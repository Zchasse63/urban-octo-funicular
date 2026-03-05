# Normalized Plan: PodBrain Codebase Refactor

**Scrutiny Date:** 2026-03-04
**Complexity Class:** SIGNIFICANT
**Mode:** Deep (all 7 agents)
**Plan Type:** Codebase refactor — pre-production, feature-complete app

---

## 1. Plan Identity

**Product:** PodBrain — AI-powered podcast production platform
**Domain:** getpodbrain.ai
**Stage:** Feature-complete, pre-launch (testing phase). 789 tests passing.
**Decision Context:** Pre-launch codebase cleanup before first paying customers

**Objective:**
Simplify, optimize, and clean up the entire codebase while preserving 100% functional equivalence. Zero visual changes, zero behavioral changes, zero breaking changes.

**Explicitly Out of Scope (per plan):**
- No file moves between directories
- No dependency upgrades
- No UI/UX changes
- No new features
- No changing public API contracts
- No breaking the tier system
- No removing mock data fallbacks
- No creating new shared UI components

---

## 2. Proposed Changes by Phase

### Phase 1: Lib Modules
1.1 Create `lib/api/helpers.ts` — response helper functions (`errorResponse`, `successResponse`, `handleApiError`, `validateUUID`, `parsePagination`)
1.2 Consolidate xAI client — make `lib/xai/client.ts` use `createChatCompletion()` from `lib/xai-client.ts`; remove `createGrokClient()` and default `grokClient` export
1.3 Remove `lib/supabase-client.ts` re-export wrapper — update 4 import sites to use `lib/supabase/server` directly
1.4 Consolidate time formatting — move `formatDuration()`, `durationToSecs()`, `secsToHuman()` from `episode-list.tsx` to `lib/utils.ts`
1.5 Clean up unused code — remove wrapper interface from `xai-client.ts` (lines 145-165), fix eslint-disable comments

### Phase 2: API Routes
2.1 Apply response helpers across all 48 routes (150+ instances)
2.2 Consolidate auth + UUID validation (45 instances)
2.3 Standardize response shapes (Stripe routes, team routes, subscriptions)
2.4 Simplify complex route handlers (stripe/checkout, episodes/process)

### Phase 3: Components and Hooks
3.1 Rename hook return types (`UseAuthReturn` → `UseAuthResult`, etc.)
3.2 Standardize hook error handling; fix `use-vocabulary.ts`; fix `use-shows.ts` defensive patterns
3.3 Simplify complex conditionals in components (episode-detail.tsx nested ternaries)
3.4 Remove unused imports (lucide-react icons, etc.)

### Phase 4: Types and Constants
4.1 Tighten type definitions — remove `any` from `use-episode-seo.ts`, `types/database.ts`
4.2 Move hook types to `types/database.ts`; re-export from hooks for backwards compatibility
4.3 Extract magic number `POLL_INTERVAL_MS = 3000` to `lib/constants.ts`
4.4 Clean up stale TODOs (13 total)

### Phase 5: Test Cleanup
5.1 Verify all tests pass after each phase (baseline: 789 passing, 12 DB failures)
5.2 Leave `lib/viral-moments/detector.test.ts` in place (no file moves)

---

## 3. Existing System Context

**Tech Stack:** Next.js 16+, React 19, TypeScript, Supabase, xAI Grok (`grok-4-1-fast`), AssemblyAI, Trigger.dev v4, Upstash Redis, Stripe, Resend, Taddy API, Sentry

**Codebase Size:** 82 lib files, 48 API routes, 17 hooks, 16 pages

**Test Suite:** 789 passing, 12 pre-existing DB/RLS failures, 108 skipped

**Build Status:** Clean TypeScript, passing Next.js production build

**App Status:** Feature-complete but not yet serving real user traffic (pre-launch)

**Key Findings from Codebase Scan:**
- `lib/api/` directory already exists (contains `dev-guard.ts`) — plan adds `helpers.ts` to it
- Two xAI client implementations coexist: `lib/xai-client.ts` (used by 5 files) and `lib/xai/client.ts` (standalone with retry logic)
- `createGrokClient()` used via dynamic import in 4 lib files; `createChatCompletion` imported directly in 1 API route
- `supabase-client.ts` imported by 4 files: `viral-moments/route.ts`, `guest-intel/route.ts`, `shows/[id]/related-episodes/route.ts`, `cross-episode/similarity.ts`
- `formatDuration` in `lib/utils.ts` takes `number | null`, returns human-readable ("1h 23m"); local version in `episode-list.tsx` takes `number`, returns colon-separated ("1:23:45") — DIFFERENT SIGNATURES AND OUTPUT FORMAT
- `durationToSecs()` and `secsToHuman()` in episode-list parse string durations (e.g. "1:23:45") — not number-based — no equivalent in utils.ts
- `POLL_INTERVAL_MS = 3000` already defined in `use-episode.ts` locally; `use-polling.ts` has its own `interval = 3000` default — both would need updating
- 13 TODOs found: several are critical wiring tasks (mock data in episode-detail.tsx referring to real API fields not yet wired), not cosmetic
- `eslint-disable` in `use-episode-seo.ts` is a block-level disable (/* ... */), not inline — plan proposes fixing it
- `eslint-disable` in `webhooks/dispatcher.ts` is a single inline comment (line 62)
- Hook return type naming: mix of `Result` and `Return` suffix conventions across 17 hooks

---

## 4. Embedded Assumptions

1. The two `formatDuration` functions are equivalent and can be unified (FALSE — they have different signatures AND output formats)
2. `durationToSecs` and `secsToHuman` are general utilities that belong in utils.ts (unclear — they operate on string colon-format durations, not the numeric seconds that utils.ts normally handles)
3. Removing `createGrokClient()` and `grokClient` from `xai-client.ts` is safe because only `createChatCompletion()` needs to remain (FALSE — 4 files use `createGrokClient()` via dynamic import)
4. The test suite adequately covers all 48 API routes (not verified — test count is 789 but route coverage unknown)
5. Response shape standardization for Stripe routes will not break any frontend callers
6. Moving `PreInterviewAppearance`, `PreInterviewData`, `GuestPackageData` types and keeping re-exports maintains backwards compatibility for all consumers

---

## 5. Open Questions

- Do the 789 tests cover the specific API response shapes being changed in Phase 2?
- Are there any frontend callers of the Stripe/team/subscription routes that rely on the exact current response format?
- What is the blast radius if `lib/xai/client.ts` regression occurs (which endpoints are downstream)?
- Is the existing `eslint-disable` in `use-episode-seo.ts` protecting against a real type-system gap, or is it truly removable?
- Which of the 13 TODOs are "cosmetic" vs. genuinely flagging incomplete features?
