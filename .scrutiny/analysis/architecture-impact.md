# Architecture Impact Agent Report

**Agent:** architecture-impact
**Plan:** PodBrain Launch Roadmap — Full 8-Phase Analysis
**Complexity Class:** MAJOR
**Analysis Depth:** Extended (Deep+)
**Date:** 2026-02-26

---

## Agent Verdict

**MODIFY** — The existing architecture is fundamentally sound. The Swiss Broadcast UI design system is implemented. The service layer pattern (`lib/xai-client.ts`, `lib/assemblyai/`, `lib/buzzsprout/`) is consistent and extensible. The Trigger.dev + Supabase + Next.js App Router stack is well-chosen for the use case. The plan's proposed changes are architecturally coherent. However, four specific architectural concerns require remediation: (1) the pre-interview intelligence pipeline (Phase 7) must use Trigger.dev background jobs, not synchronous Next.js API routes — a 3-10 minute operation will always time out on Vercel/Netlify; (2) three separate xAI client implementations create an inconsistency that will compound during Phase 7 when more Grok calls are added; (3) the `hosting_connections` table has a dual schema conflict that needs explicit migration resolution before Phase 2 auth work begins; (4) middleware.ts doesn't exist yet but is the critical control point for auth, rate limiting, and tier enforcement — its design must be planned before Phase 1 is complete.

---

## 1. Overall Architecture Assessment

**What's good:**
- Service layer pattern is consistent across integrations (xAI, AssemblyAI, Buzzsprout, Stripe, Resend)
- Next.js App Router with TypeScript is appropriate for the feature set
- Supabase pgvector for vocabulary embeddings is the right technology
- Trigger.dev v4 for background jobs is the right pattern for long-running AI operations
- Schema has user_id columns on all tables (auth-ready without structure changes)
- Component architecture (ui/, layout/, episodes/, upload/) is well-organized

**What needs fixing:**
- Three xAI client implementations (architectural inconsistency)
- No middleware.ts (critical missing control point)
- RLS policies at `USING (true)` (security-deferred but must be resolved in Phase 2)
- `find_similar_sections` RPC never created (silent failure in production)
- `hosting_connections` dual schema conflict

---

## 2. The Three xAI Client Implementations

**Finding:** The audit identifies 3 separate xAI Grok client implementations. This creates maintenance risk:

- When `grok-beta` is replaced with a stable model ID, the replacement must happen in 3 places
- When Grok API changes (auth headers, endpoint URL, response format), 3 files must be updated
- When rate limiting is applied to Grok calls, it must be applied in 3 places (or missed)

**Impact on Phase 7:** Phase 7 adds more Grok calls (expert enrichment, transcript analysis, pre-interview synthesis). If these new calls use a 4th implementation pattern, the inconsistency compounds.

**Recommended fix (Phase 1):** Consolidate to a single `lib/xai-client.ts` with typed methods for each use case (generateShowNotes, generateAssets, analyzeTranscript, enrichExpert). All Phase 7 Grok calls should use this unified client.

---

## 3. middleware.ts — Critical Missing Control Point

**Finding:** No `middleware.ts` exists. This is the location where all cross-cutting concerns should be enforced:
- Authentication (Phase 2): Verify user session before allowing access to protected routes
- Rate limiting (Phase 1): Check Redis-based rate limit counters before processing requests
- Tier enforcement (Phase 3): Verify user's subscription tier before allowing premium features
- CORS (if needed): Allow or deny cross-origin requests

**The current state:** Without middleware.ts, each of these concerns must be implemented in every individual route handler. This is the source of the "rate limiting applied to 0 routes" problem — there's no central enforcement point.

**Architecture recommendation:** Design middleware.ts before Phase 2 work begins. The middleware should:
1. Identify public routes (landing page, auth pages, webhook endpoints)
2. For protected routes: extract and verify Supabase session
3. For AI-cost routes (processing, asset generation): check rate limits
4. For premium feature routes: check subscription tier

This is not a single file — it's the architectural spine of the security model. Budget 2-3 days to design and test it properly.

---

## 4. Pre-Interview Intelligence Must Use Trigger.dev

**Finding:** The Phase 7 plan places pre-interview intelligence at `app/api/episodes/[id]/pre-interview/route.ts` — a standard Next.js API route.

**The execution flow would be:**
1. Search Taddy: 5-10 API calls with pagination (~5-15 seconds)
2. Fetch 10-20 transcripts: 10 seconds each for 1-hour episodes (~100-200 seconds minimum)
3. Send 10-20 transcripts to Grok for analysis (~20-100 seconds)
4. Synthesis call (~5-10 seconds)
5. Cache results in database

**Total: 130-330 seconds (2-5.5 minutes) minimum.**

Next.js API routes on Vercel (and Netlify functions): 60-second default timeout. Even on Vercel Pro with configurable timeouts, blocking a user's HTTP request for 2-5+ minutes is an unacceptable UX pattern.

**The fix:** Follow the same pattern used for episode processing:
1. `POST /api/episodes/[id]/pre-interview` → creates Trigger.dev job, returns `{jobId}`
2. Trigger.dev job `generatePreInterviewIntelligence` executes the full pipeline
3. UI polls `GET /api/episodes/[id]/pre-interview/status` with job ID
4. When complete, results are in `pre_interview_cache`
5. UI fetches results

This is architecturally consistent with the existing processing pattern and handles the execution time correctly.

---

## 5. Dual Schema Conflict in `hosting_connections`

**Finding:** The `hosting_connections` table has columns from two different schema versions (Phase 1 schema + Phase 7 schema) that conflict. This was identified in the audit but is not explicitly addressed in any phase of the new roadmap.

**Impact:** If Phase 2 auth work involves touching `hosting_connections` (it does — RLS policies must be applied), the conflicting schema creates migration complexity. Attempting to add `USING (user_id = auth.uid())` to a table with schema conflicts may fail or produce unexpected results.

**Recommendation:** Add a migration cleanup as a Phase 1 or early Phase 2 task: resolve the `hosting_connections` dual schema conflict before the auth migration touches this table.

---

## 6. Database Schema — Phase 7 Additions

**New tables proposed:**
- `taddy_podcast_cache` — shared cache, no user_id (correct)
- `taddy_episode_cache` — shared cache, no user_id (correct)
- `guest_appearances` — user-scoped, uses DEFAULT_USER_ID
- `pre_interview_cache` — user-scoped, uses DEFAULT_USER_ID

**Schema design concerns:**

**`pre_interview_cache` episode coupling:** The schema ties pre-interview intelligence to a specific `episode_id`. But pre-interview research for a guest is reusable — the same guest can appear on multiple episodes. The correct design caches by guest_name (per user), with a separate join table for episode associations. This avoids re-running expensive research when the same guest appears on multiple episodes.

**Foreign key gaps in `guest_appearances`:** The `episode_taddy_uuid` and `podcast_taddy_uuid` fields are TEXT with no FK constraint to the cache tables. A guest appearance can be inserted referencing a Taddy UUID that has no corresponding cache entry, causing silent null joins in the UI.

**RLS at creation time:** The new tables should include RLS policies in their migration, not as a follow-up. Include:
```sql
ALTER TABLE guest_appearances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own guest appearances" ON guest_appearances
  FOR ALL USING (user_id = auth.uid() OR user_id = '00000000-0000-0000-0000-000000000001');
```

The second clause allows single-user mode to work during development while being ready for multi-user auth.

---

## 7. Caching Architecture (Redis vs. Supabase)

**Current pattern:** Upstash Redis is used for rate limiting and caching.

**Phase 7 proposal:** Supabase tables for Taddy data caching.

**The tension:** Redis is fast (sub-millisecond) but ephemeral. Supabase is slower (~5-20ms) but persistent and queryable with SQL.

**Why the split is actually correct:**
- Taddy cache data (podcast metadata, episode metadata, guest appearances) needs to be: persistent (survives server restarts), queryable (SQL joins, search), and shareable across users
- Redis is appropriate for: ephemeral rate limit counters, short-lived session data, high-frequency key-value lookups

**What should go in Redis (not Supabase) for Taddy:**
- Rate limit counters (Taddy API calls per day)
- Transcript credit counter (monthly)
- Short-lived search result sets (5-minute TTL for the most recent topic search)

**What should go in Supabase:**
- All persistent cache data (podcast metadata, episode metadata, guest appearances, pre-interview results)

This split is correct architecture. The plan's `cache.ts` should be explicit about which data goes to which storage layer.

---

## 8. Circuit Breaker Pattern (Phase 5)

**The plan adds circuit breaker to xAI API calls in Phase 5.** This is correctly prioritized.

**What a circuit breaker requires architecturally:**
- State tracking: CLOSED (normal), OPEN (circuit tripped), HALF-OPEN (testing recovery)
- State storage: Redis is appropriate here (fast, doesn't need persistence across restarts)
- The circuit breaker must be part of the unified xAI client (Finding 2 above) — another reason to consolidate implementations in Phase 1

**Additionally:** A circuit breaker should also be added to Taddy API calls in Phase 7. Taddy is a startup; downtime is plausible. When Taddy is down, expert discovery should gracefully fall back to cached data or the existing Grok-based approach.

---

## 9. Webhooks Architecture

**Stripe webhooks:** Currently implemented, but:
- No signature verification mentioned in the plan (CRITICAL security gap — without this, anyone can send fake webhook events)
- The Phase 2 auth middleware must explicitly EXCLUDE the Stripe webhook endpoint

**AssemblyAI webhook (Phase 5):**
- Requires a public HTTPS endpoint that AssemblyAI can POST to
- Must NOT be protected by auth middleware (external service, not user session)
- Should have HMAC signature verification (AssemblyAI provides this)

**Middleware exclusion list for Phase 2:** `/api/stripe/webhook`, `/api/assemblyai/webhook` (Phase 5). This must be designed into middleware.ts from the start.

---

## Architectural Impact Summary

| Impact Area | Severity | Phase | Recommendation |
|------------|----------|-------|---------------|
| Pre-interview as sync route | CRITICAL | Phase 7 | Must use Trigger.dev background job |
| No middleware.ts | HIGH | Phase 2 | Design before Phase 2 begins |
| 3 xAI client implementations | HIGH | Phase 1 | Consolidate to single client |
| `hosting_connections` conflict | HIGH | Phase 1/2 | Add migration to resolve before auth work |
| `pre_interview_cache` episode coupling | MEDIUM | Phase 7 | Guest-centric schema redesign |
| Guest appearances FK gaps | MEDIUM | Phase 7 | Add FK constraints in migration |
| Taddy tables missing RLS | MEDIUM | Phase 7 | Include RLS at table creation time |
| Stripe webhook verification | MEDIUM | Phase 3 | Add signature verification (may already exist) |
| Redis vs. Supabase for Taddy | LOW | Phase 7 | Split is correct; document in cache.ts |
| GraphQL types (manual vs. codegen) | LOW | Phase 7 | Acceptable at launch; design for replacement |

---

## Architectural Conclusion

The PodBrain architecture is well-structured and the service layer pattern is a good foundation for Phase 7. The critical corrections needed are:
1. Design `middleware.ts` as a Phase 1/2 priority (the control plane for the entire security model)
2. Consolidate 3 xAI clients to 1 in Phase 1
3. Pre-interview intelligence must be a Trigger.dev job in Phase 7
4. Resolve `hosting_connections` schema conflict before Phase 2 auth migration

These changes strengthen the architecture rather than change its direction.
