# Feature Analysis: Core Paid Flow

**Status:** Reviewed
**Author:** qa-analyst
**Date:** 2026-04-18
**Target:** `http://localhost:3001` — `/login` → `/upload` → `/episodes/[id]`
**Source files:**
- `app/src/components/upload/upload-wizard.tsx`
- `app/src/components/episodes/episode-detail.tsx`
- `app/src/app/api/upload/route.ts`
- `app/src/app/api/episodes/route.ts`
- `app/src/app/api/episodes/[id]/process/route.ts`
- `app/src/app/api/episodes/[id]/assets/route.ts`
- `app/src/app/api/episodes/[id]/assets/download/route.ts`
- `app/src/app/api/episodes/[id]/guest-package/route.ts`
- `app/src/app/api/webhooks/assemblyai/route.ts`
- `app/src/lib/webhooks/dispatcher.ts`
- `app/src/lib/email/service.ts`
- `app/src/lib/email/resend-client.ts`
- `app/src/lib/email/processing-notification.ts`
- `app/src/lib/tier-limits.ts`
- `app/src/lib/trigger/client.ts`

## 1. Overview

The **core paid flow** is the revenue-critical journey PodBrain sells: an authenticated podcaster uploads an audio file (or URL), provides expert context (show + episode metadata + guest details), selects content style and assets, and within minutes receives a complete deliverable package — show notes, transcript, 30+ AI-generated content assets (Twitter threads, LinkedIn posts, blog articles, newsletters, quote cards, etc.), viral-moment candidates, a guest promotion package with email template, RSS-ready Podcasting 2.0 tags, and a downloadable ZIP of everything.

The journey crosses eight subsystems: Supabase Storage (direct-to-cloud pre-signed upload), Supabase Postgres (episode + assets), Trigger.dev (background job dispatch), AssemblyAI (webhook-based transcription), xAI Grok `grok-4-1-fast` (show-notes + asset generation wrapped in a circuit breaker), Resend (guest-package email — MUST BE INTERCEPTED IN TESTS), Upstash Redis (rate limiting), and an HMAC-signed user-webhook dispatcher.

All routes except public webhooks are gated by `requireAuth()` and RLS (`shows.user_id = auth.uid()`). Tier limits (`canProcessEpisode`, `canGenerateAssetType`) protect the monthly audio-minutes quota and gate Pro/Agency-only asset types.

## 2. Source Code Map

| File | Responsibility |
|---|---|
| `src/components/upload/upload-wizard.tsx` | 3-step wizard (Select Audio → Expert Context → Style & Assets). Uses pre-signed upload URL, creates episode row, dispatches process. |
| `src/app/(app)/upload/page.tsx` | Route wrapper mounting `<UploadWizard/>`. |
| `src/app/api/upload/route.ts` | `POST` → returns signed upload URL, path, token, public URL. Rate-limited (10/min per user). Enforces MIME type + max file size. |
| `src/app/api/episodes/route.ts` | `POST` creates episode row after upload. Tier gate `canProcessEpisode()`. Enforces show ownership. |
| `src/app/api/episodes/[id]/process/route.ts` | `POST`/`GET`/`DELETE`/`PUT` → trigger, poll, cancel, replay processing. Atomic status claim prevents TOCTOU. Rolls back on trigger failure. |
| `src/app/api/episodes/[id]/assets/route.ts` | `GET`/`POST`/`DELETE` assets. Tier gate per asset type. Generates new asset BEFORE deleting old on regenerate (no data loss). |
| `src/app/api/episodes/[id]/assets/download/route.ts` | `GET` — ZIP bundle of all completed assets. 404 if no assets. |
| `src/app/api/episodes/[id]/guest-package/route.ts` | `GET` package data. `POST` sends via Resend (must be intercepted). |
| `src/app/api/webhooks/assemblyai/route.ts` | AssemblyAI callback. Token auth via query param `?token=SECRET`, timing-safe compare. 401 on bad/missing token. |
| `src/lib/webhooks/dispatcher.ts` | Fires `episode.completed` / `episode.failed` / `asset.generated` to user-registered URLs with HMAC-SHA256 signature in `X-PodBrain-Signature` header. Decrypts secret envelope at delivery time. |
| `src/lib/email/service.ts` | `sendGuestPackageEmail()` — calls `resend.emails.send()`. TESTS MUST MOCK. |
| `src/lib/email/processing-notification.ts` | `sendProcessingCompleteEmail()` / `sendProcessingFailedEmail()`. TESTS MUST MOCK. |
| `src/lib/tier-limits.ts` | `canProcessEpisode()` gates minutes; `canGenerateAssetType()` gates Pro/Agency asset types. |
| `src/components/episodes/episode-detail.tsx` | 6-tab workspace. Contains BUG #29 fix (`formatTimestamp(milliseconds)`) and BUG #11-related show-notes rendering. Exposes `[data-testid="episode-detail-tabs"]` + `episode-tab-{id}`. |

## 3. Selector Inventory

All selectors below are **verified against the live DOM** at localhost:3001 via Playwright MCP snapshot.

### Login page (`/login`)

| Element | Selector | Source | Purpose |
|---|---|---|---|
| Email input | `page.getByRole('textbox', { name: 'Email' })` OR `getByLabel(/email/i)` | Login snapshot e26 | Login identifier |
| Password input | `page.getByRole('textbox', { name: 'Password' })` OR `getByLabel(/password/i)` | e31 | Password |
| Sign in button | `page.getByRole('button', { name: /^Sign in$/i })` | e32 | Submit login (existing `signIn()` helper uses this) |
| Magic link button | `getByRole('button', { name: /Send me a magic link/i })` | e33 | Magic link fallback |

### Upload wizard (`/upload`)

Step-shared elements:

| Element | Selector | Notes |
|---|---|---|
| Step indicator labels | `getByText('Select Audio')`, `getByText('Expert Context')`, `getByText('Style & Assets')` | Used as step visibility anchors |
| Next button | `page.getByTestId('upload-next-button')` OR `getByRole('button', { name: /^Continue to / })` | Explicit data-testid since 2026-04 |
| Back button | `page.getByTestId('upload-back-button')` OR `getByRole('button', { name: /^Back$/i })` | data-testid confirmed |
| Submit button | `page.getByTestId('upload-submit-button')` | Label varies: "Start Processing Episode" / "Uploading & Processing…" |

**Step 1 — Select Audio:**

| Element | Selector | Purpose |
|---|---|---|
| File Upload tab | `getByRole('button', { name: /File Upload/i })` | Active by default |
| URL Import tab | `getByRole('button', { name: /URL Import/i })` | Switches input mode |
| Drop zone (empty) | `getByText('Drag & drop audio files')` | Empty-queue state |
| Drop zone (populated) | `getByText('Add more files')` | Queue has ≥1 item |
| Hidden file input | `page.locator('input[type="file"]')` | Attach file via `setInputFiles()` |
| URL input | `getByPlaceholder(/youtube.com\/watch/i)` | URL import field |
| Add to Queue button | `getByRole('button', { name: /Add to Queue/i })` | URL tab submit |
| Queue "Ready" label | `getByText(/Ready to process/i)` | Visible when queue.length > 0 |
| Audio limit banner | `getByText('Audio minutes limit reached')` | Tier gate hit |

**Step 2 — Expert Context:**

| Element | Selector | Purpose |
|---|---|---|
| Show Name input | `getByLabel(/Show Name/i)` — label renders via component `field(label, ...)` | Maps to `expertContext.showName` (first-item only) |
| Episode Title input | `getByLabel(/Episode Title/i)` | `expertContext.episodeTitle` |
| Episode Description | `getByLabel(/Episode Description/i)` (textarea) | `expertContext.description` |
| Guest Name | `getByLabel(/Guest Name/i)` | `expertContext.guestName` |
| Guest Bio / Role | `getByLabel(/Guest Bio/i)` | `expertContext.guestBio` |
| Language select | Near text `/Episode Language/i`, `<select>` with options flag+label | Language choice |
| Topic suggestion chips | `getByRole('button', { name: /^\+ / })` | Click to add predefined topic |
| Topic text input | `getByPlaceholder(/Add topic/i)` | Custom topic input |

**Step 3 — Style & Assets:**

| Element | Selector | Purpose |
|---|---|---|
| Content style cards | `getByRole('button', { name: /Educational|Conversational|Interview|Storytelling|News/i })` | `contentStyle` selector |
| Tone chips | `getByRole('button', { name: /Professional|Casual|Inspirational|Technical|Humorous/i })` | `toneStyle` selector |
| Target audience input | `getByLabel(/Target Audience/i)` | `targetAudience` free text |
| "Select all" assets | `getByRole('button', { name: /Select all/i })` | Check every asset |
| Submit button | `getByTestId('upload-submit-button')` | Confirmed fires `handleFinish` |

### Episode detail (`/episodes/[id]`)

| Element | Selector | Purpose |
|---|---|---|
| Tabs container | `page.getByTestId('episode-detail-tabs')` | Mount confirmation |
| Tab buttons | `page.getByTestId('episode-tab-{id}')` where id ∈ `show-notes, assets, transcript, guest, intelligence, rss-tags` | All 6 confirmed present in DOM |
| Episode title H1 | `page.locator('h1').filter({ hasText: ... })` | Renders real episode title |
| Signal Chain labels | `getByText('Upload')`, `getByText('Transcribe')`, `getByText('Generate')`, `getByText('Ready')` | Processing progress dots |
| Completed badge | `getByText('COMPLETED')` OR `getByText('Completed')` | Status pill |
| Processing badge | `getByText('PROCESSING')` / `getByText(/processing/i)` | When status = 'processing' |
| Failed badge | `getByText('FAILED')` | When status = 'failed' (BUG #10 fix) |
| Duration chip | Time format `/^\d{2}:\d{2}$/` (e.g., "45:30") near signal chain | Duration display |

**Show Notes tab:**

| Element | Selector |
|---|---|
| HTML/MD/TXT format toggles | `getByRole('button', { name: 'HTML' })`, `getByRole('button', { name: 'MD' })`, `getByRole('button', { name: 'TXT' })` |
| Copy button | `getByRole('button', { name: /^Copy$/ })` |
| Export button | `getByRole('button', { name: 'Export' })` |
| Edit button | `getByRole('button', { name: /^Edit$/ })` |
| Regenerate button | `getByRole('button', { name: 'Regenerate' })` |
| Empty state | `getByText('No show notes yet')` |

**Assets tab:**

| Element | Selector |
|---|---|
| Generate All Remaining button | `getByRole('button', { name: /Generate All Remaining/i })` |
| Download ZIP link | `page.locator('a[href*="/api/episodes/"][href$="/assets/download"]')` (only visible when ≥1 asset generated) |
| Per-asset Generate button | `getByRole('button', { name: /^Generate$/ })` within an asset row |
| "Ready" badge | `getByText(/^Ready$/)` inside an asset row |
| Copy / .txt buttons | `getByRole('button', { name: /^Copy$/ })` / `getByRole('button', { name: '.txt' })` per asset |
| Batch progress bar | `getByText(/Generating assets/i)` |

**Transcript tab:**

| Element | Selector |
|---|---|
| Segment count header | `getByText(/\d+ segments?/)` |
| Export SRT button | `getByRole('button', { name: /Export SRT/i })` |
| Segment timestamp | `page.locator('text=/^\\d{2}:\\d{2}$/').first()` (must be `MM:SS` not `MM:00`) |
| Empty state | `getByText('Transcript not yet available')` |

**Guest Package tab:**

| Element | Selector |
|---|---|
| Guest name header | `getByText(/^Dr\. Sarah Lin$/)` (example) or by episode.guest_name |
| Guest bio paragraph | `getByText(/Researcher at MIT/)` |
| Pre-interview intel empty state | `getByText('No guest information yet')` |
| Per-item Generate buttons | `getByRole('button', { name: /^Generate$/ })` (Guest Bio / Post-show Email / Social Mention Copy / Guest Audiogram) |

**Intelligence tab:**

| Element | Selector |
|---|---|
| Unified empty state | `getByText(/Sentiment & engagement analysis/i)` |

**RSS Tags tab:**

| Element | Selector |
|---|---|
| RSS tag panel heading | `getByRole('heading', { name: /RSS Tags/i })` (pending verification) |

## 4. Workflows

### Workflow W-1 — Happy path: File upload → processing → assets ready (P0)

**Preconditions:** User exists with status `active` or `trialing`; at least one show exists; `minutesConsumed` below tier cap; AssemblyAI / xAI / Supabase reachable; Resend **intercepted**.

**Steps:**
1. Sign in → redirect `/episodes`.
2. Navigate `/upload`.
3. Step 1: attach `test/fixtures/test-podcast-clip.mp3` via hidden `input[type="file"]`.
4. Assert queue shows "Ready to process".
5. Click "Continue to Expert Context".
6. Step 2: fill Show Name, Episode Title, Guest Name, Guest Bio. (Optional fields can be left blank.)
7. Click "Continue to Style & Assets".
8. Step 3: keep defaults → click `upload-submit-button`.
9. URL changes to `/episodes/<uuid>` (timeout ≤ 30 s).
10. Verify DB: episode row exists with `audio_url` matching `supabase.co/storage/v1/object/public/episodes/`.
11. Verify DB: episode `status` transitions `pending → processing`.
12. (With real AssemblyAI) — this is where the test should STOP for cost/time reasons and fast-forward by directly seeding the episode to `completed` state.

**Assertions:**
- POST `/api/upload` returned 200 with `{filePath, token, uploadUrl, publicUrl}`
- POST `/api/episodes` returned 201 with `data.id`
- POST `/api/episodes/[id]/process` returned 200
- Episode row has `metadata.processing_run_id`

### Workflow W-2 — Episode detail: 6-tab integrity on a completed episode (P0)

**Preconditions:** Populated episode exists (use `createPopulatedEpisode` factory + add ≥1 generated_asset).

**Steps:**
1. Navigate `/episodes/{id}`.
2. Assert `episode-detail-tabs` visible.
3. Iterate each of 6 tabs: click, assert tab-specific anchor text, run Stoicism regression.
4. Verify Show Notes renders episode.show_notes (markdown or HTML).
5. Verify Transcript timestamps match `MM:SS` format where `M` corresponds to seg.start / 60_000 (BUG #29 guard).
6. Verify Assets tab shows generated count ≥ 1.
7. Verify Download ZIP link is visible (`<a href="/api/episodes/{id}/assets/download" download>`).

### Workflow W-3 — ZIP download of completed assets (P0)

**Preconditions:** Episode with ≥1 `generated_assets` row.

**Steps:**
1. Navigate to Assets tab.
2. Click Download ZIP link (or API fetch `/api/episodes/{id}/assets/download`).
3. Assert response `Content-Type: application/zip`.
4. Assert `Content-Disposition` header has `attachment; filename="...-assets-<ts>.zip"`.
5. Assert body length > 0.
6. Alternate path — same request for episode with zero assets returns 404 `{ error: 'No assets available for download' }`.

### Workflow W-4 — Guest package fetch + email render (P0)

**Preconditions:** Completed episode with `guest_name`. Resend client intercepted/stubbed.

**Steps:**
1. GET `/api/episodes/{id}/guest-package` → 200 with `package.socialPosts`, `package.emailSubject`, `package.emailBody`.
2. POST `/api/episodes/{id}/guest-package` with `{guestEmail: 'guest@example.test'}`.
3. Assert Resend stub was called with: `from` value matches env default; `to = 'guest@example.test'`; subject is non-empty; `html` contains episode title substring.
4. Assert NO real Resend HTTP call went out (monitor network requests; fail on `api.resend.com`).

### Workflow W-5 — Regenerate show notes on completed episode (P1)

**Preconditions:** Completed episode with existing `show_notes`.

**Steps:**
1. Navigate to episode Show Notes tab.
2. Click Regenerate.
3. Confirm dialog (if any) → proceed.
4. Poll backend; expect `show_notes` to change (new content) without dropping existing non-notes content.
5. Assert no 409 ("already exists") surfaces on show-notes regeneration pipeline.

### Workflow W-6 — Tier gate: user hits monthly audio-minutes cap mid-upload (P1)

**Preconditions:** User at 95% of monthly cap (via `setSubscriptionState({minutesConsumed: ...})`).

**Steps:**
1. Navigate `/upload`.
2. Assert `Approaching audio minutes limit` banner visible.
3. Bump user to 100%+.
4. Reload — banner shows "Audio minutes limit reached"; drop zone `onAddFile` is a no-op; Next button remains disabled.
5. Try direct API call POST `/api/episodes` → 403 with message "Audio hours limit reached" (or similar).

### Workflow W-7 — AssemblyAI webhook rejects bad/missing token (P0)

**Preconditions:** `ASSEMBLYAI_WEBHOOK_SECRET` set in env.

**Steps:**
1. POST `/api/webhooks/assemblyai?token=bogus` with valid body → **401 `{error: 'Unauthorized'}`**.
2. POST `/api/webhooks/assemblyai` (no token) → **401**.
3. POST `/api/webhooks/assemblyai?token={CORRECT}` with `{transcript_id: 'missing'}` → 404 "Episode not found".
4. Length-mismatched token (e.g., 1 char) → **401** without a 500 timing leak.

### Workflow W-8 — Processing status polling during processing (P1)

**Steps:**
1. Create episode and trigger processing.
2. GET `/api/episodes/{id}/process` → 200 with `{runId, status: 'processing', processingStep, processingProgress}`.
3. Navigate away (to `/episodes`) then back to `/episodes/{id}` — polling resumes without error.

### Workflow W-9 — xAI circuit breaker tripped (P1)

**Preconditions:** Simulate xAI outage by seeding circuit breaker into "open" state (via cache key) OR by stubbing `callGrok()`.

**Steps:**
1. POST `/api/episodes/{id}/assets` with valid `assetType`.
2. Expect 500 with degradation message (or graceful queued state) — NOT an unhandled exception.
3. Episode status remains safe (not silently flipped to `failed`).

### Workflow W-10 — RLS: cross-user isolation (P0)

**Preconditions:** Two users A and B, each with one show and one episode.

**Steps:**
1. Sign in as A. Attempt GET `/api/episodes/{B-episode-id}` → **404** ("Episode not found").
2. Attempt GET `/api/episodes/{B-episode-id}/assets/download` → **404**.
3. Attempt GET `/api/episodes/{B-episode-id}/guest-package` → **404**.
4. Attempt POST `/api/episodes/{B-episode-id}/process` → **404**.
5. Attempt direct UI navigation `/episodes/{B-episode-id}` → renders "Episode not found" empty state or redirects.

### Workflow W-11 — XSS/SQL injection in title and guest fields (P0)

**Steps:**
1. Create episode with title `<script>alert(1)</script>` and guest_name `Robert'); DROP TABLE episodes;--`.
2. Navigate `/episodes/{id}`.
3. Assert DOM never contains a `<script>` tag with the attack string (must be escaped).
4. Query `episodes` table — row still exists, no SQL injection fired.
5. Guest package GET echoes escaped/sanitized guest name.

### Workflow W-12 — Download ZIP while assets still generating (P1)

**Preconditions:** Episode with 0 `generated_assets`.

**Steps:**
1. GET `/api/episodes/{id}/assets/download` → 404 `{error: "No assets available for download"}`.
2. UI — Download ZIP link is NOT rendered (guarded by `generatedCount > 0`).

### Workflow W-13 — Guest package with no guest data (P1)

**Steps:**
1. Create completed episode with `guest_name: null`.
2. GET `/api/episodes/{id}/guest-package` → 200 (package builds with "Guest" default).
3. POST with valid email — email still sends but addresses "Guest" as fallback.

### Workflow W-14 — Concurrent upload by same user (P1)

**Steps:**
1. Sign in as user A.
2. Fire two parallel `POST /api/episodes/{id}/process` for the same episode.
3. Exactly ONE returns 200; the other returns **409 "Episode is already being processed"** due to atomic TOCTOU-safe status claim.
4. DB shows exactly one `processing_run_id` in metadata.

### Workflow W-15 — Webhook dispatch on episode.completed (P1)

**Preconditions:** User has registered a webhook URL for `episode.completed`.

**Steps:**
1. Register a test webhook with a `test-webhook-server` that captures POST.
2. Fast-forward episode to `completed` (direct DB write triggering the completion pipeline or a targeted fixture).
3. Assert POST arrives at webhook URL with:
   - `Content-Type: application/json`
   - `X-PodBrain-Event: episode.completed`
   - `X-PodBrain-Signature: <hex HMAC-SHA256 of body>`
4. Validate HMAC matches using the shared secret.

### Workflow W-16 — Show-notes markdown does not render BUG #11 regression (P0)

**Preconditions:** Completed episode whose `show_notes` contains `[0:53](0:53)` style broken-link markdown.

**Steps:**
1. Navigate Show Notes tab.
2. Assert rendered DOM does NOT contain literal `[0:53](0:53)` string.
3. Show notes either render as rich markdown (if sanitized HTML present) or escape timestamp links correctly.

## 5. Loading, Empty, and Error States

- **Upload limit-reached banner:** triggered by `usage.audioMinutes.percentage >= 100` → UpgradePrompt banner + disabled file acceptance.
- **Upload limit-approaching banner:** `>= 80 && < 100` → UpgradePrompt warning banner, still accepts files.
- **Processing in flight:** Episode card shows amber pulsing "Transcribe" or "Generate" dot; Signal Chain animates.
- **Episode failed:** Signal Chain step turns red with BUG #10 "FAILED" pill; Transcript tab may show `error_message` from metadata.
- **No-show error:** "No show found. Create a show before uploading." toast on submit if `shows[0]` missing.
- **Assets all generated:** "Generate All Remaining" button disabled with "Generating (x/y)" label during batch.
- **Empty assets:** "0 of 30 assets generated" — Download ZIP hidden; Generate All available.

## 6. Edge Cases

- **EC-1:** File > maxFileSize → 413 from `/api/upload`.
- **EC-2:** Unsupported MIME type → 400.
- **EC-3:** Empty file name → 400.
- **EC-4:** Duplicate submit clicks → `isSubmitting` guard prevents re-entry.
- **EC-5:** Two browser tabs submitting the same queue → second submit creates duplicate episodes but **not** duplicate processing runs (atomic claim).
- **EC-6:** Navigate away during processing — polling stops; returning to `/episodes/{id}` resumes SWR.
- **EC-7:** xAI circuit breaker open → graceful 500 with retry hint.
- **EC-8:** Regenerate on completed episode while another regenerate in flight → second returns 409.
- **EC-9:** Download ZIP with 0 assets → 404 "No assets available".
- **EC-10:** Guest package POST with invalid email → 400 "Invalid email address".
- **EC-11:** AssemblyAI webhook bad token / no token → 401.
- **EC-12:** AssemblyAI webhook delivers for unknown transcript_id → 404.
- **EC-13:** Title with XSS payload → escaped, script never executes.
- **EC-14:** Cross-user access to another episode → 404 (not 403 — opaque).
- **EC-15:** Transcript segments with `start = 0` → renders `00:00` (not `0:00` or `12:00` — BUG #29 regression guard).
- **EC-16:** show_notes containing `[0:53](0:53)` → rendered literally would be BUG #11 regression.
- **EC-17:** Upload with >5 queue items → all items uploaded but expert context only applies to first.
- **EC-18:** User at tier cap clicks upload — file ignored by drop handler (no-op on `addFile`).
- **EC-19:** User's subscription `status = 'trial_expired'` → POST `/api/episodes/[id]/process` returns 403 with upgrade message.

## 7. Async Behavior

- **Pre-signed upload URL:** ~200 ms. Fire `fetch('/api/upload')` → await JSON → `supabase.storage.uploadToSignedUrl()` (browser-direct → Storage). Wait for `uploadError` truthy/falsy.
- **Create episode record:** ~100–300 ms. Await `POST /api/episodes`. If not `.ok`, `safeParseError()`.
- **Trigger processing:** ~400 ms. Await `POST /api/episodes/{id}/process`. Not awaited blockingly from the UI — fire-and-continue.
- **Navigation to `/episodes/{id}`:** `router.push()` immediately after first episode ID resolves.
- **AssemblyAI transcription:** 2–4 min (real). Tests MUST fast-forward by seeding `status='completed'` + transcript rows.
- **xAI asset generation:** 3–10 s per asset. Tests requiring actual output SHOULD stub `callGrok` or run against a pre-seeded episode with existing assets.
- **ZIP download:** 200–800 ms (on-demand `archiver` stream in-memory). No polling; direct `<a download>`.
- **SWR polling of `/api/episodes/{id}/process`:** Every 4 s while `status === 'processing'`. Stops on terminal state.

**Correct waits:** `expect(locator).toBeVisible({timeout: ...})`, `page.waitForURL(/pattern/)`, `expect.poll(() => fetch(...))`. **NEVER** `waitForTimeout`.

## 8. Data Requirements

- **Supabase project:** `itnzbdojxvbhuxnwqgzg` (production project used by dev server per `.env.local`).
- **Test data prefix:** `[CORE-QA]` for shows and `[TEST]` for users (reused from existing `auth.ts` helper).
- **Audio fixture:** `app/test/fixtures/test-podcast-clip.mp3` — 1.3 MB, 2:50 duration.
- **Test users:** Created per-test via `createTestUser('core-qa-<tag>')`; deleted in `afterAll`.
- **Populated episode factory:** Reuse `createPopulatedEpisode({showId})` from `helpers/factories.ts` — already returns a valid `completed` episode matching all 6-tab expectations.
- **Generated assets seeding:** For ZIP download tests, insert one or more rows into `generated_assets` with `asset_type` matching the `UI_ID_TO_DB_TYPE` map (e.g. `linkedin_post`, `twitter_thread`, `blog_post`, `newsletter`, `guest_bio_short`).
- **Webhook registration:** Insert `webhooks` row with `url`, `events: ['episode.completed']`, `secret` (encrypted envelope), `active: true`.
- **Resend interception:** Either `vi.mock('resend')` at import level OR Playwright `page.route('https://api.resend.com/**', route => route.abort())` + server-side module mock — see Test Plan for architect decision.

## 9. Accessibility Notes

- Tab buttons use `data-testid` but also `<button>` semantics with text content — `getByRole('button', {name: ...})` works.
- Form labels use `<label>` tags bound to inputs — `getByLabel()` works.
- Focus management on step transitions: not audited; out of scope for this feature pass (exists in `specs/a11y-color-contrast-followup.md`).
- Download ZIP is an `<a download>` — keyboard-accessible via Enter.

## 10. Out of Scope

- Real AssemblyAI transcription (too slow, too expensive per run).
- Real xAI generation end-to-end (time cost; tests for asset output quality live in LLM-judge suite).
- Buzzsprout/Transistor push (separate integration flow).
- Stripe checkout/portal (covered in `pricing-subscription-refactor` spec).
- Podcast RSS proxy feed.
- Analytics dashboard.

## 11. Open Questions

None blocking. The Architect can proceed.

---

**Handoff summary:**
- Selectors verified: ~80 across 6 surfaces
- Workflows mapped: 16 (8 P0, 7 P1, 1 P2)
- Edge cases: 19 enumerated
- Open questions: 0
- Test fixture: `app/test/fixtures/test-podcast-clip.mp3`
- Resend intercept strategy: module-level mock (see plan)

NEXT STEP: qa-architect builds the prioritized test plan at `specs/plans/core-paid-flow-test-plan.md`.
