# Test Plan: Authentication & Row-Level Security

**Status:** Draft
**Author:** qa-architect (executed in-process by qa-council)
**Date:** 2026-04-18
**Related:** `specs/features/auth-and-rls-analysis.md`

## 1. Overview

This plan covers two distinct test layers:

1. **E2E auth page tests (Playwright)** — extend `app/test/e2e/flows/auth-edge-cases.spec.ts` and add a new `auth-advanced.spec.ts` covering registration, forgot-password, oauth/email-confirm callbacks, redirect preservation, and cookie attributes. Tests that already exist (invalid-credential toast, unauth redirect, session clear) are **preserved as-is** and NOT reimplemented.
2. **RLS correctness tests (Vitest, integration)** — a new `app/test/integration/rls/auth-and-rls.test.ts` that uses real `@supabase/supabase-js` clients against the live Supabase project (`itnzbdojxvbhuxnwqgzg`) to verify cross-user isolation on all 16 public tables, service-role bypass, and the BUG #23/#26 regression guards.

Test data is prefixed `[AUTH-QA]` and torn down in `afterAll`. No real email is sent — Supabase internal emails are fine in the test project; the app's own Resend-backed emails are not exercised by auth flows.

## 2. Page Object Models

### LoginPage (NEW)
- **File:** `app/test/e2e/pages/login-page.ts`
- **Responsibility:** Encapsulate selectors and actions on `/login`.
- **Selectors (encapsulated):**
  - `emailInput` → `page.getByLabel(/email/i)`
  - `passwordInput` → `page.getByLabel(/^password$/i)`
  - `submitButton` → `page.getByRole('button', { name: /^sign in$/i })`
  - `googleButton` → `page.getByRole('button', { name: /continue with google/i })`
  - `magicLinkButton` → `page.getByRole('button', { name: /send me a magic link/i })`
  - `forgotPasswordLink` → `page.getByRole('link', { name: /forgot password/i })`
  - `registerLink` → `page.getByRole('link', { name: /create one/i })`
  - `magicLinkSentHeading` → `page.getByRole('heading', { name: /check your email/i })`
- **Methods:**
  - `async goto(redirect?: string)` — navigates to `/login` (optionally with `?redirect=...`)
  - `async login(email, password)` — fills + submits the email/password form
  - `async requestMagicLink(email)` — fills email, clicks magic link button
  - `async expectOnPage()` — asserts URL is `/login*`

### RegisterPage (NEW)
- **File:** `app/test/e2e/pages/register-page.ts`
- **Responsibility:** `/register` encapsulation.
- **Selectors:**
  - `emailInput` → `page.getByLabel(/email/i)`
  - `passwordInput` → `page.getByLabel(/^password$/i)`
  - `confirmInput` → `page.getByLabel(/confirm password/i)`
  - `submitButton` → `page.getByRole('button', { name: /create account/i })`
  - `mismatchInlineError` → `page.getByText(/passwords do not match/i)`
  - `checkEmailHeading` → `page.getByRole('heading', { name: /check your email/i })`
- **Methods:**
  - `async goto()`
  - `async register(email, password, confirm)`

### ForgotPasswordPage (NEW)
- **File:** `app/test/e2e/pages/forgot-password-page.ts`
- **Responsibility:** `/forgot-password` encapsulation.
- **Selectors:**
  - `emailInput` → `page.getByLabel(/email/i)`
  - `submitButton` → `page.getByRole('button', { name: /send reset link/i })`
  - `genericSuccess` → `page.getByText(/if an account exists with this email/i)`
- **Methods:**
  - `async goto()`
  - `async request(email)`

## 3. Fixtures

No new Playwright fixtures needed — existing `app/test/e2e/fixtures/base.ts` provides the `test` object and the mock-data guard. Tests that need a second independent user create them inline via the existing `createTestUser` / `deleteTestUser` helpers.

For the Vitest RLS tests, a minimal `makeAnonClientFor(user)` helper logs a Supabase anon client in via `signInWithPassword` and returns the client — no external fixture file required.

## 4. Test Cases

### E2E — page-level

#### T-001 (P0) — Happy-path email+password login
- **Workflow:** W-1
- **File:** new `app/test/e2e/flows/auth-advanced.spec.ts`
- **POM:** LoginPage
- **Steps:** create user, goto /login, login, expect URL `/episodes`
- **Assertions:** URL matches `/episodes`; session cookie count > 0.

#### T-002 (P0) — Happy-path registration
- **Workflow:** W-2
- **POM:** RegisterPage
- **Steps:** goto /register, fill unique email + 10-char password + matching confirm, submit, wait for "Check your email" heading, cleanup auth user in afterAll
- **Assertions:** `checkEmailHeading` visible; URL still `/register`; no cookies set (not yet confirmed).
- **Cleanup:** `deleteTestUser` via admin API (email is under `[AUTH-QA]` prefix).

#### T-003 (P0) — Register: short password blocked client-side
- **Workflow/Edge:** EC-5
- **POM:** RegisterPage
- **Steps:** goto /register, fill 6-char password, submit; expect toast + NO call to Supabase (URL unchanged, no "Check your email" state).
- **Assertions:** URL stays `/register`; `checkEmailHeading` NOT visible.

#### T-004 (P0) — Register: mismatched passwords blocked
- **Workflow/Edge:** EC-6
- **POM:** RegisterPage
- **Steps:** fill two different passwords each >=8, submit; assert the inline "Passwords do not match." appears and URL unchanged.

#### T-005 (P1) — Forgot-password: generic success for unknown email
- **Workflow:** W-3, EC-8
- **POM:** ForgotPasswordPage
- **Steps:** goto /forgot-password, enter `does-not-exist-<uid>@test.local`, submit, expect `/if an account exists/i` message.

#### T-006 (P1) — Forgot-password: generic success for existing email
- **Workflow:** W-3
- **POM:** ForgotPasswordPage
- **Steps:** uses a real `[AUTH-QA]` user; same message expected (no leak).
- **Assertions:** Message is *indistinguishable* from T-005 response.

#### T-007 (P0) — /auth/callback error path (no code)
- **Workflow:** W-12
- **Steps:** `await page.goto('/auth/callback')`; expect final URL `/login?error=auth-callback-error`.
- **Assertions:** URL matches `/login` with `error=auth-callback-error`.

#### T-008 (P0) — /auth/callback sanitizes non-relative `next`
- **Workflow:** W-13, EC-10
- **Steps:** `await page.goto('/auth/callback?next=https://evil.com')` — since there is no code, we end up at login error URL regardless; the sanitization path is more directly covered by code review. We assert the browser never navigates to evil.com.
- **Assertions:** Final URL host is the same as `baseURL` (localhost), NOT `evil.com`.

#### T-009 (P0) — /auth/confirm error path with bad token
- **Workflow:** W-14, EC-12
- **Steps:** `await page.goto('/auth/confirm?token_hash=invalid&type=signup')`; expect `/login?error=invalid-link`.

#### T-010 (P1) — Redirect preservation: login sends user back to original path
- **Workflow:** W-15
- **POM:** LoginPage
- **Steps:** unauthed, goto `/settings` → bounced to `/login?redirect=/settings`. Login via email/password → expect URL `/settings`.

#### T-011 (P1) — Signed-in user hitting /login bounces to /episodes
- **Workflow:** W-10
- **Steps:** sign in; goto /login; expect final URL `/episodes`.

#### T-012 (P1) — Session cookies are HttpOnly + SameSite=Lax
- **Workflow:** EC-20 (defense)
- **Steps:** sign in; read cookies from `context.cookies()`; for every `sb-*` cookie, assert `httpOnly === true` AND `sameSite === 'Lax'`.

#### T-013 (P0) — Unauthed API probe returns 401 with opaque body
- **Workflow:** W-5
- **Steps:** `context.request.get('/api/shows')` (no cookies since a fresh anon context) → expect status 401, body `{ data: null, error: 'Unauthorized' }`.

#### T-014 (P0) — Cross-user API probe returns 404 (enumeration-safe)
- **Workflow:** W-6, EC-16
- **Steps:** create users A + B; B creates a show via admin; A signs in through the UI; A makes `GET /api/shows/<B's show id>` via `page.request` (inherits cookies) → expect 404 with body `{ error: 'Show not found' }`.

### Vitest — RLS layer

#### T-015 (P0) — RLS SELECT: user A cannot read user B's rows on every user-scoped table
- **File:** `app/test/integration/rls/auth-and-rls.test.ts`
- **Steps:**
  1. In `beforeAll`: create users A and B via admin; create B-owned: show, episode, episode_section, generated_asset, correction, vocabulary_term, hosting_connection, subscription, webhook, guest_appearance, pre_interview_cache, team_member (A as owner, B as member to seed the table but NOT making A a member of B's team — keep isolated), and insert a users row for each.
  2. For each of the 14 user-scoped tables, use anonClient signed in as A to SELECT; assert empty result.
  3. For `taddy_podcast_cache` and `taddy_episode_cache`: SELECT returns rows (shared cache) — assert data length >= 0 with no RLS error.

#### T-016 (P0) — RLS INSERT: user A cannot insert rows owned by user B
- **Steps:** Same setup; for each table, attempt INSERT of a row with `user_id = B.id` (or an owner-chain pointing to B's show/episode) — expect error (code 42501 or PostgrestError with message mentioning RLS).

#### T-017 (P0) — RLS UPDATE: user A cannot update user B's rows
- **Steps:** Same setup; for each table, UPDATE against B's row as A — expect no rows affected (data is `[]`), no error, OR 42501.

#### T-018 (P0) — RLS DELETE: user A cannot delete user B's rows
- **Steps:** Same setup; DELETE target set to B's row as A — expect no rows affected; row still exists when queried as admin.

#### T-019 (P0) — BUG #23 regression: authenticated user cannot INSERT into taddy_podcast_cache
- **Steps:** Signed in as user A (anon client), attempt INSERT into `taddy_podcast_cache` with a fresh `taddy_uuid`; expect PostgrestError (RLS denies). Admin client can still insert.

#### T-020 (P0) — BUG #23 regression: authenticated user cannot UPDATE taddy_episode_cache
- **Steps:** Admin inserts a row into `taddy_episode_cache`; as user A attempt UPDATE → expect 0 rows / RLS error.

#### T-021 (P0) — Service-role bypass: admin client can read every user-scoped table
- **Steps:** Admin client performs SELECT on every user-scoped table after B's seed data exists; expect rows returned regardless of user_id filter.

#### T-022 (P1) — `verifyShowOwnership` returns false for cross-user show id
- **Steps:** Call the util with (B's show id, A's user id) — but since it's a server-side helper that relies on the server Supabase client, this test runs in Node/Vitest against a direct Supabase client as A; functionally equivalent to T-015 on the shows table. We fold this into T-015 as a sub-assertion rather than a standalone test to avoid duplication.

#### T-023 (P1) — Team-shared-shows policy: active member can SELECT owner's shows
- **Steps:** Seed: user B (owner) has show S; `team_members` row with `owner_user_id=B`, `member_user_id=A`, `status='active'`. As user A, SELECT from `shows` — expect to see S.
- **Negative:** Same but `status='pending'` → A should NOT see S.

#### T-024 (P2) — `auth_rls_initplan` performance regression guard
- **Note:** This is a performance warning that's been resolved via migration `20260415223000_rls_auth_uid_initplan.sql`. A true perf test would need pgstats. Instead, this test queries `pg_policies` via admin client and asserts every policy's `qual` and `with_check` strings use the `(SELECT auth.uid())` form, not raw `auth.uid()`.
- **Selector:** direct `admin.rpc` or raw SQL — since `execute_sql` RPCs aren't available through the JS client by default, we use a REST query against `pg_policies` via `admin.from('pg_policies')` — but `pg_policies` isn't exposed on REST. **Decision:** Mark T-024 as P2 and execute via a separate check that compares the migration file content against a known list. If pg_policies access is not possible through the anon+service REST layer, we skip this test and document it in the coverage-gap section.

## 5. Test File Organization

```
app/test/
├── e2e/
│   ├── flows/
│   │   ├── auth-edge-cases.spec.ts      [existing — preserved]
│   │   └── auth-advanced.spec.ts        [NEW — T-001 through T-014]
│   ├── pages/
│   │   ├── login-page.ts                [NEW]
│   │   ├── register-page.ts             [NEW]
│   │   └── forgot-password-page.ts      [NEW]
│   └── helpers/
│       └── auth.ts                      [existing — extended if needed]
└── integration/
    └── rls/
        └── auth-and-rls.test.ts         [NEW — T-015 through T-023 (+T-024 if feasible)]
```

## 6. Execution Priority Order

1. T-001, T-002, T-003, T-004, T-007, T-008, T-009, T-013, T-014 (E2E P0) — must pass before ship.
2. T-015 through T-021 (RLS P0) — the bulletproof gate.
3. T-005, T-006, T-010, T-011, T-012, T-023 (P1) — important additions.
4. T-024 (P2) — optional regression check.

Total: 9 E2E P0 + 7 RLS P0 + 6 P1 + 1 P2 = **23 tests** (24 including the optional pg_policies guard).

## 7. Test Data Requirements

- **Two isolated test users** per RLS test, created via `admin.auth.admin.createUser({ email_confirm: true })` with emails `[AUTH-QA]-a-<uid>@test.local` / `[AUTH-QA]-b-<uid>@test.local`.
- **One full ownership chain per user** (show → episode → episode_section + generated_asset + correction + vocabulary_term + pre_interview_cache + guest_appearance).
- **Direct user_id tables** (hosting_connections, subscriptions, webhooks, team_members) seeded with minimal required columns.
- **Cleanup** in `afterAll`: delete both users via admin → cascade ON DELETE handles most; `cleanupTestDataByPattern()` sweeps any `[TEST]`-prefixed rows as a safety net. Add a similar sweep for `[AUTH-QA]` prefix (we'll extend the existing helper or filter by email pattern).

## 8. Flakiness Risks

- **T-002 Registration** — Supabase signup triggers an internal confirmation email. In a noisy environment, rate limiting could kick in. Mitigate by using a single unique email per run.
- **T-012 Cookie attributes** — cookie names have changed across Supabase SSR versions; grep pattern `sb-*` is resilient but may pick up non-session cookies. Filter by `cookie.name.startsWith('sb-')`.
- **T-023 Team-shared-shows** — relies on the policy `Team members access shows` being correctly defined. If the live DB is out of sync with migrations, this can false-fail. The pipeline-log records migrations 1-13 applied to the live project, so we assume they're present.
- **RLS tests** — small chance of flakiness if the live DB has stale data. All tests filter by freshly-created IDs, so this is minimal.

## 9. Out of Scope

- Real Google OAuth round-trip — see analysis §10.
- Resend email delivery / template rendering — see analysis §10.
- Password-reset completion (updating password after clicking reset link) — see analysis §10.
- CSRF cross-origin POST — covered by SameSite=Lax assertion (T-012).
- HIBP password rejection on signUp — requires sending a known-compromised password to the live project which has HIBP enabled; doing so to verify the rejection is low-value (tests Supabase, not our code) and pollutes the auth audit log. Out of scope.

## 10. Open Questions

None. Architect proceeded with the orchestration-provided defaults where the analysis was silent (email prefix, test-user tag, chosen Supabase project).
