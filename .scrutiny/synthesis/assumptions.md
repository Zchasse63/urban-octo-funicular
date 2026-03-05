# Assumptions Register: PodBrain Codebase Refactor

**Date:** 2026-03-04

---

## Critical Assumptions (False or Unverified — Require Action)

### A1: "formatDuration functions are duplicates" — FALSE
**Plan states:** `episode-list.tsx` has local `formatDuration()` that duplicates `lib/utils.ts`'s version.
**Reality:** Different signatures, different output formats. `lib/utils.ts` returns `"1h 23m"`. Episode-list returns `"1:23:45"`. Not duplicates.
**Action Required:** Redesign Phase 1.4 before executing.

### A2: "createGrokClient() is unused" — FALSE
**Plan states:** Remove "unused" `createGrokClient()` wrapper from `xai-client.ts`.
**Reality:** Used by 4 files via dynamic import (`viral-moments/detector.ts`, `guest-intel/service.ts`, `cross-episode/embeddings.ts`, `experts/discovery.ts`).
**Action Required:** Redesign Phase 1.2 before executing.

### A3: "lib/xai/client.ts can simply call createChatCompletion()"
**Status:** Unverified — `lib/xai/client.ts` has retry logic and 429 handling not present in `createChatCompletion()`.
**Action Required:** Decide where retry logic lives before implementing consolidation.

### A4: "Response shape standardization won't break frontend callers"
**Status:** Unverified — `stripe/checkout` currently returns `{ url }`, not `{ data: { url } }`. Frontend caller behavior is unknown.
**Action Required:** Audit frontend callers of Stripe routes before changing response shapes.

### A5: "The test suite covers API response shapes"
**Status:** Unknown — 789 tests exist but test coverage of specific HTTP response shapes in integration tests is unclear.
**Risk:** A response shape change could silently pass all tests but break the frontend.

### A6: "All 13 TODOs are removable or cosmetic"
**Status:** Partially false — 9 TODOs in `episode-detail.tsx` and `settings-page.tsx` are active wiring tasks for pre-launch features, not cosmetic comments.
**Action Required:** Review each TODO individually; do not bulk-delete.

---

## Assumed-True and Likely Correct

### A7: "supabase-client.ts can be safely removed"
**Confidence:** High — only 4 import sites identified, none use `createAdminClient` from this path. TypeScript will catch missed sites.

### A8: "lib/api/ is the correct location for helpers"
**Confidence:** High — directory already exists with `dev-guard.ts`, semantically correct.

### A9: "Hook type renames are backwards-compatible with re-exports"
**Confidence:** High — TypeScript re-exports of type aliases are zero-runtime-cost. TypeScript compiler catches missed consumers.

### A10: "POLL_INTERVAL_MS extraction is additive"
**Confidence:** High — adding a constant to `lib/constants.ts` and using it in `use-episode.ts` has no behavioral change.

### A11: "Moving types to types/database.ts with re-exports is safe"
**Confidence:** High — type-only re-exports are build-time only. No runtime behavior.

### A12: "The refactor can be completed in one continuous session or a few days"
**Confidence:** Medium — estimated 17-32 hours. This spans multiple sessions. Risk of mid-refactor inconsistency if sessions are interrupted.

### A13: "789 passing, 12 DB failures is the current baseline"
**Confidence:** Unknown — CLAUDE.md says "513 passing" and MEMORY.md says "750 passing." There may be a stale count. Verify before starting.

---

## Assumptions About Excluded Items

### A14: "No frontend callers depend on the old hook return type names"
**Status:** Likely true — hook return types are TypeScript types used in type annotations. TypeScript catches missed renames at compile time.

### A15: "No external consumers call the internal API routes directly"
**Status:** Assumed true — these are not documented as a public API. However, webhook routes (AssemblyAI, Stripe) are called by external systems. They must be excluded from Phase 2.

### A16: "The test suite baseline is stable and reproducible"
**Status:** Memory.md notes DB integration tests can be "intermittently flaky due to real Supabase network latency." The 12 pre-existing failures should be confirmed before treating them as fixed baseline.
