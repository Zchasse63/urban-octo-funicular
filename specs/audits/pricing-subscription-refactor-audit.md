# Sentinel Audit Report: pricing-subscription-refactor

**Sentinel:** QA Sentinel
**Date:** 2026-04-14
**Verdict:** 🚫 PIPELINE BLOCKED — 1 critical issue must be resolved before proceeding.

---

## Summary

| Severity | Count |
|---|---|
| 🚫 CRITICAL (blocking) | 1 |
| ⚠️ HIGH (non-blocking warning) | 2 |
| 🔶 MEDIUM | 2 |
| ℹ️ LOW / INFO | 2 |

---

## 🚫 CRITICAL Issues (Must Fix)

### C-1: P0-2 state restore inside test body — execution order dependency

**File:** `app/test/e2e/flows/pricing-subscription-refactor.spec.ts:61–77`
**Checklist trigger:** "Tests that depend on execution order without setup"

**Problem:**

Test P0-2 sets the shared `testUser` to `trial_expired` state at line 66 and restores it to `trialing` at line 76. However, the restore is **not** inside a `try/finally` block. If the assertion on line 73 (`sub.expectBlockedBanner('trial_expired')`) throws or fails, control exits the test body immediately — the restore on line 76 is never reached. The `testUser` remains in `trial_expired` state for the duration of the test run.

Tests P0-1 and P0-8, which share the same `testUser` and rely on it being in `trialing` state, will then fail because `beforeEach` signs the same user in but does not restore the subscription state.

```typescript
// CURRENT — dangerous: restore skipped on assertion failure
test('P0-2: ...', async ({ page }) => {
  await setSubscriptionState(testUser.id, { status: 'trial_expired', ... })  // line 66
  await page.goto('/episodes')
  await sub.expectBlockedBanner('trial_expired')                               // line 73 — can throw
  await setSubscriptionState(testUser.id, { status: 'trialing' })             // line 76 — NEVER RUNS if line 73 throws
})
```

**Fix — wrap in `try/finally`:**

```typescript
test('P0-2: should show access-blocked banner when trial has expired', async ({ page }) => {
  const sub = new SubscriptionPage(page)

  try {
    await setSubscriptionState(testUser.id, {
      status: 'trial_expired',
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })
    await page.goto('/episodes')
    await sub.expectBlockedBanner('trial_expired')
  } finally {
    // Always restore trialing state so P0-1 and P0-8 see the expected state
    await setSubscriptionState(testUser.id, { status: 'trialing' })
  }
})
```

Also remove the now-unused `const admin = getAdminClient()` on line 63 (see C-1 fix eliminates it).

---

## ⚠️ HIGH Issues (Non-blocking, should fix before merge)

### H-1: P1-6 double sign-in (redundant, slows test)

**File:** `app/test/e2e/flows/pricing-subscription-refactor.spec.ts:449, 454`

The `Tier Limits & Settings [P1]` describe block has a `beforeEach` at line 449 that calls `signIn(page, proUser)`. Test P1-6 then immediately calls `signIn(page, proUser)` again at line 454. This causes two full sign-in round trips for this one test.

```typescript
// beforeEach (line 449)
test.beforeEach(async ({ page }) => {
  await signIn(page, proUser)  // first sign-in
})

// P1-6 (line 454)
test('P1-6: ...', async ({ page }) => {
  const sub = new SubscriptionPage(page)
  await signIn(page, proUser)  // DUPLICATE — remove this line
  ...
})
```

**Fix:** Remove line 454 (`await signIn(page, proUser)`) from the P1-6 test body. The `beforeEach` already handles it.

---

### H-2: P1-9 double sign-in (same issue)

**File:** `app/test/e2e/flows/pricing-subscription-refactor.spec.ts:397, 420`

`Read-Only Access [P1]` has a `beforeEach` at line 397 that calls `signIn(page, testUser)`. Test P1-9 at line 420 calls it again.

```typescript
// beforeEach (line 397)
test.beforeEach(async ({ page }) => {
  await signIn(page, testUser)  // first sign-in
})

// P1-9 (line 420)
test('P1-9: ...', async ({ page }) => {
  const sub = new SubscriptionPage(page)
  await signIn(page, testUser)  // DUPLICATE — remove this line
  ...
})
```

**Fix:** Remove line 420 (`await signIn(page, testUser)`) from the P1-9 test body.

---

## 🔶 MEDIUM Issues

### M-1: Unused variable `const admin = getAdminClient()` in P0-2

**File:** `app/test/e2e/flows/pricing-subscription-refactor.spec.ts:63`

Line 63 declares `const admin = getAdminClient()` inside the P0-2 test body. The variable is never referenced — all state manipulation in that test goes through `setSubscriptionState()` which manages its own admin client internally. This is dead code that will trigger a TypeScript `no-unused-vars` warning.

**Fix:** Delete line 63 (`const admin = getAdminClient()`). Also remove the `getAdminClient` import from line 20 if no other test in this file uses it directly.

**Check first:** `getAdminClient` IS used in the `Episode API Enforcement [P0]` `beforeAll` at line 118 to insert a pending episode directly. So the import must stay — only remove the unused local declaration on line 63.

---

### M-2: CSS ID selector `#pricing` used in test file instead of POM

**File:** `app/test/e2e/flows/pricing-subscription-refactor.spec.ts:211, 237, 248, 260, 268, 276`

`page.locator('#pricing').scrollIntoViewIfNeeded()` is called 6 times directly in the test file. Per project conventions, selectors belong in the Page Object Model. The `#pricing` ID is a stable HTML id on the landing page (`app/src/app/page.tsx:322`), so the selector itself is sound — but it should live in the POM.

**Fix:** Add a scroll helper to `SubscriptionPage` (or create a `LandingPage` POM):
```typescript
// In subscription-page.ts or a new landing-page.ts
async scrollToPricingSection(): Promise<void> {
  await this.page.locator('#pricing').scrollIntoViewIfNeeded()
}
```
Then replace all 6 usages in the spec with `await sub.scrollToPricingSection()`.

This is a style issue, not a functional defect. Tests will pass as-is.

---

## ℹ️ LOW / INFO

### I-1: Unused variable `showId` in `Subscription Banners [P0]`

**File:** `app/test/e2e/flows/pricing-subscription-refactor.spec.ts:31, 35`

`showId` is assigned the result of `createTestShow(testUser.id)` but never referenced in any of the three P0 banner tests (P0-1, P0-2, P0-8). The `createTestShow` call itself is correct and necessary (banner rendering works better when the user has at least one show), but the return value doesn't need to be stored.

**Fix (optional):** Change line 35 from:
```typescript
showId = await createTestShow(testUser.id)
```
to:
```typescript
await createTestShow(testUser.id)
```
And remove the `let showId: string` declaration on line 31.

---

### I-2: `nearingLimitBanner()` method in POM is unused

**File:** `app/test/e2e/pages/subscription-page.ts:111`

Per dead-code detection protocol, searched all of:
- `pricing-subscription-refactor.spec.ts` — no match
- All other spec files in `app/test/e2e/flows/` — no match
- POM file itself — only the definition, no internal delegation

The `nearingLimitBanner()` method (which targets `"You're nearing your plan limits"` text in the Settings page) is defined but not called by any test. This corresponds to a test scenario that was listed in the plan but not implemented in the spec (the "soft limit warning in Settings" case).

**Action:** No fix required — this is a legitimate forward-looking POM method. Downgraded to INFO per dead-code detection protocol. The missing test coverage for the settings soft-limit warning is a documentation gap, not a code bug.

---

## Checklist Pass/Fail

| Criterion | Status |
|---|---|
| No raw CSS/XPath in test assertions | ✅ PASS — ID selector only used for scroll, not assertion |
| No missing assertions | ✅ PASS — every test has at least one `expect()` |
| No hardcoded credentials | ✅ PASS |
| No `page.waitForTimeout()` | ✅ PASS |
| No `force: true` clicks | ✅ PASS |
| No execution-order dependencies | 🚫 FAIL — C-1: P0-2 state restore not in finally block |
| All `[TEST]` prefix on test data | ✅ PASS — all user/episode/show names use `[TEST]` prefix |
| Cleanup in afterAll | ✅ PASS — all 7 describe blocks call deleteTestUser + cleanupTestDataByPattern |
| Selectors in POM | ⚠️ WARN — CSS ID for scroll anchor in test file (M-2) |
| Revenue-critical P0 paths correct | ✅ PASS — P0-3, P0-4, P0-7 correctly assert 403 with error message content |
| State machine transitions handled | ✅ PASS — correct reload after mid-test state change in P1-6 |
| Coverage matches plan | ✅ PASS — 26 tests match all 26 defined in plan tables (plan summary misquotes 27) |

---

## Required Fix (blocking)

The Healer must apply this change to `pricing-subscription-refactor.spec.ts` before tests can be run:

**In test P0-2 (lines 61–77):** Wrap the state mutation and assertion in `try/finally` so the restore always executes. Also remove the unused `const admin = getAdminClient()` from that test.

The HIGH issues (H-1, H-2) should also be fixed by the Healer as they reduce test reliability and speed, though they do not currently block test execution.
