# Test Plan: Billing & Tier Enforcement

**Status:** Final
**Author:** qa-architect
**Date:** 2026-04-18
**Related:** specs/features/billing-tier-enforcement-analysis.md

---

## 1. Overview

This test plan extends the existing QA coverage for billing with an **API-surface and edge-case focus** that the prior `pricing-subscription-refactor` run explicitly left out-of-scope. Rather than duplicate banner UI / state-machine-transition coverage already green in that pipeline (28/28), this plan targets:

- **Stripe checkout endpoint (POST `/api/stripe/checkout`)** — price ID routing, auth/rate-limit/validation errors, customer lifecycle
- **Stripe portal endpoint (POST `/api/stripe/portal`)** — 404 without customer, 200 with
- **Stripe webhook endpoint (POST `/api/stripe/webhooks`)** — signature verification, idempotency, state-machine transitions for events that don't call Stripe back (`invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`)
- **Enforcement edge cases** — 99% → over-cap precision, downgrade with excess usage, read-only after cancel, rate-limit 429
- **Annual upgrade route (POST `/api/stripe/upgrade-annual`)** — 404 without subscription (the only shape we can assert without a real Stripe subscription)

Everything that requires a LIVE Stripe API call (`handleCheckoutCompleted` retrieves the subscription from Stripe — `stripe.subscriptions.retrieve`) is **delegated to the existing Vitest unit suite** at `app/test/unit/lib/stripe-webhooks.test.ts` which already has comprehensive mocked coverage. This plan explicitly does NOT re-test those.

**Test strategy:**
- **Playwright E2E** for everything reachable via HTTP (~80% of this plan)
- **Vitest unit** for 1 new test that exercises `constructEvent`-level HMAC failures in isolation (missing secret scenario)
- **No live Stripe calls** — card numbers / 3DS are Stripe's responsibility, not ours

**Baseline guarantee:** Pre-existing 998 Vitest passing + 48 Playwright passing (all prior pipelines) must remain green. This plan only adds.

---

## 2. Page Object Models

### SubscriptionPage (EXISTING — extend)
- **File:** `app/test/e2e/pages/subscription-page.ts`
- **Responsibility:** Banners, usage meters, tier-enforcement API helpers.
- **Existing methods used here:** `attemptCreateEpisode`, `attemptProcessEpisode`, `attemptCreateShow`, `attemptImportFeed`, `getUsageData`.
- **NEW methods to add:**
  - `async attemptCheckout(body: {tier?: string, interval?: string}): Promise<{status, body}>` — POST `/api/stripe/checkout`
  - `async attemptPortal(): Promise<{status, body}>` — POST `/api/stripe/portal`
  - `async attemptUpgradeAnnual(): Promise<{status, body}>` — POST `/api/stripe/upgrade-annual`
  - `async attemptInvoices(): Promise<{status, body}>` — GET `/api/stripe/invoices`

### BillingWebhookHelper (NEW — not a page; signature helper)
- **File:** `app/test/e2e/helpers/billing-webhook.ts`
- **Responsibility:** Construct signed Stripe webhook payloads and POST them.
- **Methods:**
  - `buildSignedEvent(payload: object, secret: string, timestamp?: number): { body: string, header: string }` — uses `stripe.webhooks.generateTestHeaderString`
  - `postWebhook(request: APIRequestContext, payload: object, opts?: {signature?: 'valid'|'missing'|'bad', secret?: string}): Promise<{status, body}>` — drives the webhook endpoint with variants

### SettingsBillingPage (NEW — thin)
- **File:** `app/test/e2e/pages/settings-billing-page.ts`
- **Responsibility:** Settings subscription tab interactions (upgrade button, portal button).
- **Selectors:**
  - `upgradeButton` → `page.getByRole('button', { name: /Upgrade Plan/i })`
  - `managePlanButton` → `page.getByRole('button', { name: /Manage Plan/i })`
  - `portalButton` → `page.getByRole('button', { name: /Manage subscription|Open Customer Portal/i })` (may not render depending on state)
  - `checkoutDialog` → `page.getByRole('dialog').filter({ hasText: /Upgrade to/ })`
  - `checkoutContainer` → `page.locator('#embedded-checkout-container')`
  - `checkoutError` → `page.getByText(/Checkout failed|Failed to start checkout/)`
- **Methods:**
  - `goto()` — `page.goto('/settings?tab=subscription')`
  - `clickUpgrade()` — clicks the upgrade button and waits for the dialog
  - `expectCheckoutDialogOpen()` / `expectCheckoutDialogClosed()`
  - `expectCheckoutError(pattern)`

---

## 3. Shared Fixtures

Existing fixtures apply — no new ones required. Key helpers reused:
- `createTestUser(tag)` / `deleteTestUser(user)` from `helpers/auth.ts`
- `createTestShow(userId)` from `helpers/auth.ts`
- `setSubscriptionState(userId, state)` from `helpers/factories.ts`
- `cleanupTestDataByPattern()` from `setup/database.ts`
- `signIn(page, user)` from `helpers/auth.ts`

For webhook tests, we need the `STRIPE_WEBHOOK_SECRET` to be readable at test runtime (it is — it's in `.env.local` and `playwright.config.ts` loads it).

---

## 4. Test Cases — Prioritized

**Legend:** P0 = must have, P1 = should have, P2 = nice to have

### Describe block A — `Stripe Checkout API [P0]` (6 tests)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-1** | P0 | `should return 401 when unauthenticated` | — | Unauthenticated `page.request.post('/api/stripe/checkout', {tier:'pro'})` → 401 |
| **B-2** | P0 | `should reject invalid tier with 400` | SubscriptionPage | Auth'd POST with `{tier:'enterprise'}` → 400, body.error mentions tier |
| **B-3** | P0 | `should reject missing tier with 400` | SubscriptionPage | POST with `{}` → 400 |
| **B-4** | P0 | `should return 429 after 5 checkout attempts within window` | SubscriptionPage | 5 POSTs succeed (may hit Stripe, but stubbed via `page.route`); 6th → 429 with "Rate limit exceeded" |
| **B-5** | P0 | `should route correct priceId per tier+interval combination` | SubscriptionPage | Stub `page.route('**/api/stripe/checkout', ...)` inspecting **request** body shape; assert the 6 valid combinations reach the handler with expected values. Uses network-level stubbing — actual Stripe is not hit. |
| **B-6** | P0 | `should accept default interval=monthly when omitted` | SubscriptionPage | POST `{tier:'pro'}` → server applies CheckoutSchema default; assert same outcome as explicit monthly |

### Describe block B — `Stripe Portal API [P0]` (3 tests)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-7** | P0 | `should return 401 when unauthenticated` | — | → 401 |
| **B-8** | P0 | `should return 404 when user has no stripe_customer_id` | SubscriptionPage | Fresh user (no `subscriptions` row) → POST `/api/stripe/portal` → 404, body.error = "No active subscription found" |
| **B-9** | P0 | `should return 200 with portal URL for user with stripe_customer_id` | SubscriptionPage | Seed `subscriptions` row with `stripe_customer_id='cus_test_xxx'` (fake). Stub `page.route('**/api/stripe/portal')` to intercept the response from the SERVER (which would otherwise try to hit Stripe); fulfill with `{url: 'https://billing.stripe.com/...'}`. Assert response contains `url`. |

**Rationale for B-9's stubbing approach:** The `/api/stripe/portal` route server-side calls `stripe.billingPortal.sessions.create()` which requires live keys. We cannot easily mock the server-side Stripe client from a Playwright test. The cleanest alternative is: don't make the server call at all — intercept the `/api/stripe/portal` route at the browser's network edge and return a canned response. This tests the client-side contract (hook calls the right URL, handles the response) without touching Stripe.

### Describe block C — `Stripe Webhook API [P0]` (7 tests)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-10** | P0 | `should reject 401 when stripe-signature header missing` | — | POST without header → 401, body.error = "Missing stripe-signature header" |
| **B-11** | P0 | `should reject 400 when signature is invalid` | — | POST with `stripe-signature: t=1,v1=deadbeef` → 400, body.error = "Invalid signature" |
| **B-12** | P0 | `should reject 400 when signature uses wrong secret` | BillingWebhookHelper | Build signature using `'wrong_secret'`; POST → 400 |
| **B-13** | P0 | `should accept valid signature and dispatch invoice.payment_failed → past_due` | BillingWebhookHelper | Seed `subscriptions` row for test user + `users.subscription_status='active'`; build signed `invoice.payment_failed` event; POST → 200 `{received:true}`; verify `users.subscription_status='past_due'` + `past_due_since` set |
| **B-14** | P0 | `should dispatch invoice.payment_succeeded → active and clear past_due_since` | BillingWebhookHelper | Seed `past_due` user; POST signed `invoice.payment_succeeded`; verify status flips back to `active`, `past_due_since=null` |
| **B-15** | P0 | `should dispatch customer.subscription.deleted → canceled (preserve tier)` | BillingWebhookHelper | Seed `active` user on `creator` tier; POST signed `customer.subscription.deleted`; verify `users.subscription_status='canceled'`, `subscription_tier='creator'` (preserved) |
| **B-16** | P0 | `should be idempotent on duplicate invoice.payment_failed delivery` | BillingWebhookHelper | Seed `active` user; POST event → 200; capture `past_due_since`; POST same event again → 200; verify `past_due_since` unchanged (not reset by the redelivery) |

### Describe block D — `Minute Cap Enforcement [P0]` (3 tests)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-17** | P0 | `should block episode at 99% + 10min would-exceed with precise remaining` | SubscriptionPage | User with 297 min used; POST `/api/episodes` → 403; error matches `/3(\.\d)? minutes remaining/i` and `/300-minute monthly limit/i` |
| **B-18** | P0 | `should block episode processing at 99% over-estimate` | SubscriptionPage | Same user, seed pending episode with `audio_duration_seconds=600`; POST `/api/episodes/[id]/process` → 403 |
| **B-19** | P0 | `should allow episode just under the cap (297 + 2 min = 299 ≤ 300)` | SubscriptionPage | Same user; POST `/api/episodes` with `audio_duration_seconds=120` — happy path → 201 |

### Describe block E — `Rate Limiting [P0]` (2 tests)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-20** | P0 | `should return 429 after 30 taddy searches within 60s` | SubscriptionPage | Loop 30× GET `/api/taddy/search?term=tech` (pass regardless of Taddy-side 503s — rate limit runs first). 31st → 429 with JSON error |
| **B-21** | P0 | `should return 429 after 5 RSS imports within 60s` | SubscriptionPage | Loop 5× POST `/api/shows/[id]/import`. 6th → 429 |

### Describe block F — `Billing Edge Cases [P1]` (6 tests)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-22** | P1 | `should preserve subscription_tier when webhook sets canceled status` | BillingWebhookHelper | Same as B-15 but asserts read access to existing episodes is NOT broken after cancel (GET `/api/episodes/[id]` → 200) |
| **B-23** | P1 | `should block new writes after webhook sets canceled status` | SubscriptionPage + BillingWebhookHelper | After B-22's cancellation, POST `/api/episodes` → 403, POST `/api/shows` → 403 |
| **B-24** | P1 | `should allow writes during past_due grace period (W-14)` | SubscriptionPage | Seed `past_due` with `past_due_since=now()`; POST `/api/episodes` → 201 (grace period honors 3-day allowance) |
| **B-25** | P1 | `should block writes for canceled user even with remaining minutes` | SubscriptionPage | `canceled` user with 0 minutes used; POST `/api/episodes` → 403, error mentions "canceled" and "reactivate" |
| **B-26** | P1 | `should return 404 from upgrade-annual when user has no active subscription` | SubscriptionPage | Trialing user (no `subscriptions` row) → POST `/api/stripe/upgrade-annual` → 404 |
| **B-27** | P1 | `should return [] from invoices when user has no stripe_customer_id` | SubscriptionPage | Fresh user → GET `/api/stripe/invoices` → 200 with `data: []` |

### Describe block G — `Downgrade & State Propagation [P1]` (2 tests)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-28** | P1 | `should reflect tier change from usage API after simulated downgrade` | SubscriptionPage + BillingWebhookHelper | Creator user with 500 min used; simulate `customer.subscription.updated` with pro priceId (via direct DB write since we can't easily trigger the full handler path with `getTierByPriceId` without real price IDs matching — fallback: use `setSubscriptionState(tier:'pro')`). Assert GET `/api/usage` returns `{tier:'pro', audioMinutes.limit:300, audioMinutes.used:500}`. |
| **B-29** | P1 | `should block episode creation after downgrade puts user over new cap` | SubscriptionPage | After B-28, POST `/api/episodes` → 403. Error message references the 300-minute Pro cap. |

### Describe block H — `Embedded Checkout UI [P2]` (3 tests)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-30** | P2 | `should open checkout dialog when upgrade clicked` | SettingsBillingPage | Sign in as trialing user → goto settings → click upgrade → dialog visible with title `/Upgrade to Pro/i` |
| **B-31** | P2 | `should display error when checkout endpoint fails` | SettingsBillingPage | Stub `page.route('**/api/stripe/checkout')` → fulfill with `{status:500, body:{error:'Pricing not configured'}}`; click upgrade; expect dialog error copy visible |
| **B-32** | P2 | `should close dialog when close button clicked` | SettingsBillingPage | Open dialog → click close (`aria-label="Close"`) → dialog not visible |

### Describe block I — `Unit: Webhook secret config [P0]` (1 test)

| # | Priority | Name | POMs | Assertions |
|---|---|---|---|---|
| **B-33** | P0 | `webhook route returns 500 when STRIPE_WEBHOOK_SECRET unset` | — (Vitest unit) | Vitest unit test at `app/test/unit/api/stripe-webhook-env.test.ts`. Dynamically imports the route handler with `process.env.STRIPE_WEBHOOK_SECRET` unset; calls the POST handler with a minimal signed request; asserts 500 and `body.error === 'Webhook configuration error'`. |

---

## 5. Test Counts Summary

| Priority | Count | Describe Blocks |
|---|---:|---|
| **P0** | 22 | A (6) + B (3) + C (7) + D (3) + E (2) + I (1) |
| **P1** | 8 | F (6) + G (2) |
| **P2** | 3 | H (3) |
| **Total** | **33** | |

Of these, **32 are Playwright E2E** and **1 is a new Vitest unit test (B-33)**.

---

## 6. Cross-Cutting Concerns

### Async handling
- All HTTP assertions use `page.request.*()` (synchronous await of status + JSON).
- DOM assertions use web-first `expect(locator).toBeVisible()`.
- Webhook DB mutations: after POST, tests use `admin.from('users').select('subscription_status').eq('id', userId).single()` directly — no polling needed because the handler awaits all writes.
- **No `waitForTimeout`, no arbitrary sleeps, no `force:true`.**

### Test isolation
- Every test creates its own user (or uses a user created in `beforeAll` of that describe block).
- `cleanupTestDataByPattern()` runs in each `afterAll` + globally in teardown.
- No shared mutable state across describe blocks.

### Parallelization
- Default `workers: 1` (per the existing `playwright.config.ts`). Each describe block can later opt into `test.describe.configure({ mode: 'parallel' })` if test runtime becomes a problem, but for this pipeline serial execution is safer (webhook tests share the webhook secret).

### Flakiness risks
- **B-20 / B-21 (rate limit tests)** — depend on Redis being stable. Fallback to in-memory works but means tests on different workers would see different counters. Mitigation: `workers: 1` + single-test-user scope.
- **B-13 through B-16 (webhook DB assertions)** — depend on `updateUserWithRetry` completing before the test reads the DB. Since the handler awaits all writes before returning 200, this should be deterministic. If flakes appear, add `expect.poll` around the DB read with 1000 ms timeout.
- **B-4 (rate-limit 429 for checkout)** — 5 rapid-fire POSTs may intermittently hit Stripe's API through the handler's `stripe.customers.list`. Mitigation: first 5 are stubbed via `page.route('**/api/stripe/checkout', route => route.fulfill(...))` **only after auth + rate-limit** runs — but wait, that stubs the whole route including the server logic. Alternative: the 5 calls can fail with 500 from Stripe and the 6th still 429s because rate-limit fires first. Tests assert **count of 429 responses** rather than that calls 1-5 all succeeded.

### CI considerations
- This plan requires Playwright + chromium installed (already done in this project).
- Requires `STRIPE_WEBHOOK_SECRET` env var at runtime (already set in `.env.local`).
- Requires Supabase service-role key (already set).
- No Stripe live key calls — safe to run in any CI with the test-mode config.

---

## 7. Files the Engineer Must Create / Modify

| File | Status | Purpose |
|---|---|---|
| `app/test/e2e/flows/billing-tier-enforcement.spec.ts` | NEW | All 32 Playwright test cases |
| `app/test/e2e/pages/subscription-page.ts` | MODIFY | Add 4 new API helper methods (checkout/portal/upgrade-annual/invoices) |
| `app/test/e2e/pages/settings-billing-page.ts` | NEW | POM for embedded checkout dialog interactions |
| `app/test/e2e/helpers/billing-webhook.ts` | NEW | Signed webhook payload builder + poster |
| `app/test/unit/api/stripe-webhook-env.test.ts` | NEW | Single Vitest unit test for missing-secret case |

---

## 8. Out of Scope (will NOT test — justified)

- **Driving the Stripe iframe** — card input is inside Stripe's sandbox; not reachable from Playwright.
- **Real Stripe API calls** — live keys in env; risk of real customers/charges.
- **`handleCheckoutCompleted` end-to-end** — requires `stripe.subscriptions.retrieve`; covered by existing `test/unit/lib/stripe-webhooks.test.ts`.
- **Out-of-order webhook delivery** (analysis EC-4) — the handler throws 500 and relies on Stripe's retry; covered by existing unit test's `handleSubscriptionUpdated → fetchError → throws` case.
- **14-day trial cron (`expire-trials`)** — timing-dependent; simulated via `setSubscriptionState` in prior pipeline.
- **Retry-After header on 429** — current code doesn't set one; flagged as INFO in analysis — NOT a blocker.
- **Banner UI tests** — already green in `pricing-subscription-refactor.spec.ts` (28/28).

---

## 9. Expected Outcomes

**Pre-implementation**: 32 Playwright tests + 1 Vitest unit test = 33 new tests.

**Post-healing targets:**
- ≥ 30/32 Playwright passing (aim for 32/32)
- 1/1 Vitest unit passing

**Acceptable real bugs to surface:**
- Silent priceId routing drift (e.g. `STRIPE_CREATOR_ANNUAL_PRICE_ID` pointing at the wrong tier)
- Webhook handlers that don't preserve `past_due_since` on redelivery (already covered — guard should hold)
- Minute-cap precision regressions (e.g. rounding causes off-by-one)
- 500 responses where a 403/404 would be correct

**Non-bugs (known limitations to document, not fix):**
- Missing `Retry-After` header on 429
- Out-of-order webhook → 500 (expected — Stripe's retry handles this)

---

## 10. Handoff

Next step: invoke **qa-engineer** to implement the 33 tests per this plan.

Files ready:
- `specs/features/billing-tier-enforcement-analysis.md` (Feature Design Doc)
- `specs/plans/billing-tier-enforcement-test-plan.md` (this file)
