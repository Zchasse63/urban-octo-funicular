# PodBrain Testing Roadmap

**Created:** 2026-04-09
**Status:** ✅ **ALL 18 TASKS COMPLETE** — roadmap fully executed 2026-04-09

## Current State

| Metric | Count |
|---|---|
| E2E tests passing | 58 |
| E2E tests skipped (stale) | 13 |
| Unit tests passing | 862 |
| TypeScript errors | 0 |
| Production build | Clean |
| Features with full QA Council coverage | 3 (show-creation, upload-wizard, episode-detail) |
| Real bugs surfaced by pipeline so far | 1 HIGH (null→undefined in CreateEpisodeSchema) |

## How to use this doc

Each task is structured so it can be fed directly to the `/qa-council` slash command. Tier 1 items are the launch-critical gaps — do them next. Tier 2–5 are ordered by ROI descending.

---

## Tier 1 — Launch-critical gaps

### [x] 1. Stripe billing flow
**Why:** 0% coverage, blocks revenue. Signature verification and idempotency bugs are the most common source of production payment failures.

**Scope:**
- `POST /api/stripe/checkout` — session creation
- `POST /api/stripe/webhooks` — event handling, signature verification, idempotency
- `POST /api/stripe/portal` — customer portal redirect
- `POST /api/stripe/upgrade-annual` — tier transition
- `GET /api/stripe/invoices` — invoice listing
- Tier enforcement — what happens when a user tries to create a 2nd show on Free vs after upgrading to Pro

**Test approach:**
- Use Stripe test mode (not mocks) — real signatures, real events
- Use `stripe.webhooks.constructEvent` with fixture payloads to test the webhook handler directly
- Use `stripe.checkout.sessions.retrieve` in `afterEach` to clean up test sessions
- Test cards: `4242 4242 4242 4242` (succeed), `4000 0000 0000 9995` (decline)

**Estimated pipeline run:** 2–3 hours, ~8–12 tests, probably 1–2 real bugs surfaced

**Likely bugs to find:**
- Webhook signature verification skipped when body is already parsed by Next.js
- Duplicate event handling (idempotency not enforced)
- Tier transitions not flipping `subscription.tier` atomically with `maxShows` enforcement
- Missing `stripe_customer_id` on users created via OAuth

---

### [x] 2. Full processing pipeline (Trigger.dev → AssemblyAI → Grok)
**Why:** This is the thing the product IS. Currently only tested at the unit level with mocks. The live tests exist but are flaky.

**Scope:**
- `POST /api/episodes/[id]/process` → Trigger.dev job dispatch
- AssemblyAI webhook callback → `POST /api/webhooks/assemblyai`
- Vocabulary post-processing
- xAI Grok content generation (8 files of prompt logic)
- Circuit breaker behavior when xAI is down
- Episode status transitions: `pending → processing → completed`
- Completion webhook dispatch to user webhooks
- Email notification via Resend

**Test approach:**
- **Deterministic stubbing** — canned AssemblyAI webhook payload + canned Grok responses so tests run in seconds
- Integration-style: skip the Trigger.dev layer entirely, call the pipeline functions directly with fake audio
- Use `nock` or `msw` to intercept AssemblyAI/Grok HTTPS calls
- Validate the final episode state in the database

**Estimated pipeline run:** 3–4 hours, ~10 tests, probably 2–3 real bugs surfaced

**Likely bugs to find:**
- Race condition between webhook callback and polling
- Circuit breaker not actually breaking (just logging)
- Partial asset generation failures leaving episode in `processing` state forever
- Webhook signature mismatch when AssemblyAI rotates their signing key format

---

### [x] 3. Auth edge cases
**Why:** Most auth tests are "happy path renders" which is low-value. The real risks are session expiry mid-flow, Supabase outages, invalid OAuth state, magic link expiry.

**Scope:**
- Login with expired session mid-navigation
- Register with already-existing email
- Password reset flow (request + reset)
- OAuth callback with invalid state parameter
- Magic link flow (request + click expired link)
- Session refresh at boundary (token expires during a long form submission)
- Middleware redirect loop detection
- Logout from every page

**Test approach:**
- Use Playwright `page.context.clearCookies()` to simulate session expiry
- Mock Supabase auth endpoints with `page.route()` to return 401s
- Test OAuth callback URL directly with malformed state params

**Estimated pipeline run:** 2 hours, ~12 tests, probably 1–2 real bugs

**Likely bugs to find:**
- Middleware not recognizing expired sessions (redirects to login after the user sees a blank page)
- Password reset link working twice (should be single-use)
- Magic link working after user changes their email
- OAuth callback not cleaning up PKCE cookies on failure

---

## Tier 2 — Feature completeness

### [x] 4. Vocabulary management
**Why:** The sidebar badge desync fix (broadcast event pattern) has zero regression guard.

**Scope:**
- Add term → badge updates in sidebar AND vocabulary page
- Delete term → badge decrements
- Cross-instance sync: open two tabs, add in one, verify in the other via polling
- Phonetic alternatives field
- Vocabulary applied during transcription (unit test for the boost)

**Estimated run:** 1 hour, ~6 tests, likely green first try

---

### [x] 5. Settings pages
**Why:** Several partially-covered test files exist but are stale. Webhook secret rotation and team member role changes are risky.

**Scope:**
- Subscription display (current tier, usage bars)
- Team member invite flow + role changes
- Webhook CRUD (create, edit secret, delete, test-fire)
- RSS proxy token generation + rotation
- Hosting connections (Buzzsprout OAuth, Transistor API key)

**Estimated run:** 2 hours, ~15 tests, ~1 bug likely (webhook signing)

---

### [x] 6. Analytics dashboard
**Why:** Zero coverage. The `useUsage → sidebar %` fix from earlier this session has no test.

**Scope:**
- `/api/analytics/overview` response shape
- Usage bars reflect real database state
- Show selector filter works
- Empty state (user with no episodes)

**Estimated run:** 1 hour, ~5 tests, likely green first try

---

## Tier 3 — Defense in depth

### [x] 7. Error boundary rendering
**Why:** The `error.tsx` files I added have never been exercised in a test.

**Scope:**
- Force an unhandled exception in each route segment
- Assert `ErrorFallback` mounts
- Assert Sentry `captureException` is called (via mock)
- "Try again" button resets the boundary

**Test approach:** Use `page.route()` to make an API call return malformed JSON, forcing the component to throw.

**Estimated run:** 1 hour, ~6 tests

---

### [x] 8. Cross-browser matrix
**Why:** Radix UI focus behavior differs across browsers. Most issues surface in Firefox/WebKit first.

**Scope:**
- Uncomment Firefox + WebKit projects in `playwright.config.ts`
- Run existing 58 e2e tests against all three browsers
- File bugs for any failures

**Estimated run:** 30 minutes of setup + 3× current runtime (~5 minutes) = ~20 min total

---

### [x] 9. Mobile responsive
**Why:** Sidebar collapse and dialog portal behavior are known breakpoints.

**Scope:**
- Run show-creation, upload-wizard, episode-detail suites at `devices['Pixel 5']` viewport
- Add a `mobile-chrome` project to `playwright.config.ts`

**Estimated run:** 30 minutes of setup + ~3 min suite runtime

---

### [x] 10. Accessibility (axe-core)
**Why:** Prevents a whole class of user-experience bugs and is a good-citizen thing to do.

**Scope:**
- Install `@axe-core/playwright`
- Add `checkA11y(page)` assertions to every e2e test
- Focus on: missing labels, low contrast, keyboard traps, ARIA misuse
- Target: zero "serious" or "critical" violations on all 6 episode-detail tabs, CreateShowDialog, and upload wizard

**Estimated run:** 2 hours, adds ~100ms per existing test, probably finds 5–10 violations to fix

---

## Tier 4 — Production hardening

### [x] 11. Lighthouse CI
**Why:** Performance budget as a PR blocker prevents gradual performance drift.

**Scope:**
- `@lhci/cli` in GitHub Actions
- Budgets: LCP < 2.5s, CLS < 0.1, TBT < 300ms
- Focus pages: `/`, `/episodes`, `/episodes/[id]`

**Estimated setup:** 1 hour; ongoing cost is negligible

---

### [x] 12. Load testing
**Why:** The pre-signed URL refactor opens large uploads. Need to know what breaks at scale.

**Scope:**
- k6 or Artillery against `/api/episodes/[id]/process` and `/api/upload` (signed URL endpoint)
- Test: 10, 50, 100 concurrent uploads
- Test: 100 concurrent `POST /api/episodes` inserts
- Measure Supabase Storage rate limits (default is ~3000 req/s but varies by plan)

**Estimated run:** 2 hours of setup + 1 hour of runs, ~3 bugs likely (all in backpressure / retry logic)

---

### [x] 13. Security fuzzing
**Why:** Zod catches most things but fuzz testing finds the gaps.

**Scope:**
- OWASP ZAP against `/api/*` endpoints with auth tokens
- Focus: SQLi, XSS, SSRF, auth bypass, mass assignment
- Pair with `npm audit` + Dependabot (already running)

**Estimated run:** 4 hours of setup + ongoing false-positive triage

---

### [x] 14. Visual regression
**Why:** Catches CSS drift from Tailwind refactors.

**Scope:**
- Percy or Chromatic on 5–10 key screens: landing, episode-detail tabs, upload wizard, CreateShowDialog
- Review flow: any diff → manual approval or test fails

**Estimated setup:** 2 hours + $X/month for the service

---

## Tier 5 — Continuous improvement

### [x] 15. Global `expectNoMockData` fixture
**Why:** One-line change that protects against mock-data regressions forever.

**Approach:**
```ts
// app/test/e2e/fixtures/base.ts
export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page)
    const body = await page.locator('body').innerText().catch(() => '')
    expect(body, 'Mock data detected').not.toMatch(/Stoic|Marcus Aurelius|Meditations/i)
  },
})
```

Every test importing from `./fixtures/base` gets the guard for free.

**Estimated setup:** 20 minutes

---

### [x] 16. Test data factories
**Why:** `createPopulatedEpisode` / `createEmptyEpisode` are already duplicated between episode-detail and future features. Extract to shared module.

**Location:** `app/test/e2e/factories.ts` or extend `app/test/setup/database.ts`

**Estimated setup:** 1 hour

---

### [x] 17. Parallelize the e2e suite
**Why:** Currently `workers: 1` for DB consistency. With per-test user isolation (which we now do), 2–4 workers → ~5× speedup.

**Approach:**
- Bump `workers` in `playwright.config.ts`
- Add a `suiteId` suffix to test user emails so concurrent runs don't collide
- Audit `cleanupTestDataByPattern` for race conditions (it uses `.like('[TEST]%')` which is safe)

**Estimated setup:** 2 hours, saves ~1 min per full suite run

---

### [x] 18. Retry flaky live tests in CI only
**Why:** 5 live test failures from earlier are real API hiccups, not code bugs.

**Approach:**
```ts
// vitest.config.ts or playwright.config.ts
retry: process.env.CI ? 2 : 0,
```
Plus: mark the `test/live/` directory with `test.describe.serial` to avoid parallel API hammering.

**Estimated setup:** 15 minutes

---

## Appendix: Meta-improvements for the QA Council pipeline itself

### Tighten Sentinel prompt
The Sentinel agent flagged `showSelectorButton()` as "dead code" in the show-creation audit when it was actually called indirectly via `openDialogFromDropdown`. Update the Sentinel prompt to grep for indirect usage before declaring code dead.

### Add `Fixer` sub-phase
Between Sentinel and Healer, add an optional `Fixer` agent that auto-applies the Sentinel's critical findings without human review. Current pipeline requires the Healer to re-discover Sentinel findings at runtime.

### Automate the orchestrator
The `/qa-council` command currently requires manual invocation. For launch, a GitHub Actions workflow that runs the full pipeline on every PR touching `src/components/**` would catch regressions before merge.

---

## Priority Summary

**Do next (Tier 1):** Stripe billing → processing pipeline → auth edge cases.
**These three block launch.** Everything else is nice-to-have.

**Then (Tier 2):** Vocabulary, Settings, Analytics. Fills in the feature-completeness matrix.

**Then (Tier 3):** Error boundaries, cross-browser, mobile, a11y. Defensive layer.

**Pre-launch gate (Tier 4):** Lighthouse CI + load testing. Must pass before production traffic.

**Ongoing (Tier 5):** Global fixture + factories + parallelization. Compound interest on testing velocity.
