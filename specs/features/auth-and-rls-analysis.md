# Feature Analysis: Authentication & Row-Level Security

**Status:** Draft
**Author:** qa-analyst (executed in-process by qa-council)
**Date:** 2026-04-18
**Target:** http://localhost:3001
**Source files:**
- `app/src/app/(auth)/login/page.tsx`
- `app/src/app/(auth)/register/page.tsx`
- `app/src/app/(auth)/forgot-password/page.tsx`
- `app/src/app/auth/callback/route.ts`
- `app/src/app/auth/confirm/route.ts`
- `app/src/lib/supabase/middleware.ts`
- `app/src/lib/supabase/client.ts`
- `app/src/lib/supabase/server.ts`
- `app/src/lib/auth.ts`
- `app/middleware.ts`
- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/20260226000000_auth_rls_policies.sql`
- `supabase/migrations/20260226100000_taddy_cache.sql`
- `supabase/migrations/20260226200000_webhooks.sql`
- `supabase/migrations/20260226300000_team_features.sql`
- `supabase/migrations/20260415220000_taddy_cache_rls_hardening.sql`
- `supabase/migrations/20260415223000_rls_auth_uid_initplan.sql`

## 1. Overview

Authentication is implemented using Supabase Auth via `@supabase/ssr`. Three public auth pages (`/login`, `/register`, `/forgot-password`) rely on a client-side `createClient()` helper that calls `supabase.auth.signInWithPassword`, `signUp`, `signInWithOAuth({ provider: 'google' })`, `signInWithOtp` (magic link), and `resetPasswordForEmail`. Two server-side callback routes (`/auth/callback` for OAuth / magic link / reset, `/auth/confirm` for email OTP confirm) exchange the code/OTP for a session and redirect.

Session refresh and protected-route enforcement live in `app/src/lib/supabase/middleware.ts`, invoked by the root `app/middleware.ts` on every request. The middleware redirects unauthenticated users off protected page routes to `/login?redirect=<path>` and returns a 401 JSON body for unauthenticated API routes. A short list of public paths (`/`, `/login`, `/register`, `/forgot-password`, `/auth`, `/api/stripe/webhooks`, `/api/webhooks`, `/api/auth`, legal pages, `*/rss`) bypasses the auth gate.

Inside API routes, `requireAuth()` extracts the Supabase user and throws `'Unauthorized'` (translated to 401 by `handleApiError`) if absent. `verifyShowOwnership(showId, userId)` returns a boolean used by mutating routes to decide between 404 and continue — the project has standardized on 404 (not 403) for cross-user access attempts to prevent enumeration.

At the database layer, RLS is enforced on all 16 public tables. Ownership is modeled in three patterns: direct `user_id = auth.uid()` (users, shows, hosting_connections, subscriptions, webhooks, guest_appearances, pre_interview_cache, team_members), transitive via `shows` (episodes, vocabulary_terms, experts), or transitive through `episodes -> shows` (episode_sections, generated_assets, corrections). The taddy cache tables (`taddy_podcast_cache`, `taddy_episode_cache`) are intentionally read-shared across authenticated users; writes were hardened in migration `20260415220000_taddy_cache_rls_hardening.sql` by dropping the permissive INSERT/UPDATE policies (service_role still bypasses RLS, so app-code writes via admin client continue to work). Migration `20260415223000_rls_auth_uid_initplan.sql` wraps `auth.uid()` in `(SELECT auth.uid())` across all re-evaluating policies to get per-query caching instead of per-row — the Supabase `auth_rls_initplan` performance advisory is now clean.

## 2. Source Code Map

| File | Responsibility |
|------|----------------|
| `app/src/app/(auth)/login/page.tsx` | Email+password form, Google OAuth button, magic link request, error toasts via `sonner` |
| `app/src/app/(auth)/register/page.tsx` | Account creation with password-length + confirm-match client checks, Google OAuth, "email sent" confirmation state |
| `app/src/app/(auth)/forgot-password/page.tsx` | Password reset email request, always-success confirmation message (does NOT leak whether email exists) |
| `app/src/app/auth/callback/route.ts` | OAuth/magic-link/reset callback: exchange `code` → session, validate that `next` is relative, redirect |
| `app/src/app/auth/confirm/route.ts` | Email OTP confirmation (`verifyOtp({ type, token_hash })`) |
| `app/src/lib/supabase/middleware.ts` | `updateSession()` — refresh session cookies, enforce protected routes, return 401 on API / redirect on pages, bounce signed-in users off `/login` and `/register` |
| `app/src/lib/supabase/client.ts` | Browser-side `createClient()` |
| `app/src/lib/supabase/server.ts` | Server-side `createClient()` |
| `app/src/lib/auth.ts` | `getAuthUser()`, `requireAuth()`, `verifyShowOwnership()`, `verifyEpisodeOwnership()` |
| `app/middleware.ts` | Delegates to `updateSession()`; also sets Sentry transaction name |
| `supabase/migrations/20260226000000_auth_rls_policies.sql` | Drops permissive default-user policies from initial schema; introduces `auth.uid()`-based policies on users/shows/episodes/sections/assets/corrections/vocabulary/hosting/subscriptions |
| `supabase/migrations/20260226100000_taddy_cache.sql` | Creates cache + guest-appearance + pre-interview tables and initial RLS |
| `supabase/migrations/20260226200000_webhooks.sql` | webhooks table, `Users manage own webhooks` policy |
| `supabase/migrations/20260226300000_team_features.sql` | team_members table, owners-manage/members-view policies, team-shared-shows SELECT |
| `supabase/migrations/20260415220000_taddy_cache_rls_hardening.sql` | Drops `WITH CHECK (true)` INSERT/UPDATE policies on taddy_*_cache (BUG #23 fix) |
| `supabase/migrations/20260415223000_rls_auth_uid_initplan.sql` | Wraps all `auth.uid()` calls in `(SELECT auth.uid())` for initplan caching (BUG #26 fix) |

## 3. Selector Inventory

Selectors are stable and follow React `label[for=...]` + `<input id=...>` conventions. All verified by reading source.

### Login — Email input
- **Role/Type:** input[type=email]
- **Selector:** `page.getByLabel(/email/i)` (label: "Email", for="email")
- **Source:** `app/src/app/(auth)/login/page.tsx:192-207`
- **Purpose:** Primary credential for email+password login
- **States:** enabled, disabled (during submit), required

### Login — Password input
- **Role/Type:** input[type=password]
- **Selector:** `page.getByLabel(/^password$/i)`
- **Source:** `app/src/app/(auth)/login/page.tsx:210-234`
- **States:** enabled, disabled, required

### Login — Submit button
- **Role/Type:** button[type=submit]
- **Selector:** `page.getByRole('button', { name: /^sign in$/i })`
- **Source:** `app/src/app/(auth)/login/page.tsx:237-244`

### Login — Google OAuth button
- **Selector:** `page.getByRole('button', { name: /continue with google/i })`
- **Source:** `app/src/app/(auth)/login/page.tsx:148-177`

### Login — Magic link button
- **Selector:** `page.getByRole('button', { name: /send me a magic link/i })`
- **Source:** `app/src/app/(auth)/login/page.tsx:248-260`

### Login — Forgot-password link
- **Selector:** `page.getByRole('link', { name: /forgot password/i })`
- **Source:** `app/src/app/(auth)/login/page.tsx:218-223`

### Login — Register link
- **Selector:** `page.getByRole('link', { name: /create one/i })`
- **Source:** `app/src/app/(auth)/login/page.tsx:263-270`

### Login — Error toast (sonner)
- **Selector:** `page.locator('[data-sonner-toast]')` (fallback: `page.getByText(error.message)` after submit)
- **Source:** `sonner` library renders into a portal at document root

### Register — Email / Password / Confirm-Password inputs
- **Selectors:**
  - `page.getByLabel(/email/i)`
  - `page.getByLabel(/^password$/i)`
  - `page.getByLabel(/confirm password/i)`
- **Source:** `app/src/app/(auth)/register/page.tsx:162-223`

### Register — Create account button
- **Selector:** `page.getByRole('button', { name: /create account/i })`
- **Source:** `app/src/app/(auth)/register/page.tsx:227-233`

### Register — "Check your email" confirmation
- **Selector:** `page.getByRole('heading', { name: /check your email/i })`
- **Source:** `app/src/app/(auth)/register/page.tsx:84`

### Register — Passwords mismatch inline error
- **Selector:** `page.getByText(/passwords do not match/i)`
- **Source:** `app/src/app/(auth)/register/page.tsx:219-223`

### Forgot-password — Email input
- **Selector:** `page.getByLabel(/email/i)`
- **Source:** `app/src/app/(auth)/forgot-password/page.tsx:96-111`

### Forgot-password — Send reset link button
- **Selector:** `page.getByRole('button', { name: /send reset link/i })`
- **Source:** `app/src/app/(auth)/forgot-password/page.tsx:114-121`

### Forgot-password — Always-success message
- **Selector:** `page.getByText(/if an account exists with this email/i)`
- **Source:** `app/src/app/(auth)/forgot-password/page.tsx:54-56` — **critical: the copy is present-unconditional, so presence on screen is the success marker; absence + a toast indicates the Supabase client rejected the email format before even hitting the server**

## 4. Workflows

### Workflow W-1: Happy-path email+password login
- **Preconditions:** A confirmed user exists with known credentials.
- **Steps:**
  1. User navigates to `/login` → login form renders.
  2. User fills Email and Password.
  3. User clicks Sign in → `supabase.auth.signInWithPassword` succeeds → `router.push(redirectTo)` → middleware sets session cookies → `/episodes` renders.
- **Postconditions:** Session cookies `sb-*` present on browser context; `/episodes` rendered.
- **Assertions:** URL matches `/\/episodes/`; session cookie count > 0.

### Workflow W-2: Happy-path registration
- **Preconditions:** Email not already registered.
- **Steps:**
  1. Navigate to `/register`, fill Email + Password + Confirm.
  2. Click Create account → `supabase.auth.signUp` → "Check your email" state appears.
- **Postconditions:** Confirmation email would be sent (Supabase emails — intercepted at Resend in this project).
- **Assertions:** "Check your email" heading visible; URL still `/register`.

### Workflow W-3: Happy-path password reset request
- **Preconditions:** Any email (existing or not).
- **Steps:**
  1. Navigate to `/forgot-password`, fill Email.
  2. Click Send reset link → "Check your email" screen with always-success message.
- **Assertions:** `/if an account exists with this email/i` visible (does NOT leak existence).

### Workflow W-4: Protected-page redirect when unauthenticated
- **Preconditions:** No session cookies on context.
- **Steps:**
  1. Navigate to `/episodes` → middleware returns 302 to `/login?redirect=/episodes`.
- **Assertions:** URL contains `/login`; `redirect` query param equals `/episodes`.

### Workflow W-5: Protected-API 401 when unauthenticated
- **Preconditions:** No cookies.
- **Steps:**
  1. `GET /api/shows` → 401 `{ data: null, error: 'Unauthorized' }`.
- **Assertions:** Status 401; JSON body shape `{ data: null, error: 'Unauthorized' }`.

### Workflow W-6: Cross-user API access returns 404 (no enumeration)
- **Preconditions:** Two users A and B. B owns a show.
- **Steps:**
  1. Signed in as A, `GET /api/shows/<B's show id>` → 404 `{ error: 'Show not found' }`.
- **Assertions:** Status 404 (NOT 403), body does not include B's show data, does not confirm existence.

### Workflow W-7: RLS blocks direct Supabase read across users (DB layer)
- **Preconditions:** Users A and B. B owns a show S.
- **Steps:**
  1. Using a Supabase client authenticated as A, `SELECT * FROM shows WHERE id = S.id` → empty result (RLS masks).
- **Assertions:** `data.length === 0` AND no error (RLS silently filters).

### Workflow W-8: Service-role client bypasses RLS
- **Preconditions:** Any data.
- **Steps:**
  1. Admin client (`SUPABASE_SERVICE_ROLE_KEY`) reads/writes any row regardless of user_id.
- **Assertions:** Insert/select succeeds.

### Workflow W-9: Session clear mid-flight → next protected nav redirects
- **Preconditions:** Signed-in browser context.
- **Steps:**
  1. Clear cookies via `context.clearCookies()`.
  2. Navigate to `/settings` → middleware redirects to `/login`.
- **Assertions:** URL contains `/login`.

### Workflow W-10: Signed-in user hitting `/login` or `/register` → redirected to `/episodes`
- **Preconditions:** Session cookies present.
- **Steps:**
  1. `GET /login` → middleware redirects to `/episodes`.
- **Assertions:** URL matches `/episodes`.

### Workflow W-11: OAuth callback success path
- **Preconditions:** A valid `code` parameter (in real Google flow).
- **Steps:**
  1. `GET /auth/callback?code=<code>&next=/episodes` → `exchangeCodeForSession(code)` → redirect to `${origin}/episodes`.
- **Assertions:** 302 to `/episodes`.
- **Test scope:** E2E for real Google is out of scope; we test the error path.

### Workflow W-12: OAuth callback error path (bad code / missing)
- **Steps:**
  1. `GET /auth/callback` (no code) → redirect to `/login?error=auth-callback-error`.
  2. `/login?error=auth-callback-error` triggers `toast.error('Authentication failed...')`.
- **Assertions:** Final URL is `/login?error=auth-callback-error`.

### Workflow W-13: OAuth callback `next` parameter sanitization
- **Steps:**
  1. `GET /auth/callback?next=https://evil.com` → `next` reset to `/episodes` because it doesn't start with `/`.
- **Assertions:** No open redirect; only relative paths honored.

### Workflow W-14: Email OTP confirmation (/auth/confirm)
- **Steps:**
  1. `GET /auth/confirm?token_hash=xxx&type=signup` → `verifyOtp` → redirect to `/episodes`.
  2. Invalid token → redirect to `/login?error=invalid-link`.
- **Assertions:** Error path redirects with query param; toast fires on login page.

### Workflow W-15: Signed-in user is returned to redirect path after login
- **Steps:**
  1. Unauthed, navigate to `/upload` → bounced to `/login?redirect=/upload`.
  2. Login succeeds → `router.push(redirectTo)` where `redirectTo = searchParams.get('redirect') ?? '/episodes'` → `/upload`.
- **Assertions:** Final URL is `/upload`.

### Workflow W-16 (error): Invalid password → error toast, no navigation
- Covered by existing `auth-edge-cases.spec.ts`.

### Workflow W-17 (error): Nonexistent email → same generic error (no email-existence leak)
- Covered by existing `auth-edge-cases.spec.ts`.

## 5. Loading, Empty, and Error States

- **Loading (login):** `isLoading` disables submit; `Loader2` icon inside button.
- **Loading (magic link):** `isMagicLinkLoading` disables button.
- **Loading (google):** `isGoogleLoading` disables button.
- **Registration email-sent state:** full swap to "Check your email" card — no form.
- **Forgot-password email-sent state:** "Check your email" card with generic message.
- **Login error (query param):** `useEffect` fires `toast.error` on mount with `error=auth-callback-error` or `invalid-link`.

## 6. Edge Cases

- **EC-1:** Login with wrong password → Supabase returns error; toast shown; URL unchanged. *(existing test)*
- **EC-2:** Login with nonexistent email → same error shape; must not confirm that the email is absent. *(existing test)*
- **EC-3:** Login with email for unconfirmed account → Supabase returns an `Email not confirmed` error (assuming `confirm_email` is enabled at the project level).
- **EC-4:** Login with HIBP-compromised password — Supabase project has HIBP enabled (per MEMORY.md and launch report). Sign-UP with `password123` should fail; LOGIN with an existing compromised password still works (HIBP only gates creation / password change).
- **EC-5:** Register with short password (< 8) → client blocks with toast "Password must be at least 8 characters".
- **EC-6:** Register with mismatched confirm → client blocks; inline "Passwords do not match." visible.
- **EC-7:** Register with email already registered → Supabase returns `User already registered`; toast surfaces; no enumeration-mitigation at Supabase layer (this is a known Supabase default — not something the app can fix).
- **EC-8:** Forgot-password with nonexistent email → UI still says "If an account exists with this email…" (Supabase default) — no leak.
- **EC-9:** Forgot-password with malformed email → `supabase.auth.resetPasswordForEmail` throws `Email is invalid`; UI shows toast.
- **EC-10:** `/auth/callback` with `next=https://evil.com` → reset to `/episodes` (source line 11-13).
- **EC-11:** `/auth/callback` without `code` → redirect to `/login?error=auth-callback-error`.
- **EC-12:** `/auth/confirm` with tampered `token_hash` → `verifyOtp` returns error → redirect to `/login?error=invalid-link`.
- **EC-13:** Direct DB query as user A for user B's row → RLS filters it to empty (SELECT) or rejects (INSERT/UPDATE/DELETE).
- **EC-14:** Direct DB query against taddy_podcast_cache INSERT as authenticated user (not service_role) → should FAIL now (post BUG #23 fix), because the `WITH CHECK (true)` policy is dropped.
- **EC-15:** Direct DB query against taddy_podcast_cache SELECT as authenticated user → still succeeds (shared cache is intentional).
- **EC-16:** API `GET /api/shows/<uuid owned by other user>` → 404 (enumeration-safe).
- **EC-17:** API `GET /api/shows/not-a-uuid` → 400 (`isValidUUID` gate).
- **EC-18:** Session token tampered → `supabase.auth.getUser()` returns null → middleware treats as unauth.
- **EC-19:** Email with unicode / very long / SQL injection → Supabase client rejects invalid formats; server does not crash.
- **EC-20:** CSRF / cross-site POST with stolen cookie — Supabase cookies are SameSite=Lax by default, which blocks top-level cross-site POSTs from `evil.com` to our API routes. Out of scope for an automated E2E (browser behavior) but verified by inspecting cookie attributes.
- **EC-21:** Magic link reuse after consumed — Supabase invalidates the token; our `/auth/callback` returns error → `/login?error=auth-callback-error`.
- **EC-22:** OAuth state parameter tampering — Supabase enforces state verification internally during `exchangeCodeForSession`; a tampered code returns an error which we redirect to the error URL.
- **EC-23:** Login page reachable when already signed in (middleware redirects to `/episodes` now, per `middleware.ts:59-63`).

## 7. Async Behavior

- `signInWithPassword` / `signUp` / `resetPasswordForEmail` are all async — the forms show `Loader2` and disable the submit button.
- Web-first waits for post-submit: `page.waitForURL(/\/episodes/, { timeout: 10_000 })` on login, or `expect(heading).toBeVisible()` on the email-sent states.
- Supabase RLS-filtered SELECTs return `{ data: [], error: null }` — NOT an error. The test must assert `data.length === 0`.
- RLS-blocked INSERT/UPDATE/DELETE returns `{ data: null, error: { code: '42501', message: 'new row violates row-level security policy…' } }` or similar. The test must assert `error !== null`.

## 8. Data Requirements

- **Two independent test users per RLS test** (user A and user B). Each created via `admin.auth.admin.createUser({ email_confirm: true })`.
- **Each user owns one show** for cross-user RLS tests.
- Clean up via `deleteTestUser()` + `cleanupTestDataByPattern()` in `afterAll`.
- Email prefix: `[AUTH-QA]` per orchestration spec (mapped onto the existing helper's `tag` parameter — we pass `'auth-qa-<subject>'`).

## 9. Security / Config Notes

- HIBP password protection: enabled at Supabase project level — cannot be tested by a direct signUp with `password123` in the live project without risking a real-account-create side effect. Instead we verify the error response when Supabase rejects the password, by asserting that a known-HIBP password returns a specific error.
- Cookies: `@supabase/ssr` sets `sb-*` cookies with `HttpOnly`, `SameSite=Lax`, `Secure` (when HTTPS). Assert in a test.
- Open redirect defense in `/auth/callback`: already validates `next.startsWith('/')`.
- Service-role key is server-only (never shipped to client) — verified by grep for `SUPABASE_SERVICE_ROLE_KEY` in `app/src/app` (must only appear in server files).

## 10. Out of Scope

- Real Google OAuth round-trip (too brittle for automated E2E; only callback error path is tested).
- Real Resend email delivery (intercepted via `installResendBlock`; rendered email templates are not tested here).
- CSRF cross-origin POST from an external domain — requires a second origin in Playwright; `SameSite=Lax` cookie assertion covers the defense.
- Clerk / third-party auth providers — project uses Supabase only.
- Password-reset completion flow (the actual PASSWORD update after clicking the reset link) — the token-consume happens at `/auth/callback`; the reset-confirmation UI is part of `/settings`. Out of scope for this auth-and-rls run; tests cover the request side.

## 11. Open Questions

None. All ambiguity resolved by the source, migrations, and the orchestration assignment.
