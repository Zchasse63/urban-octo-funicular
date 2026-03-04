# Technical Feasibility Analysis: PodBrain Pricing Structure

**Agent:** technical-feasibility
**Complexity Class:** SIGNIFICANT
**Date:** 2026-03-01

---

## Agent Verdict

**MODIFY**

The pricing structure is technically implementable as designed, but contains a structural flaw: the Agency tier at max usage is loss-making with no technical safeguard to prevent it. The Stripe integration is not yet live. No cost circuit-breaker exists at the tier level. These are not theoretical concerns — they are confirmed gaps in the codebase.

---

## 1. Is the Pricing Technically Enforceable?

### Episode Count Limits
**Status: Implemented and working.**
`src/lib/tier-limits.ts` enforces hard caps per tier. `canCreateEpisode()` queries the DB and returns 401 with an upgrade prompt if the limit is exceeded. `getBillingPeriod()` correctly handles subscription-aligned vs. calendar-month windows.

**Gap identified:** The billing period logic for free tier uses calendar month, but for paid tiers it uses the Stripe subscription anchor date. This is correct behavior, but it means a Pro user who subscribes on the 15th gets 50 episodes between the 15th and 14th of next month — not calendar-based. This is industry-standard but could confuse users if the UI does not show the next reset date.

### Show Count Limits
**Status: Implemented.**
`canCreateShow()` enforces the 1/5/999 limits. The Agency limit is set to 999 (not "unlimited" as marketed). This is functionally unlimited but technically a cap.

### Asset Type Gating
**Status: Implemented.**
`canGenerateAssetType()` with `CORE_ASSET_TYPES` set correctly gates the 6 free assets. Free users who try to generate advanced assets should be blocked.

**Gap identified:** The code in `tier-limits.ts` gates generation, but the UI (episode workspace, 7-tab interface) likely renders all 45 asset types in the tab regardless of tier. Users on free tier may see UI for assets they cannot generate, creating frustration. This needs a UI-level check to show upgrade prompts rather than errors after attempted generation.

### Team Seat Limits
**Status: Partially implemented.**
`teamSeats` is stored in tier config but the `team/` API routes need to enforce this. The `tier-limits.ts` file shows `teamSeats: 5` for Agency but `canCreateTeamMember()` is not implemented in the file — only `canCreateEpisode()` and `canCreateShow()` have guard functions.

**This is a real gap:** Agency users could theoretically add unlimited team members if the API route doesn't check tier limits.

---

## 2. Stripe Readiness

### Current State
Stripe products are defined in `src/lib/stripe/products.ts` with `priceId: null` for both Pro and Agency (comment: "Resolved server-side via getServerPriceId()"). The `MEMORY.md` confirms: "Create Stripe products (Pro $19/mo, Agency $49/mo) + get Price IDs" is still a pending infrastructure task.

**This means the pricing plan cannot go live until:**
1. Stripe products are created in Stripe Dashboard
2. Price IDs are set as env vars
3. Stripe webhook endpoint is configured

**Known Stripe bugs from prior audit:**
- B8: Stripe `priceId` reads server-only env vars on client — upgrade buttons broken
- B9: Checkout success URL points to `/settings/billing` (non-existent) — post-checkout 404

Both are confirmed 1-line fixes but neither is yet fixed. Any user who clicks "Upgrade" today will hit a broken flow.

---

## 3. The Cost Circuit-Breaker Problem

### The Structural Risk
Agency tier: $49/mo revenue, up to $82 variable cost at max usage (200 episodes × $0.41/episode).

**There is no cost protection in the codebase.** Specifically:
- Rate limiting exists at the API level (10 req/min for processing) but does NOT enforce a monthly episode cap on cost-per-episode basis
- The `canCreateEpisode()` function enforces the 200-episode count limit but does NOT differentiate between a 5-minute episode ($0.02) and a 4-hour episode ($1.64)
- A single Agency user with 200 episodes of 4-hour podcasts would cost: 200 × $1.64 = **$328** in variable costs alone, against $49 revenue

**This is not a pricing strategy question — it is a technical gap that makes the current pricing unacceptable for agencies with long-form content.**

### Recommended Technical Fix
Two options:
1. **Hour-based cap:** Convert episode limits to audio-hour limits. 200 episodes × 45 min = 150 hours. Cap Agency at 150 audio hours/month. Implementation requires storing audio duration and checking it against the monthly budget. Moderate complexity (2-3 days).
2. **Minimum cost floor with overage billing:** Allow unlimited but charge per-episode beyond the cap. Stripe supports metered billing. Higher complexity (1 week+).

**The current episode-count-only enforcement is technically unsafe for the Agency tier.**

---

## 4. AssemblyAI Cost Variance

The plan cites "$0.17-0.39/hr" but this is a wide range. The variance matters:
- Universal-2 model (higher quality, speaker diarization): $0.17/hr
- Standard model: ~$0.39/hr

The codebase uses Universal-2 with speaker diarization enabled (confirmed in `lib/assemblyai/` config). So the realistic cost is closer to the LOW end ($0.17/hr), which is good news for margins. At $0.17/hr:
- Agency (200 eps × 45 min = 150 hrs): $25.50 AssemblyAI + ~$3-6 Grok = ~$28.50-31.50 variable
- At $49 revenue: gross margin is +37-42% at average usage

But at 4-hour episodes (200 × 4 hrs = 800 hrs): $136 AssemblyAI alone exceeds the $49 price. **The hour dimension is the real cost driver, not episode count.**

---

## 5. Taddy API Cost at Scale

Taddy Pro: $75/mo flat for 100,000 requests.

The plan assumes this is sufficient for "early growth." But:
- Each expert discovery search likely makes 2-5 Taddy API calls (search + episode lookup + caching)
- Pre-interview intelligence may make 5-10 calls per guest
- If the free tier has access to Taddy-powered search (it does — the `/api/taddy/search` route has only rate limiting, not tier gating), free users consume Taddy quota

**Gap:** The Taddy search API route (`/api/taddy/search`) is not gated behind a paid tier in the current code. Free users can use Taddy-powered expert discovery at the same $75/mo fixed cost. At 1,000 free users making 5 searches each = 5,000 Taddy calls. At 10,000 free users = 50,000 calls (within Pro limit). But at 30,000 free users, the Taddy quota is exceeded and the feature breaks for all users.

**Recommendation:** Gate Taddy-powered features (pre-interview intelligence, expert discovery beyond basic) behind Pro tier in the code.

---

## 6. xAI Cost Growth with Asset Count

The plan says "9 API calls" for Grok at $0.01-0.03/episode. This is based on the default asset set. But:
- Pro and Agency tiers get all 45 asset types
- If all 45 assets are generated per episode, this is potentially 45 separate Grok calls
- At $0.50/M output tokens, generating 45 detailed assets (avg 500 tokens each) = 22,500 tokens × $0.50/M = $0.011 in output costs per episode

The plan's $0.01-0.03 estimate appears to assume a subset of assets are generated (the 9 default ones), not all 45. If users trigger generation of all 45 assets on every episode, the Grok cost per episode could reach $0.05-0.10, which is 3-5x the assumed cost.

**This is within acceptable margins but should be verified against actual usage patterns.**

---

## 7. Infrastructure Cost at Scale

The $135/mo fixed cost baseline creates a minimum revenue threshold:
- Break-even on fixed costs alone requires: $135 ÷ $19 = ~7.1 Pro subscribers
- Or: $135 ÷ $49 = ~2.8 Agency subscribers

This is a very low bar to clear. The fixed cost structure is appropriate for a pre-launch SaaS.

**However:** Supabase Pro ($25/mo) includes 8GB database and 100GB storage. pgvector embeddings for episodes grow quickly. At 1,000 episodes with transcript segments, each ~1KB per segment × 50 segments = 50MB. At 10,000 episodes: 500MB. Storage is manageable but the embedding search (`find_similar_sections` RPC) may become expensive at scale and will require Supabase compute add-ons.

---

## Summary of Technical Findings

| Finding | Severity | Action Required |
|---------|----------|----------------|
| No hour-based cost cap for Agency | CRITICAL | Add audio-hour tracking and cap |
| Team seat limit not enforced in API | HIGH | Add `canCreateTeamMember()` guard |
| Stripe not yet provisioned | HIGH | Provisioning task (non-code) |
| Taddy search ungated from free tier | MEDIUM | Add Pro tier gate |
| xAI cost may be underestimated for full 45-asset generation | MEDIUM | Monitor and benchmark |
| UI shows all assets regardless of tier | MEDIUM | Add tier-aware UI gating |
| Billing period reset date not shown in UI | LOW | UX enhancement |

**Bottom line:** The pricing is technically implementable but the Agency tier as designed has a cost exposure that is technically unbounded relative to its revenue. Episode count alone is the wrong enforcement unit when audio duration varies from 5 minutes to 4 hours.
