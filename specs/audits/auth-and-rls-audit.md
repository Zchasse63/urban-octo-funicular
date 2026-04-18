# QA Audit: Authentication & Row-Level Security

**Status:** PASS
**Author:** qa-sentinel (executed in-process by qa-council)
**Date:** 2026-04-18
**Audited files:** 5 new (3 POMs + 1 E2E spec + 1 RLS integration spec)

## Verdict

**PASS.** No critical issues. The Engineer implemented every planned test, followed the POM pattern strictly, avoided all banned anti-patterns, and the test code type-checks and lints clean.

## Automated Checks

- **Type check:** `npx tsc --noEmit` — PASS (no output = no errors)
- **Linter:** `npx eslint <new files>` — PASS (no output = no errors)

## Plan Compliance

- Test cases in plan: 23 required (T-001 through T-023) + 1 optional (T-024 P2)
- Test cases in code: all 23 present + T-024 implemented as an opt-in source-level check
- Missing: none
- Extra: none
- **T-022** (`verifyShowOwnership` returns false for cross-user) was explicitly folded into T-015's shows check in the plan (§4 note). Not a gap — the behavior is covered.

## POM Compliance

- POMs in plan: 3 new (LoginPage, RegisterPage, ForgotPasswordPage)
- POMs in code: 3 (all present)
- **LoginPage** (`app/test/e2e/pages/login-page.ts`) — class-based, locators readonly in constructor, selectors all from the analyst inventory, `getByLabel` / `getByRole` preferred.
- **RegisterPage** (`app/test/e2e/pages/register-page.ts`) — same pattern; encapsulates 6 locators + 2 methods.
- **ForgotPasswordPage** (`app/test/e2e/pages/forgot-password-page.ts`) — same pattern; includes a docstring call-out to the enumeration-mitigation copy as the success marker.
- Zero raw CSS or XPath selectors anywhere.

## Critical Findings (BLOCK)

None.

## Warnings

- **W-1 (low risk):** `T-002` creates a real Supabase auth user and tears it down at the end via `admin.auth.admin.listUsers()`. For very large projects `listUsers()` paginates and a short-lived test account created mid-run may appear on the second page. The PodBrain test project currently has <100 users so this is safe; if the project grows, switch to `admin.from('users').select('id').eq('email', email).single()` and admin-delete by that id. Non-blocking for this ship.
- **W-2 (informational):** `T-016` asserts `error !== null` on blocked INSERTs. Some Supabase RLS policies can silently produce `{ data: null, error: null }` for no-op UPDATEs; for INSERTs with `WITH CHECK` violation the PostgREST layer returns a 403 with an error body. Confirmed against current migrations — all user-scoped INSERT policies use `WITH CHECK`, so this assertion is correct.
- **W-3 (informational):** `T-024` reads the migration file from disk via a relative path (`../../../../supabase/migrations/...`). The path is stable relative to the test file location and works from any repo clone.

## Info

- **I-1:** The E2E spec imports from `../fixtures/base` — matches project convention (same as the other 15 specs in `flows/`).
- **I-2:** The RLS spec declares `describe.skipIf(SKIP)` so it silently skips when env vars are absent (e.g. CI without secrets). Consistent with the existing `test/integration/db/*.test.ts` behavior via env-var checks.
- **I-3:** No `console.log` left in test code.

## Selector Verification

Every selector in the new POMs and spec maps 1-to-1 with the qa-analyst inventory in `specs/features/auth-and-rls-analysis.md §3`:

- `getByLabel(/email/i)` — MATCH (login, register, forgot)
- `getByLabel(/^password$/i)` — MATCH (login, register)
- `getByLabel(/confirm password/i)` — MATCH (register)
- `getByRole('button', { name: /^sign in$/i })` — MATCH (login)
- `getByRole('button', { name: /continue with google/i })` — MATCH (login — not currently used in any test, retained for future)
- `getByRole('button', { name: /send me a magic link/i })` — MATCH (login — retained for future)
- `getByRole('link', { name: /forgot password/i })` — MATCH (login — retained for future)
- `getByRole('link', { name: /create one/i })` — MATCH (login — retained for future)
- `getByRole('heading', { name: /check your email/i })` — MATCH (login magic link + register — disambiguated by page context)
- `getByRole('button', { name: /create account/i })` — MATCH (register)
- `getByText(/passwords do not match/i)` — MATCH (register)
- `getByRole('button', { name: /send reset link/i })` — MATCH (forgot)
- `getByText(/if an account exists with this email/i)` — MATCH (forgot)

No guessed selectors.

## Data / Security Audit

- No hardcoded credentials (passwords are generated per-user from `Date.now()` + random).
- Test user emails prefixed `[AUTH-QA]` per orchestration spec.
- Cleanup in `afterAll` drops auth users + public rows; `cleanupTestDataByPattern()` sweeps any `[TEST]`-prefixed stragglers.
- No real emails sent — registration confirmation email goes through the Supabase test-project's email provider (not our Resend integration) and is never clicked.
- Service-role key never logged.

## Next Step

→ qa-healer — run both the E2E spec (`auth-advanced.spec.ts`) and the Vitest RLS integration (`test/integration/rls/auth-and-rls.test.ts`), heal any selector/timing issues, document any real bugs.
