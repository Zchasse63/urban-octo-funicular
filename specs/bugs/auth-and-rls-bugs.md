# Auth & RLS — Bugs Found

**Author:** qa-healer (executed in-process by qa-council)
**Date:** 2026-04-18

## Summary

**Zero production bugs found.** All 62 tests (40 RLS + 14 E2E auth-advanced + 8 pre-existing auth-edge-cases regression) pass against the live Supabase project.

The four healing iterations documented in `specs/healing/auth-and-rls-healing-log.md` were all **test-code fixes**, not application fixes:

1. Supabase rejects emails containing `[`/`]` — had to escape the test email prefix.
2. A source-file SQL-comment regex false match — had to strip `--` comments before scanning.
3. Supabase auth rate-limits on signup/reset — tests now accept both success and rate-limit outcomes while preserving enumeration-safety invariants.
4. Supabase SSR browser-client's auth cookie is intentionally non-HttpOnly — test was rewritten to assert the actually-enforceable CSRF defense (SameSite=Lax + Secure-in-HTTPS).

## Confirmed defenses (now regression-tested)

- `requireAuth()` returns 401 with opaque body for unauthenticated API access.
- `verifyShowOwnership()` returns false on cross-user access; the API layer converts this to **404** (not 403) → no user-id enumeration via the shows API.
- Middleware redirects unauthenticated page-route requests to `/login?redirect=<path>` and 401 for API routes.
- Signed-in users hitting `/login` or `/register` are bounced to `/episodes`.
- `/auth/callback` and `/auth/confirm` redirect to `/login?error=...` on invalid/missing codes.
- `/auth/callback` sanitizes the `next` parameter — non-relative URLs (e.g. `https://evil.com`) are rejected and reset to `/episodes`.
- Forgot-password UX is enumeration-safe: the same generic "If an account exists with this email" copy is shown for both existing and unknown emails.
- Supabase session cookies carry `SameSite=Lax` or `Strict` (CSRF mitigation).
- RLS SELECT isolation verified on all 14 user-scoped tables (shows, episodes, episode_sections, generated_assets, corrections, vocabulary_terms, hosting_connections, subscriptions, webhooks, guest_appearances, pre_interview_cache, experts, users, team_members).
- RLS INSERT/UPDATE/DELETE isolation verified on shows, episodes, webhooks, subscriptions, and team_members.
- **BUG #23 regression guard:** `taddy_podcast_cache` and `taddy_episode_cache` correctly reject INSERT/UPDATE from authenticated (non-service-role) clients. SELECT remains open (intended shared read cache).
- Service-role admin client bypasses RLS on all 12 user-scoped tables (required for background jobs / webhooks).
- **BUG #26 regression guard:** migration `20260415223000_rls_auth_uid_initplan.sql` uses `(SELECT auth.uid())` everywhere (initplan caching).
- Team-members policy: `status='active'` membership grants SELECT on owner's shows; `status='pending'` does not.

## Out-of-scope notes (not bugs, for completeness)

- HIBP password rejection on signup — enabled at the Supabase project level per MEMORY.md and the 2026-04-15 launch-readiness report. Verifying requires posting a known-compromised password to the live project, which has side-effects; left unverified here (low risk — Supabase owns this behavior).
- Real Google OAuth round-trip — out of scope per orchestration spec.
- Password-reset completion flow (setting a new password after clicking the reset link) — out of scope per orchestration spec; this suite covers the request side.
- CSRF cross-origin POST — SameSite=Lax cookies provide the defense; browser-enforced, not automatable without a second origin.
