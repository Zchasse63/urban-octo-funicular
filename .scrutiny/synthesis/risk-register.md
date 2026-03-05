# Risk Register: PodBrain Codebase Refactor

**Date:** 2026-03-04

---

## Risk Scoring

**Likelihood:** 1 (rare) to 5 (near-certain)
**Impact:** 1 (negligible) to 5 (launch-blocking)
**Score:** Likelihood × Impact

---

## Critical Risks (Score 12+)

### R1: formatDuration Silent UI Regression
**Description:** Executing Phase 1.4 as written unifies two `formatDuration` functions that have different output formats. Episode list would display `"1h 23m"` instead of `"1:23:45"`. Duration-based sorting and total duration calculation would break.
**Likelihood:** 5 (near-certain if executed as written)
**Impact:** 3 (visible UI defect on episode list page — high-visibility for first users)
**Score:** 15
**Mitigation:** Redesign Phase 1.4. Recognize the functions are not duplicates. Add distinctly named utils or leave in component.
**Owner:** Plan author — must redesign before execution.
**Status:** OPEN — requires plan correction.

### R2: xAI Dynamic Import Runtime Failure
**Description:** Removing `createGrokClient()` from `lib/xai-client.ts` breaks 4 files that use `await import('@/lib/xai-client')` with dynamic destructuring. Viral moments, guest intelligence, cross-episode similarity, and expert discovery fail at runtime.
**Likelihood:** 5 (near-certain if removal executed)
**Impact:** 3 (non-critical features break, but are marketed features)
**Score:** 15
**Mitigation:** Keep `createGrokClient()` in `lib/xai-client.ts`. Redesign consolidation to preserve the callers.
**Owner:** Plan author — must redesign before execution.
**Status:** OPEN — requires plan correction.

---

## High Risks (Score 8-11)

### R3: Stripe Checkout Response Shape Break
**Description:** If Phase 2.3 changes `stripe/checkout` success response from `{ url: session.url }` to `{ data: { url }, error: null }`, the frontend caller (likely does `const { url } = await response.json()`) silently fails to redirect. User sees no response after clicking upgrade — a revenue-blocking UX failure.
**Likelihood:** 3 (likely if Phase 2.3 touches Stripe routes without frontend audit)
**Impact:** 4 (revenue-path failure — users can't upgrade)
**Score:** 12
**Mitigation:** Audit frontend callers of all Stripe routes before changing response shapes. Update frontend and backend in the same commit.
**Status:** OPEN — requires verification step.

### R4: Webhook Routes Receive Wrong Response Format
**Description:** AssemblyAI and Stripe webhook endpoints get JSON error/success wrappers applied that break their external contracts. AssemblyAI may retry (duplicate episode processing). Stripe may retry (duplicate subscription events).
**Likelihood:** 3 (likely if webhook routes are not explicitly excluded from Phase 2)
**Impact:** 4 (duplicate episode processing, billing events)
**Score:** 12
**Mitigation:** Explicitly list excluded routes before beginning Phase 2. See edge-cases report.
**Status:** OPEN — requires explicit exclusion list.

### R5: handleApiError Loses HTTP Status Information
**Description:** A generic `handleApiError` that always returns 500 would change the semantic response for errors that currently return 400/401/403/404/429. Frontend callers that branch on status code would behave incorrectly.
**Likelihood:** 3 (depends on implementation — moderate if naive)
**Impact:** 3 (broken error handling across many routes)
**Score:** 9
**Mitigation:** `handleApiError` must type-check errors and map to appropriate status codes. Include test cases for each error type.
**Status:** CONDITIONAL — manageable if implemented carefully.

---

## Medium Risks (Score 4-7)

### R6: Phase 2 Scope Creep into Feature Code
**Description:** Reviewing 48 routes for response standardization creates many "while I'm here" opportunities. Developers may fix adjacent issues that are out of scope, increasing the change surface.
**Likelihood:** 3 (common pattern in refactor sessions)
**Impact:** 2 (delays timeline, may introduce unrelated changes)
**Score:** 6
**Mitigation:** Strong discipline on scope. Commit after each route file rather than batching. Review diffs before each commit.
**Status:** LOW — manageable with process discipline.

### R7: Test Baseline Discrepancy
**Description:** The plan states "789 passing, 12 failures" but CLAUDE.md says "513 passing" and MEMORY.md says "750 passing." Starting from a wrong baseline means regressions may be invisible.
**Likelihood:** 3 (stale docs are common)
**Impact:** 3 (regressions attributed to "known failures" rather than investigated)
**Score:** 9
**Mitigation:** Run test suite before starting Phase 1. Record actual baseline numbers.
**Status:** OPEN — verify before starting.

### R8: Mid-Refactor Inconsistency
**Description:** If the refactor spans multiple sessions (likely at 17-32 hours), the codebase may be in an intermediate state between sessions — some routes using helpers, some not. This creates review difficulty and potential bugs from partially-applied patterns.
**Likelihood:** 4 (high — refactor will span sessions)
**Impact:** 2 (minor — confusion and inconsistency, not likely to cause bugs)
**Score:** 8
**Mitigation:** Complete each phase fully before stopping. Don't leave Phase 2 half-done between sessions. Use branch commits to mark progress.
**Status:** LOW — manageable with process.

### R9: xAI Retry Logic Lost in Consolidation
**Description:** If `lib/xai/client.ts`'s retry loop is removed when consolidating to call `createChatCompletion()`, show notes generation loses retry protection. A transient xAI API error would fail an episode rather than retrying.
**Likelihood:** 2 (depends on implementation approach)
**Impact:** 3 (degraded reliability for the core product feature)
**Score:** 6
**Mitigation:** Explicitly design the consolidation to preserve retry logic. Option: move retry into `createChatCompletion()` base layer.
**Status:** CONDITIONAL — depends on consolidation approach.

### R10: TODO Cleanup Removes Active Work Tracking
**Description:** Phase 4.4 removes TODOs without distinguishing cosmetic from active. The episode-detail.tsx TODOs (9 instances) mark mock data standing in for unimplemented API wiring — removing them loses the checklist for pre-launch completion.
**Likelihood:** 2 (moderate — developer might categorize them as cosmetic)
**Impact:** 3 (pre-launch features not completed, unknown until launch)
**Score:** 6
**Mitigation:** Review each TODO individually. Treat episode-detail.tsx TODOs as active until the mock data is replaced with real API data.
**Status:** OPEN — requires careful human review.

---

## Low Risks (Score 1-3)

### R11: Type Re-export Chain Breaks
**Description:** Moving types from hooks to `types/database.ts` with re-exports creates an import chain. If consumers use value imports instead of type imports, the chain may pull in unintended code.
**Likelihood:** 1 (rare — types are type-only)
**Impact:** 2 (build error — caught immediately)
**Score:** 2

### R12: RSS Proxy Route Gets JSON Error Response
**Description:** `GET /api/shows/[id]/rss` returns XML. If Phase 2 accidentally applies JSON error helpers to this route, podcast players receive unparseable XML error responses.
**Likelihood:** 2 (the route probably doesn't use NextResponse.json for errors)
**Impact:** 3 (broken RSS feeds for podcast players)
**Score:** 6
**Mitigation:** Include in excluded routes list for Phase 2.

### R13: _request Rename Misses Active Usage
**Description:** A route parameter renamed from `request` to `_request` might actually be used indirectly (passed to a helper, used in a closure). Renaming signals to TypeScript that it's unused; TypeScript may not warn.
**Likelihood:** 1 (rare — most unused params are genuinely unused)
**Impact:** 2 (subtle runtime bug if the param was actually used)
**Score:** 2

---

## Risk Summary

| Risk | Score | Status | Phase |
|------|-------|--------|-------|
| R1: formatDuration regression | 15 | OPEN | 1.4 |
| R2: xAI dynamic import failure | 15 | OPEN | 1.2 |
| R3: Stripe checkout shape break | 12 | OPEN | 2.3 |
| R4: Webhook route format break | 12 | OPEN | 2.1 |
| R5: handleApiError loses status | 9 | CONDITIONAL | 2.1 |
| R7: Test baseline discrepancy | 9 | OPEN | Pre-start |
| R8: Mid-refactor inconsistency | 8 | LOW | All |
| R6: Phase 2 scope creep | 6 | LOW | 2 |
| R9: Retry logic lost | 6 | CONDITIONAL | 1.2 |
| R10: Active TODO removal | 6 | OPEN | 4.4 |
| R12: RSS route XML break | 6 | OPEN | 2.1 |
| R11: Type re-export chain | 2 | LOW | 4.2 |
| R13: _request rename | 2 | LOW | 2.2 |

**Total OPEN risks requiring action before or during execution: 7**
**Total CONDITIONAL risks (manageable during execution): 2**
**Total LOW risks (monitor only): 4**
