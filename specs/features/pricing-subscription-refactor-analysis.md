# Feature Design Document: Pricing Refactor + Subscription State Machine

**Analyst:** QA Analyst
**Date:** 2026-04-14
**Status:** Complete
**Pipeline:** `pricing-subscription-refactor`

---

## 1. Feature Overview

The pricing refactor introduces a **5-state subscription machine** replacing the previous implicit `subscription_tier = 'free'` pattern. Every user is always in one of five explicit states: `trialing | active | past_due | trial_expired | canceled`. New signups automatically start a 14-day Pro trial via a PostgreSQL trigger on `auth.users`.

Metering transitions from hours to **minutes**: Pro 300 min/mo, Creator 1,200 min/mo, Agency 3,600 min/mo. Annual prices are exactly 10× monthly ($290/$590/$1,490). Three tiers remain (Pro, Creator, Agency); the permanent free tier is eliminated entirely. The landing page pricing grid shrinks from 4 to 3 columns with CTAs updated to "Start 14-day Trial."

The three **subscription banners** (`TrialCountdownBanner`, `PastDueBanner`, `AccessBlockedBanner`) are rendered inside `AppShell` between the mobile header and main content, ensuring they appear on every authenticated page. Episode processing is now gated by `canProcessEpisode()` which checks both subscription status and the monthly minute cap.

**Sources of truth:**
- `app/src/lib/pricing.ts` — tier definitions, status helpers, feature flags
- `app/src/lib/tier-limits.ts` — enforcement layer (DB queries, access checks)
- `app/src/lib/stripe/webhooks.ts` — state transitions driven by Stripe events
- `app/src/trigger/jobs/expire-trials.ts` — daily cron at 00:00 UTC
- `supabase/migrations/20260414000000_subscription_state_machine.sql` — schema

---

## 2. Selector Inventory

### Critical Gap: No `data-testid` Attributes on Banner Components

**`app/src/components/ui/subscription-banners.tsx`** contains zero `data-testid` attributes. All E2E tests must rely on ARIA roles, text content, and button labels. The following `data-testid` attributes **must be added** to the components before tests can run reliably:

| Recommended `data-testid` | Component | Location |
|---|---|---|
| `subscription-banner-trial` | `TrialCountdownBanner` outer `<div>` | `subscription-banners.tsx:44` |
| `subscription-banner-past-due` | `PastDueBanner` outer `<div>` | `subscription-banners.tsx:105` |
| `subscription-banner-blocked` | `AccessBlockedBanner` outer `<div>` | `subscription-banners.tsx:138` |
| `banner-upgrade-button` | Upgrade button in each banner | Multiple |
| `banner-dismiss-button` | Dismiss button in trial banner | `subscription-banners.tsx:79` |

### Usable Selectors (Exist Today)

| Selector | Type | Element | Purpose | File:Line |
|---|---|---|---|---|
| `role="status"` | ARIA role | TrialCountdownBanner outer div | Trial countdown banner container | `subscription-banners.tsx:52` |
| `role="alert"` | ARIA role | PastDueBanner outer div | Payment failure banner | `subscription-banners.tsx:107` |
| `role="alert"` | ARIA role | AccessBlockedBanner outer div | Blocked access banner | `subscription-banners.tsx:140` |
| `aria-label="Dismiss"` | ARIA label | Trial banner dismiss button | Dismiss trial countdown | `subscription-banners.tsx:83` |
| `"Upgrade"` | Button text | Trial/blocked banner CTA | Navigate to settings | Multiple |
| `"Update Payment"` | Button text | PastDue banner CTA | Navigate to settings | `subscription-banners.tsx:119` |
| `"Reactivate"` | Button text | Blocked banner CTA (canceled) | Navigate to settings | `subscription-banners.tsx:154` |
| `"Your trial ends today."` | Text content | Trial banner (0 days) | Urgent state text | `subscription-banners.tsx:59` |
| `"1 day left in your Pro trial."` | Text content | Trial banner (1 day) | Near-expiry text | `subscription-banners.tsx:61` |
| `" days left in your Pro trial."` | Text content | Trial banner (N days) | Countdown text | `subscription-banners.tsx:62` |
| `"Upgrade to keep your access."` | Text content | Trial banner CTA copy | Action prompt | `subscription-banners.tsx:64` |
| `"Payment failed."` | Text content | PastDue banner message | Payment failure text | `subscription-banners.tsx:112` |
| `"Your trial has ended."` | Text content | AccessBlocked banner (trial_expired) | Blocked state text | `subscription-banners.tsx:135` |
| `"Your subscription has been canceled."` | Text content | AccessBlocked banner (canceled) | Canceled state text | `subscription-banners.tsx:136` |
| `"Upgrade to continue processing episodes."` | Text content | Blocked banner (trial_expired) | Action text | `subscription-banners.tsx:147` |
| `"Reactivate to continue processing episodes."` | Text content | Blocked banner (canceled) | Action text | `subscription-banners.tsx:148` |
| `id="pricing"` | HTML id | Landing page pricing section | Pricing section anchor | `page.tsx:322` |
| `"Simple, Transparent Pricing"` | Heading text | Landing page pricing heading | Section title | `page.tsx:331` |
| `"All plans start with a free 14-day Pro trial. No credit card required."` | Text content | Pricing section subtext | Trial messaging | `page.tsx:334` |
| `"Start 14-day Trial"` | Button/link text | Pricing cards CTA | Trial signup button (all 3 cards) | `page.tsx:343,348,353` |
| `"Most Popular"` | Badge text | Pro tier card | Highlighted tier badge | `page.tsx:369` |
| `"Pro"` / `"Creator"` / `"Agency"` | Heading text | Pricing card tier names | Tier identification | `page.tsx:376` |
| `"$29"` / `"$59"` / `"$149"` | Text content | Pricing card prices | Price display | `page.tsx:380` |
| `"Start 14-Day Free Trial"` | Link text | Hero CTA button | Primary hero CTA | `page.tsx:109` |
| `"14-DAY PRO TRIAL · NO CREDIT CARD REQUIRED"` | Text content | Hero social proof | Trial messaging | `page.tsx:123` |
| `"Audio Minutes"` | Label text | Settings usage meter | Usage display label | `settings-page.tsx:475` |
| `"You're nearing your plan limits"` | Heading text | Settings warning banner | Soft-limit alert | `settings-page.tsx:424` |
| `id="email"` | Input id | Register form email field | Email input | `register/page.tsx:170` |
| `id="password"` | Input id | Register form password field | Password input | `register/page.tsx:183` |
| `id="confirm-password"` | Input id | Register form confirm field | Confirm password input | `register/page.tsx:205` |
| `"Create account"` | Button text | Register form submit | Form submission | `register/page.tsx:227` |
| `"Check your email"` | Heading text | Post-registration confirmation | Email sent state | `register/page.tsx:84` |

---

## 3. User Workflow Mapping

### Journey 1: New User Signup (Trial)

**Expected outcome:** User is in `trialing` state, `tier=pro`, sees trial countdown banner.

**Note:** E2E registration requires email confirmation; tests must bypass this using the admin client to create users directly (as per existing `createTestUser()` helper at `app/test/e2e/helpers/auth.ts:23`). The `handle_new_user` DB trigger sets `subscription_status='trialing'`, `subscription_tier='pro'`, `trial_ends_at=now()+14 days` on the `public.users` row.

```
Admin creates user via Supabase admin SDK
  → auth.users INSERT triggers handle_new_user()
  → public.users row: { status: 'trialing', tier: 'pro', trial_ends_at: +14d }
  → Test signs in via signIn() helper
  → /episodes page loads
  → AppShell renders SubscriptionBanners with status='trialing'
  → TrialCountdownBanner visible with role="status"
  → Countdown text shows days remaining (10-14 days for fresh user)
  → Upgrade button routes to /settings?tab=subscription on click
  → Dismiss button: removes banner for session, sessionStorage key set
  → Refresh: banner reappears (new session, sessionStorage cleared between navigations)
  → Pro-level features accessible (episode creation allowed)
```

**Interaction steps (E2E test):**
1. Create user via admin client with default subscription fields
2. Sign in via `signIn()` helper
3. Wait for `/episodes` URL
4. Assert `role="status"` element visible
5. Assert text matches `/\d+ days? left in your Pro trial/i`
6. Click dismiss button (aria-label="Dismiss")
7. Assert banner no longer visible
8. Navigate away and back → assert banner still hidden (sessionStorage persists in same browser context)

---

### Journey 2: Trial Expiration → Access Blocked

**Expected outcome:** After `trial_ends_at` passes, user sees `AccessBlockedBanner`, cannot trigger episode processing.

**Simulation:** Set `subscription_status='trial_expired'` and `trial_ends_at=past` directly via admin client (cannot run cron in E2E).

```
Test manually sets: users row → { status: 'trial_expired', trial_ends_at: 2026-01-01 }
  → User refreshes app (or GET /api/usage returns status='trial_expired')
  → AppShell renders AccessBlockedBanner (role="alert")
  → Text: "Your trial has ended. Upgrade to continue processing episodes."
  → Upgrade button routes to /settings?tab=subscription
  → No dismiss button (blocked banner is persistent)
  → POST /api/episodes → 403 "Your trial has ended. Upgrade to..."
  → POST /api/episodes/[id]/process → 403 "Your trial has ended..."
  → GET /episodes (read) → 200 (can view existing content)
  → GET /episodes/[id] (view episode) → 200 (read-only access)
```

**Interaction steps (E2E test):**
1. Create user + show + completed episode via admin client
2. Set `subscription_status='trial_expired'` via admin DB update
3. Sign in and navigate to `/episodes`
4. Assert `role="alert"` element visible
5. Assert text contains "Your trial has ended."
6. Assert NO dismiss button (blocked banner has no dismissal)
7. Assert existing episode card is visible (read access works)
8. Attempt to navigate to `/upload` → assert blocked state messaging or redirect
9. API: POST to `/api/episodes` → assert 403 response

---

### Journey 3: Trial-to-Paid Conversion

**Expected outcome:** After "upgrading" (Stripe checkout completes), `subscription_status` becomes `active`, trial banner disappears.

**Simulation:** Stripe webhooks cannot be triggered in E2E. Use admin DB update to simulate `handleCheckoutCompleted` outcome.

```
User is trialing
  → Test simulates checkout: updates users row → { status: 'active', tier: 'pro' }
  → User refreshes app / /api/usage is re-fetched
  → AppShell: status='active' → SubscriptionBanners returns null
  → No banner visible
  → Pro features remain accessible
```

**Interaction steps (E2E test):**
1. Create user in `trialing` state
2. Sign in → confirm trial banner visible
3. Admin client: update `subscription_status='active'`
4. Reload the page (triggers /api/usage refetch)
5. Assert NO banner visible (all banner types absent)
6. Assert episode creation still accessible

---

### Journey 4: Payment Failure → Grace Period (past_due)

**Expected outcome:** User sees `PastDueBanner` with grace period end date, retains episode access for 3 days.

**Simulation:** Admin client sets `subscription_status='past_due'`, `past_due_since=<recent timestamp>`.

```
Test sets: users → { status: 'past_due', past_due_since: 2026-04-14T00:00:00Z }
  → AppShell renders PastDueBanner (role="alert")
  → Text: "Payment failed. Update your payment method by Apr 17 to avoid service interruption."
  → "Update Payment" button routes to /settings?tab=subscription
  → No dismiss button
  → POST /api/episodes → 200 (grace period = still has access)
  → POST /api/episodes/[id]/process → 200 (still has access)
```

**Interaction steps (E2E test):**
1. Create active user
2. Admin client: set `subscription_status='past_due'`, `past_due_since=now()`
3. Sign in → navigate to `/episodes`
4. Assert `role="alert"` visible
5. Assert text matches `/Payment failed/i`
6. Assert grace period end date shows (today + 3 days)
7. Assert episode creation still works (POST /api/episodes → 200)

---

### Journey 5: Upgrade from Pro to Creator

**Expected outcome:** User on Pro tier (300 min cap) upgrades to Creator (1,200 min cap). Usage API reflects new limits.

**Simulation:** Admin DB update sets `subscription_tier='creator'`.

```
User is active, tier=pro, audioMinutes.limit=300
  → Admin sets: users → { tier: 'creator' }
  → GET /api/usage → returns { tier: 'creator', audioMinutes: { limit: 1200 } }
  → Sidebar usage card reflects 1200 min limit
  → Settings page "Audio Minutes" meter reflects 1200 limit
  → Creator-tier features now accessible (hosting push, pre-interview, etc.)
```

**Interaction steps (E2E test):**
1. Create Pro user, sign in
2. GET /api/usage → assert `audioMinutes.limit === 300`
3. Admin client: set `subscription_tier='creator'`
4. Reload → GET /api/usage → assert `audioMinutes.limit === 1200`
5. Navigate to `/settings` → assert usage meter shows 1,200 min limit

---

### Journey 6: Hitting the Minute Cap (Hard Limit)

**Expected outcome:** User at 100% of monthly minute cap cannot create or process new episodes; receives 403 with minutes-language message.

**Simulation:** Create episodes with `audio_duration_seconds` summing to ≥ tier limit × 60.

```
Pro user (300 min = 18,000 sec) has episodes totaling 18,001 seconds in billing period
  → GET /api/usage → audioMinutes.percentage = 100
  → UploadWizard: audioLimitReached=true → UpgradePrompt rendered
  → POST /api/episodes → 403 "You've used all 300 minutes this month on the pro plan."
  → POST /api/episodes/[id]/process → 403 (if episode.audio_duration_seconds pushes over)
```

**Interaction steps (E2E test):**
1. Create Pro user + show
2. Admin insert episode with `audio_duration_seconds=18001` (300+ min) in current billing period
3. Sign in → navigate to `/upload`
4. Assert upgrade prompt visible ("Audio minutes limit reached" text)
5. API: POST to `/api/episodes` with valid body → assert 403

---

### Journey 7: Accessing Content After Trial Ended (Read-Only)

**Expected outcome:** Blocked user can view past episodes and shows but cannot create new content.

```
User with trial_expired has existing shows + completed episodes
  → GET /episodes → 200 (list visible)
  → GET /episodes/[id] → 200 (episode workspace visible with tabs)
  → POST /api/episodes → 403
  → POST /api/shows → 403 (canCreateShow checks isAccessBlocked)
```

**Interaction steps (E2E test):**
1. Create user + show + completed episode via admin
2. Admin: set `subscription_status='trial_expired'`
3. Sign in → navigate to `/episodes`
4. Assert blocked banner visible
5. Assert episode card is clickable, episode workspace opens
6. Assert tabs (Notes, Assets) are readable
7. Navigate to `/upload` → assert episode creation blocked
8. API assertions: POST /api/episodes → 403; POST /api/shows → 403

---

## 4. API Endpoints

| Method | Path | Auth | Subscription Check | Success | Error Cases |
|---|---|---|---|---|---|
| GET | `/api/usage` | Required | None (read-only) | 200: `{ tier, status, trialEndsAt, pastDueSince, audioMinutes, shows, billingPeriod }` | 401 if unauthenticated |
| POST | `/api/episodes` | Required | `canProcessEpisode(userId)` | 201: episode created | 403 if blocked or at cap, 429 rate limit |
| POST | `/api/episodes/[id]/process` | Required | `canProcessEpisode(userId, audio_duration_seconds)` | 200: run triggered | 403 if blocked/cap, 404 if episode not found, 409 if already processing |
| POST | `/api/shows` | Required | `canCreateShow(userId)` | 201: show created | 403 if blocked or at show limit |
| POST | `/api/shows/[id]/import` | Required | Status check + minute cap | 200: feed imported | 403 if blocked/cap, 422 if invalid RSS |
| GET | `/api/subscriptions` | Required | None | 200: `{ tier, status, trialEndsAt, pastDueSince, ...stripeFields }` | 401, 500 |
| POST | `/api/stripe/webhooks` | Stripe signature | N/A (webhook) | 200: `{ received: true }` | 400 invalid sig, 500 handler error |

### `/api/usage` Response Shape (new fields)

```json
{
  "data": {
    "tier": "pro",
    "status": "trialing",
    "trialEndsAt": "2026-04-28T00:00:00.000Z",
    "pastDueSince": null,
    "billingPeriod": { "start": "...", "end": "..." },
    "audioMinutes": { "used": 45.5, "limit": 300, "percentage": 15 },
    "shows": { "used": 1, "limit": 2, "percentage": 50 }
  }
}
```

---

## 5. Edge Cases and Error States

### E1: Trial Banner Dismiss Persistence

- **Behavior:** Dismissed via `sessionStorage.setItem('podbrain-trial-banner-dismissed', 'true')`
- **Edge case:** If user opens a new tab in the same session, sessionStorage is shared → banner stays hidden. New browser window → new session → banner reappears.
- **Test approach:** Within same page context, dismiss and verify. Cannot test cross-tab in Playwright without separate browser contexts.

### E2: Status Change During Active Session

- **Behavior:** `useUsage` fetches once on mount. If status changes (e.g., trial expires while user is logged in), they won't see the new banner until they refresh.
- **Impact for tests:** Set DB state BEFORE signing in, not after, to ensure correct initial state.

### E3: Trial Countdown at Day 0

- **Behavior:** When `getTrialDaysRemaining()` returns 0, banner shows "Your trial ends today." (not "-1 days").
- **Test:** Set `trial_ends_at` to earlier today (past midnight but still today).
- **Urgent styling:** When `daysRemaining <= 3`, banner switches from blue to amber.

### E4: Grace Period Date Display

- **Behavior:** `PastDueBanner` shows `gracePeriodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })`. This is locale-sensitive.
- **Test:** Match regex `/[A-Z][a-z]+ \d+/` rather than exact date string.

### E5: Billing Period During past_due

- **Behavior:** `getBillingPeriod()` now includes `past_due` in the `status` filter (line 149 of `tier-limits.ts`). Without an active Stripe subscription row in the DB, falls back to calendar month.
- **Test implication:** In E2E, test users won't have Stripe subscription rows, so billing period always falls back to calendar month. Minute cap resets at start of month.

### E6: `trial_expired` vs `canceled` in AccessBlockedBanner

- **Behavior:** Banner CTA says "Upgrade" for `trial_expired`, "Reactivate" for `canceled`. Message text differs too.
- **Test:** Verify both states independently.

### E7: No Banner on `active` or `null` Status

- **Behavior:** `SubscriptionBanners` returns `null` when status is `active` or when usage hasn't loaded yet (null check at line 203).
- **Test:** Verify active users see no banner element.

### E8: Shows Limit After Blocking

- **Behavior:** `canCreateShow()` checks `isAccessBlocked(status)` BEFORE checking the show count. A blocked user with 0 shows still gets blocked.
- **Test:** Verify blocked user cannot create a show even with capacity available.

### E9: Register Page — No Plan Selection UI

- **Behavior:** The `/register` page has no tier-selection UI. The `?plan=` query parameter from landing page links is not read by the register page — it only calls `supabase.auth.signUp()`. All new users start with `trialing/pro` regardless.
- **Test implication:** Register page tests should NOT assert plan-specific behavior. The plan parameter is marketing-only at this stage.

### E10: `createTestUser()` Helper Bypass

- **Behavior:** The existing `createTestUser()` helper (auth.ts:23) inserts a minimal `users` row via `admin.upsert()` without setting `subscription_status` or `trial_ends_at`. After the migration, these columns have `NOT NULL` defaults (`'trialing'` and `now()+14d`), so the upsert will succeed and the DB defaults will apply.
- **Test implication:** Existing helper works correctly. New tests should explicitly set subscription state after user creation rather than relying on defaults.

---

## 6. Test Data Requirements

Tests need a `setSubscriptionState()` factory function (add to `app/test/e2e/helpers/factories.ts`):

```typescript
interface SubscriptionState {
  status: 'trialing' | 'active' | 'past_due' | 'trial_expired' | 'canceled'
  tier?: 'pro' | 'creator' | 'agency'
  trialEndsAt?: Date        // default: now + 14 days
  pastDueSince?: Date | null
  minutesConsumed?: number  // creates a backdated episode with this many seconds of audio
}

async function setSubscriptionState(userId: string, state: SubscriptionState): Promise<void>
```

**Required scenarios:**

| Scenario | DB State |
|---|---|
| Fresh trial (default) | `status='trialing', tier='pro', trial_ends_at=now+14d` |
| Trial ending soon | `status='trialing', trial_ends_at=now+2d` |
| Trial ending today | `status='trialing', trial_ends_at=today_midnight` |
| Trial expired | `status='trial_expired', trial_ends_at=past` |
| Active Pro | `status='active', tier='pro'` |
| Active Creator | `status='active', tier='creator'` |
| Past due | `status='past_due', past_due_since=now()` |
| Canceled | `status='canceled'` |
| At minute cap | `status='active' + episode with audio_duration_seconds = tier_limit * 60` |
| At soft limit (80%) | `status='active' + episode with audio_duration_seconds = tier_limit * 60 * 0.8` |

---

## 7. Dependencies on Other Features

| Dependency | Impact |
|---|---|
| `auth` — `requireAuth()` | All tier enforcement is auth-gated. Tests must be signed in. |
| `useUsage` hook | Banners depend on this hook's data. No data = no banner (loading state returns null). |
| Supabase DB trigger `on_auth_user_created` | Creates trial state on signup. Bypass by creating user via admin API + explicit upsert. |
| Stripe webhooks | State transitions in production; replaced by direct DB writes in tests. |
| `getAdminClient()` in test helpers | Requires `SUPABASE_SERVICE_ROLE_KEY` env var in test setup. Already confirmed working in existing E2E tests. |

---

## 8. Recommended Test Priorities

### P0 — Must Pass Before Launch

| # | Test | Rationale |
|---|---|---|
| P0-1 | Trial banner visible for new trialing user | Core new-user experience |
| P0-2 | Access-blocked banner for trial_expired user | Revenue protection — blocked user should not be able to process |
| P0-3 | POST /api/episodes returns 403 for trial_expired user | Direct revenue leak prevention |
| P0-4 | POST /api/episodes/[id]/process returns 403 for trial_expired user | The critical CRITICAL finding from code review |
| P0-5 | Landing page has 3-column pricing grid, no free tier | Correct marketing |
| P0-6 | Landing page CTAs say "Start 14-Day Free Trial" | Consistent messaging |
| P0-7 | Pro user at minute cap gets 403 on episode creation | Revenue metering |
| P0-8 | Trial banner is dismissible (session-level) | UX — not a persistent nag |

### P1 — High Priority

| # | Test | Rationale |
|---|---|---|
| P1-1 | Past-due banner visible with correct grace period end date | Payment recovery UX |
| P1-2 | Active user sees no banner | Negative test — active users should not be bothered |
| P1-3 | Canceled user sees "Reactivate" CTA, not "Upgrade" | Correct messaging |
| P1-4 | Trial_expired user CAN view existing episodes (read-only) | Don't block users from their content |
| P1-5 | Upgrade click navigates to /settings?tab=subscription | Correct routing |
| P1-6 | Pro→Creator tier change updates minute limit in /api/usage | Tier upgrade reflected correctly |
| P1-7 | Settings page shows "Audio Minutes" meter (not hours) | Renamed field |
| P1-8 | Sidebar shows correct tier label ("Pro Plan", "Creator Plan", "Agency Plan") | Tier label regression |
| P1-9 | POST /api/shows returns 403 for trial_expired user | canCreateShow enforcement |

### P2 — Important But Not Blocking Launch

| # | Test | Rationale |
|---|---|---|
| P2-1 | Trial countdown shows "Your trial ends today." when trialEndsAt is today | Edge case text |
| P2-2 | Trial banner is amber/urgent when ≤3 days remain | Visual urgency |
| P2-3 | Trial banner is blue/normal when >3 days remain | Normal visual |
| P2-4 | GET /api/usage returns correct shape with new fields | API contract |
| P2-5 | Pricing section subtext: "All plans start with a free 14-day Pro trial." | Copy verification |
| P2-6 | Pro pricing card shows "$29" and "300 min/mo" | Pricing accuracy |
| P2-7 | Creator pricing card shows "$59" and "1,200 min/mo" | Pricing accuracy |
| P2-8 | Agency pricing card shows "$149" and "3,600 min/mo" | Pricing accuracy |
| P2-9 | "Most Popular" badge on Pro tier card | Marketing badge |
