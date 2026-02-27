# Risk Register: Taddy API Integration

**Date:** 2026-02-26
**Source:** Cross-synthesis from all 7 scrutiny agent reports

---

## Risk Summary

| ID | Risk | Probability | Impact | Overall | Owner |
|----|------|-------------|--------|---------|-------|
| R1 | Persons field coverage too low for expert discovery | High | High | Critical | Architecture |
| R2 | Transcript credit exhaustion on Pro plan | Very High | High | Critical | Product/Infra |
| R3 | Taddy integration delays launch by 4-7 weeks | High | High | Critical | Product |
| R4 | Pre-interview as sync route times out in production | Certain | High | Critical | Architecture |
| R5 | Taddy API outage breaks expert discovery (no fallback) | Medium | High | High | Architecture |
| R6 | False positive rate in text-based guest search | High | Medium | High | Architecture |
| R7 | Taddy company instability (pricing change, outage, shutdown) | Low-Medium | Medium | Medium | Product |
| R8 | DB schema migration debt when auth ships | High | Medium | Medium | Engineering |
| R9 | Guest name collision (same name, different people) | High | Medium | Medium | Architecture |
| R10 | Rate limit exhaustion from heavy API users | Low | Medium | Medium | Infra |
| R11 | Taddy tables missing RLS before auth ships | Medium | High | High | Engineering |
| R12 | Scope underestimation delays all surrounding roadmap items | High | High | Critical | Product |
| R13 | GraphQL partial response mishandled | Medium | Low | Low | Engineering |
| R14 | Data moat story doesn't materialize at launch scale | High | Low | Low | Product |
| R15 | Podchaser has better guest credits coverage than Taddy | Medium | Medium | Medium | Product |

---

## Critical Risks — Must Address Before Implementation Begins

### R1: Persons Field Coverage Too Low

**Description:** Taddy's `persons` field (Podcasting 2.0 `<podcast:person>` tag) is the primary mechanism for the Expert Discovery rewrite. Mainstream podcast adoption of this tag is estimated at <15%. The majority of topic searches will return episodes with no persons data.

**Current mitigation in plan:** "Fall back to text search + AI extraction from descriptions" — mentioned but not designed.

**Required action:**
1. Test Taddy API with 10 representative topics before building T2
2. If persons coverage is <30% of results: redesign T2 to make description-based extraction the primary path, not the fallback
3. If persons coverage is adequate (>50%): proceed with plan as written

**Timeline:** Before T1 even begins. This is a validation gate.

---

### R2: Transcript Credit Exhaustion on Pro Plan

**Description:** Pre-interview intelligence uses 10-20 transcript credits per request. Pro plan: 100/month = ~6-7 uses per month total. Any meaningful user adoption exhausts the budget in the first days of the month.

**Current mitigation in plan:** "Only fetch transcripts for top appearances, check if transcript exists before requesting" — reduces consumption per request but doesn't address monthly ceiling.

**Required action:**
1. Implement Redis counter for transcript credits consumed this month
2. Define per-user credit quotas (e.g., Pro users: 10 credits/month, Agency: 50 credits/month)
3. Design graceful degradation: show appearance history without transcript analysis when credits exhausted
4. Make explicit business decision: Business plan ($150/mo, 2,000 credits) if T3 is a launch feature

**Timeline:** Must be designed before T3 is built.

---

### R3: Integration Delays Launch

**Description:** Realistic estimate for T1-T4 is 22-35 development days. The existing launch roadmap estimates 6-8 weeks to launch with existing backlog. Adding Taddy pre-launch extends timeline proportionally.

**Current mitigation in plan:** No acknowledgment of this risk.

**Required action:**
1. Explicit capacity planning: how many dev days are available before target launch date?
2. If <20 days available: defer all Taddy work to post-launch
3. If 20-35 days available: T1 foundation only pre-launch, T2-T4 post-launch
4. The 10 critical bugs (Phase 0) must ship before any Taddy work begins

**Timeline:** Strategic decision required immediately.

---

### R4: Pre-Interview as Synchronous Route Times Out

**Description:** T3's API route (`/api/episodes/[id]/pre-interview`) will take 3-10 minutes to execute. Next.js API routes default timeout: 60 seconds.

**Current mitigation in plan:** None — the route is described as a standard API endpoint.

**Required action:** T3 must be implemented as a Trigger.dev background job from the start:
1. Route receives guest name, creates Trigger.dev job, returns job ID
2. UI polls job status (same pattern as episode processing)
3. When job completes, results are in `pre_interview_cache` and displayed in UI
4. This adds scope to T3 but is architecturally non-negotiable

**Timeline:** Must be in T3 design before implementation begins.

---

## High Risks — Address Before Launch of Affected Feature

### R5: Taddy Outage Breaks Expert Discovery

After T2 ships, Grok is demoted to enrichment only. If Taddy is unavailable:
- Expert discovery returns errors (no Grok fallback for the discovery query)
- Resolution: preserve Grok discovery path as circuit breaker fallback; serve 7-day stale cache during outages

### R11: Taddy Tables Missing RLS

If `guest_appearances` and `pre_interview_cache` are added without RLS, they'll expose all users' data when auth ships. Resolution: add RLS policies to migration file at creation time using the future-ready pattern.

---

## Medium Risks — Monitor and Address During Implementation

### R6: False Positive Rate in Guest Search

Text-based search returns episodes that mention a guest, not just episodes where they appeared. Mitigation: heuristic pre-filters (title contains "interview with", "feat.", etc.) before AI validation. Cap AI validation to top 20 results only.

### R7: Taddy Company Instability

Mitigated by: all Taddy data cached locally (Taddy explicitly allows this). At worst, cached data can be served for weeks after any outage. Actual service shutdown: fallback to Grok (R5 mitigation), cached data continues to serve. Moderate risk, acceptable with caching.

### R8: Auth Migration Debt

Every user-scoped table added in single-user mode is another migration target when auth ships. Mitigation: use the future-ready RLS pattern from day one. Acceptable cost given the phased auth approach.

### R9: Guest Name Collision

Different people with the same name will be merged in the guest_appearances table. Mitigation: always display podcast context with guest appearances; filter by genre/niche; document the limitation.

### R15: Podchaser Better for Guest Credits

If Podchaser has materially better guest credits coverage than Taddy's persons field, the competitive analysis supports using Podchaser for T2 and Taddy for T3 transcripts only. Validation required before T1 build begins.

---

## Low Risks — Accept or Monitor

### R10: Rate Limit Exhaustion
Apply per-user daily limits using existing Redis infrastructure. Low probability of exhaustion at launch scale.

### R13: GraphQL Partial Response
Handle in client.ts implementation. Standard engineering problem with known solution.

### R14: Data Moat Doesn't Materialize at Launch Scale
Accepted. The data moat is a long-term narrative, not a launch deliverable.
