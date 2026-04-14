# Sentinel Audit — Episode Detail

**Feature:** `episode-detail`
**Date:** 2026-04-09

## Verdict: **PASS ✅**

No critical issues. Proceed to Healer.

## Files Audited

- `app/test/e2e/flows/episode-detail.spec.ts` (252 lines)
- `app/test/e2e/pages/episode-detail-page.ts` (56 lines)

## Critical Findings

None.
- ✅ No raw CSS/XPath selectors in tests. The POM uses `getByTestId` and `getByText`.
- ✅ 11 assertions across 8 tests.
- ✅ No hardcoded credentials — uses the shared `createTestUser` helper.
- ✅ No `waitForTimeout` or `force: true`.
- ✅ Both fixture episodes use `[TEST]` prefix.
- ✅ Test users deleted in `afterAll` via shared helper.

## Warnings

### W1 — `expectNoStoicism` runs `innerText()` on body (minor)

Grabbing the whole body as text is the right brute-force regression
guard for this specific mock-data bug, but it's slightly expensive. With
only 3 describe blocks and 8 tests, the runtime cost is negligible.
No action needed.

### W2 — P1-4 depends on default format being HTML (minor)

`ShowNotesTab` initializes `notesFormat = 'html'` in state. If a future
refactor changes the default, P1-4 becomes a false pass. Mitigation:
the test assertion text ("HTML version not yet generated") is specific
enough that if the notice ever stops rendering, the test fails.

## Summary

The regression guard design is effective — `expectNoStoicism` will
catch any accidental reintroduction of the MOCK_* constants regardless
of which tab they surface in. Proceed.
