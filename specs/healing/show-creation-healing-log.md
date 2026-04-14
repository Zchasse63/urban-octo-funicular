# Healing Log — Show Creation

**Feature:** `show-creation`
**Healer:** qa-healer
**Started:** 2026-04-09

## Iteration 1 — 8 tests failed

### Failure symptom
All 8 tests failed inside the `signIn` helper at `page.waitForURL(/\/episodes/)` — timeout waiting for navigation. The dialog submit appeared to succeed (no explicit error), but the redirect never happened.

### Diagnosis
Inspected `test-results/.../error-context.md` and saw the page snapshot contains:

```
- heading "Meridian" [level=1]
- paragraph: Fitness Studio Operating System
- heading "Sign in"
- paragraph: Invalid email or password.
```

**Root cause:** A different project ("Meridian — Studio OS") is running on port 3000 at the user's machine. `playwright.config.ts` has `webServer.reuseExistingServer: !process.env.CI`, so Playwright detected the port was already in use and **connected to Meridian instead of starting PodBrain**. All 8 tests ran against the wrong app, with test users that don't exist in Meridian's auth system → "Invalid email or password."

This is not a test-code defect and not an application bug. It's a test infrastructure collision. The fix is to run the tests against a dedicated PodBrain port that won't collide.

### Fix
1. Spin up PodBrain on port 3100 in the background (separate from the Meridian server on 3000)
2. Set `PLAYWRIGHT_BASE_URL=http://localhost:3100` via env for the test run
3. Update `playwright.config.ts` to honour `PLAYWRIGHT_BASE_URL` AND skip `webServer` auto-start when that env var is set (so Playwright uses our running server instead of trying to start its own)

### Actions taken
- Updated `playwright.config.ts` to respect `PLAYWRIGHT_BASE_URL` and skip `webServer` auto-start when it is set.
- Started PodBrain on port 3100 manually (`PORT=3100 npm run dev &`).
- Re-ran `PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test test/e2e/flows/show-creation.spec.ts`.

### Result
**5 of 8 tests passed** (all P0, both P2). The 3 failing tests were all in the P1 describe block — all failing at the same line in the POM.

---

## Iteration 2 — 3 P1 tests failed

### Failure symptom
P1-1, P1-2, and P1-4 all failed inside `ShowCreationPage.openDialogFromDropdown` with a 30s timeout on `getByRole('button', { name: /Add new show/i })`.

### Diagnosis
The previous POM implementation tried to find the show selector with an overly broad locator:
```ts
const currentShowButton = this.page
  .getByRole('button', { name: /select show|.+/i })
  .first()
```
The `.+` regex alternative matches ANY button. `.first()` returned an unrelated button (likely the theme toggle or sidebar brand icon), so the dropdown never opened. Confirmed by reading the error-context.md page snapshot — the dropdown was never triggered, the `[TEST] Pre-existing` show was still visible in the sidebar but no "Add new show" button existed in the DOM.

The Sentinel flagged exactly this as warning W3 but didn't block because the method was (supposedly) unused. Turns out it WAS used — W3 was wrong that it was dead code.

### Fix
Rewrote `openDialogFromDropdown` to take a required `currentShowName` parameter and match the sidebar button by that specific name (escaped for regex safety). Updated P1-1, P1-2, P1-4 in the spec file to pass `preExistingShowName` through.

---

## Iteration 3 — ALL 8 tests passed ✅

```
Running 8 tests using 1 worker

✓  P0-1: opens CreateShowDialog when clicking sidebar empty-state button (2.4s)
✓  P0-2: creates a new show end-to-end from the empty state (3.8s)
✓  P0-3: disables submit button when name is empty (2.0s)
✓  P1-1: opens dialog from dropdown "Add new show" button (2.5s)
✓  P1-2: surfaces real API error when free tier limit exceeded (3.7s)
✓  P1-4: shows "Create new show" title when open (2.8s)
✓  P2-1: focuses the name input after open (2.2s)
✓  P2-2: closes the dialog on Escape when idle (1.7s)

8 passed (26.1s)
```

**Total iterations: 3** (well under the 5-iteration budget)
**Regressions surfaced: 0** — all failures were test-infrastructure issues, not application bugs.
**Application bugs discovered: 0**

## Status: RESOLVED
