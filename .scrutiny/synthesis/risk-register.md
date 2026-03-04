# Risk Register: PodBrain Pricing Structure

**Date:** 2026-03-01

---

## Risk Matrix

| ID | Risk | Probability | Impact | Severity | Mitigation |
|----|------|------------|--------|----------|------------|
| R1 | Agency long-form content makes tier loss-making | Medium | Critical | **CRITICAL** | Add audio-hour cap or monitoring |
| R2 | Price anchoring: impossible to raise prices post-launch | High | High | **CRITICAL** | Set correct prices before first subscriber |
| R3 | Agency tier underpriced — excluded from professional evaluation | High | High | **HIGH** | Raise to $149 before launch |
| R4 | Free tier re-registration abuse | Medium | Medium | **MEDIUM** | Require email verification |
| R5 | Stripe not provisioned — no actual revenue possible | High | Critical | **CRITICAL** | Provisioning task (non-code, immediate) |
| R6 | Three pricing sources drift — displayed price wrong | Medium | Medium | **MEDIUM** | Consolidate to single source |
| R7 | Team seat enforcement missing — free users add unlimited members | Medium | Medium | **MEDIUM** | Add canAddTeamMember() guard |
| R8 | All 45 assets auto-generated — cost 3-5x assumed | Low | Medium | **MEDIUM** | Confirm on-demand generation |
| R9 | Taddy quota exhausted by free users — feature breaks for all | Medium | Medium | **MEDIUM** | Gate Taddy features behind Pro |
| R10 | Competitor launches full-featured free trial — evaluation lost | High | Medium | **MEDIUM** | Add 14-day Pro trial option |
| R11 | No annual pricing — lower LTV certainty vs. competitors | High | Low | **LOW** | Add annual Stripe prices |
| R12 | "Too cheap to trust" perception — low agency adoption | High | High | **HIGH** | Raise Agency to $149 |
| R13 | Show limit forces premature Agency upgrade — churn | Medium | Medium | **MEDIUM** | Raise Pro show limit or add Creator tier |

---

## Critical Risks (Act Before Launch)

### R1 — Agency Long-Form Cost Exposure
**Description:** An Agency user processing 200 episodes at 3+ hours each incurs $100+ in variable costs against $49 revenue (or $149 at recommended price — still a loss at extreme usage).
**Trigger:** Any Agency user managing long-form content (true crime, documentary, interview podcasts)
**Financial impact at current pricing:** -$30 to -$82 per affected user per month
**Financial impact at recommended $149:** -$0 to -$28 per affected user per month (better but not solved)
**Mitigation:** Add audio-hour monitoring in Sentry. Consider hard cap at 150 audio hours/month for Agency, or overage billing at $1/hr beyond cap.
**Deadline:** Before any Agency user is onboarded

### R2/R5 — Price Anchoring + Stripe Provisioning
**Description:** R2: Every day at old prices anchors user expectations. R5: No Stripe products exist yet.
**Combined mitigation:** Create Stripe products at the NEW recommended prices ($29 Pro, $149 Agency) — do not create at $19/$49. This solves both: set correct prices before any subscriber exists.
**Deadline:** Immediate (blocking all revenue)

---

## High Risks (Act Within 2 Weeks)

### R3/R12 — Agency Tier Mispricing and Perception
**Description:** $49 signals consumer-grade to agency buyers. Agencies filter out tools below $100 from professional evaluation.
**Impact:** Entire agency market segment effectively excluded from consideration at $49.
**Mitigation:** Raise Agency to $149. Add priority support and onboarding language to justify price.
**Deadline:** Before any agency-targeted marketing or outreach

---

## Medium Risks (Act Within 30 Days Post-Launch)

### R4 — Free Tier Abuse
Enable Supabase Auth email confirmation. Configuration toggle in Supabase Dashboard.

### R6 — Pricing Source Drift
Create `src/lib/pricing.ts` as single source of truth. Other files import from it.

### R7 — Team Seat Not Enforced
Implement `canAddTeamMember()` in `tier-limits.ts`, call from `POST /api/team`.

### R8 — Asset Auto-Generation Cost
Audit `generate-assets.ts`. Confirm assets are on-demand. If auto-generating all 45: restrict default to core 9.

### R9 — Taddy Quota for Free Users
Gate `/api/taddy/search` and `/api/shows/[id]/experts` behind Pro tier check.

### R10 — No Free Trial Option
Add 14-day Pro trial on sign-up. Let users experience full product; then revert to free tier.

### R13 — Show Limit Churn Trigger
Raise Pro show limit from 5 to 10, or add Creator tier at $59 with 15 shows.
