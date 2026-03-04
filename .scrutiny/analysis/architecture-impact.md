# Architecture Impact Analysis: PodBrain Pricing Structure

**Agent:** architecture-impact
**Complexity Class:** SIGNIFICANT
**Date:** 2026-03-01

---

## Agent Verdict

**MODIFY**

The pricing plan has direct architectural consequences that are not currently implemented. The most serious: the episode-count enforcement unit creates an unbounded cost exposure for audio-heavy Agency users, and the Stripe integration is not yet provisioned. Several pricing decisions (adding a 4th tier, switching to hourly pricing) have non-trivial architectural implications that should be evaluated before committing to a direction.

---

## 1. Current Architecture State for Pricing Enforcement

### What Is Built and Working

**Tier configuration** (3 locations, must stay in sync):
1. `src/lib/constants.ts` — `SUBSCRIPTION_TIERS` object
2. `src/lib/tier-limits.ts` — `TIER_LIMITS` with feature flags + guard functions
3. `src/lib/stripe/products.ts` — `PRICING_TIERS` with Stripe price IDs

These three sources of truth can drift. If the Pro price is updated in Stripe but `SUBSCRIPTION_TIERS.pro.priceMonthly` is not updated in constants.ts, the displayed price is wrong. This is a maintenance liability.

**Recommendation:** Consolidate to single source of truth. `tier-limits.ts` (or a new `pricing.ts`) should own all tier data. The other files should import from it.

### What Is Not Built

1. **Audio-hour tracking:** No database column for audio duration budgets. Episodes have `duration_seconds` but there is no monthly aggregate query or enforcement.
2. **Team seat enforcement:** `canCreateTeamMember()` function does not exist. Tier config shows `teamSeats: 5` for Agency but there is no guard at the API level.
3. **Stripe provisioning:** Price IDs are null in code. Stripe products don't exist yet in the dashboard.
4. **Metered billing:** No metered billing configured. All tiers are flat-rate subscriptions.
5. **Usage dashboard:** `GET /api/usage` exists but needs to be wired to the UI's upgrade prompts.

---

## 2. Architectural Implications of Each Pricing Decision

### Decision 1: Keep Current Episode-Count Pricing (No Change)

**Architectural impact:** Minimal. Current enforcement is built.

**Hidden risk:** `duration_seconds` is stored in the episodes table (from AssemblyAI). A future switch to hour-based billing requires this column and the data has been accumulating from day one. No schema migration needed — the data is already there.

**Action required for safety:** Add a soft warning system. When a user's episodes in the current month sum to >X audio hours, log a monitoring alert (Sentry custom event). This costs 10 minutes to implement and gives visibility into cost exposure before it becomes a problem.

### Decision 2: Switch to Hour-Based Pricing

**Database impact:**
```sql
-- New query needed for hour-based enforcement:
SELECT SUM(duration_seconds) / 3600 AS total_hours
FROM episodes
JOIN shows ON episodes.show_id = shows.id
WHERE shows.user_id = $1
  AND episodes.created_at >= $billing_start
  AND episodes.status = 'completed'
```
This query is straightforward. An index on `(shows.user_id, episodes.created_at)` is likely needed for performance.

**Tier limits change:**
```typescript
// tier-limits.ts would change from:
episodesPerMonth: 50
// to:
audioHoursPerMonth: 37.5  // 50 eps × 45 min avg
```

**API impact:** `canCreateEpisode()` becomes `canProcessAudio(userId, durationSeconds)`. The check must happen BEFORE AssemblyAI is called (since that's when cost is incurred), which means the upload step must record the audio duration before processing begins.

**Problem:** Audio duration is not known until AssemblyAI processes the file (or until ffprobe analyzes the upload). This creates a chicken-and-egg problem: you need duration to enforce limits, but you only know duration after processing. Workaround: allow the upload and check a soft limit, or require duration metadata from the client.

**Estimated architectural complexity:** 1.5-2 weeks including schema work, API changes, UI changes, Stripe reconfiguration.

**Verdict:** Feasible but non-trivial. Do not switch pre-launch unless the financial case for it is compelling enough to delay launch by 2 weeks.

### Decision 3: Add a 4th Tier (Starter at ~$9/mo)

**Database impact:** None — the `subscription_tier` column in the `users` table is a text field. A new value 'starter' simply needs to be handled everywhere tier is checked.

**Code impact — files that need changes:**
1. `src/lib/constants.ts` — Add `SUBSCRIPTION_TIERS.starter`
2. `src/lib/tier-limits.ts` — Add `TIER_LIMITS.starter` with new limits + `canGenerateAssetType()` update
3. `src/lib/stripe/products.ts` — Add `PRICING_TIERS.starter` with Stripe price ID
4. `src/lib/stripe/products.server.ts` — Add price ID env var handling
5. Landing page pricing component — Add Starter column
6. Upgrade prompt components — Add Starter as an option

**Stripe impact:** New Stripe product + price must be created. Existing webhook handler must handle 'starter' tier.

**Estimated complexity:** 2-3 days. Manageable.

**Risk:** Complicates the pricing page. A 4-tier pricing page is harder to communicate than 3 tiers, especially for a new product. Good pricing pages should tell a simple story.

### Decision 4: Raise Prices (No New Tiers)

**Architectural impact:** Essentially zero. Change numbers in `products.ts`, update Stripe, update marketing copy. This is the lowest-complexity pricing change available.

**Risk:** None architecturally. Business risk (conversion) is the only concern.

### Decision 5: Metered/Overage Billing

**Architectural impact:** High.

Stripe supports metered billing (`usage_type: 'metered'` in price configuration). This requires:
1. New Stripe price type (recurring + metered)
2. Usage reporting to Stripe after each episode processed
3. Stripe webhook handling for usage-based invoices
4. UI to show estimated vs. actual bill

This is a 2-3 week architectural addition. Not recommended pre-launch.

---

## 3. The Three-Source-of-Truth Problem

Pricing data currently lives in 3 separate files that must be kept in sync:

```
constants.ts        → SUBSCRIPTION_TIERS (priceMonthly, episodesPerMonth, maxShows, teamSeats)
tier-limits.ts      → TIER_LIMITS (same data + feature flags + guard functions)
stripe/products.ts  → PRICING_TIERS (same data + Stripe price IDs + features array for UI)
```

If Pro changes from $19 to $39:
- Update `constants.ts` line 63
- Update `stripe/products.ts` line 32
- Update Stripe Dashboard (external)
- Update landing page copy (separate component)
- Update any hardcoded references in email templates

This is brittle. A pricing change in Stripe that doesn't propagate to `constants.ts` means the app displays the wrong price.

**Recommended architectural fix (2-3 hours):**
Create `src/lib/pricing.ts` as the single canonical source. All other files import from it. The Stripe price IDs remain server-side only (in `products.server.ts`). This reduces future pricing changes to 2 file edits + Stripe.

```typescript
// src/lib/pricing.ts — single source of truth
export const TIERS = {
  free:   { price: 0,  episodes: 3,   shows: 1,    seats: 1 },
  pro:    { price: 39, episodes: 50,  shows: 5,    seats: 1 },  // raised from $19
  agency: { price: 149, episodes: 200, shows: 999, seats: 5 },  // raised from $49
} as const
```

---

## 4. Stripe Integration Architecture Gaps

### Current State
The Stripe checkout, portal, and webhook handler are implemented in code. But:
- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` are not set in production env
- `STRIPE_PRO_PRICE_ID` and `STRIPE_AGENCY_PRICE_ID` do not exist (Stripe products not created)
- Post-checkout redirect goes to `/settings/billing` (404 — should be `/settings?tab=billing`)

### What Happens When a User Tries to Upgrade Today
1. They click "Upgrade to Pro"
2. Client-side code reads `STRIPE_PUBLISHABLE_KEY` from env — which is undefined
3. Stripe.js fails to initialize
4. Or: the checkout session API call fails because `STRIPE_SECRET_KEY` is undefined
5. User sees an error

This is a pre-launch blocker, not a pricing strategy question. But it's relevant because **the pricing plan cannot be validated until users can actually pay.**

### Stripe Architecture Checklist Before Any Pricing Decision Is Final
- [ ] Create Stripe products and prices for Pro and Agency
- [ ] Set `STRIPE_PRO_PRICE_ID` and `STRIPE_AGENCY_PRICE_ID` env vars
- [ ] Fix success URL redirect (B9 from prior audit)
- [ ] Set Stripe webhook endpoint in Stripe Dashboard
- [ ] Verify webhook signature validation works
- [ ] Test checkout flow end-to-end with Stripe test mode

If prices are to be raised (recommended), do it NOW in Stripe before these products are created. Changing a Stripe price after customers are subscribed requires migration or grandfathering.

---

## 5. Tier Enforcement Architecture for Team Seats

The Agency tier includes 5 team seats. This feature is listed in the tier config but the enforcement guard doesn't exist.

**Current code in `tier-limits.ts`:**
```typescript
agency: {
  episodesPerMonth: 200,
  maxShows: 999,
  teamSeats: 5,  // defined but never enforced
  ...
}
```

**What needs to be added:**
```typescript
export async function canAddTeamMember(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
}> {
  const tier = await getUserTier(userId);
  const limits = getTierLimits(tier);
  const supabase = await createClient();
  const { count } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);

  if ((count || 0) >= limits.teamSeats) {
    return { allowed: false, reason: `Team seat limit reached`, current: count || 0, limit: limits.teamSeats };
  }
  return { allowed: true, current: count || 0, limit: limits.teamSeats };
}
```

This guard needs to be called in `POST /api/team`. Without it, any user (including free) can add unlimited team members.

**Estimated fix:** 30 minutes.

---

## 6. Architecture Summary

| Change | Complexity | Priority |
|--------|-----------|----------|
| Fix three-source-of-truth pricing data | 2-3 hrs | HIGH |
| Add audio-hour monitoring (alerting only) | 30 min | HIGH |
| Add `canAddTeamMember()` guard | 30 min | HIGH |
| Provision Stripe products + set env vars | 1 hr (non-code) | CRITICAL |
| Fix Stripe success URL redirect | 5 min | HIGH |
| Add Starter tier (if decided) | 2-3 days | MEDIUM |
| Switch to hour-based enforcement | 1.5-2 weeks | LOW (post-launch) |
| Metered/overage billing | 2-3 weeks | LOW (post-launch) |

**The most important architectural action:** Raise prices before Stripe products are created. A price change in Stripe before any subscribers exist costs nothing. A price change after 100 users are subscribed at $19 requires grandfathering, communications, and accepts churn risk.
