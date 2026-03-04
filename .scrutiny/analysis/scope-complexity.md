# Scope & Complexity Analysis: PodBrain Pricing Structure

**Agent:** scope-complexity
**Complexity Class:** SIGNIFICANT
**Date:** 2026-03-01

---

## Agent Verdict

**MODIFY**

The pricing plan's scope is appropriate in concept, but it attempts to serve two fundamentally different buyer personas (independent podcasters and agencies) with the same three-tier structure at price points that work well for one and are unjustifiably cheap for the other. The complexity of this decision is higher than it appears — pricing is not just a financial decision but a product positioning decision that will be extremely difficult to reverse once users are onboarded.

---

## 1. Scope of the Decision

This is not a simple "pick a number" pricing decision. The plan encompasses:

1. **Unit of value definition:** Episode count vs. audio hours vs. feature access vs. outcomes
2. **Market positioning:** Price leader vs. value leader vs. premium
3. **Revenue model:** Flat subscription vs. usage-based vs. hybrid
4. **Tier architecture:** 3 tiers vs. 4 tiers, and what each gates
5. **Freemium strategy:** Acquisition funnel vs. viable product vs. lead magnet
6. **Agency pricing:** Professional services pricing vs. SaaS pricing
7. **Competitive strategy:** Race to bottom vs. differentiation

Each of these is a distinct decision with its own implications. The plan conflates them. Resolving all seven simultaneously as a pre-launch exercise without user data is high risk.

---

## 2. The Two-Persona Problem

The plan targets "Independent podcasters AND podcast agencies." These are profoundly different buyers:

### Independent Podcasters
- Decision-maker = end user
- Budget: discretionary, personal ($20-100/mo feels significant)
- Episode cadence: typically 1-8 episodes/month (not 50)
- Value metric: time saved per episode, content quality
- Purchase trigger: "this saves me 3 hours per episode"
- Price sensitivity: HIGH
- Support burden: HIGH (questions, feature requests)
- LTV: typically 12-24 months before show cancellation or pivot

### Podcast Agencies
- Decision-maker = different from end user
- Budget: client-billable, professional ($100-500/mo is normal)
- Episode cadence: 20-200+ episodes/month (managing multiple clients)
- Value metric: per-client profitability, team throughput, white-label
- Purchase trigger: "this replaces a human editor or VA"
- Price sensitivity: LOW (if it replaces a $500/mo contractor)
- Support burden: LOW (power users, technical)
- LTV: potentially 3-5 years if integrated into workflow

**The problem:** The current pricing plan has a $49/mo Agency tier. A real agency managing 10 client shows is replacing 10 × $300-500/mo in contractor work. They would pay $200-500/mo without hesitation. Offering it at $49 does not signal value to a professional buyer — it signals "this is a consumer tool that also works for agencies."

**Scope complexity:** Adding an Enterprise/Agency tier at appropriate pricing ($199-499/mo) is not a small scope addition. It requires:
- Different onboarding flow (agency → shows setup, not personal show)
- Client management view (manage shows per client, not per personal show)
- Invoice/billing per client or consolidated billing
- White-label actually delivered (not just a feature flag)
- Dedicated onboarding and support tier
- Agency-specific sales motion

This is not a pricing decision — it is a product segment decision. Trying to serve agencies at $49 is scope reduction through underpricing.

---

## 3. Tier Gap Analysis

### The Missing Middle

Current structure:
- Free: $0 (3 episodes)
- Pro: $19 (50 episodes) — 50 episodes is a HIGH cap for a solo podcaster
- Agency: $49 (200 episodes) — $49 is a LOW price for actual agency use

The jump from Free ($0) to Pro ($19) is too large for many users who want "a little more than free." The jump from Pro ($19) to Agency ($49) is too small to signal agency-grade value.

**A missing tier:** A "Starter" or "Creator" tier at $9/mo (10-15 episodes, 3 shows, core assets) would:
- Reduce the activation energy for free-to-paid conversion
- Serve the "I publish twice a month" independent podcaster
- Create a clearer step-up ladder

**However:** Adding this tier adds product complexity. The current code has 3 tiers hardcoded across multiple files (constants.ts, tier-limits.ts, products.ts, stripe/products.ts). Adding a 4th tier requires changes to all four plus UI, plus Stripe configuration. Estimated: 2-3 days of development.

---

## 4. The Episode Count Metric Problem

50 episodes/month for Pro. This sounds like a lot. How many podcasters produce 50 episodes per month on a single show?

- Daily show: 30 episodes/month
- 3x/week: 13 episodes/month
- Weekly: 4-5 episodes/month
- Biweekly: 2-3 episodes/month

The vast majority of independent podcasters publish 4-8 episodes/month. The Pro tier's 50-episode cap is so far above typical usage that it provides no psychological urgency to upgrade. Users will see "3 used of 50 this month" and never feel the ceiling.

**This is a significant scope complexity problem:** The metric chosen (episodes) does not align with the natural pressure points in the user journey. A podcaster on free tier hits the 3-episode cap on month 1 if they publish weekly. But a Pro user never hits 50 unless they're running multiple daily shows.

**Alternative metrics to consider:**
- Shows (more natural ceiling for growing podcasters: 1 → 3 → 10)
- Asset downloads or exports (engagement-based)
- Team seats (grows with agency use)
- Audio hours processed (scales with content volume)

For independent podcasters, the most meaningful ceiling is likely "number of shows" — upgrading from 1 show to multiple shows (starting a second podcast, managing a client's show) is a natural growth path.

---

## 5. Free Tier Scope

6 core assets on free. The 6 are: show_notes, episode_titles, key_takeaways, chapter_markers, transcript_summary, seo_description.

**The question: is this enough to demonstrate value?**

Yes — show notes alone is the primary value proposition. A user who gets high-quality AI show notes on 3 episodes will understand the product's capability. The question is whether they then convert.

**The risk:** 3 episodes might be enough for some users to "get what they came for" and churn without ever paying. A podcaster who produces 1 episode a month and only needs show notes could use the free tier for 3 months and then cancel (or re-register with a new email).

**Scope of abuse prevention:** No mention of email verification, device fingerprinting, or any free tier abuse prevention. This is a scope gap for a launch checklist.

---

## 6. What Changing Pricing Affects

If the team decides to change pricing post-launch, the scope of changes includes:

| Change | Files Affected | Complexity |
|--------|---------------|------------|
| Raise Pro from $19 to $39 | products.ts, stripe, landing page | LOW (mostly Stripe + copy) |
| Add Starter tier at $9 | 4+ code files + DB + Stripe | MEDIUM (2-3 days) |
| Switch to hourly pricing | tier-limits.ts, DB schema, UI | HIGH (1-2 weeks) |
| Raise Agency to $99 | Same as price raise | LOW |
| Add Enterprise tier | New product segment | VERY HIGH (new features) |
| Grandfather existing users | Stripe subscription handling | MEDIUM |

**The longer PodBrain runs at current prices, the harder it is to raise them.** Pre-launch is the ONLY time to raise prices with zero user backlash. Post-launch price increases require grandfathering, communications, and churn risk.

---

## 7. Complexity of the Episode-to-Hour Conversion

The plan asks whether to switch from episode count to hour-based pricing. The scope of this change:

**In the database:** Episodes table has duration stored as `duration_seconds` (from AssemblyAI). The data is available.

**In tier-limits.ts:** The enforcement logic is episode-count based. It would need to be rewritten to query the sum of `duration_seconds` for episodes in the billing period.

**In the UI:** Every usage display (progress bars, limit warnings, upgrade prompts) would need to show "hours" not "episodes."

**In Stripe:** Products would need to be redefined with hour-based limits (or metered billing).

**In marketing:** All copy changes from "50 episodes/month" to "37 hours/month."

**Estimated scope:** 1.5-2 weeks of development for a complete switch. Not trivial pre-launch.

**Verdict:** Episode count is fine as a proxy metric for now. It is easy to understand, easy to enforce, and familiar from competitor positioning. Switch to hours if cost data post-launch shows dangerous margin erosion.

---

## Summary

| Finding | Severity |
|---------|----------|
| Two-persona problem: agency at $49 is misaligned | HIGH |
| Missing Starter tier creates conversion gap | MEDIUM |
| 50-episode Pro cap creates no urgency | MEDIUM |
| Episode count may be wrong metric for cost control | MEDIUM |
| Free tier abuse potential (re-registration) | LOW |
| Post-launch price increase will face user resistance | HIGH (timing) |

**Bottom line:** The plan is scoped appropriately for a pre-launch MVP pricing exercise, but it undersizes the agency opportunity and oversizes the Pro tier's limits. The most important scope decision is not "3 tiers vs. 4 tiers" — it is "are we really serving agencies or are we pretending to?"
