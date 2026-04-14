# Sentinel Audit — Upload Wizard

**Feature:** `upload-wizard`
**Sentinel:** qa-sentinel
**Date:** 2026-04-09

## Verdict: **PASS ✅** (with 2 warnings)

No critical blockers. Tests may proceed to the Healer phase.

## Files Audited

- `app/test/e2e/flows/upload-wizard.spec.ts` (220 lines)
- `app/test/e2e/pages/upload-wizard-page.ts` (134 lines)

## Critical Findings

**None.**

- ✅ No raw CSS selectors in the test file. The POM owns all locators. The POM uses `page.locator('input[type="file"]')` which is an unavoidable CSS selector for a hidden input that has no accessible role or text — this is the correct place for it.
- ✅ Every test has at least one meaningful `expect()` assertion. Count: **9 assertions across 7 tests** (excluding implicit assertions inside POM helpers).
- ✅ No hardcoded credentials. Test users are generated per-suite via `createTestUser()`.
- ✅ No `page.waitForTimeout()` calls (grep-verified).
- ✅ No `force: true` click invocations.
- ✅ All test data uses the `[TEST]` prefix — `cleanupTestDataByPattern()` will catch strays.
- ✅ Fixture path `test/fixtures/test-podcast-clip.mp3` resolved from `__dirname` — no hardcoded absolute paths.
- ✅ `afterAll` explicitly deletes test users via `deleteTestUser()` (the pattern helper only cleans shows, not auth).
- ✅ P1 tests use isolated users created/destroyed per test to prevent state bleed — a deliberate pattern shift from P0 (which uses a shared user because all three P0 tests are read-only or bounded).

## Warnings

### W1 — P0-3 depends on real Trigger.dev dispatch (medium)

**File:** `upload-wizard.spec.ts:127-142`

P0-3 navigates to `/episodes/[id]` after submit. The submit flow calls `POST /api/episodes/[id]/process` which dispatches a Trigger.dev job. In the test environment, if Trigger.dev is not configured or rejects the dispatch, the wizard code in `handleFinish` catches the error and shows a soft toast ("Episode created but processing could not start"), then STILL navigates. That's correct behaviour — the episode row is created — so the test's URL assertion and DB assertion both pass. BUT if Trigger.dev's behaviour changes (e.g. returns a 500 that the wizard doesn't catch), the test will fail silently on a different code path.

**Mitigation:** The test explicitly checks for the created episode row with `audio_url` matching a Supabase public URL. That's the real contract. If Trigger.dev breaks, the test will still validate that the upload → episode creation path works, which is what we actually care about.

**Recommendation:** Consider intercepting `POST /api/episodes/[id]/process` with `page.route()` in the future to make the test deterministic regardless of Trigger.dev state. Not blocking.

### W2 — `queueItems()` locator uses a speculative attribute selector (low)

**File:** `upload-wizard-page.ts:57-59`

```ts
return this.page.locator('[data-queue-item], [aria-label^="Remove "]')
```

The `data-queue-item` attribute does not exist in the source — it's aspirational. The `aria-label` fallback will work if the remove button has an appropriate aria-label, which I haven't verified. This locator is only used for future tests that aren't in this plan, so it's not exercised by the current suite. Keeping it as dead code is a trap (cf. W3 from the previous feature's audit).

**Recommendation:** Either verify and fix the locator against the real source code, or delete `queueItems()` entirely until a test needs it. Not blocking.

## Info / Recommendations

- **I1:** Consider adding `data-testid="upload-drop-zone"` and `data-testid="upload-submit"` to stabilize the POM. The text-based locators work but are fragile to copy changes.
- **I2:** P2-2 (queue item removal) from the plan is NOT implemented because the remove button doesn't have a reliable locator without source changes. Deferred — document in Scribe report.
- **I3:** The `silentMp3Path` fixture pattern from the test plan was replaced with the existing 1.3 MB `test-podcast-clip.mp3`. That's fine for a first pass but increases test runtime by ~2-3 seconds per test that uploads. A truly silent 4 KB MP3 would be faster.
- **I4:** `signIn` is duplicated between this spec and `show-creation.spec.ts`. Extract to a shared helper in `app/test/e2e/helpers/auth.ts` in a follow-up.

## Summary

The Engineer produced a well-structured test suite with appropriate fixture isolation and cleanup. The biggest risk is the dependency on a real file upload succeeding to Supabase Storage — but that's the feature under test, so it's unavoidable. The 1.3 MB fixture is small enough to keep test runtime reasonable.

**Proceed to Healer phase.**
