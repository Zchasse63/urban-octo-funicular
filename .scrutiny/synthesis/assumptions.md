# Assumption Register: Taddy API Integration

**Date:** 2026-02-26
**Source:** Cross-synthesis from all 7 scrutiny agent reports

---

## Assumption Inventory

Each assumption is rated by:
- **Confidence:** How likely the assumption is to be true
- **Impact if Wrong:** What breaks if the assumption is false
- **Validation Method:** How to verify before building

---

### A1: `persons` field provides adequate guest credit coverage

**Stated in plan:** Implicitly assumed as the primary guest discovery mechanism.
**Confidence:** Low (estimated <15% adoption in mainstream podcasts)
**Impact if wrong:** Expert Discovery returns empty results for majority of mainstream topic searches; the entire T2 rewrite produces no improvement over current Grok approach for most users
**Validation method:** Run 10 representative topic searches via Taddy API (before signing up for paid plan, free tier allows 1,000 requests). Count what percentage of results have non-empty `persons` fields. If <30% have persons data, the fallback must become the primary strategy.

---

### A2: Text-based search reliably identifies actual guest appearances

**Stated in plan:** "search(term: 'Guest Name', filterForTypes: PODCASTEPISODE)" finds their appearances
**Confidence:** Medium-Low (false positive rate is real; many episodes mention guests without hosting them)
**Impact if wrong:** Expert cards show inaccurate appearance counts, wrong episodes linked, freshness scores meaningless
**Validation method:** Test 5 well-known podcast guests manually. Search Taddy, review top 25 results, count what % are actual appearances vs. mentions. If false positive rate exceeds 30%, the AI post-filter is required (adding significant cost).

---

### A3: 100 transcript credits/month (Pro plan) is sufficient for pre-interview intelligence at launch

**Stated in plan:** "Pro plan: 100/month" under key limitations, then not revisited in cost analysis
**Confidence:** Very Low (6-7 full pre-interview requests exhausts 100 credits; any meaningful user adoption will hit ceiling in days)
**Impact if wrong:** Pre-interview intelligence fails for all users after the first week of each month
**Validation method:** Define expected T3 usage before launch (what's the minimum viable number of pre-interview requests that justifies the feature being available?). If answer > 7/month, Business plan is required.

---

### A4: Grok can effectively enrich sparse Taddy data

**Stated in plan:** "Grok as enrichment layer for results Taddy returns"
**Confidence:** Medium (Grok can write bios from names, but requires context to be accurate)
**Impact if wrong:** Expert cards have real appearance data from Taddy but poor quality bios/insights from Grok making things up from context
**Validation method:** Test Grok enrichment with minimal context (name + show name + episode title only). Does the output quality justify the API cost?

---

### A5: Taddy as a company remains stable and pricing-stable

**Stated in plan:** Acknowledged as business risk, but no due diligence specified
**Confidence:** Unknown (startup, limited public information on their scale and backing)
**Impact if wrong:** Primary data source becomes unavailable; cached data has limited shelf life; must migrate to Podchaser/Listen Notes
**Validation method:** Review Taddy's changelog/GitHub, check their developer Discord/community activity, review ToS for data portability, email their sales team to ask about SLA and uptime history.

---

### A6: The guest credits database becomes a data moat at launch scale

**Stated in plan:** "Build a data moat that makes the product more valuable with use"
**Confidence:** Low (moats require scale; at tens to low hundreds of users, the database is sparse; established competitors like Podchaser already have this data)
**Impact if wrong:** The data moat narrative used to justify the integration cost doesn't materialize; users don't see the "gets better with use" benefit
**Validation method:** Calculate minimum user count at which local guest_appearances cache meaningfully outperforms cold Taddy searches. Likely requires 500+ users running multiple topic searches before cache hit rates become significant.

---

### A7: The 5-phase implementation sequence is compatible with the 8-phase launch roadmap without adding critical path risk

**Stated in plan:** Taddy T1-T4 mapped to roadmap Phases 2-5
**Confidence:** Low (naming mismatch confirmed; scope underestimated by 2-3x; timing conflicts with launch critical path)
**Impact if wrong:** Launch delayed by 4-7 weeks while Taddy integration is built; or Taddy shipped incomplete (T1 foundation only) with no immediate user-facing value
**Validation method:** Map realistic Taddy effort estimates against available development capacity. If Taddy T1-T4 consumes more than 20% of available pre-launch capacity, it should be deferred.

---

### A8: graphql-request library is sufficient for production Taddy integration

**Stated in plan:** "Use graphql-request library, add retry logic"
**Confidence:** Medium-High (graphql-request is widely used; appropriate for request volume)
**Impact if wrong:** Library limitations hit during development (partial response handling, complex retry scenarios); requires switching to a heavier client (Apollo Client or urql)
**Validation method:** Read graphql-request documentation for partial error handling and confirm it handles the `{data, errors}` co-existing response case. If it throws on any errors (discarding partial data), a custom wrapper is needed.

---

### A9: $75/mo Taddy Pro is the right starting tier for T1+T2 at launch

**Stated in plan:** "Pro plan minimum ($75/mo) for transcripts and adequate request volume"
**Confidence:** High for request volume (100K/month easily covers launch-scale usage), Low for transcripts (100/month is insufficient for T3)
**Impact if wrong:** If T3 is built on Pro plan, users hit transcript ceiling in week 1
**Validation method:** Make explicit decision: T3 at launch (requires Business plan, $150/mo) vs. T3 post-launch (Pro plan is fine for T1+T2 only). This decision should be made before signing up for any Taddy plan.

---

### A10: Pre-interview intelligence can be implemented as a standard API route

**Stated in plan:** `app/api/episodes/[id]/pre-interview/route.ts` as a Next.js API route
**Confidence:** Very Low (10-20 transcript fetches + Grok analysis = 3-10 minute operation; Next.js routes timeout at 60 seconds by default)
**Impact if wrong:** Pre-interview intelligence routes time out for any guest with >3 podcast appearances; feature is unreliable at production scale
**Validation method:** The architecture-impact agent confirms this is an architectural gap — T3 MUST use Trigger.dev. This assumption is definitively false. Update the plan before implementation.
