# PodBrain Codebase Refactor Plan

## Objective
Simplify, optimize, and clean up the entire codebase while preserving 100% functional equivalence. Zero visual changes, zero behavioral changes, zero breaking changes.

## Baseline
- **Tests:** 789 passing (12 pre-existing DB failures from RLS, 108 skipped)
- **TypeScript:** Clean (tsc --noEmit passes)
- **Build:** Clean (npm run build succeeds)

---

## Phase 1: Lib Modules (Core Services, Utilities, Infrastructure)

### 1.1 Create API Response Helpers (`lib/api/helpers.ts`)
- Extract duplicated error handling into `handleApiError(error)` function
- Extract `errorResponse(message, status)` and `successResponse(data)` helpers
- Extract `validateUUID(id, label)` that returns error response or null
- Extract `parsePagination(searchParams)` helper
- **Impact:** Eliminates ~150 duplicate response blocks across 48 API routes

### 1.2 Consolidate xAI Client
- `lib/xai/client.ts` duplicates fetch logic from `lib/xai-client.ts`
- Refactor `lib/xai/client.ts` to use `createChatCompletion()` from `xai-client.ts`
- Remove unused `createGrokClient()` wrapper and default `grokClient` export from `xai-client.ts`

### 1.3 Remove Redundant Wrapper
- `lib/supabase-client.ts` is a thin re-export wrapper around `lib/supabase/server.ts`
- Update all imports to use `lib/supabase/server` directly, then delete the wrapper

### 1.4 Consolidate Time Formatting
- `components/episodes/episode-list.tsx` has local `formatDuration()`, `durationToSecs()`, `secsToHuman()`
- `lib/utils.ts` already has `formatDuration()`
- Move all time utilities to `lib/utils.ts`, update imports in episode-list

### 1.5 Clean Up Unused Code
- Remove unused wrapper interface/instance from `xai-client.ts` (lines 145-165)
- Remove `eslint-disable` from `webhooks/dispatcher.ts` and fix the underlying type
- Fix `eslint-disable` in `use-episode-seo.ts` by creating proper union type

---

## Phase 2: API Routes

### 2.1 Apply Response Helpers Across All Routes
- Replace 150+ instances of `NextResponse.json<ApiResponse<null>>({ data: null, error: '...' }, { status: ... })` with `errorResponse('...', status)`
- Replace success responses with `successResponse(data)` where appropriate
- Replace catch blocks with `handleApiError(error, 'context')`

### 2.2 Consolidate Auth + UUID Validation
- Replace ~45 instances of auth + UUID validation boilerplate with calls to `validateUUID()`
- Standardize unused request params: use `_request` consistently when unused

### 2.3 Standardize Response Shapes
- Ensure Stripe routes (`checkout`, `portal`, `invoices`) use consistent `{ data, error }` format
- Ensure team routes use consistent response format
- Fix `subscriptions/route.ts` to wrap response consistently

### 2.4 Simplify Complex Route Handlers
- Extract customer lookup/creation in `stripe/checkout/route.ts` to helper
- Simplify nested try-catch in `episodes/[id]/process/route.ts`

---

## Phase 3: Components and Hooks

### 3.1 Standardize Hook Return Type Naming
- Rename `UseAuthReturn` → `UseAuthResult`
- Rename `UseUsageReturn` → `UseUsageResult`
- Rename `UsePreInterviewReturn` → `UsePreInterviewResult`
- Rename `UsePodcastSearchReturn` → `UsePodcastSearchResult`

### 3.2 Standardize Hook Error Handling
- Ensure consistent error message format across all hooks
- Fix `use-vocabulary.ts` to set error state instead of throwing (or consistently throw)
- Standardize `result.data || result` defensive patterns in `use-shows.ts`

### 3.3 Simplify Complex Conditionals in Components
- Extract nested ternary in `episode-detail.tsx:470-477` to `getFormattedNotes()` helper
- Extract similarity score color logic in `related-episodes.tsx` to config object
- Simplify SEO metric derivation in `episode-detail.tsx:434-448`

### 3.4 Clean Up Unused Imports
- Remove unused lucide-react icons from `episode-detail.tsx` (massive import line)
- Audit all component files for unused imports

---

## Phase 4: Types and Constants

### 4.1 Tighten Type Definitions
- Remove `any` from `use-episode-seo.ts` — create `RawSEOResponse` union type
- Remove `any` from `types/database.ts` — type the `shows` field properly
- Replace `Record<string, unknown>` in metadata fields with specific interfaces where possible

### 4.2 Move Hook Types to Central Location
- Move `PreInterviewAppearance`, `PreInterviewData` from `use-pre-interview.ts` to `types/database.ts`
- Move `GuestPackageData` from `use-guest-package.ts` to `types/database.ts`
- Keep re-exports from hooks for backwards compatibility

### 4.3 Extract Magic Numbers
- Move `POLL_INTERVAL_MS = 3000` to `lib/constants.ts`
- Ensure `use-polling.ts` default interval references the same constant

### 4.4 Clean Up Stale TODOs
- Review 13 TODO/FIXME comments — remove ones that are no longer actionable
- Keep TODOs that are genuinely pending (scaffold items like audiogram, i18n, publishing OAuth)

---

## Phase 5: Test Cleanup

### 5.1 Verify All Tests Pass After Each Phase
- Run `npx vitest run` after each phase
- Baseline: 789 passing, 12 pre-existing failures (DB/RLS)
- No test removal allowed — only additions

### 5.2 Clean Up Test Files
- Note: `lib/viral-moments/detector.test.ts` exists in lib directory — leave as-is (moving files is out of scope per instructions)

---

## What This Plan Does NOT Do
- No file moves between directories (no architecture changes)
- No dependency upgrades
- No UI/UX changes
- No new features
- No changing public API contracts (request/response shapes stay identical)
- No breaking the tier system (free/pro/creator/agency stays as-is)
- No removing mock data fallbacks (they serve as graceful degradation)
- No creating new shared UI components like `<AsyncState>` or `<CollapsibleSection>` (would be architecture changes that risk visual differences)

## Risk Assessment
- **Low risk:** Response helpers, unused code removal, type tightening, TODO cleanup
- **Medium risk:** xAI client consolidation (touching AI pipeline), response shape standardization
- **Mitigation:** Run full test suite after every change group
