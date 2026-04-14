# Sentinel Audit — Show Creation

**Feature:** `show-creation`
**Sentinel:** qa-sentinel
**Date:** 2026-04-09

## Verdict: **PASS ✅** (with minor warnings)

No critical blockers. Tests may proceed to the Healer phase.

## Files Audited

- `app/test/e2e/flows/show-creation.spec.ts` (241 lines)
- `app/test/e2e/pages/show-creation-page.ts` (147 lines)

## Critical Findings

**None.** All critical checks pass:

- ✅ No raw CSS/XPath selectors in the test file (verified via grep). The POM owns all `#show-name`, `#show-description`, `#show-language` ID selectors — which is where they belong.
- ✅ Every test has at least one `expect()` assertion. Count: 13 assertions across 7 tests.
- ✅ No hardcoded credentials. Test users are generated at runtime via `createTestUser()` with random UUIDs in email addresses.
- ✅ No `page.waitForTimeout()` calls in either file.
- ✅ No `force: true` click invocations.
- ✅ All test data (users, shows) uses the `[TEST]` prefix so `cleanupTestDataByPattern()` will catch any strays.
- ✅ `afterAll` cleanup explicitly deletes the test user via `admin.auth.admin.deleteUser()` — the pattern helper only cleans shows, not auth records.

## Warnings

### W1 — P0-3 mutates state mid-describe (medium severity)

**File:** `show-creation.spec.ts:136-140`

```ts
const admin = getAdminClient()
await admin.from('shows').delete().eq('user_id', testUser.id)
await page.reload()
```

The P0-3 test deletes shows created by P0-2 to reset the empty-state precondition. This couples the test to the execution order of the describe block — if P0-3 runs before P0-2, it's a no-op but harmless; if they run in parallel (Playwright workers > 1), the delete races with P0-2's insert.

**Mitigation already in place:** `playwright.config.ts:24` sets `workers: 1`, so parallelism is disabled for this suite. This is safe for now.

**Recommendation:** Move the cleanup into a `test.beforeEach` so each P0 test starts with zero shows, making the tests order-independent. Not blocking.

### W2 — `signIn` helper depends on middleware redirect (low severity)

**File:** `show-creation.spec.ts:71-73`

`await page.waitForURL(/\/episodes/, { timeout: 10_000 })` relies on the Next.js middleware redirecting to `/episodes` after login. If the middleware changes to a different default route (e.g. `/upload`), every test will break with the same symptom.

**Recommendation:** After the waitForURL, also assert the sidebar is visible as a belt-and-braces check. Optional.

### W3 — `showSelectorButton()` uses an overly permissive filter (low severity)

**File:** `show-creation-page.ts:44-49`

```ts
return this.page
  .locator('button')
  .filter({ hasText: /Create your first show|Select Show|.+/ })
  .first()
```

The `.+` alternative will match literally any button on the page. This method is not actually called by any test (tests use `openDialogFromEmptyState` / `openDialogFromDropdown` helpers directly), but keeping a dead-code locator is a trap for future authors.

**Recommendation:** Either delete `showSelectorButton()` or tighten the regex to match the real two labels only. Not blocking.

## Info / Recommendations

- **I1:** Consider adding `data-testid="create-show-dialog"` to the Radix Dialog root in `create-show-dialog.tsx` and `data-testid="sidebar-show-selector"` to the button in `sidebar.tsx:216`. The Analyst flagged this as a gap. Tests work without it but would be slightly more resilient.
- **I2:** P1-3 (race condition during submit) from the plan is NOT implemented in the spec file. It's genuinely hard to exercise deterministically without request interception. Acceptable omission — flag in the Scribe report.
- **I3:** P2-3 (form input preservation after error) from the plan is NOT implemented. Simple to add — low priority.

## Summary

The Engineer produced well-structured code that follows the existing project conventions in `test/e2e/flows/`. The POM cleanly encapsulates all selectors, assertions are meaningful, and cleanup is thorough. Two of ten planned tests are missing (P1-3 race, P2-3 input preservation) but that is documented for the Scribe, not hidden.

**Proceed to Healer phase.**
