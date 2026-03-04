# Normalized Plan: PodBrain Pricing & Subscription Structure

**Scrutiny Date:** 2026-03-01
**Complexity Class:** SIGNIFICANT
**Mode:** Deep (all 7 agents)
**Plan Type:** Pricing strategy evaluation — pre-launch, no existing user base

---

## 1. Plan Identity

**Product:** PodBrain — AI-powered podcast production platform
**Domain:** getpodbrain.ai
**Stage:** Feature-complete, pre-launch (testing phase)
**Decision Context:** Finalizing pricing before first paying customers

**Value Proposition:**
- Transforms podcast audio into SEO-optimized show notes + 45 content assets
- AI vocabulary learning improves accuracy over time per show
- Podcasting 2.0 RSS tags (claimed market first for SaaS)
- Guest promotion packages with email delivery
- Hosting integrations (Buzzsprout, Transistor)
- Cross-episode AI intelligence, viral moment detection, pre-interview intelligence

**Target Users:** Independent podcasters AND podcast agencies

---

## 2. The Proposed Pricing Structure

### Current Three-Tier Model

| Tier | Price | Episodes/mo | Shows | Team | Key Features |
|------|-------|------------|-------|------|-------------|
| Free | $0/mo | 3 | 1 | 1 | 6 core asset types only |
| Pro | $19/mo | 50 | 5 | 1 | All 45 asset types, priority processing |
| Agency | $49/mo | 200 | Unlimited | 5 | White-label, API access, team seats |

### Feature Gating (as implemented in code)
Free tier gets: show_notes, episode_titles, key_takeaways, chapter_markers, transcript_summary, seo_description
Pro/Agency get: all 45 asset types + advanced integrations + custom templates

---

## 3. Unit Economics

### Variable Cost Per Episode (45-60 min podcast)
- AssemblyAI transcription: $0.17-0.39/hr → approximately $0.13-0.39/episode
- xAI Grok (grok-4-1-fast, 9 API calls): ~$0.01-0.03/episode
- Trigger.dev background job: ~$0.005/episode
- Supabase storage + Redis + Resend: <$0.01/episode
- **Total variable: ~$0.16-0.41/episode**
- **Code's own target:** $0.15/episode (PROCESSING.targetCostPerEpisode in constants.ts — already exceeded)

### Fixed Monthly Infrastructure
- Supabase Pro: $25/mo
- Taddy Pro API: $75/mo (podcast search, 100K req/mo)
- Resend email: $0-20/mo
- Trigger.dev: $0-10/mo
- Sentry error tracking: $0-29/mo
- Upstash Redis: $0-10/mo
- **Total fixed: ~$100-169/mo (mid-estimate ~$135/mo)**

### Margin Analysis at Max Tier Usage
- **Free (3 eps):** Variable cost $0.48-1.23, revenue $0 → pure loss per active user
- **Pro (50 eps):** Variable cost $8.00-20.50, revenue $19 → gross margin -8% to +58%
- **Agency (200 eps):** Variable cost $32.00-82.00, revenue $49 → gross margin -67% to +35%
- **CRITICAL:** Agency tier at max usage is structurally loss-making (cost can exceed revenue by $33)

---

## 4. Competitor Benchmarks

| Product | Price | Volume | Effective Rate |
|---------|-------|--------|---------------|
| Castmagic Hobby | $29/mo | 5 hrs/mo | $5.80/hr |
| Castmagic Starter | $99/mo | 20 hrs/mo | $4.95/hr |
| Castmagic Business | $999/mo | 80 hrs/mo | $12.49/hr |
| Capsho | $79-129/mo | Unknown | — |
| Industry norm | — | — | $5-6/hr |

### PodBrain Effective Rate (current pricing)
- Pro: $19/mo ÷ ~37.5 hrs = **$0.51/hr** (vs. competitor $4.95-5.80/hr — 10x cheaper)
- Agency: $49/mo ÷ ~150 hrs = **$0.33/hr** (vs. competitor $4.95-12.49/hr — 15-38x cheaper)

---

## 5. Key Decisions Requested

1. Is PodBrain dramatically underpriced vs. competitors?
2. Should pricing switch from episode-count to time-based (hours)?
3. Should a 4th pricing tier be added?
4. Should the free tier be reduced or eliminated?
5. Is Agency tier properly priced for value delivered?
6. What is the right market entry strategy — aggressive pricing or premium positioning?

---

## 6. Existing System Context

**Tech Stack:** Next.js 16+, React 19, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + pgvector), xAI Grok (grok-4-1-fast), AssemblyAI, Trigger.dev v4, Upstash Redis, Stripe, Resend, Taddy API

**Pricing Implementation:**
- Tier limits enforced in `src/lib/tier-limits.ts` (hard episode/show/seat caps)
- Feature flags: advancedAssets, buzzsproutIntegration, customTemplates, whiteLabel, apiAccess
- Free tier asset gating via `canGenerateAssetType()` function
- Stripe products defined in `src/lib/stripe/products.ts` — Price IDs not yet provisioned (pre-launch)
- Billing period: subscription-aligned for paid, calendar-month for free
- No cost circuit-breaker at tier level — only endpoint rate limiting (10 req/min for processing)

**No live user data available** — pricing decisions must be made without utilization rates, churn, or LTV data.

---

## 7. Embedded Assumptions

1. Average episode duration is 45-60 minutes
2. Most paid users will NOT hit their episode limit (utilization < 100%)
3. Competitor prices reflect true market willingness-to-pay
4. Free tier functions as acquisition funnel (converts to paid)
5. Agency clients manage 10+ shows or have meaningful team needs
6. 45 asset types is a strong enough differentiator to justify lower prices
7. Vocabulary learning drives meaningful retention
8. Time-based (hours) and episode-count pricing are comparable metrics
9. Taddy Pro ($75/mo fixed) remains sufficient through early growth
10. Pre-launch aggressive pricing can be raised later without user backlash
11. The podcast content creation tools market is not already saturated

---

## 8. Open Questions

- What is the realistic average monthly episode count for each tier's users?
- What is the target CAC, LTV, and payback period?
- Is the free tier designed to convert or to serve casual users indefinitely?
- Would agencies actually pay $49 for white-label — or do they expect $200-500+?
- Does Taddy Pro scale cost with user growth or stay flat at $75/mo?
- What happens to Agency margin if a user processes 200 x 2-hour episodes?
- Is there a cost cap or metered billing fallback for extreme usage?
