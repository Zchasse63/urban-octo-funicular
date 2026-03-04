# Scope Decomposition: PodBrain Pricing Changes

**Date:** 2026-03-01

---

## Decision Gate (Resolve Before Implementation)

### Decision 1: Final Prices
- **Option A:** Raise Pro to $29, Agency to $99 (conservative, fast)
- **Option B:** Raise Pro to $29, Agency to $149 (recommended)
- **Option C:** Pro $29, Creator $59, Agency $149 (best, adds 2-3 days)

Recommendation: Option B now, Option C via Creator tier post-launch.

### Decision 2: Free Tier Approach
- **Option A:** Keep perpetual restricted free (current)
- **Option B:** Add 14-day Pro trial on sign-up
- **Option C:** Both

Recommendation: Option C. Trial is 1-2 days of work with meaningful conversion upside.

---

## Work Breakdown

### P0 — Before Stripe Provisioning (4-6 hours)

**P0.1 — Consolidate pricing data (2-3 hrs)**
- Create `src/lib/pricing.ts` as single canonical source
- Set Pro = $29, Agency = $149
- Update `constants.ts`, `tier-limits.ts`, `stripe/products.ts` to import from it
- Files: 4 modified, 1 created

**P0.2 — Fix Stripe success URL (5 min)**
- Change `/settings/billing` to `/settings?tab=billing` in checkout route
- File: 1 line in `app/src/app/api/stripe/checkout/route.ts` (or equivalent)

**P0.3 — Add team seat enforcement (30 min)**
- Add `canAddTeamMember()` to `tier-limits.ts`
- Call from `POST /api/team` route
- Files: `tier-limits.ts` + `app/src/app/api/team/route.ts`

### P0-Infra — Infrastructure (1.5-2 hrs, non-code)

**P0-Infra.1 — Provision Stripe products**
- Create Pro product: $29/mo monthly + $232/yr annual
- Create Agency product: $149/mo monthly + $1,192/yr annual
- Get Price IDs, set env vars: `STRIPE_PRO_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`, `STRIPE_AGENCY_ANNUAL_PRICE_ID`

**P0-Infra.2 — Configure Stripe webhook**
- Set production webhook URL in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set in Netlify env

**P0-Infra.3 — Enable email verification**
- Toggle in Supabase Dashboard: Auth > Email > Enable confirmation
- 5 minutes, zero code

### P1 — Cost Safety (3-5 hours)

**P1.1 — Audio-hour monitoring (3-4 hrs)**
- Add `getAudioHoursThisMonth(userId)` query to `tier-limits.ts`
- Call after episode completion; log Sentry event if >100 audio hours
- Consider adding soft cap at 150 hours for Agency tier
- Files: `tier-limits.ts`, episode completion handler

**P1.2 — Gate Taddy behind Pro (1 hr)**
- Add tier check to `/api/taddy/search` route
- Add tier check to `/api/shows/[id]/experts` route
- Files: 2 API route files

**P1.3 — Confirm asset generation behavior (1-2 hrs)**
- Audit `src/lib/content/generate-assets.ts`
- Confirm assets are generated per user request, not auto-triggered for all 45 on episode completion
- If auto-generating all 45: add config to limit default to core 9 assets

### P2 — Conversion Optimization (2-4 days)

**P2.1 — Annual pricing (3-4 hrs)**
- Add annual Stripe price objects (already covered in P0-Infra.1)
- Add annual toggle to landing page pricing component
- Update `stripe/products.ts` to support annual price IDs

**P2.2 — Locked asset upgrade prompts (4-6 hrs)**
- In episode workspace: show locked asset cards with "Upgrade" overlay for free-tier users
- Make the 39 locked assets visible (not hidden) with clear upgrade path
- Files: Episode detail component, asset display components

**P2.3 — 14-day Pro trial on sign-up (1-2 days)**
- Option A (Stripe-native): Enable trial period in Stripe subscription creation
  - Pass `trial_period_days: 14` to Stripe checkout
  - Stripe handles trial state; webhook fires when trial ends
  - Minimal code change
- Option B (custom): Add `trial_ends_at` to users table
  - DB migration + `getUserTier()` check trial date
  - More control, more code
- Recommendation: Option A (Stripe-native) — 3-4 hours total

---

## Priority Order

| Priority | Item | Time | Business Impact |
|----------|------|------|----------------|
| P0 | Raise prices in code ($29/$149) | 2-3 hrs | Captures correct prices permanently |
| P0 | Provision Stripe at new prices | 1 hr | Enables any revenue |
| P0 | Fix Stripe success URL | 5 min | Removes post-checkout 404 |
| P0 | Enable email verification | 5 min | Prevents free abuse |
| P0 | Add team seat enforcement | 30 min | Closes enforcement gap |
| P1 | Audio-hour monitoring | 3-4 hrs | Cost visibility |
| P1 | Gate Taddy behind Pro | 1 hr | Prevents quota exhaustion |
| P1 | Confirm asset generation behavior | 1-2 hrs | Cost control |
| P2 | Annual pricing | 3-4 hrs | LTV improvement, competitive parity |
| P2 | Locked asset upgrade prompts | 4-6 hrs | Free-to-paid conversion |
| P2 | 14-day Pro trial | 3-4 hrs | Higher aha-moment conversion |

**Total P0:** ~4-5 hours code + 1.5 hours non-code = ~6 hours
**Total P0+P1:** ~10-13 hours
**Total P0+P1+P2:** ~2-3 days
