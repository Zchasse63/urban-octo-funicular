# Test Plan: Core Paid Flow

**Status:** Reviewed
**Author:** qa-architect
**Date:** 2026-04-18
**Related:** [specs/features/core-paid-flow-analysis.md](../features/core-paid-flow-analysis.md)

## 1. Overview

Test strategy focuses on **contract-level correctness of the paid flow** rather than waiting for real AI pipelines. Every test that would block on AssemblyAI (2–4 min) or xAI (3–10 s per asset) uses a **fast-forward fixture** — direct DB inserts via the existing `createPopulatedEpisode` factory — and asserts against the resulting rendered state.

External services:
- **REAL:** Supabase (auth + storage + DB), Upstash Redis (rate limiting)
- **REAL but not exercised end-to-end:** AssemblyAI, xAI Grok — triggering verified via API response and DB state, not output content
- **INTERCEPTED:** Resend — a `resend-mock.ts` helper installed via `vi.mock` equivalent at the server action level, plus a Playwright route-blocker on `https://api.resend.com/**` as belt-and-braces

The spec file is a single `core-paid-flow.spec.ts` at `app/test/e2e/flows/` with priority-grouped `describe` blocks, matching the project convention.

## 2. Page Object Models

### UploadWizardPage (EXTEND existing)
- **File:** `app/test/e2e/pages/upload-wizard-page.ts`
- **Status:** Exists — extend with two new methods
- **New methods to add:**
  - `async fillExpertContext(ctx: {episodeTitle?, description?, guestName?, guestBio?})` — fills Step 2 fields (requires adding `getByLabel()` calls that map to the component's `field()` render)
  - `async selectContentStyle(style: string)` — clicks the Content Style card matching a regex
  - `languageSelect()`, `topicInput()` — locators exposed for topic/language edge-case tests
  - `submitTestId()` — returns `page.getByTestId('upload-submit-button')` (switch from regex-by-name to explicit testId)

### EpisodeDetailPage (EXTEND existing)
- **File:** `app/test/e2e/pages/episode-detail-page.ts`
- **Status:** Exists — add these:
  - `downloadZipLink()` → `page.locator('a[href$="/assets/download"][download]')`
  - `generateAllButton()` → `page.getByRole('button', { name: /Generate All Remaining/i })`
  - `regenerateNotesButton()` → `page.getByRole('button', { name: 'Regenerate' })`
  - `statusBadge(status)` → `getByText(new RegExp(status, 'i'))` matching COMPLETED/PROCESSING/FAILED
  - `transcriptFirstTimestamp()` → `page.locator('text=/^\\d{2}:\\d{2}$/').first()`
  - `assertNoBrokenTimestampLinks()` → regex-matches rendered body for `/\[\d+:\d+\]\(\d+:\d+\)/` and expects no match (BUG #11 guard)

### CorePaidFlowApi (NEW helper, not a POM)
- **File:** `app/test/e2e/helpers/core-paid-flow-api.ts`
- **Responsibility:** Direct HTTP helpers for API-only contract tests (no browser needed). Uses `request` fixture from Playwright.
- **Methods:**
  - `async downloadZip(episodeId, cookies) → {status, contentType, contentDisposition, length}`
  - `async fetchGuestPackage(episodeId, cookies) → {status, body}`
  - `async sendGuestPackage(episodeId, cookies, payload) → {status, body}`
  - `async triggerAssemblyaiWebhook(token?, body?) → {status, body}`
  - `async processEpisode(episodeId, cookies) → {status, body}`

### ResendInterceptor (NEW helper)
- **File:** `app/test/e2e/helpers/resend-intercept.ts`
- **Responsibility:** Installs a Playwright-level network block on `https://api.resend.com/**` AND exposes a server-side mock registration file that `sendGuestPackageEmail` reads when `process.env.TEST_E2E_RESEND_MOCK=1`.
- **Methods:**
  - `async installNetworkBlock(page)` — adds `page.route('**/api.resend.com/**', r => r.fulfill({ status: 500, body: 'blocked'}))`
  - `async readCapturedEmails() → Array<{to, subject, html}>` — reads from a temp file `/tmp/resend-capture-<testid>.jsonl` the server wrote
- **Implementation note for server side:** A minimal edit to `resend-client.ts` is scoped to ONLY this plan — see "Healer fix" path. For the first engineer pass, the approach is route-blocking only and asserting the POST `/api/episodes/{id}/guest-package` returns a `503 Email service is not configured` if `RESEND_API_KEY` is unset in the test-only env. If the test env does have `RESEND_API_KEY`, the Healer will instrument the client.

## 3. Fixtures

### coreQaUser (NEW)
- **Purpose:** Creates a fresh `[CORE-QA]` test user with one show; deletes in teardown.
- **File:** `app/test/e2e/fixtures/core-paid-flow.ts`
- **Setup:** Uses existing `createTestUser('core-qa-<tag>')` + `createTestShow(userId, '[CORE-QA] ...')`
- **Teardown:** Existing `deleteTestUser` + `cleanupTestDataByPattern`
- **Used by:** All P0/P1/P2 tests in this plan.

### seededCompletedEpisode (NEW)
- **Purpose:** Given a show id, create a fully-populated `completed` episode + N generated_assets rows for ZIP download testing.
- **File:** Same fixture module.
- **Setup:** Reuses `createPopulatedEpisode` + inserts 3 rows into `generated_assets` for `linkedin_post`, `twitter_thread`, `blog_post`.
- **Teardown:** Cascade via FK from `shows` delete.

### twoUserContext (NEW — for RLS test only)
- **Purpose:** Creates two distinct `[CORE-QA]` users each with a show + episode, for the cross-user isolation test.
- **Teardown:** Delete both users.

## 4. Test Cases

Test naming convention: `T-NNN: <behavior-focused name>`.

### P0 — Core paid flow must-haves (10 tests)

#### T-001: Upload wizard submits via pre-signed URL and creates an episode in processing state
- **Priority:** P0
- **Workflow:** W-1
- **File:** `app/test/e2e/flows/core-paid-flow.spec.ts`
- **POMs:** `UploadWizardPage`
- **Fixtures:** `coreQaUser`
- **Steps:**
  1. Sign in.
  2. Goto `/upload`.
  3. Attach `test/fixtures/test-podcast-clip.mp3`.
  4. Fill expert context with title, guest name, guest bio.
  5. Navigate Step 1 → 2 → 3.
  6. Click `upload-submit-button`.
  7. Wait for URL `/episodes/<uuid>`.
  8. Query DB: verify episode row exists with `audio_url` containing `supabase.co/storage`.
  9. Verify `status IN ('pending', 'processing')`.
- **Assertions:**
  - URL matches `/episodes/[0-9a-f-]{36}`
  - Episode row has non-null `audio_url`, `title`, `guest_name`
  - `metadata.processing_run_id` present OR `status = 'processing'`

#### T-002: Completed episode exposes all 6 tabs with Stoicism regression guard
- **Priority:** P0
- **Workflow:** W-2
- **POMs:** `EpisodeDetailPage`
- **Fixtures:** `coreQaUser`, `seededCompletedEpisode`
- **Steps:** Navigate to episode; iterate each tab id; assert tab button visible; assert `assertNoMockData()` body-level guard runs via base fixture.
- **Assertions:** All 6 testIds visible; `expectNoStoicism()` passes on every tab.

#### T-003: Transcript timestamps display MM:SS from milliseconds (BUG #29 regression guard)
- **Priority:** P0
- **Workflow:** W-2 / EC-15
- **Fixtures:** `coreQaUser` + a seeded episode where `transcript_segments[0].start = 3000` (3 sec)
- **Steps:** Click Transcript tab; extract first segment timestamp text; assert it equals `00:03` (NOT `50:00` — the pre-fix behavior of treating 3000 as seconds).
- **Assertions:** First timestamp `/^00:0[0-5]$/`; no timestamp contains `\d\d:\d\d` where minutes > 60 (indicator of wrong unit).

#### T-004: Show notes do not render broken `[0:53](0:53)` markdown (BUG #11 regression guard)
- **Priority:** P0
- **Workflow:** W-16
- **Fixtures:** `coreQaUser` + seeded episode with `show_notes` containing `See [0:53](0:53) for context`.
- **Steps:** Navigate to Show Notes tab; extract rendered body text; assert pattern `/\[\d+:\d+\]\(\d+:\d+\)/` does NOT match.
- **Assertions:** Either string is rendered as valid markdown (link text visible without brackets) OR stripped entirely, but NEVER as the literal malformed pattern.

#### T-005: ZIP download returns application/zip with Content-Disposition attachment
- **Priority:** P0
- **Workflow:** W-3
- **POMs:** `EpisodeDetailPage` (for download link locator) + API helper for direct fetch
- **Fixtures:** `coreQaUser`, `seededCompletedEpisode` (with 3 assets)
- **Steps:**
  1. Navigate Assets tab.
  2. Assert Download ZIP link visible.
  3. Trigger download via Playwright `page.waitForEvent('download')` + click.
  4. Assert downloaded file name matches `/assets-\d+\.zip$/`.
- **Assertions:** Download event captured; suggested file name non-empty; file size > 0.

#### T-006: Guest package fetch returns structured content for completed episode
- **Priority:** P0
- **Workflow:** W-4
- **POMs:** API helper (no browser needed — use Playwright `request` context after sign-in)
- **Fixtures:** `coreQaUser`, `seededCompletedEpisode` with `guest_name`
- **Steps:** GET `/api/episodes/{id}/guest-package` with auth cookie.
- **Assertions:**
  - Status 200
  - `data.package.socialPosts` is non-empty array
  - `data.package.emailSubject` is string of length > 0
  - `data.package.emailBody` is string of length > 0

#### T-007: AssemblyAI webhook returns 401 on missing or bad token
- **Priority:** P0
- **Workflow:** W-7 / EC-11
- **POMs:** API helper `triggerAssemblyaiWebhook`
- **Fixtures:** None (endpoint is unauthenticated re: session)
- **Steps:**
  1. POST `/api/webhooks/assemblyai` (no query) with body `{transcript_id: 'x', status: 'completed'}` → expect 401
  2. POST `?token=wrong` → expect 401
  3. POST `?token=a` (length mismatch) → expect 401 (NOT 500)
- **Assertions:** All three return exactly 401 and `{error: 'Unauthorized'}`.
- **Flakiness risk:** Requires `ASSEMBLYAI_WEBHOOK_SECRET` set — test skips with clear `test.skip()` + reason if env var missing.

#### T-008: RLS — user cannot access another user's episode
- **Priority:** P0
- **Workflow:** W-10
- **POMs:** API helper + `EpisodeDetailPage`
- **Fixtures:** `twoUserContext`
- **Steps:**
  1. Sign in as A.
  2. GET `/api/episodes/{B-episode-id}` → 404
  3. GET `/api/episodes/{B-episode-id}/assets/download` → 404
  4. GET `/api/episodes/{B-episode-id}/guest-package` → 404
  5. POST `/api/episodes/{B-episode-id}/process` → 404
- **Assertions:** All 4 return 404 (opaque — no 403 leak).

#### T-009: XSS payload in title and guest name is escaped in the rendered DOM
- **Priority:** P0
- **Workflow:** W-11 / EC-13
- **Fixtures:** `coreQaUser` + seeded episode with:
  - title `<script>window.__xss__=true</script>Payload Title`
  - guest_name `Robert'; DROP TABLE episodes;--`
- **Steps:**
  1. Navigate `/episodes/{id}`.
  2. Assert `page.evaluate(() => window.__xss__)` returns `undefined`.
  3. Assert title renders as escaped text (does NOT execute).
  4. Query `episodes` table — at least 1 row still exists (no drop).
- **Assertions:** No XSS execution; no SQL dropping; escaped text visible in DOM.

#### T-010: ZIP download returns 404 when no assets have been generated
- **Priority:** P0
- **Workflow:** W-12 / EC-9
- **POMs:** API helper
- **Fixtures:** `coreQaUser` + a completed episode with ZERO rows in `generated_assets`
- **Steps:** GET `/api/episodes/{id}/assets/download`
- **Assertions:** Status 404 with `{error: 'No assets available for download'}`.

### P1 — Should-haves (7 tests)

#### T-011: Concurrent process dispatch returns 409 on the loser
- **Priority:** P1
- **Workflow:** W-14 / EC-5
- **Fixtures:** `coreQaUser` + pending episode
- **Steps:** Fire two parallel `POST /api/episodes/{id}/process` via `Promise.all`.
- **Assertions:** Exactly one response is 200; the other is 409 `{error: 'Episode is already being processed'}`.

#### T-012: User at audio-minutes cap sees limit banner and cannot submit
- **Priority:** P1
- **Workflow:** W-6 / EC-18
- **Fixtures:** `coreQaUser` + `setSubscriptionState({status: 'active', tier: 'pro', minutesConsumed: 999})` (or value that blows pro cap)
- **Steps:**
  1. Sign in, goto `/upload`.
  2. Assert "Audio minutes limit reached" banner visible.
  3. Try attaching file — assert Next button stays disabled.
  4. Direct API `POST /api/episodes` with payload → 403.
- **Assertions:** UI banner text present; API returns 403 with message matching `/limit|cap|hours/i`.

#### T-013: Guest package email send is intercepted (no real Resend call)
- **Priority:** P1
- **Workflow:** W-4
- **POMs:** API helper + Resend interceptor
- **Fixtures:** `coreQaUser`, `seededCompletedEpisode` with guest_name
- **Steps:**
  1. Install `page.route('**/api.resend.com/**', r => r.abort())`.
  2. POST `/api/episodes/{id}/guest-package` with `{guestEmail: 'captured@test.local'}`.
  3. Observe: if RESEND_API_KEY is configured, response should indicate success (mocked) OR a known error; if unconfigured, 503.
- **Assertions:** NO network request reached `api.resend.com` (inspect `page.on('request')`). Either success or documented 503 is accepted.
- **Flakiness risk:** Depends on env state — architect allows either outcome to pass as long as no outbound Resend call fires.

#### T-014: Regenerate show notes (does not break episode state)
- **Priority:** P1
- **Workflow:** W-5
- **POMs:** `EpisodeDetailPage`
- **Fixtures:** `coreQaUser`, `seededCompletedEpisode`
- **Steps:** Click Regenerate on Show Notes tab; accept confirm if shown; wait for loader dismiss with timeout 30s.
- **Assertions:** Episode status remains `completed`; show_notes content is non-empty after action completes. If Regenerate posts to a backend endpoint that is currently "501 not implemented", test documents the contract as-is (passes if UI doesn't crash).

#### T-015: Process status GET returns well-shaped response during processing
- **Priority:** P1
- **Workflow:** W-8
- **POMs:** API helper
- **Fixtures:** `coreQaUser` + pending episode
- **Steps:** POST `/api/episodes/{id}/process` then immediately GET `/api/episodes/{id}/process`.
- **Assertions:** GET returns 200 with `{runId, status, createdAt, updatedAt}` shape. `status` is one of `pending|processing|completed|failed`.

#### T-016: Episode polling resumes after navigate away and back
- **Priority:** P1
- **Workflow:** W-8
- **POMs:** `EpisodeDetailPage`
- **Fixtures:** `coreQaUser` + a seeded `processing` episode
- **Steps:**
  1. Goto `/episodes/{id}` → assert status badge visible.
  2. Goto `/episodes` → wait for episode list.
  3. Goto back to `/episodes/{id}`.
  4. Assert status badge still visible, no console errors about polling.
- **Assertions:** Page re-mounts cleanly; no unhandled error.

#### T-017: Guest package handles episode with no guest_name (fallback to "Guest")
- **Priority:** P1
- **Workflow:** W-13
- **POMs:** API helper
- **Fixtures:** `coreQaUser` + completed episode with `guest_name = null`
- **Steps:** GET `/api/episodes/{id}/guest-package`.
- **Assertions:** Status 200; `data.package` exists; `data.episode.guest_name` is null.

### P2 — Nice-to-haves (3 tests)

#### T-018: Upload wizard preserves queue across Step 1→2→Back
- **Priority:** P2
- **Workflow:** (from upload-wizard.spec.ts P1-3 pattern — strengthened for core flow)
- **POMs:** `UploadWizardPage`
- **Fixtures:** `coreQaUser`
- **Steps:** Attach file; click Next; click Back; assert queue label still says "Add more files".
- **Assertions:** Queue preserved.

#### T-019: Upload accepts URL-import source and creates episode without browser Storage upload
- **Priority:** P2
- **POMs:** `UploadWizardPage`
- **Fixtures:** `coreQaUser`
- **Steps:** Switch to URL Import tab; add a URL; submit through Step 2 and 3; expect episode row with `audio_url` equal to the URL.
- **Assertions:** Episode row's `audio_url` starts with `https://` and matches input.

#### T-020: Invalid file type (text/plain) is rejected by /api/upload with 400
- **Priority:** P2
- **POMs:** API helper (direct POST, no browser)
- **Fixtures:** `coreQaUser`
- **Steps:** POST `/api/upload` with `{fileName:'x.txt', fileSize: 1000, mimeType: 'text/plain'}`.
- **Assertions:** 400 with error message containing "Invalid file type".

## 5. Test File Organization

```
app/test/e2e/
├── flows/
│   └── core-paid-flow.spec.ts          # NEW — T-001..T-020
├── pages/
│   ├── upload-wizard-page.ts           # EXTEND
│   └── episode-detail-page.ts          # EXTEND
├── helpers/
│   ├── core-paid-flow-api.ts           # NEW
│   └── resend-intercept.ts             # NEW
└── fixtures/
    └── core-paid-flow.ts                # NEW — coreQaUser, seededCompletedEpisode, twoUserContext
```

## 6. Execution Priority Order

1. **P0 — 10 tests** (T-001 to T-010) — MUST pass for flow to be declared BULLETPROOF.
2. **P1 — 7 tests** (T-011 to T-017) — should pass; any failure is a bug to investigate but not a blocker.
3. **P2 — 3 tests** (T-018 to T-020) — nice to have.

## 7. Test Data Requirements

- Audio fixture: `app/test/fixtures/test-podcast-clip.mp3`
- Test user email pattern: `test-core-qa-<tag>-<random>@test.local`
- Test show name: `[CORE-QA] Test Show <random>`
- Test episode titles: prefixed with `[CORE-QA]`
- Cleanup: all `[TEST]*` + `[CORE-QA]*` entries cascade via `cleanupTestDataByPattern()` in `afterAll`.

## 8. Flakiness Risks

- **T-001 (upload):** Real Supabase Storage — ~2–5 s RTT; use a generous `waitForURL` timeout of 30 s.
- **T-005 (ZIP download):** Uses `page.waitForEvent('download')` — must be set up BEFORE clicking. If click races the event, test flakes. Mitigation: create the download promise first, then click.
- **T-007 (webhook token):** Skips if env var missing — document the skip reason loudly.
- **T-013 (Resend intercept):** Env-dependent outcome. Architect accepts 200 (mocked) or 503 (unconfigured) as long as no outbound request fires.
- **T-011 (concurrent 409):** `Promise.all` on two process dispatches — inherently a race. Retry logic: if both return 200, the atomic claim code is BROKEN and the test correctly fails; this is a real-bug detector.

## 9. Out of Scope

- Webhook dispatch for `episode.completed` to user-registered URLs (W-15) — requires spinning up a capture server; deferred to a separate webhook-specific spec. Noted as coverage gap in the scribe report.
- Real AssemblyAI transcription path (would require 2–4 min per run).
- Real xAI asset generation quality (covered by LLM-judge suite in other spec).
- Circuit breaker open-state test (W-9) — requires module-level state injection; added as follow-up.

## 10. Open Questions

None. Plan is executable as-is.

---

**Handoff summary:**
- POMs: 2 existing to extend, 2 new helpers
- Test cases: **10 P0 + 7 P1 + 3 P2 = 20 total**
- Fixtures: 3 new (coreQaUser, seededCompletedEpisode, twoUserContext)
- Flakiness mitigations: download-event-first ordering, env-aware skips for webhook secret, documented Resend env-state tolerance
- Critical path: T-001 through T-010

NEXT STEP: qa-engineer implements the tests.
