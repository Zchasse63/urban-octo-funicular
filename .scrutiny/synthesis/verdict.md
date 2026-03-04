# Verdict: PodBrain Pricing & Subscription Structure

**Synthesis Date:** 2026-03-01
**Reports Synthesized:** 7 (technical-feasibility, scope-complexity, user-value, cost-benefit, architecture-impact, edge-cases, competitive-context)
**Complexity Class:** SIGNIFICANT
**Mode:** Deep (all 7 agents)

---

## Verdict: MODIFY

The pricing plan should not launch as-is. It is not a GO because it misprices both the individual and agency segments, carries an unmitigated structural cost risk in the Agency tier, and misses the pre-launch window — the only moment when prices can be set correctly at zero cost. It is not a NO-GO because the product is viable, the cost structure is manageable, and the changes required are straightforward.

---

## Agent Verdicts Summary

| Agent | Verdict | Primary Concern |
|-------|---------|----------------|
| technical-feasibility | MODIFY | Agency tier has no audio-hour cost cap; Stripe not provisioned |
| scope-complexity | MODIFY | Agency at $49 is wrong market positioning; Pro limit creates no upgrade urgency |
| user-value | MODIFY | Agency price signals consumer-grade to professional buyers; aha moment weak on free |
| cost-benefit | MODIFY | Pro underpriced by ~50%; Agency underpriced by ~200-300% vs. market WTP |
| architecture-impact | MODIFY | Three sources of pricing truth; team seat enforcement missing; Stripe provisioning critical |
| edge-cases | MODIFY | Long-form Agency content causes loss; free tier has no abuse prevention; no annual pricing |
| competitive-context | MODIFY | $19 Pro cannot compete on narrative with Castmagic; $49 Agency is invisible to real agencies |

**Unanimous verdict: MODIFY.** No agent recommended GO. No agent recommended NO-GO or DEFER.

---

## The Three Core Issues

### Issue 1: Agency Tier Is Financially Unsafe at Max Usage

At 200 episodes of long-form content (2-4 hours/episode), variable costs exceed $49 revenue by $30-82. There is no code-level protection (no audio-hour cap, no cost circuit-breaker). This is not a theoretical risk — agencies with true-crime, documentary, or interview-format podcasts routinely produce 2-4 hour episodes.

**Required fix before launch:** Add audio-hour monitoring/alerting. Consider adding a soft cap at 150 audio hours/month for Agency tier.

### Issue 2: Prices Are Set Against Cost, Not Against Value

The plan correctly identifies that PodBrain's cost per episode is $0.16-0.41. It then sets prices just above cost ("$19/mo for 50 episodes — even at max usage we're profitable!"). This is cost-plus pricing, the least optimal pricing strategy for SaaS.

The market data in the plan contradicts itself: Castmagic charges $5.80/hr, the market norm is $5-6/hr, and podcasters are saving 6-9 hours per episode. The correct price is derived from value delivered to the buyer, not from the seller's API costs.

**The current prices leave 40-60% of capturable revenue on the table.**

### Issue 3: Pre-Launch Is the Only Costless Moment to Change Prices

Every day the product runs at $19 Pro and $49 Agency with paying customers is a day it becomes harder to raise prices. Grandfathering, communications, and churn risk accompany every post-launch price increase.

Right now, with zero subscribers, a price change is:
- One Stripe configuration update
- One landing page copy change
- Zero customer emails required
- Zero churn risk

**This window closes the moment the first paying subscriber signs up.**

---

## Recommended Pricing Structure

### Recommended vs. Current

| Tier | Current | Recommended | Rationale |
|------|---------|-------------|-----------|
| Free | $0, 3 eps, 6 assets | $0, 3 eps, 6 assets + 14-day Pro trial on sign-up | Current free is right; add trial to improve aha moment |
| Pro | $19/mo, 50 eps | **$29/mo**, 50 eps | Matches Castmagic Hobby price; enables "same price, 10x features" narrative |
| Creator (new) | — | **$59/mo**, 100 eps, 15 shows | Serves multi-show creators currently mis-placed in Agency |
| Agency | $49/mo, 200 eps | **$149/mo**, 200 eps, 150 audio hrs | Right-prices for professional buyers; adds audio-hour cap |

**Note:** The "Creator" tier is optional for launch. If simplicity is preferred, simply raise Pro to $29 and Agency to $149. The 3-tier structure is clean and sufficient.

### Annual Pricing (Add Before First Subscriber)
- Pro annual: $232/yr ($19.33/mo effective — "2 months free")
- Agency annual: $1,192/yr ($99.33/mo effective)

This is a 2-3 hour implementation in Stripe and adds annual pricing that every competitor offers.

---

## Key Numbers

| Metric | Current Structure | Recommended Structure |
|--------|-----------------|----------------------|
| Pro monthly revenue per user | $19 | $29 |
| Agency monthly revenue per user | $49 | $149 |
| Pro gross margin at avg usage (15 eps) | 84% | 90% |
| Agency gross margin at avg usage (80 eps) | 67% | 89% |
| Agency gross margin at max 200 eps × avg 45 min | +35% | +52% |
| Agency gross margin at max 200 eps × 3 hrs | **-120%** | **-17%** (with audio-hour cap: +6%) |
| Break-even paying users (fixed costs only) | 8 Pro | 5 Pro |
| LTV (Pro, 18-month retention) | $342 | $522 |
| LTV (Agency, 24-month retention) | $1,176 | $3,576 |

---

## What Must Be Done Before Launch (Pricing-Related)

### Critical (blocking)
1. Provision Stripe products at the new prices (not the old ones) before any subscriber exists
2. Fix Stripe success URL redirect (B9 from prior audit: `/settings/billing` → `/settings?tab=billing`)
3. Add audio-hour monitoring/alerting for Agency tier cost visibility
4. Add email verification requirement before episode processing

### High Priority (week 1 post-decision)
5. Consolidate three-source-of-truth pricing data into single `src/lib/pricing.ts`
6. Add `canAddTeamMember()` enforcement guard to the team API route
7. Add annual Stripe pricing options
8. Implement 14-day Pro trial on sign-up (or decide on free-tier-only approach)

### Medium Priority (before first 100 users)
9. Make "39 locked assets" visible to free-tier users (upgrade prompts in the UI)
10. Add audio-hour cap enforcement for Agency tier (not just episode count)
11. Confirm asset generation is on-demand, not auto-generating all 45 for every episode
