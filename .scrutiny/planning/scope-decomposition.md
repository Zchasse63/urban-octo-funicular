# Scope Decomposition: PodBrain Codebase Refactor

**Date:** 2026-03-04

---

## Recommended Execution Order

The following decomposition reorders and refines the plan's phases to de-risk the execution. Complete each gate before proceeding.

---

## Gate 0: Baseline Verification (Before Any Changes)

**Duration:** 30 minutes
**Goal:** Confirm true baseline before any changes.

- [ ] Run `cd app && npx vitest run` — record exact passing/failing counts
- [ ] Run `cd app && npx tsc --noEmit` — confirm clean TypeScript
- [ ] Run `cd app && npm run build` — confirm clean build
- [ ] Record baseline in `.scrutiny/meta/progress.log`
- [ ] Note which 12 failures are pre-existing (confirm they're DB/RLS, not regressions)

**Acceptance criterion:** Baseline numbers documented. Do not proceed if baseline differs significantly from plan's claim of 789/12.

---

## Gate 1: Safe Phase 1 Items (Low Risk)

**Duration:** 2-4 hours
**Goal:** Pick the riskless Phase 1 items first before touching the AI pipeline.

### 1.A: Create `lib/api/helpers.ts`

Create at `/Users/zach/urban-octo-funicular/app/src/lib/api/helpers.ts` with:
- `errorResponse(message: string, status: number): NextResponse<ApiResponse<null>>`
- `successResponse<T>(data: T): NextResponse<ApiResponse<T>>`
- `handleApiError(error: unknown, context: string): NextResponse<ApiResponse<null>>` — must inspect error type to return correct HTTP status (401 for Unauthorized, 404 for not found patterns, 500 for unknown)
- `validateUUID(id: string, label?: string): NextResponse<ApiResponse<null>> | null` — returns error response or null (null means valid)
- `parsePagination(searchParams: URLSearchParams): { page: number; pageSize: number; offset: number }`

**Acceptance:** Types compile. Export test: `import { errorResponse } from '@/lib/api/helpers'` works.

### 1.B: Remove `lib/supabase-client.ts`

- Update 4 import sites to use `@/lib/supabase/server` directly
- Delete `lib/supabase-client.ts`
- Run `npx tsc --noEmit` to confirm no missed references

**Files to update:**
- `app/src/app/api/episodes/[id]/viral-moments/route.ts`
- `app/src/app/api/episodes/[id]/guest-intel/route.ts`
- `app/src/app/api/shows/[id]/related-episodes/route.ts`
- `app/src/lib/cross-episode/similarity.ts`

### 1.C: Fix ESLint Suppression Comments

- `use-episode-seo.ts`: Create `RawSEOResponse` union type for the two API shapes. Remove block-level `eslint-disable`. Verify `normalizeAnalysis` function still compiles correctly.
- `webhooks/dispatcher.ts`: Fix the type at line 62 or use targeted inline `// eslint-disable-next-line` instead of block
- `types/database.ts`: Replace `shows: any` with proper inline type for the Supabase `!inner` join result shape (the shows field is an object `{ id: string; user_id: string; name: string }`)

**Acceptance:** `npx tsc --noEmit` clean. `npx eslint src/` has no new violations.

**Gate 1 checkpoint:** Run full test suite. Confirm still at baseline.

---

## Gate 2: Corrected Phase 1 Items (Medium Risk)

**Duration:** 2-4 hours
**Goal:** Tackle the two items that required redesign.

### 2.A: Redesigned formatDuration Consolidation

**Corrected approach** — add utilities to `lib/utils.ts` under distinct names:

```typescript
// lib/utils.ts — additions
/**
 * Format seconds as colon-separated time for table/list display.
 * e.g., 5025 → "1:23:45", 303 → "5:03"
 */
export function formatDurationColons(seconds: number): string

/**
 * Parse a colon-separated duration string to total seconds.
 * e.g., "1:23:45" → 5025, "5:03" → 303
 */
export function parseDurationColons(duration: string): number

/**
 * Format total seconds as a compact human string for aggregate display.
 * e.g., 5025 → "1h 23m", 303 → "5m", 0 → "0m"
 */
export function formatDurationCompact(totalSeconds: number): string
```

Update `episode-list.tsx`:
- Replace local `formatDuration` call with `formatDurationColons`
- Replace local `durationToSecs` call with `parseDurationColons`
- Replace local `secsToHuman` call with `formatDurationCompact`
- Remove local function definitions

**Acceptance:** Episode list renders durations in colon format. Duration sort works. Total duration summary works. Tests pass.

### 2.B: Redesigned xAI Client Consolidation

**Corrected approach:**
- Keep `createGrokClient()` in `lib/xai-client.ts` (it has 4 active callers)
- Keep the `grokClient` default export (used by `default export` consumers if any)
- Make `lib/xai/client.ts` call `createChatCompletion()` from `lib/xai-client.ts` inside its existing retry loop:

```typescript
// lib/xai/client.ts — updated inner loop
import { createChatCompletion } from '@/lib/xai-client';

// Inside retry loop:
const data = await createChatCompletion({
  model: process.env.XAI_MODEL || 'grok-4-1-fast',
  messages: [...],
  temperature: 0.7,
  response_format: { type: 'json_object' },
});
// Note: createChatCompletion already handles circuit breaker and 30s timeout
// Retain the retry loop and 429 detection in lib/xai/client.ts
```

This eliminates the duplicated fetch setup while preserving the retry logic and the `grokClient` interface for the 4 dynamic-import callers.

**Acceptance:** All 4 dynamic-import callers still work (`createGrokClient()` still exported). Show notes generation still retries on failure. `npx vitest run` passes.

**Gate 2 checkpoint:** Run full test suite. Confirm still at baseline.

---

## Gate 3: Phase 2 — API Routes (High Volume, Needs Discipline)

**Duration:** 8-14 hours
**Goal:** Apply response helpers across routes systematically without breaking contracts.

### Pre-Phase 2: Document Excluded Routes

Before touching any route file, create a file `.scrutiny/planning/excluded-routes.md` listing:
- `POST /api/webhooks/assemblyai` — external contract
- `POST /api/stripe/webhooks` — external contract
- `GET /api/shows/[id]/rss` — XML response
- `GET /api/episodes/[id]/assets/download` — binary response
- `GET /api/episodes/[id]/guest-package/download` — binary response

### 3.A: Apply Helpers to 5 Pilot Routes First

Choose 5 routes with only internal callers (e.g., `/api/shows`, `/api/episodes`, `/api/vocabulary`). Apply helpers. Verify frontend still works (manually or via integration tests). Run test suite.

### 3.B: Apply to Remaining Standard Routes

For each route, verify:
- [ ] Success response shape preserved or frontend caller updated
- [ ] Error responses map to correct HTTP status codes
- [ ] `catch` block uses `handleApiError` correctly
- [ ] No excluded routes touched

### 3.C: Stripe Routes — Separate Pass

Handle Stripe routes last. For each:
- [ ] Identify the frontend component/hook that calls this route
- [ ] Check what the frontend expects from the response body
- [ ] If changing response shape: update both route and frontend caller atomically
- [ ] If keeping current shape: apply only error path helpers, not success path

### 3.D: UUID Validation Standardization

Replace `isValidUUID(id)` + manual response block with `validateUUID(id)` helper. Standardize `_request` naming where genuinely unused. Do NOT rename `request` to `_request` if any helper in the route uses the request object.

**Gate 3 checkpoint:** Run full test suite. TypeScript clean. Build clean.

---

## Gate 4: Phase 3 — Components and Hooks

**Duration:** 3-5 hours

### 4.A: Hook Return Type Renames

For each renamed type:
1. Rename the interface definition
2. Add backwards-compat re-export: `export type OldName = NewName`
3. Run `npx tsc --noEmit` — fix any consumers that TypeScript flags

### 4.B: Standardize Hook Error Handling

- `use-vocabulary.ts`: verify error state is set correctly (currently appears to set error state via `setError` — check if there are any throw paths)
- `use-shows.ts`: the `result.data || result` defensive pattern is intentional guard against non-standard API response; remove only if Phase 2 ensures `/api/shows` always returns `{ data: [...] }`

### 4.C: Simplify Component Conditionals

- `episode-detail.tsx:470-477`: extract nested ternary to `getFormattedNotes()` helper function
- `related-episodes.tsx`: extract score color logic to config object

### 4.D: Unused Import Cleanup

- Use TypeScript language server / eslint to identify genuinely unused imports
- Do NOT remove lucide-react icons without verifying they're not used in JSX (icon names are easy to miss in large files)

**Gate 4 checkpoint:** Run full test suite.

---

## Gate 5: Phase 4 — Types and Constants

**Duration:** 1-2 hours

### 5.A: Type Tightening

- `types/database.ts` line 219: replace `shows: any` with proper inline type based on the Supabase join shape
- Verify the fix doesn't break any query that uses this type

### 5.B: Type Centralization

Move `PreInterviewAppearance`, `PreInterviewData`, `GuestPackageData` to `types/database.ts`. Add re-exports from origin hooks. Run TypeScript check.

### 5.C: Constants

Add `POLL_INTERVAL_MS` to `lib/constants.ts`. Update `use-episode.ts` to import it. Leave `use-polling.ts`'s default parameter as a plain `3000` literal (generic hook, no dependency on app constants needed).

### 5.D: TODO Review

Review each TODO individually. Categorize:
- **Remove:** Only if the work is verifiably done or permanently out of scope
- **Keep:** `episode-detail.tsx` TODOs (active wiring tasks), settings-page TODOs (integration wiring), scaffold TODOs (i18n, publishing, audiogram)
- **Document:** If removing a TODO because the feature was descoped, note it in a comment or issue

**Gate 5 checkpoint:** Final full test suite run. TypeScript clean. Build clean. Confirm same pass/fail distribution as Gate 0 baseline (plus any new tests added).

---

## Definition of Done

- [ ] All 5 gates completed
- [ ] Test suite passes at baseline (no new failures)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` clean
- [ ] The two corrected items (formatDuration, xAI client) verified manually in development
- [ ] Excluded webhook routes confirmed untouched
- [ ] Stripe routes' frontend callers verified
