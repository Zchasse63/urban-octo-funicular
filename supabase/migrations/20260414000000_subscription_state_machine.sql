-- ============================================================================
-- Subscription State Machine Migration
-- ============================================================================
--
-- Replaces the implicit `subscription_tier = 'free' OR NULL` access pattern
-- with an explicit 5-state machine on the users table:
--
--   trialing      — 14-day Pro trial active, full Pro access
--   active        — Paid subscription current, access at their tier level
--   past_due      — Payment failed, 3-day grace period retains access
--   trial_expired — Trial ended without paying, read-only access
--   canceled      — Subscription canceled, read-only access
--
-- New columns:
--   subscription_status  — the 5-state enum
--   trial_ends_at        — when the current trial period ends
--   past_due_since       — when payment failed (for grace period calculation)
--
-- After this migration, `subscription_tier` is NEVER NULL and NEVER 'free'.
-- Every user is always in one of three tiers: pro, creator, or agency.
-- Access control is determined by subscription_status, not tier.
-- ============================================================================

-- ─── 1. Add new columns ────────────────────────────────────────────────────
-- DEFAULTs are set here so the backfill below treats existing rows as trialing.
-- NOT NULL constraint is added AFTER the backfill to avoid migration failure.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ
    DEFAULT (now() + interval '14 days');

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMPTZ;

-- ─── 2. Backfill existing rows ─────────────────────────────────────────────
-- Any user with subscription_tier = 'free' or NULL gets upgraded to a Pro trial.
-- This is the pre-launch migration window — zero paying customers exist yet.
-- Idempotent: re-running the migration is a no-op for correctly-migrated rows.

UPDATE public.users
SET
  subscription_tier = 'pro',
  subscription_status = COALESCE(subscription_status, 'trialing'),
  trial_ends_at = COALESCE(trial_ends_at, now() + interval '14 days')
WHERE subscription_tier IS NULL OR subscription_tier = 'free';

-- Any rows that somehow have subscription_tier set correctly but
-- subscription_status still NULL (edge case) also get set to trialing.
UPDATE public.users
SET subscription_status = 'trialing',
    trial_ends_at = COALESCE(trial_ends_at, now() + interval '14 days')
WHERE subscription_status IS NULL;

-- ─── 3. Add NOT NULL constraints ───────────────────────────────────────────
-- Only safe to run after the backfill above has populated every row.

ALTER TABLE public.users
  ALTER COLUMN subscription_status SET NOT NULL;

ALTER TABLE public.users
  ALTER COLUMN trial_ends_at SET NOT NULL;

ALTER TABLE public.users
  ALTER COLUMN subscription_tier SET NOT NULL;

-- Remove the old 'free' default from subscription_tier.
-- New users start at 'pro' via the updated handle_new_user() trigger below.
ALTER TABLE public.users
  ALTER COLUMN subscription_tier DROP DEFAULT;

ALTER TABLE public.users
  ALTER COLUMN subscription_tier SET DEFAULT 'pro';

-- ─── 4. Enforce the 5-state enum via CHECK constraints ────────────────────
-- Drop any pre-existing CHECK constraints from prior migrations, then recreate.

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS chk_subscription_status;

ALTER TABLE public.users
  ADD CONSTRAINT chk_subscription_status CHECK (
    subscription_status IN ('trialing', 'active', 'past_due', 'trial_expired', 'canceled')
  );

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS chk_subscription_tier;

ALTER TABLE public.users
  ADD CONSTRAINT chk_subscription_tier CHECK (
    subscription_tier IN ('pro', 'creator', 'agency')
  );

-- ─── 5. Indexes for cron job queries ──────────────────────────────────────
-- The daily trial expiration job queries trialing users whose trial has ended.
-- The past_due grace period job queries past_due users past the cutoff.

CREATE INDEX IF NOT EXISTS idx_users_subscription_status
  ON public.users(subscription_status);

CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at
  ON public.users(trial_ends_at)
  WHERE subscription_status = 'trialing';

CREATE INDEX IF NOT EXISTS idx_users_past_due_since
  ON public.users(past_due_since)
  WHERE subscription_status = 'past_due';

-- ─── 6. Update handle_new_user() trigger function ─────────────────────────
-- New signups start with a 14-day Pro trial.
-- ON CONFLICT intentionally does NOT update subscription fields — if the row
-- already exists (e.g., OAuth re-auth firing onAuthStateChange twice), we
-- preserve whatever trial/subscription state the user already has.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    subscription_tier,
    subscription_status,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'pro',
    'trialing',
    now() + interval '14 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name);
  -- IMPORTANT: ON CONFLICT does NOT update subscription_tier, subscription_status,
  -- or trial_ends_at. This preserves the trial/subscription state for returning
  -- users whose auth record gets re-inserted (OAuth re-auth, etc.).
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. Comments ──────────────────────────────────────────────────────────

COMMENT ON COLUMN public.users.subscription_status IS
  'Explicit 5-state access control: trialing | active | past_due | trial_expired | canceled. Used by canProcessEpisode to decide whether to allow new work.';

COMMENT ON COLUMN public.users.trial_ends_at IS
  'Timestamp when the current trial period expires. Set to now() + 14 days on signup via handle_new_user() trigger. Used by the daily expire-trials cron job to flip status to trial_expired.';

COMMENT ON COLUMN public.users.past_due_since IS
  'Timestamp when the subscription flipped to past_due (payment failed). NULL when not past_due. Used to calculate the 3-day grace period before flipping to canceled.';
