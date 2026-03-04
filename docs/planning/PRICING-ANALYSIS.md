# PodBrain Pricing Analysis & Recommendations

**Date:** 2026-03-02
**Status:** Pre-launch (zero subscribers — optimal window for pricing changes)

---

## 1. Verified API Costs Per Episode

Based on codebase analysis and current API pricing (March 2026):

| Service | Cost Per Episode | Notes |
|---------|-----------------|-------|
| **AssemblyAI** (transcription) | $0.13–0.39 | Universal-2 + speaker diarization at $0.17/hr; standard rate ~$0.39/hr. 45-60 min avg episode |
| **xAI Grok** (content generation) | $0.01–0.03 | 9 API calls (show notes + 8 default assets). Input: $0.20/M tokens, Output: $0.50/M tokens |
| **Trigger.dev** (background jobs) | ~$0.005 | 4-5 task invocations per episode |
| **Supabase** (DB + storage) | ~$0.001 | Marginal per-episode cost |
| **Upstash Redis** (rate limiting) | ~$0.0001 | $0.20 per 100K requests |
| **Resend** (email notification) | ~$0.0004 | 1-2 emails per episode |
| **TOTAL** | **$0.16–0.41** | Avg ~$0.25 for a typical 45-min episode |

### Key Insight: Transcription Is 80%+ of Variable Cost

xAI Grok is nearly free at current pricing ($0.20/M input, $0.50/M output). AssemblyAI transcription dominates the cost structure.

---

## 2. Fixed Infrastructure Costs

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Supabase Pro | $25 | 8GB DB, 100GB storage, 100K MAU included |
| Taddy Pro | $75 | 100K requests/month — gate behind Pro tier to justify |
| Resend | $0–20 | Free tier: 3K emails/month; Pro: $20/mo for 50K |
| Trigger.dev | $0–10 | Free tier: 10K invocations; generous for early stage |
| Sentry | $0–29 | Free tier: 5K error events/month |
| Upstash Redis | $0–10 | Pay-as-you-go: $0.20/100K requests |
| **Total** | **$25–169** | $25 minimum (early), ~$169 at growth stage |

---

## 3. Current vs. Recommended Pricing

### The Problem With Current Pricing

| Issue | Detail |
|-------|--------|
| **Cost-plus pricing** | We priced against our API costs ($0.16-0.41/ep), not against the value we deliver |
| **Agency tier is invisible** | At $49/mo, agencies filter us out of professional evaluation (their threshold: $100+) |
| **Pro is 10x below market** | Castmagic charges $29/mo for 5 hours of audio. We charge $19/mo for 50 episodes |
| **Revenue left on table** | 40-60% of capturable revenue lost at current prices |
| **Price anchoring risk** | Once subscribers exist at $19/$49, raising prices requires grandfathering and risks churn |

### What Competitors Charge

| Competitor | Entry | Mid | High | Pricing Model |
|-----------|-------|-----|------|---------------|
| Castmagic | $29/5 hrs | $99/20 hrs | $999/80 hrs | Hours of audio |
| Capsho | $79/mo | $129/mo | — | Monthly flat |
| Podium | ~$25/mo | ~$89/mo | — | Monthly flat |
| Descript | $24/mo | $40/mo | $80/mo | Monthly flat |
| **PodBrain (current)** | $19/50 eps | $49/200 eps | — | Episode count |

### Recommended Pricing Structure

| Tier | Current | **Recommended** | Key Changes |
|------|---------|-----------------|-------------|
| **Free** | $0, 3 eps, 1 show | **$0, 3 eps, 1 show + 14-day Pro trial** | Add trial to improve conversion |
| **Pro** | $19/mo, 50 eps, 5 shows | **$29/mo, 50 eps, 10 shows** | +$10 matches Castmagic entry; enables "same price, 10x output" marketing |
| **Agency** | $49/mo, 200 eps, unlimited shows, 5 seats | **$149/mo, 200 eps, 150 audio hrs, unlimited shows, 10 seats** | 3x price for professional positioning; add audio-hour cap for cost protection |

**Optional 4th tier (add later based on data):**
| **Creator** | — | **$59/mo, 100 eps, 15 shows** | Serves multi-show creators who don't need team features |

### Annual Pricing (add before launch)
- Pro annual: $232/yr ($19.33/mo effective — "2 months free")
- Agency annual: $1,192/yr ($99.33/mo effective — "2 months free")

---

## 4. Financial Impact

### Per-User Margins

| Tier | Avg Episodes/mo | Variable Cost | Revenue | Gross Margin |
|------|----------------|---------------|---------|-------------|
| Free | 2 | $0.50 | $0 | -100% (acquisition cost) |
| Pro (avg usage) | 15 | $3.75 | $29 | **87%** |
| Pro (max usage) | 50 | $12.50 | $29 | **57%** |
| Agency (avg usage) | 80 | $20.00 | $149 | **87%** |
| Agency (max 200 eps, avg length) | 200 | $50.00 | $149 | **66%** |
| Agency (max 200 eps × 3hr each) | 200 | $102.00 | $149 | **32%** (protected by audio-hour cap) |

### Revenue Projections (Month 12)

| Metric | Current Pricing | Recommended Pricing |
|--------|----------------|-------------------|
| 200 Pro users × monthly | $3,800 | **$5,800** |
| 25 Agency users × monthly | $1,225 | **$3,725** |
| **Total MRR** | **$5,025** | **$9,525** (+90%) |
| Gross margin | 61% | 78% |

### LTV Comparison

| Tier | Current Price | LTV (18/24 mo) | Recommended Price | LTV |
|------|-------------|-----------------|-------------------|-----|
| Pro | $19 | $342 | $29 | **$522** |
| Agency | $49 | $1,176 | $149 | **$3,576** |

Higher LTV means we can spend more on customer acquisition and marketing.

---

## 5. Critical Actions Before Launch

### Blocking (do before first subscriber)

1. **Provision Stripe products at NEW prices** ($29 Pro, $149 Agency) — NOT the old $19/$49
2. **Add annual pricing** in Stripe ($232/yr Pro, $1,192/yr Agency)
3. **Update landing page** pricing section, tier cards, feature comparison
4. **Update `src/lib/constants.ts`** — tier pricing, limits (Pro shows: 5→10, Agency seats: 5→10)
5. **Update `src/lib/tier-limits.ts`** — show limits, team seat limits
6. **Add audio-hour tracking** for Agency tier (monitor/alert at minimum, enforce cap later)

### High Priority (week 1)

7. **Consolidate pricing sources** — create single `src/lib/pricing.ts` as source of truth
8. **Add `canAddTeamMember()` enforcement** in team API route
9. **Gate Taddy features behind Pro** (expert discovery, pre-interview intelligence)
10. **Implement 14-day Pro trial** on free signup
11. **Add email verification requirement** before episode processing

### Medium Priority (before 100 users)

12. **Make locked assets visible** to free users (upgrade prompts showing what they're missing)
13. **Audio-hour cap enforcement** for Agency (soft cap at 150 hrs, overage at $1/hr)
14. **Update `PROCESSING.targetCostPerEpisode`** from $0.15 to $0.25 (actual cost)

---

## 6. Value Proposition by Tier

### Pro at $29/mo — "Same price as Castmagic, 10x the output"
- Castmagic Hobby: $29/mo for 5 hours of audio, ~10 asset types
- PodBrain Pro: $29/mo for 50 episodes, 45 asset types, vocabulary learning, SEO analysis
- **Marketing angle:** "One episode. Two weeks of content."

### Agency at $149/mo — "15% of Castmagic Business, with team workflow"
- Castmagic Business: $999/mo for 80 hours
- PodBrain Agency: $149/mo for 200 episodes, team seats, hosting integrations
- **Marketing angle:** "The platform your agency's clients don't know they're running on."

---

## 7. Assumptions to Validate Post-Launch

| Assumption | How to Validate | Timeline |
|-----------|----------------|----------|
| Typical Agency user processes 50-100 eps/month (not 200) | First 90 days of Agency user data | 90 days |
| Free-to-Pro conversion rate (target: 10-15%) | Free user behavior tracking | 6 months |
| Pro at $29 converts as well as Pro at $19 | Monitor conversion in first 30 days | 30 days |
| 14-day Pro trial improves conversion | A/B test free vs. trial | At launch |
| Average episode length is 45-60 min | Track from processing data | 30 days |

---

## Sources

- [AssemblyAI Pricing](https://www.assemblyai.com/pricing) — Universal-2 at $0.15/hr base
- [xAI API Pricing](https://x.ai/api#pricing) — grok-4-1-fast at $0.20/M input, $0.50/M output
- [Supabase Pricing](https://supabase.com/pricing) — Pro at $25/mo
- [Upstash Redis Pricing](https://upstash.com/pricing/redis) — $0.20 per 100K requests
- [Castmagic Pricing](https://www.castmagic.io/pricing) — Hobby $29, Starter $99, Business $999
