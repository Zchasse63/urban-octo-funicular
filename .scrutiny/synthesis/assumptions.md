# Assumptions Register: PodBrain Pricing Structure

**Date:** 2026-03-01

---

## Assumptions That Are Likely True

| # | Assumption | Evidence | Confidence |
|---|-----------|----------|------------|
| A1 | Average podcast episode is 45-60 minutes | Industry widely reported; matches AssemblyAI pricing examples | HIGH |
| A2 | AssemblyAI Universal-2 model at $0.17/hr is the cost in use | Confirmed from codebase — Universal-2 + speaker diarization configured | HIGH |
| A3 | Grok API cost is $0.01-0.03 for 9 default calls | Consistent with xAI published pricing at expected token volumes | HIGH |
| A4 | Supabase Pro at $25/mo is sufficient for early growth | Supports 8GB DB + 100GB storage; sufficient for <10,000 episodes | HIGH |
| A5 | Competitor pricing is as stated | Castmagic, Capsho prices are publicly listed | HIGH |
| A6 | The market pays $5-6/hr for podcast AI tools | Consistent across Castmagic tiers | HIGH |

## Assumptions That Are Uncertain

| # | Assumption | Risk if Wrong | Confidence |
|---|-----------|--------------|------------|
| A7 | Most users will NOT hit their episode limit each month | If 30%+ of Agency users hit 200 eps with long-form content, Agency tier loses money | MEDIUM |
| A8 | Free tier converts to paid at a meaningful rate | If conversion rate is <5%, free tier is pure cost center with no strategic value | MEDIUM |
| A9 | Taddy Pro ($75/mo) is sufficient for early growth | Free users trigger Taddy searches at scale (ungated today), could exhaust quota | MEDIUM |
| A10 | Price increase post-launch is possible without major churn | Every SaaS that has raised prices knows this is costly | MEDIUM |
| A11 | Vocabulary learning drives meaningful retention | No user data yet; assumed based on product logic | MEDIUM |
| A12 | Agencies will evaluate a $149 Agency tier | Requires social proof from early users first | MEDIUM |

## Assumptions That Are Likely Wrong

| # | Assumption | Why Likely Wrong | Action |
|---|-----------|-----------------|--------|
| A13 | $19 is the right Pro price | 10x below market value of time saved; no competitive advantage vs. Castmagic at $29 | Raise to $29 |
| A14 | $49 is the right Agency price | Agency buyers filter out tools under $100; $49 is not agency-grade positioning | Raise to $149 |
| A15 | Episode count alone is a safe cost control mechanism | Audio duration is the cost driver; 200 x 4-hour episodes = $100+ variable cost | Add audio-hour cap |
| A16 | The Agency tier is profitable at max usage | At 200 eps x avg long-form: variable cost > revenue. Confirmed by math. | Fix before launch |
| A17 | Raising prices post-launch is as easy as pre-launch | False — every existing user must be grandfathered or risked for churn | Act now |
| A18 | PROCESSING.targetCostPerEpisode = $0.15 is achievable | Actual cost is $0.16-0.41; the code's own target is already exceeded | Update constant |

## Assumptions That Need Validation (Post-Launch)

| # | Assumption | How to Validate | Timeline |
|---|-----------|----------------|----------|
| V1 | Typical Agency user processes 50-100 eps/month (not 200) | First 90 days of Agency user data | Post-launch |
| V2 | Free-to-Pro conversion rate (target: 10-15%) | First 6 months of free user behavior | Post-launch |
| V3 | Free trial (14-day Pro access) improves conversion vs. restricted free tier | A/B test at launch | At launch |
| V4 | Pro at $29 converts as well as Pro at $19 | Monitor conversion rate in first 30 days | At launch |
| V5 | Assets are primarily generated on-demand (not all 45 auto-generated) | Code audit of generate-assets.ts behavior | Before launch |
| V6 | Taddy Pro quota is sufficient at 1,000 active free users | Monitor Taddy usage counter from day 1 | Week 1 post-launch |
