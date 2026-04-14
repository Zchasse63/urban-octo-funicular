# Healing Log — Upload Wizard

**Feature:** `upload-wizard`
**Healer:** qa-healer
**Started:** 2026-04-09

## Iteration 1 — 7 of 7 tests failed

### Failure symptom
All tests failed on one of two locators that couldn't find their target element:

- `getByRole('button', { name: /^Next/ })` — used for the wizard's step-forward button
- `getByRole('button', { name: /^URL$/ })` — used for the Step 1 URL tab

### Diagnosis
Read `test-results/flows-upload-wizard-Upload-cebe5-ep-1-with-drop-zone-visible-chromium/error-context.md` — the page snapshot revealed the real button labels:

- **"Next" button is actually labeled `"Continue to Expert Context"`** (or `"Continue to Style & Assets"` on step 2). Evidence: `upload-wizard.tsx:1109` — `<span>Continue to {stepLabels[currentStep]}</span>`.
- **URL tab is labeled `"URL Import"`, not `"URL"`**. Evidence: `upload-wizard.tsx:389` — `label: 'URL Import'`.

The Analyst made a documentation error — I wrote the design doc from memory instead of exhaustively grepping the source for every button label. Real button labels that should have been in the selector inventory:
- `Continue to Expert Context` (step 1 Next)
- `Continue to Style & Assets` (step 2 Next)
- `URL Import` (tab)

### Fix
Updated `upload-wizard-page.ts`:
- `nextButton()` → `getByRole('button', { name: /^Continue to /i })` to match both step labels
- `urlTab()` → `getByRole('button', { name: /URL Import/i })`
- `backButton()` → made the regex more precise (`/^Back$/i`) to avoid accidentally matching "Back to Dashboard" or similar

No application changes needed. This was a pure Analyst/Engineer documentation error — the wizard works correctly.

### Result
**5 of 7 tests passed.** Remaining failures:
- P0-3: Full 3-step upload flow times out waiting for navigation
- P2-1: URL tab queue-append assertion fails

---

## Iteration 2 — 2 tests failed

### Failure symptom
- **P0-3:** URL never navigates to `/episodes/[uuid]` after submit. Dev server log shows:
  ```
  POST /api/upload 200 in 1903ms    ← pre-signed URL created OK
  POST /api/episodes 400 in 644ms   ← episode creation 400 Bad Request
  ```
- **P2-1:** After adding a URL to the queue, `getByText('Add more files')` times out (DropZone hidden on URL tab).

### Diagnosis

**P0-3 is a REAL APPLICATION BUG.** Documented in `specs/bugs/upload-wizard-bugs.md` as Bug #1.

Root cause: `upload-wizard.tsx:948-951` posts `description: null`, `guest_name: null`, `guest_bio: null` when context fields are empty. But `CreateEpisodeSchema` in `validation-schemas.ts:56-64` uses `.optional()` for those fields, which accepts `undefined` but NOT `null`. Zod rejects with 400.

This is a pre-existing bug (commits predate this session). It would have blocked any first-time user who skipped the Step 2 context fields — which is almost everyone doing a quick upload. No prior test caught it because no E2E upload-wizard coverage existed.

**P2-1 was an Engineer oversight.** The DropZone's "Add more files" label is only visible on the file tab. After switching to the URL Import tab, the DropZone is not rendered at all — the URL panel takes its place. The test asserted on a label that's only visible in a different tab.

### Fix

1. **Bug #1 (P0-3):** Changed `|| null` → `|| undefined` in `upload-wizard.tsx` for the three affected fields. Added an explanatory comment citing the schema. This is the minimum change and matches how other valid optional fields in the codebase are serialized.

2. **P2-1:** Rewrote the assertion to use `getByText(/Ready to process/)` — a label that appears in the queue header when `queue.length > 0`, regardless of which tab is active. Also kept the `expectNextEnabled` check.

### Result
Need to re-run from `app/` directory (earlier run tried root path which picked up a wrong playwright version).

---

## Iteration 3 — ALL 7 tests passed ✅

```
Running 7 tests using 1 worker

✓  P0-1: renders Step 1 with drop zone visible (2.7s)
✓  P0-2: accepts a file via hidden input and queues it (1.4s)
✓  P0-3: creates an episode via the full 3-step flow (11.2s)
✓  P1-1: disables Next when queue is empty (2.4s)
✓  P1-2: shows error toast when no show exists (3.9s)
✓  P1-3: preserves the queue across Next/Back navigation (2.8s)
✓  P2-1: adds a URL to the queue (2.0s)

7 passed (30.6s)
```

**P0-3 now runs in 11 seconds** — end-to-end including:
- Authenticated wizard load
- File attachment via hidden input
- 3-step navigation
- POST /api/upload → pre-signed URL issued
- Direct-to-Storage upload via `uploadToSignedUrl`
- POST /api/episodes (previously 400, now 201 after bug fix)
- POST /api/episodes/[id]/process → Trigger.dev dispatch
- Navigation to `/episodes/[uuid]`
- DB assertion that an episode row exists with a Supabase public URL

**Total iterations: 3**
**Application bugs discovered and fixed: 1** (Bug #1 — `null` vs `undefined` in CreateEpisodeSchema)
**Bug fixes committed to feature code: 1**

## Status: RESOLVED
