# Edge Cases Analysis: PodBrain Pricing Structure

**Agent:** edge-cases
**Complexity Class:** SIGNIFICANT
**Date:** 2026-03-01

---

## Agent Verdict

**MODIFY**

The pricing plan has several failure modes that are not addressed: the Agency tier is financially catastrophic under specific (not merely theoretical) usage patterns, the free tier has no abuse prevention, and the billing period logic creates exploitable edge cases. These are not corner cases — they are the predictable behaviors of motivated users encountering the system.

---

## 1. The Long-Form Content Catastrophe

### Scenario
An Agency user manages 5 true-crime podcasts, each publishing weekly 3-hour episodes.
- 5 shows × 4 episodes/month × 3 hours = 60 episodes, 180 audio hours/month
- AssemblyAI at $0.17/hr: 180 × $0.17 = **$30.60 AssemblyAI cost**
- Grok API: 60 episodes × 9 calls × ~$0.003 = **$1.62 Grok cost**
- Total variable: **~$32.22** against Revenue: **$49** — margin: +34% (barely acceptable)

But now the same agency also generates all 45 assets per episode:
- Additional Grok calls: 60 episodes × 36 more assets × $0.003 = **$6.48 more**
- Total variable: **~$38.70** — margin: +20% (dangerously thin before fixed cost allocation)

Now scale to 200 episodes at 3 hours each:
- AssemblyAI: 200 × 3 × $0.17 = **$102**
- Grok (9 default calls): **$6**
- Total variable: **$108** against Revenue: **$49** — Net loss: **-$59 per user per month**

**This is not a theoretical edge case.** Long-form agencies (true crime, documentary, interview podcasts) routinely produce 2-4 hour episodes. Any Agency-tier user with this content type loses PodBrain money every month.

**Mitigation options:**
1. Cap audio hours (Agency = 150 hrs/month, not 200 episodes of unlimited length)
2. Add overage billing ($1/hour beyond base allocation)
3. Clearly disclaim in marketing: "optimized for episodes under 90 minutes"

---

## 2. Free Tier Abuse via Re-Registration

### Scenario
A podcaster uses 3 free episodes in January, finds the tool valuable, and instead of upgrading:
1. Creates a new Gmail (using period trick: j.ohn@gmail.com vs john@gmail.com)
2. Re-registers for a new free PodBrain account
3. Gets 3 more free episodes
4. Repeats indefinitely

**Current code has no mitigation.** The `users` table is keyed on Supabase Auth user ID. No device fingerprinting, no payment method verification, no IP-based limits exist.

**Cost per abusive block:** ~$0.65 in variable costs for 3 episodes. At $0 revenue, each block is a loss. At 100 users doing this over 12 months: ~$780 wasted variable costs + accumulated Supabase storage with no cleanup mechanism.

**Recommended minimum mitigation:** Require email verification before any episode processing. Supabase Auth supports this natively — it's a configuration toggle, not a code change.

---

## 3. Billing Period Timing Exploitation

### Scenario
The free tier resets on the 1st of each calendar month. A user who knows this:
1. Registers on January 31st
2. Processes 3 episodes that day
3. On February 1st, processes 3 more

Result: 6 episodes in ~48 hours, all on the free tier. This is not rule-breaking but the conversion model assumes 3 episodes/month, not 6 in 2 days.

**Impact:** Low. Most users won't exploit this deliberately. But the conversion funnel math — "a weekly podcaster hits the cap in month 1 and upgrades" — is undermined if savvy users can get a month's worth of value in 2 days.

---

## 4. The Show Limit Forcing Agency Upgrade

### Scenario
A dedicated independent podcaster runs 6 shows (main show + 5 spinoffs/collaborations). They publish:
- 6 shows × 4 episodes each = 24 episodes/month
- Well within Pro's 50-episode limit
- But exceeds Pro's 5-show limit

They must upgrade to Agency ($49/mo) purely for the extra show, even though they use only 24 of their 200 episode allowance and don't need team seats or white-label.

**User experience:** "I'm paying 2.5× more ($49 vs $19) for the same amount of content because I have one extra show. That's wrong."

This is a legitimate complaint and a churn trigger. The show limit is the wrong forcing function for this user's growth pattern.

**Options:**
- Raise Pro show limit from 5 to 10
- Offer "additional shows" as a $5/show/month add-on
- Create an intermediate tier at $39-49 with 10 shows but no team features

---

## 5. Agency Team Seat Lifecycle Gaps

### Scenario
An agency buys the Agency tier for 5 team seats. They add 5 members. One employee leaves. They remove that person and try to add a replacement.

**Undefined behaviors:**
- Does the departing team member's active session get invalidated?
- Who owns episodes/assets the departing member created?
- Is there a seat reassignment or "transfer" flow?
- What if the owner account is deleted?

None of this is implemented. Team features are Phase 2.3 additions and lifecycle edge cases are unaddressed.

**Pricing implication:** Selling "5 team seats" as a feature requires those seats to work reliably through normal employee turnover. If team management is broken, Agency-tier marketing is misleading.

---

## 6. Vocabulary Learning Cross-Tier Behavior

### Scenario
A user on the free tier adds 50 vocabulary terms for their niche podcast over 3 months, then upgrades to Pro. Their accumulated vocabulary should immediately improve processing — and it does, because vocabulary is stored per-show and used at processing time regardless of tier.

**Good design:** This creates genuine switching cost. The vocabulary investment is tied to the PodBrain account.

**But the edge case:** A Pro user who downgrades to free still has their vocabulary. Free-tier episodes still benefit from Pro-era vocabulary accumulation. This is arguably a free service extension, but it's also a retention feature — the user's investment in vocabulary makes them reluctant to cancel.

**No action required** — this behavior should be intentional and highlighted in retention messaging. "Your vocabulary AI gets smarter with every episode — and it stays yours."

---

## 7. The Competitor Free Trial Comparison Problem

### Scenario
A user evaluates PodBrain vs. Castmagic. Both have free tiers. Castmagic's free trial gives access to all features for a limited period. PodBrain's free tier gives access to 6 of 45 assets indefinitely.

**User's mental comparison:** "Castmagic free trial lets me try everything. PodBrain free only lets me use 6 features."

Result: Castmagic wins the evaluation even though PodBrain's paid product is vastly better value — the user never experienced PodBrain's full capability.

**Risk:** High. This is a predictable evaluation pattern for any user comparison-shopping.

**Mitigation:** Offer a 14-day Pro trial on sign-up in addition to (or instead of) the perpetual restricted free tier. Let users taste all 45 assets. The conversion data will tell you whether this improves paid conversion.

---

## 8. The "200 Episodes × All 45 Assets" Max Stress Case

### Scenario
A power Agency user, possibly using the API, triggers full 45-asset generation for all 200 episodes in a billing period.

- 200 episodes × 45 assets = 9,000 Grok API calls
- At $0.003/call average: **$27 in Grok costs**
- Plus AssemblyAI at avg 45 min: **$25.50**
- Total variable: **$52.50** against **$49 revenue** — **Net loss: -$3.50**

This is the "moderate" version of the catastrophe — even at average episode length and all assets, the Agency tier barely breaks even. At 3-hour episodes, it's a -$59 loss.

**The current code likely prevents this partially** — asset generation is rate-limited at 30 req/min, and assets may be generated on-demand rather than automatically for all episodes. Confirm that the generate-assets endpoint takes specific asset types rather than auto-generating all 45 per episode.

---

## 9. No Annual Pricing Option

The plan discusses only monthly pricing. Annual pricing is a standard SaaS mechanism that:
- Collects 10-12 months of revenue upfront (improves cash flow)
- Reduces monthly churn (annual subscribers cancel 40-60% less often)
- Increases LTV certainty
- Creates a price anchor ("$19/mo billed annually vs. $23/mo monthly")

**Implementation cost:** 2-3 hours — create annual Stripe prices at a discount (e.g., Pro annual: $190/yr = $15.83/mo effective, vs $19/mo monthly).

**Not offering annual pricing at launch is a missed opportunity** that costs nothing to add and meaningfully improves unit economics.

---

## Summary

| Edge Case | Severity | Probability |
|-----------|----------|-------------|
| Long-form Agency user loses money per month | CRITICAL | Medium |
| Free tier re-registration abuse | HIGH | Medium |
| Show limit forcing Agency upgrade prematurely | MEDIUM | Medium |
| Competitor free trial beats restricted free tier in evaluation | HIGH | High |
| All-assets Agency stress case barely breaks even | HIGH | Medium |
| No annual pricing option | MEDIUM | High (most SaaS buyers check for this) |
| Billing period gaming | LOW | Low |
| Team seat lifecycle gaps | MEDIUM | Low at launch |

**Bottom line:** Three edge cases need immediate action before launch: (1) add audio-hour monitoring for Agency-tier cost exposure, (2) add email verification to prevent free tier abuse, (3) confirm assets are generated on-demand not automatically. Annual pricing is a high-value addition with low implementation cost and should be added before the first paying subscriber.
