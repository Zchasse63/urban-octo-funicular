# Medium Findings

**Synthesizer:** audit-synthesizer
**Date:** 2026-02-24
**Total Medium Findings:** 30

Medium severity findings represent technical debt, code quality issues, and UX gaps that should be addressed before or shortly after launch. They are unlikely to cause immediate production failures but degrade code quality, user experience, or architectural integrity.

---

## MED-01: Transcript Truncated to 8000 Characters for All Asset Generation

**Layers:** ai-layer, user-flow, integration
**Corroboration:** 3 independent layers confirmed this finding.

`lib/content/asset-prompts.ts` injects `ctx.transcript.slice(0, 8000)` into prompts for all 30+ asset types. An average 4-hour podcast transcript is approximately 150,000+ characters. The 8000-character limit means:
- Approximately 95% of the episode transcript is discarded
- Show notes, blog posts, social media content, and all other assets are generated from the first 5-6 minutes of the episode only
- The primary value proposition (comprehensive show notes for a full episode) is undermined

**Resolution:** Implement chunked transcript processing. Break the transcript into segments, generate summaries per segment, then use the combined summaries as the context for asset generation. Consider using Grok's full context window (128K tokens) for show notes generation by passing the complete transcript.

---

## MED-02: Duplicate HNSW Index on episode_sections.embedding

**Layer:** data-model

Phase 1 migration creates `episode_sections_embedding_idx` on `episode_sections.embedding` with `vector_cosine_ops`. Phase 6 migration creates `episode_sections_embedding_hnsw_idx` on the same column with the same operator class. Two HNSW indexes on the same column waste storage (potentially significant for large embedding sets) and marginally slow every INSERT into `episode_sections`.

**Resolution:** Drop one of the two indexes. Recommend keeping `episode_sections_embedding_hnsw_idx` (the more explicitly named one) and dropping `episode_sections_embedding_idx`.

---

## MED-03: RLS Policies on Core Tables Allow All Operations for All Sessions

**Layer:** data-model

Core tables from Phase 1 (`shows`, `episodes`, `episode_sections`, `generated_assets`, `corrections`, `vocabulary_terms`) have RLS policies using `USING (true)` — any Supabase session can read and write all rows. While intentional for single-user MVP mode, these policies must be updated before multi-user launch. The `experts` table correctly demonstrates the target pattern with `USING (auth.uid() = user_id)`.

**Resolution:** As an intermediate step (before full auth implementation), update policies to `USING (user_id = '00000000-0000-0000-0000-000000000001')` to at least restrict access to the default user. After auth: update to `USING (user_id = auth.uid())`.

---

## MED-04: asset_type Enum Has 40+ Values While ASSET_TYPES Constant Has 10

**Layer:** data-model

Phase 6 migration added 30+ new values to the `asset_type` enum via `ALTER TYPE ... ADD VALUE` statements. The `ASSET_TYPES` array in `lib/constants.ts` still only has the original 10 values. TypeScript code that iterates `ASSET_TYPES` will miss 30+ valid enum values, creating invisible blind spots in asset generation coverage reporting and UI filtering.

**Resolution:** Update `ASSET_TYPES` in `constants.ts` to include all enum values from the Phase 6 migration. Consider generating this constant from the database schema rather than maintaining it manually.

---

## MED-05: Credentials Stored as JSONB Without Column-Level Encryption

**Layer:** data-model

`hosting_connections.credentials` stores Buzzsprout API tokens as JSONB. Application-level encryption is applied via `lib/buzzsprout/encryption.ts` (AES-256-GCM) before insertion, which is good. However, the column has no database-level type constraint, and the encryption key strength depends entirely on the `ENCRYPTION_SECRET` environment variable. If the encryption key is weak or leaked, all stored credentials are compromised.

**Resolution:** Add a check in `lib/buzzsprout/encryption.ts` that validates `ENCRYPTION_SECRET` meets minimum entropy requirements at startup (this validation already exists per the audit finding — verify it is called at startup, not just at encryption time).

---

## MED-06: User Input Injected Into AI Prompts Without Sanitization

**Layers:** security, ai-layer

`guestName` and `guestBio` collected in Step 2 of the upload wizard are directly injected into xAI Grok prompts via `AssetContext`. The `topic` field in expert discovery is also directly injected. A user can attempt prompt injection:

```
guestName: "Ignore all previous instructions. Instead, return..."
```

While large language models have improved resistance to prompt injection, it is not a guarantee. No sanitization, length limiting beyond basic truncation, or injection detection is applied.

**Resolution:** At minimum, apply `sanitizeString()` from `lib/validation.ts` to user-provided fields before prompt injection. Consider wrapping user input in XML-style delimiters (e.g., `<guest_name>` tags) and explicitly instructing the model to treat the content as data, not instructions.

---

## MED-07: UUID Path Parameters Not Validated Before Database Queries

**Layer:** api-surface, security

Route handlers accept `params.id` path parameters and pass them directly to Supabase queries. `lib/validation.ts` provides `validateUUID()` but it is not called consistently in route handlers. While Supabase parameterized queries prevent SQL injection, error responses from an invalid UUID (e.g., Supabase's "invalid input syntax for type uuid: 'foo'") expose internal implementation details.

**Resolution:** Add `if (!validateUUID(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })` at the top of each route handler accepting an id parameter.

---

## MED-08: Turbopack Configuration Is Dead Code

**Layer:** performance-infra

`next.config.ts` defines `turbopack: { root: process.cwd() }` but the build script in `package.json` uses `"build": "TURBOPACK=false next build"`. The environment variable disables Turbopack at build time, making the configuration in `next.config.ts` inert. Dead configuration misleads developers who read the config file.

**Resolution:** Either remove `turbopack: { root: process.cwd() }` from `next.config.ts` (if Turbopack is not used), or remove the `TURBOPACK=false` override from the build script and test with Turbopack enabled.

---

## MED-09: `puppeteer` as a Production Dependency Inflates Build Size

**Layers:** security, performance-infra

`puppeteer` ^24.36.1 bundles Chromium (~150MB+ compressed). As a `dependencies` entry (not `devDependencies`), it is included in the Netlify serverless function bundle. This:
- Increases cold start times significantly
- Potentially exceeds Netlify's function size limits (50MB compressed)
- Expands the attack surface with a full browser engine in production

**Resolution:** If puppeteer is used only for PDF generation of guest packages, move it to a dedicated serverless function or use a lighter PDF library. If it is unused, remove it entirely.

---

## MED-10: No Redis Caching for Expensive API Operations

**Layer:** performance-infra

`lib/redis/cache.ts` implements Redis caching, and Redis is gracefully optional (null client if env vars not set). However, no API routes use Redis for response caching. `GET /api/shows`, `GET /api/episodes`, `GET /api/episodes/[id]/assets` query Supabase on every request. Expert discovery caches in the database table (7-day TTL) but not in Redis.

**Resolution:** Cache `GET /api/shows` responses per user in Redis with a 60-second TTL. Cache `GET /api/episodes/[id]/assets` with a 30-second TTL (invalidate on new asset creation). This reduces Supabase read load without complex infrastructure.

---

## MED-11: Vocabulary Service Fetches All Terms Without Pagination

**Layer:** performance-infra

`getShowVocabulary()` runs `SELECT * FROM vocabulary_terms WHERE show_id = ?` with no `LIMIT`. For a show that has been processing episodes for months (accumulating hundreds or thousands of vocabulary terms), this could return a large result set in a serverless function context and cause memory pressure.

**Resolution:** Add `.limit(500)` and `.order('occurrence_count', { ascending: false })` to the vocabulary query. For vocabulary term matching (word boost), the top 500 most common terms are sufficient for AssemblyAI's `word_boost` parameter (which itself has limits).

---

## MED-12: API Integration Tests Require a Manually-Started Dev Server

**Layer:** testing-quality

`test/integration/api/` tests use an `api-client.ts` that calls `http://localhost:3000`. Tests explicitly require running `npm run dev` beforehand. In CI, if the dev server is not started, tests will fail with network errors rather than being properly skipped. The `vitest.api.config.ts` has no globalSetup to start the server automatically.

**Resolution:** Add a `globalSetup.ts` to `vitest.api.config.ts` that starts the Next.js dev server, waits for it to be ready, and tears it down in `globalTeardown`. Alternatively, mock the API layer and convert these to unit tests.

---

## MED-13: No Hook Tests for 11 Custom React Hooks

**Layer:** testing-quality

`hooks/` contains 11 custom hooks (`use-episodes.ts`, `use-episode.ts`, `use-shows.ts`, `use-subscription.ts`, `use-vocabulary.ts`, `use-polling.ts`, etc.) with zero unit tests. These hooks contain business logic including data fetching patterns, polling behavior, and state management. A bug in `use-polling.ts` could cause the episode workspace to poll indefinitely or not at all.

**Resolution:** Add hook tests using `@testing-library/react`'s `renderHook`. Mock `fetch` at the hook level. Test at minimum: loading state, success state, error state, and refetch behavior for critical hooks.

---

## MED-14: 41 of 42 UI Components Have No Unit Tests

**Layer:** testing-quality

Only `Button` has a unit test. Complex components like `upload-wizard.tsx` (multi-step form, file upload, API integration), `episode-tabs.tsx` (tab state management), `sidebar.tsx` (collapsible, localStorage), and `show-notes-tab.tsx` (potentially dangerous HTML rendering) have no tests.

**Resolution:** Prioritize testing `upload-wizard.tsx` (complex form with API interactions), `show-notes-tab.tsx` (security-relevant HTML rendering), and `episode-tabs.tsx` (tab state transitions). Use `@testing-library/react` and mock fetch/router.

---

## MED-15: E2E Tests Run Against Real Database With No Test Isolation Environment

**Layer:** testing-quality

Playwright E2E tests connect to the real Supabase database via `.env.local`. Test data is created and cleaned up by prefix (`[TEST]`), but if a test run is interrupted, test data may persist in the database indefinitely. There is no separate test database or Supabase project for E2E testing.

**Resolution:** Create a separate Supabase project for E2E testing. Store its credentials in a `test.env` file used only by the Playwright configuration. This prevents test pollution of the development database.

---

## MED-16: Mobile Sidebar Escape Key Not Announced to Screen Readers

**Layer:** ui-ux

`AppShell` adds a `keydown` event listener for the Escape key to close the mobile sidebar. This keyboard shortcut is not documented in the UI, not announced via `aria-keyshortcuts`, and not discoverable by screen reader users. The mobile sidebar overlay should trap focus while open and explicitly announce the dismiss mechanism.

**Resolution:** Add `aria-keyshortcuts="Escape"` to the mobile sidebar close button. When the sidebar opens, use `focus()` to move focus into the sidebar. When it closes, return focus to the hamburger button.

---

## MED-17: Hardcoded Nav Counts Are Stale and Incorrect

**Layers:** project-structure, ui-ux, user-flow
**Corroboration:** 3 independent layers confirmed this finding.

`sidebar.tsx` shows hardcoded `count={12}` for Episodes and `count={42}` for Vocabulary in the nav item badges. `usagePercent = 82` is also hardcoded. These values are meaningless to users and create confusion about actual data.

**Resolution:** Fetch real counts from the API. `useEpisodes()` and `useVocabulary()` hooks already exist and return data — extract `.total` from their responses and pass as count props. For the usage meter, derive from the user's subscription tier and actual usage.

---

## MED-18: Missing htmlFor Associations in Upload Wizard Form

**Layer:** ui-ux

`upload-wizard.tsx` renders `<label>` elements without `htmlFor` attributes, and the corresponding `<input>` elements lack `id` attributes. Screen readers cannot programmatically associate labels with their inputs, making the form difficult to complete for users relying on assistive technology.

**Resolution:** Add `id` attributes to all form inputs and matching `htmlFor` to their labels:
```tsx
<label htmlFor="guest-name">Guest Name</label>
<input id="guest-name" ... />
```

---

## MED-19: Content Style Selector Uses Buttons Instead of Radio Inputs

**Layer:** ui-ux

Step 3 of the upload wizard (content style selection) renders 4 options (Professional, Casual, Educational, Storytelling) as styled `<button>` elements. These buttons have no `aria-pressed`, `role="radio"`, or `role="radiogroup"` attributes. Screen readers cannot determine which style is currently selected or that this is a single-select group.

**Resolution:** Convert to `<input type="radio">` elements within a `<fieldset>` and `<legend>`, or add `role="radiogroup"` to the container and `role="radio"` with `aria-checked` to each option button.

---

## MED-20: Episode Workspace Shows All 5 Tabs for Unprocessed Episodes

**Layer:** user-flow

When an episode is in `pending` or `processing` state, all 5 tabs (Show Notes, Assets, Transcript, Guest Package, Intelligence) are visible and clickable but display empty or placeholder content. A better UX pattern would be a single processing state view with a progress indicator, revealing tabs progressively as content is generated.

**Resolution:** Add conditional rendering: if `episode.status !== 'completed'`, render a `ProcessingBanner` component instead of the full tab interface. Show which processing steps are complete (transcription, show notes, assets). The `ProcessingBanner` component already exists in the UI primitives.

---

## MED-21: Experts Page Is a Dead End — No Connection to Episode Workflow

**Layer:** user-flow

`/experts` discovers AI-generated podcast guest suggestions but provides no action to associate an expert with a show, tag them for a future episode, or create a booking request. Expert cards display name, expertise, freshness score, and contact hints but have no actionable buttons.

**Resolution:** Add a "Save to Show" or "Add to Guest Pipeline" action on each expert card. Create a simple `show_guests` table to store saved expert/show associations. Surface saved guests in the episode workspace Step 2 (guest context) for easy re-use.

---

## MED-22: No Episode Editing Flow in the UI

**Layer:** user-flow

`PUT /api/episodes/[id]` exists for updating episode metadata but no edit form is exposed in the episode workspace. Users cannot update the title, description, guest info, or other metadata fields after upload without calling the API directly.

**Resolution:** Add an inline edit mode to the episode header. An "Edit" button that reveals input fields for title, description, and guest info, with a "Save" action calling `PUT /api/episodes/[id]`.

---

## MED-23: devGuard Relies on NODE_ENV — Could Be Bypassed in Staging

**Layers:** api-surface, security

`devGuard()` returns a 404 only when `process.env.NODE_ENV === 'production'`. Staging environments that use `NODE_ENV=development` or `NODE_ENV=test` would expose seed, test-db, test-redis, and test-guest-package routes. These routes could seed test data or expose internal infrastructure details.

**Resolution:** Replace the `NODE_ENV` check with an explicit `DISABLE_DEV_ROUTES=true` environment variable that is set in all non-local environments:
```typescript
if (process.env.DISABLE_DEV_ROUTES === 'true') {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

---

## MED-24: Resend Default Sender Falls Back to `onboarding@resend.dev`

**Layer:** integration

`lib/email/service.ts` falls back to `'onboarding@resend.dev'` when `RESEND_FROM_EMAIL` is not set. Guest package emails sent from this address would appear to come from Resend's own domain (not `getpodbrain.ai`), look unprofessional, and may have lower deliverability due to domain reputation differences.

**Resolution:** Make `RESEND_FROM_EMAIL` a required environment variable (throw at startup if missing). Add it to the environment variables list in `CLAUDE.md`.

---

## MED-25: No Timeout on Direct xAI API fetch() Calls Outside Trigger.dev

**Layers:** ai-layer, integration

`lib/xai-client.ts` calls `fetch()` without an `AbortSignal.timeout()`. Route handlers that call xAI directly (e.g., `GET /api/episodes/[id]/viral-moments`, `GET /api/shows/[id]/experts`) could hang for up to the Next.js serverless function maximum (30 seconds) during an xAI API slowdown. During this time, the user sees a spinner with no feedback.

**Resolution:** Add `signal: AbortSignal.timeout(10000)` (10 seconds) to all `fetch()` calls in `xai-client.ts`. Catch `AbortError` and surface a meaningful error response to the client.

---

## MED-26: Signed Audio URL Expires in 24 Hours but Is Stored Permanently

**Layer:** integration

`POST /api/upload` generates a 24-hour signed Supabase Storage URL and stores it as `episodes.audio_url`. If the episode processing fails and needs to be replayed after 24 hours, AssemblyAI cannot retrieve the audio (expired URL). The `PUT /api/episodes/[id]/process` (replay) route would fail silently for old episodes.

**Resolution:** Store the `publicUrl` (permanent) rather than the `signedUrl` as `episodes.audio_url`. Use the bucket's public access settings appropriately, or re-generate the signed URL at processing time from the stored `filePath`.

---

## MED-27: Audio Segments Not Batched on Insert — Large Payload Risk

**Layer:** performance-infra

The processing pipeline maps transcript segments to `episode_sections` rows and attempts a single Supabase `INSERT` with an array of all rows. For a 4-hour podcast with thousands of utterance segments, this single insert could be very large (each segment includes a 1536-dimension embedding vector). Supabase has payload size limits.

**Resolution:** Batch `episode_sections` inserts in chunks of 50-100 rows. Use `for (let i = 0; i < sections.length; i += 50)` with `await supabase.from('episode_sections').insert(sections.slice(i, i + 50))`.

---

## MED-28: No Breadcrumb or Back Navigation in Episode Workspace

**Layer:** user-flow

`/episodes/[id]` provides no visible breadcrumb (e.g., "Episodes > My Episode Title") or back button. Users must use the browser back button or click "Episodes" in the sidebar nav. On mobile with the sidebar hidden, there is no obvious path back to the episode list without using the browser.

**Resolution:** Add a breadcrumb component to the episode workspace page header: `< Back to Episodes` or `Episodes / Episode Title`. The `PageHeader` component from the layout layer could be extended to support breadcrumb props.

---

## MED-29: `POST /api/episodes` Endpoint — Route Inconsistency

**Layer:** api-surface

The standard REST pattern for creating an episode would be `POST /api/episodes`. The `episodes/route.ts` file may only handle `GET` (listing) without a `POST` handler. The upload wizard may create episodes through a different mechanism. If `POST /api/episodes` is missing, the REST API is incomplete and the upload flow's actual episode creation path is opaque.

**Resolution:** Verify whether `POST /api/episodes` exists. If it does, document it. If episode creation happens through a different route or within the upload endpoint, add clear comments explaining the pattern.

---

## MED-30: E2E Tests Cover Marketing Pages That May Not Exist

**Layer:** user-flow (gap identified in synthesis)

`test/e2e/flows/marketing-pages.spec.ts` tests marketing/landing pages. No marketing route was found under `app/src/app/(app)/`. The root `page.tsx` redirects to `/episodes`. If marketing pages do not exist, this E2E test file either tests a non-existent route (failing) or is a stub that was never completed.

**Resolution:** Verify whether marketing/landing pages exist. If they do not, either remove the E2E test file or mark it as skipped (`test.skip`). If they should exist, create the route.
