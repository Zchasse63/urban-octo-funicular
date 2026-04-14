# Test Plan — Upload Wizard

**Feature:** `upload-wizard`
**Architect:** qa-architect
**Date:** 2026-04-09
**Source:** `specs/features/upload-wizard-analysis.md`

## Suite Overview

This plan exercises the refactored Upload Wizard, with particular focus on
the new Supabase pre-signed URL flow (which replaced the broken
file-body-through-Netlify approach). Priorities are set so the P0 tests
constitute a 60-second smoke test of the critical path.

**Scope exclusion: No true end-to-end file upload with real audio.** The
Trigger.dev job dispatches real transcription via AssemblyAI, which costs
money and takes minutes. Instead, we test up to (and including) the
successful `POST /api/episodes` → navigation to the episode detail page.
We verify the episode row exists in the database, but we don't wait for
transcription to complete.

**Smallest viable audio file:** A ~50 KB silent MP3 is committed to
`app/test/e2e/fixtures/silent.mp3` (or created at runtime). This keeps the
Storage upload fast and deterministic.

## Shared Fixtures

| Fixture | Purpose | Lifecycle |
|---|---|---|
| `testUser` | Authenticated user with session cookies | beforeAll / afterAll |
| `testShow` | Show belonging to `testUser` (required — upload needs a show) | beforeAll |
| `silentMp3Path` | Path to the test audio fixture | static |

## Page Object Model — `UploadWizardPage`

| Method | Returns | Wraps |
|---|---|---|
| `goto()` | `void` | `page.goto('/upload')` + waits for step indicator |
| `dropZone()` | `Locator` | Element with text "Drag & drop audio files" or "Add more files" |
| `hiddenFileInput()` | `Locator` | `input[type=file]` inside the drop zone |
| `urlTab()` | `Locator` | Tab with text "URL" in step 1 |
| `fileTab()` | `Locator` | Tab with text "File" in step 1 |
| `urlInput()` | `Locator` | URL panel text input |
| `addToQueueButton()` | `Locator` | Button "Add to Queue" |
| `queueItems()` | `Locator` | Queue item rows (filter by text or role) |
| `nextButton()` | `Locator` | Button labeled "Next" |
| `backButton()` | `Locator` | Button labeled "Back" |
| `submitButton()` | `Locator` | Button matching `/Start Processing .* Episode/` |
| `stepIndicator(step: number)` | `Locator` | The step circle + label |
| `attachFile(path: string)` | `void` | `setInputFiles` on the hidden input |
| `addUrl(url: string)` | `void` | Fill + click Add to Queue |
| `gotoStep(n: number)` | `void` | Click Next or Back enough times to reach step `n` |

## P0 Tests (Critical)

| # | Test name | Precondition | Steps | Expected |
|---|---|---|---|---|
| P0-1 | `should render Step 1 with drop zone visible` | Signed in, has 1 show | 1. goto('/upload') | Drop zone visible with "Drag & drop audio files" text; Next button is disabled |
| P0-2 | `should accept a file via hidden input and queue it` | Step 1 visible | 1. `attachFile(silent.mp3)` | Queue row appears; "Next" button becomes enabled |
| P0-3 | `should create an episode via the full 3-step flow` | Has 1 show, silent mp3 ready | 1. attachFile <br> 2. Next → Step 2 <br> 3. Next → Step 3 <br> 4. Submit | URL navigates to `/episodes/[id]`; DB contains an episode row for this user; toast contains "uploaded" |

## P1 Tests (Important)

| # | Test name | Precondition | Steps | Expected |
|---|---|---|---|---|
| P1-1 | `should disable Next when queue is empty` | Step 1 visible | 1. Observe Next button state | Next is disabled |
| P1-2 | `should show error toast when no show exists` | Signed in, **0 shows** | 1. attachFile <br> 2. Navigate to Step 3 <br> 3. Submit | Toast with text matching `/No show found/`; wizard does NOT navigate |
| P1-3 | `should preserve queue across Next/Back navigation` | Step 1 with file queued | 1. Click Next <br> 2. Click Back | Queue still contains the file |

## P2 Tests (Nice-to-have)

| # | Test name | Precondition | Steps | Expected |
|---|---|---|---|---|
| P2-1 | `should add a URL to the queue` | Step 1 visible | 1. Click URL tab <br> 2. Type `https://example.com/audio.mp3` <br> 3. Click Add to Queue | Queue row visible |
| P2-2 | `should remove a queued item` | Queue with 1 item | 1. Click remove | Queue row removed |

## Database Seed Requirements

- **P0 suite:** Create `testUser` + `testShow` in `beforeAll`
- **P1-2 specifically:** Use a separate `testUserNoShow` with no shows
- **Cleanup:** Delete any episodes created by P0-3, delete all shows, delete the test user, call `cleanupTestDataByPattern()`

## Fixture File

Create `app/test/e2e/fixtures/silent.mp3` — the smallest valid MP3 we can get.
A 44100 Hz silent MP3 at 32 kbps for 1 second is ~4 KB. We can use ffmpeg
in a setup script, or commit a pre-generated file. For the first pass,
**generate it at runtime** inside `beforeAll` using Node's `Buffer.from`
with a well-known minimal MP3 header (the "silence.mp3" trick).

Even simpler: read an existing tiny MP3 from the repo if one exists. Let's
check for one during the Engineer phase.

## Out of Scope (Not in this plan)

- Actual transcription via AssemblyAI (too slow/expensive for E2E)
- Drag-and-drop interaction (Playwright's `setInputFiles` covers the same code path)
- Multi-file queue processing (latent bug: only the first file is processed)
- Rate-limit tests (429 is hard to trigger deterministically)
