# Feature Design Document — Upload Wizard

**Feature:** `upload-wizard`
**Analyst:** qa-analyst
**Date:** 2026-04-09

## Overview

The Upload Wizard is a 3-step flow (`/upload`) where users add a new episode: Step 1 picks the audio source (file drop, click-to-browse, or URL paste), Step 2 captures expert context (show name, episode title, description, guest info, language, topics), Step 3 picks content style and assets to generate. Clicking "Start Processing" at the end:

1. POSTs to `/api/upload` to get a Supabase pre-signed upload URL (refactored this session from the old "ship the file body through Netlify" approach)
2. Uploads the file directly to Supabase Storage via `supabase.storage.from('episodes').uploadToSignedUrl(filePath, token, file)`
3. POSTs to `/api/episodes` to create the episode record
4. POSTs to `/api/episodes/[id]/process` to trigger the Trigger.dev job
5. Navigates to `/episodes/[id]`

The entire pre-signed URL flow is new this session and was previously completely broken (all uploads >6 MB hit Netlify's body-size limit silently).

## User Workflows

### Flow A — Upload an MP3 file (happy path)

1. User (signed in, ≥1 show exists) navigates to `/upload`.
2. Step 1 renders the drop zone with "File Upload" tab active by default.
3. User drags an MP3 onto the zone OR clicks the zone to open the system file picker and selects a file.
4. The file appears as a queue row with its name, size, and format badge.
5. "Next" button becomes enabled (`canProceed === true` when `queue.length > 0 && !audioLimitReached`).
6. User clicks Next → Step 2.
7. User optionally fills episode title, description, guest name, topics, language.
8. User clicks Next → Step 3.
9. User picks content style, tone, target audience, and assets (defaults are fine).
10. User clicks "Start Processing Episode".
11. `handleFinish` runs the pre-signed URL flow → direct upload → create episode → trigger processing → navigate to `/episodes/[id]`.
12. Toast success: "Episode uploaded! Processing has started."

### Flow B — URL source (YouTube / RSS / direct link)

1. Step 1, user clicks the "URL" tab.
2. User pastes a URL in the input; the panel auto-detects YouTube/RSS/Direct Link and shows a badge.
3. User clicks "Add to Queue". The URL appears as a queue row (no file metadata).
4. Remaining flow identical to Flow A except `handleFinish` skips the file upload step and uses the URL directly as `audio_url`.

### Flow C — Upload fails because no show exists

1. User has no shows yet. Navigates to `/upload`.
2. Adds a file, fills context, clicks "Start Processing".
3. `handleFinish` hits `const showId = shows[0]?.id` → undefined.
4. Toast error: "No show found. Create a show before uploading."
5. `isSubmitting` is reset to `false` in `finally` (the fix from this session).

### Flow D — Pre-signed URL request fails

1. User on Free tier hits the upload rate limit (10 req/min).
2. `POST /api/upload` returns 429.
3. `safeParseError` extracts "Rate limit exceeded. Please try again shortly."
4. Toast shows that message.
5. Dialog remains usable; `isSubmitting` reset to `false`.

### Flow E — Storage upload fails mid-flight

1. `POST /api/upload` returns the signed URL successfully.
2. The subsequent `supabase.storage.uploadToSignedUrl(...)` throws (network drop, token expired, etc).
3. The caught error bubbles up → toast error → `isSubmitting` reset.
4. User can retry without reloading the page (the "stale closure" bug the QA audit flagged is fixed).

### Flow F — Audio tier limit approaching/reached

1. When `usage.audioHours.percentage >= 80%`, an amber `UpgradePrompt` banner appears above Step 1.
2. When `percentage >= 100%`, a red banner appears AND `addFile`/`addUrl` become no-ops (see `onAddFile={audioLimitReached ? () => {} : addFile}` at line 1078).
3. `canProceed` stays false so Next button is disabled.

## Selector Inventory

| Selector | Element | Purpose |
|---|---|---|
| `input[type=file]` (hidden) | DropZone file input | Accepts real file uploads via Playwright's `setInputFiles` |
| Button with text `Start Processing .+ Episode` | Final submit button | Step 3 primary action |
| Button with text `Next` | Step navigation button | Steps 1 → 2 → 3 |
| Button with text `Back` | Back button | Steps 2 → 1, 3 → 2 |
| Text `Drag & drop audio files` | DropZone placeholder | Stable text anchor for step 1 |
| Text `Add more files` | DropZone (queue non-empty) | Shows file was accepted |
| Text containing `File Upload` | Step 1 tab | Switches to file source |
| Text containing `URL` (in Step 1 tab bar) | Step 1 URL tab | Switches to URL source |
| Text `Add to Queue` | URL panel submit | Adds URL to the queue |
| Queue item `button` (remove) | Queue row delete | Removes a queue item |
| Toast containing `Episode uploaded` or `Upload failed` | Sonner toast | Success/error notification |

**Evidence:**
- `upload-wizard.tsx:299` — the hidden `<input ref={inputRef} type="file">` inside `DropZone`
- `upload-wizard.tsx:1079` — Step 3's `handleFinish` triggered by the submit button text "Start Processing Episode"
- `upload-wizard.tsx:1078` — `<Step1 ... onAddFile={...} />`
- `upload-wizard.tsx:208-211` — URL panel "Add to Queue" button
- `handleFinish` at `upload-wizard.tsx:876-961` — the full pre-signed URL flow

**Gaps:** No `data-testid` anywhere. Step indicator buttons have no stable anchors. The "File Upload" and "URL" tabs are only distinguishable by text — which is reasonable. The "Start Processing" button text is dynamic (`Start Processing ${N > 1 ? 'N Episodes' : 'Episode'}`) so the regex must handle both forms.

## API Endpoints

| Method | Path | Purpose | Success | Errors |
|---|---|---|---|---|
| POST | `/api/upload` | Returns pre-signed upload URL | `200 { filePath, token, uploadUrl, publicUrl }` | 400 validation, 413 too large, 429 rate limit |
| POST to Supabase Storage | `storage/v1/object/upload/sign/episodes/<path>` | Direct browser → Storage upload via `uploadToSignedUrl` | HTTP 200 | Network / 401 token expired / 409 exists |
| POST | `/api/episodes` | Create episode record | `201 { data: Episode }` | 400 validation, 403 tier limit |
| POST | `/api/episodes/[id]/process` | Trigger processing job | `200` | 500 job dispatch failure |

The `/api/upload` route (refactored this session) validates `fileName`, `fileSize`, `mimeType` against `SUPPORTED_AUDIO_FORMATS` and `PROCESSING.maxFileSize` (500 MB). Rate limited 10/min per user.

## Edge Cases and Error States

1. **File too large (>500 MB)** — Client sends size in the pre-signed URL request; server returns 413.
2. **Wrong mime type** (e.g. `.pdf`) — Server returns 400.
3. **Empty queue** — "Next" button is disabled on Step 1 via `canProceed`.
4. **Multiple files** — `DropZone` accepts `multiple`; queue can have N items. `handleFinish` currently only processes `localQueue[0]` — the others are silently discarded. **This is a latent bug but out of scope for this feature.**
5. **URL without `http://`** — `UrlImportPanel.handleSubmit` blocks with error.
6. **Session expired mid-flow** — API calls return 401; `safeParseError` surfaces the message as a toast.
7. **Back navigation preserves state** — `localQueue`, `expertContext`, `styleSelection` are component-level state; survive step navigation but NOT full page reload.
8. **Audio tier limit reached** — `addFile`/`addUrl` are no-ops; upgrade prompt shown.

## Dependencies

- **Auth session** — Required. Middleware redirects to `/login`.
- **At least one Show exists** — Otherwise `handleFinish` fails at the `showId` lookup.
- **Supabase Storage `episodes` bucket** — Must exist. The pre-signed URL token is tied to the bucket.
- **Trigger.dev** — Needed for actual processing but not strictly for the upload flow itself to complete (the upload succeeds, processing failure is surfaced as a soft toast).

## Recommended Test Priorities

### P0 — Critical smoke
1. **Wizard renders Step 1** with file drop zone visible
2. **File attachment via `setInputFiles`** works and creates a queue row (confirms the hidden `<input type=file>` is reachable)
3. **End-to-end upload** with a small test MP3: file → context → style → submit → navigates to `/episodes/[id]` and an episode row exists in the database

### P1 — Important
4. **"Next" button disabled** when queue is empty on Step 1
5. **Error toast when no show exists** — `handleFinish` should surface "No show found" without hanging the submit state
6. **Back/Next step navigation** preserves the queue

### P2 — Nice-to-have
7. **URL source path** — add a URL to the queue, verify queue row appears
8. **File size/format badge** — uploaded MP3 shows "MP3" badge with file size formatted
9. **Queue item removal** — clicking the X removes a queue item
