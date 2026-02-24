# PodBrain — Deferred Audit Fixes

**Created:** 2026-02-24
**Source:** Codebase Cartographer audit (76 findings, 58/100 health score)
**Branch:** ui-rebuild-v3

These items were identified during the full codebase audit but deferred because they require architectural changes, auth implementation, database migrations, or are post-launch optimizations. Review and prioritize these before launch.

---

## Pre-Launch Blockers (Require Auth Implementation)

### CRIT-01: All 26 API Routes Publicly Unauthenticated
- `validateAuth()` exists in `lib/auth.ts` but is never called
- No `middleware.ts` file exists
- Any HTTP client can trigger paid AI processing, delete data, initiate Stripe sessions
- **Action:** Implement Supabase Auth. Add `middleware.ts` to protect `/api/*` (except `/api/stripe/webhooks`). Replace `DEFAULT_USER_ID` with `auth.uid()`.

### CRIT-02: Database RLS Policies Effectively Disabled
- All Phase 1 tables use `USING (true)` — any anon key client can read/write all rows
- `experts` table correctly uses `USING (auth.uid() = user_id)` as the target pattern
- **Action:** After auth, update all policies to `USING (user_id = auth.uid())`. Interim step: `USING (user_id = '00000000-0000-0000-0000-000000000001')`.

### CRIT-05: Rate Limiting Implemented but Applied to Zero Routes
- `lib/rate-limit.ts` is imported in 5 routes but rate limiting without auth is ineffective
- `POST /api/episodes/[id]/process` can be called unlimited times (~$0.15 per call in AI costs)
- **Action:** After auth, apply `checkRateLimit()` to all POST/DELETE endpoints. Processing: 10/min. Assets: 30/min. Default: 60/min.

### HIGH-11: No `validateAuth()` Calls in Route Handlers
- Even after auth is implemented, each route needs explicit enforcement
- **Action:** Use `middleware.ts` as primary guard + per-route `validateAuth()` calls.

---

## Pre-Launch Blockers (Architectural)

### CRIT-04: Trigger.dev 30-Min Timeout vs 4-8 Hour Transcription
- `processEpisodeTask` has `maxDuration: 1800` (30 min)
- `TIMEOUTS.transcription = 8 * 60 * 60 * 1000` (8 hours)
- 4-hour podcast transcription reliably times out
- **Action:** Switch from polling-in-job to AssemblyAI webhook callback pattern. Create `/api/assemblyai/callback` endpoint that continues the pipeline.

### HIGH-01: `grok-beta` Unstable Model Identifier
- `lib/xai-client.ts` and `lib/content/generator.ts` use `grok-beta`
- xAI can retire this alias without notice, breaking all content generation
- **Action:** Pin to a specific versioned model ID (e.g., `grok-2-1212`). Monitor xAI release notes.

### HIGH-02: AI Cost Guard Never Called
- `estimateGenerationCost()` exists but is never invoked before generation
- `generateMultipleAssets()` dispatches 30+ Grok requests via `Promise.all()` with no ceiling
- **Action:** Call `estimateGenerationCost()` before `Promise.all()`. Implement `MAX_COST_PER_EPISODE` abort threshold.

### HIGH-03: Asset Generation JSON.parse Without Schema Validation
- `lib/content/generator.ts` stores AI responses directly without Zod validation
- Viral moments detector demonstrates the correct pattern
- **Action:** Define `GeneratedAssetSchema` per asset type. Apply Zod parsing before DB insertion.

### generate-assets.ts: Real xAI API Call Entirely Commented Out
- Lines 200-221 are commented out — all assets return `getMockAssetContent()`
- This means **no real asset generation** happens in the current codebase
- **Action:** Uncomment and test the real API call path before launch.

---

## Database Migrations Needed

### HIGH-04: hosting_connections Schema Conflict
- Phase 1 columns (`platform`, `access_token`, `refresh_token`) coexist with Phase 7 columns (`provider`, `credentials`)
- App code only uses Phase 7 columns; Phase 1 columns are dead weight
- **Action:** Migration to drop Phase 1 columns and `hosting_platform` enum.

### MED-02: Duplicate HNSW Index on episode_sections.embedding
- Two indexes on same column: `episode_sections_embedding_idx` and `episode_sections_embedding_hnsw_idx`
- **Action:** Migration to drop `episode_sections_embedding_idx`.

### MED-03: RLS Policies Allow All Operations (duplicate of CRIT-02)
- Same resolution — blocked by auth.

### LOW-03: Missing `seo_analyzed_at` Timestamp Column
- No way to determine if SEO analysis is stale
- **Action:** Add `seo_analyzed_at TIMESTAMPTZ` column to `episodes`.

### LOW-04: No Soft Deletes on Episodes/Shows
- Hard deletes are permanent — users can accidentally lose paid AI-generated content
- **Action:** Add `deleted_at TIMESTAMPTZ` to `shows` and `episodes`. Filter `deleted_at IS NULL` in queries.

---

## Post-Launch Performance & Reliability

### HIGH-05: No Cache Invalidation on Custom Hooks
- 11 custom hooks use plain `fetch()` with no SWR/React Query
- Episode status changes don't auto-refresh the UI
- **Action:** Adopt SWR or React Query. At minimum, poll every 5s when `episode.status === 'processing'`.

### HIGH-16: No HTTP Caching on GET Endpoints
- All 26 routes return no `Cache-Control` headers
- **Action:** Add `Cache-Control: private, max-age=30` to stable GET endpoints.

### HIGH-17: No Circuit Breaker on External Service Calls
- xAI outage causes cascading timeouts across all requests
- **Action:** Implement circuit breaker wrapper. Track failures in Redis. Open circuit after N failures.

### MED-01: Transcript Truncated to 8000 Characters for All Assets
- `lib/content/asset-prompts.ts` uses `ctx.transcript.slice(0, 8000)` — discards ~95% of a 4-hour episode
- Undermines the primary value proposition
- **Action:** Implement chunked transcript processing or use Grok's full 128K context window.

### MED-10: No Redis Caching for Expensive API Operations
- Redis is configured but no routes use it for response caching
- **Action:** Cache `GET /api/shows` (60s TTL), `GET /api/episodes/[id]/assets` (30s TTL).

### MED-11: Vocabulary Service Fetches All Terms Without Pagination
- `getShowVocabulary()` runs unbounded SELECT
- **Action:** Add `.limit(500).order('occurrence_count', { ascending: false })`.

### MED-25: No Timeout on Direct xAI API fetch() Calls
- `lib/xai-client.ts` calls `fetch()` without `AbortSignal.timeout()`
- **Action:** Add `signal: AbortSignal.timeout(10000)` to all xAI fetch calls.

### MED-27: Audio Segments Not Batched on Insert
- 4-hour podcast can produce thousands of rows with 1536-dim embeddings
- **Action:** Batch inserts in chunks of 50-100 rows.

---

## UX Improvements

### MED-06: User Input Injected Into AI Prompts Without Sanitization
- `guestName`, `guestBio`, `topic` injected directly into Grok prompts
- **Action:** Apply `sanitizeString()` + wrap in XML delimiters for prompt safety.

### MED-20: All 5 Tabs Shown for Unprocessed Episodes
- Processing/pending episodes show empty tabs
- **Action:** Show `ProcessingBanner` with progress instead of empty tab interface.

### MED-21: Experts Page Is a Dead End
- No actions on expert cards — no "Save to Show" or booking flow
- **Action:** Add guest pipeline feature with `show_guests` table.

### MED-22: No Episode Editing Flow
- `PUT /api/episodes/[id]` exists but no edit form in UI
- **Action:** Add inline edit mode to episode workspace header.

### MED-28: No Breadcrumb/Back Navigation in Episode Workspace
- Only way back is browser back button or sidebar nav
- **Action:** Add breadcrumb to episode workspace page header.

### MED-29: POST /api/episodes Route Doesn't Exist
- Episode creation happens through the upload flow, not a standalone endpoint
- **Action:** Document the pattern or add the standard REST endpoint.

---

## Testing Infrastructure

### HIGH-06: Button Tests Reference Old Kokonut CSS Classes
- Tests check for `bg-primary`, `bg-secondary` — Swiss Broadcast uses CSS custom properties
- **Action:** Update tests for Swiss Broadcast implementation.

### HIGH-07: No Coverage Thresholds Enforced
- Coverage can drop to 0% without failing CI
- **Action:** Set minimum thresholds: `{ statements: 60, branches: 50, functions: 60, lines: 60 }`.

### MED-12: API Integration Tests Require Manually-Started Dev Server
- **Action:** Add `globalSetup.ts` to start/stop Next.js dev server automatically.

### MED-13: Zero Tests for 11 Custom React Hooks
- **Action:** Add hook tests using `@testing-library/react` `renderHook`.

### MED-14: 41 of 42 UI Components Have No Unit Tests
- **Action:** Prioritize upload-wizard, show-notes-tab, episode-tabs.

### MED-15: E2E Tests Run Against Real DB
- **Action:** Create separate Supabase project for E2E testing.

---

## Security Hardening

### HIGH-12: UUID Path Params Not Validated
- Route handlers pass raw params to Supabase without `validateUUID()`
- **Action:** Add `validateUUID(params.id)` at top of each route handler.

### HIGH-13: Verify .netlify/ Is Gitignored
- `.netlify/functions-internal/.env.local` may contain secrets
- **Action:** Verify `.gitignore` excludes `.netlify/`. Run `git status` to confirm.

### MED-05: Credentials JSONB Without Column-Level Encryption Validation
- Encryption exists but startup validation of key strength needs verification
- **Action:** Verify `ENCRYPTION_SECRET` entropy check runs at startup.

### MED-07: UUID Params Not Validated (same as HIGH-12)

### MED-23: devGuard Relies on NODE_ENV
- Non-standard NODE_ENV values bypass the guard
- **Action:** Replace with explicit `DISABLE_DEV_ROUTES=true` env var.

### MED-24: Resend Falls Back to `onboarding@resend.dev`
- **Action:** Make `RESEND_FROM_EMAIL` a required env var (throw at startup).

### LOW-07: No CORS Headers
- Not needed now (same-origin) but will be needed for mobile/partner access
- **Action:** Add CORS config when needed.

### LOW-11: Stripe Webhook Idempotency Not Fully Implemented
- **Action:** Add `processed_stripe_events` table to prevent duplicate processing.

### LOW-13: Embedding Dimension Not Validated Before Storage
- **Action:** Add assertion: `if (embedding.length !== 1536) throw`.

---

## Miscellaneous

### MED-16: Mobile Sidebar Escape Key Not Announced to Screen Readers
- **Action:** Add `aria-keyshortcuts="Escape"` and focus management.

### LOW-02: devGuard NODE_ENV Bypass (duplicate of MED-23)

### LOW-06: Root Page Redirect May Cause Flash
- **Action:** Use `redirect('/episodes')` server-side instead of `router.push()`.

### LOW-08: Inconsistent Error Response Shapes Across Routes
- **Action:** Standardize to `ApiResponse<T>` shape across all route handlers.

### LOW-09: Episode Sections Insert Payload May Be Very Large (duplicate of MED-27)

### LOW-10: Default Vitest Config Catches Co-located Tests Redundantly
- **Action:** Move co-located tests or update config includes.

### LOW-14: `NEXT_PUBLIC_APP_URL` Not in Env Docs
- **Action:** Add to CLAUDE.md environment variables section and set in Netlify.

---

*Generated from codebase audit on 2026-02-24. Review before each sprint planning session.*
