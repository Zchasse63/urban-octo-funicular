# QA Council Report — Show Creation

**Feature:** `show-creation`
**Date:** 2026-04-09
**Pipeline version:** v1 (first run)

## TL;DR

**Outcome: ✅ PASS — 8 of 8 tests green after 3 Healer iterations.**

This was the inaugural run of the QA Council pipeline, executed against the
newly-built `CreateShowDialog` feature from this morning's refactor. The
pipeline surfaced two distinct problems — one in the test infrastructure,
one in the POM — and the Healer fixed both without surfacing any real
application bugs. Total wall-clock time from Analyst to Scribe: roughly
15 minutes.

## Tests Produced

| Priority | Planned | Implemented | Passing |
|---|---|---|---|
| **P0** (critical smoke) | 3 | 3 | **3 / 3** ✅ |
| **P1** (important) | 4 | 3 | **3 / 3** ✅ |
| **P2** (nice-to-have) | 3 | 2 | **2 / 2** ✅ |
| **Total** | **10** | **8** | **8 / 8** ✅ |

### Coverage Gaps

Two planned tests were intentionally omitted and documented:

- **P1-3: Dialog does not close during submit.** Exercising a true race
  condition reliably requires request interception via `page.route()`; not
  worth the complexity for a single regression guard. Defer.
- **P2-3: Form input preserved after error.** Straightforward to add in a
  follow-up but not P0 for this smoke suite.

## Bugs Discovered

**None.** Both Healer iterations were test-code or test-infrastructure
fixes, not application defects.

## Audit Findings

The Sentinel returned **PASS** on the first Engineer output. Three warnings
were logged:

- **W1** (P0-3 mutates state mid-describe) — unresolved; acceptable because
  `workers: 1` in playwright.config.ts prevents parallelism.
- **W2** (signIn relies on middleware redirect) — unresolved; would
  improve robustness to also assert sidebar visibility, but not blocking.
- **W3** (overly permissive `showSelectorButton` locator) — **incorrectly
  flagged as dead code.** In fact the method was used indirectly via
  `openDialogFromDropdown`, which is what caused the Iteration 2 failure.
  **Sentinel prompt should be tightened** to not assume code is dead just
  because no test directly calls a method — check indirect callers.

## Healing Timeline

| Iteration | Status | Root cause | Fix |
|---|---|---|---|
| 1 | 0/8 pass | Port collision with another local project ("Meridian — Studio OS") running on :3000. Playwright `reuseExistingServer: true` connected to the wrong app. | Added `PLAYWRIGHT_BASE_URL` env-var support to `playwright.config.ts` with `webServer` auto-start skipped when it's set. Ran tests against PodBrain on :3100. |
| 2 | 5/8 pass | `ShowCreationPage.openDialogFromDropdown` used an overly broad `getByRole('button', { name: /.+/ }).first()` locator that matched an unrelated button. The dropdown never opened. | Rewrote the POM method to take a required `currentShowName` parameter and match the show selector by that specific text. Updated P1 tests to pass the seeded show name. |
| 3 | **8/8 pass ✅** | — | — |

## Files Created

### Test artifacts
- `app/test/e2e/flows/show-creation.spec.ts` (268 lines)
- `app/test/e2e/pages/show-creation-page.ts` (132 lines)

### Pipeline artifacts
- `specs/features/show-creation-analysis.md` — Analyst output
- `specs/plans/show-creation-test-plan.md` — Architect output
- `specs/audits/show-creation-audit.md` — Sentinel output
- `specs/healing/show-creation-healing-log.md` — Healer iteration log
- `specs/reports/show-creation-report.md` — This report

### Infrastructure changes
- `playwright.config.ts` — Added `PLAYWRIGHT_BASE_URL` override + conditional `webServer` auto-start

## Recommendations

1. **Tighten the Sentinel prompt.** W3 was a false negative — the method *was* used, just indirectly. The prompt should instruct the Sentinel to grep for method call sites (not just direct usages in test files) before flagging code as dead.

2. **Add `data-testid="sidebar-show-selector"`** to `sidebar.tsx:216`. The POM currently matches the show selector button by the accessible name (which includes the show name), meaning tests must know the show name in advance. A stable testid would simplify the POM and future tests.

3. **Run the pipeline on `upload-wizard`** next. The upload pipeline was the other critical fix from this session and has zero e2e coverage. The direct-to-storage flow is complex enough that E2E coverage is high-value.

4. **Fix existing stale e2e tests.** `test/e2e/flows/show-management.spec.ts` references a `/shows` page and "Create" button that no longer exist in this UI. Either delete or update. Same audit should apply to the other files in `test/e2e/flows/`.

5. **Move port handling into `.env.test`.** Hardcoding `http://localhost:3100` in the healing docs is fine for this one-off run, but repeatable runs need the port encoded in a committed env file or npm script.

## Sign-off

- **Analyst:** ✅
- **Architect:** ✅
- **Engineer:** ✅
- **Sentinel:** ✅ (PASS with 3 warnings)
- **Healer:** ✅ (3 iterations, 0 bugs)
- **Scribe:** ✅ (this report)

**Pipeline status: COMPLETE ✅**
