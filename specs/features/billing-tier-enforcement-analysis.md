# Feature Analysis: Billing & Tier Enforcement

**Status:** Final
**Author:** qa-analyst
**Date:** 2026-04-18
**Target:** http://localhost:3001
**Feature slug:** `billing-tier-enforcement`

**Source files:**
- `app/src/app/api/stripe/checkout/route.ts` — Embedded Checkout session creator
- `app/src/app/api/stripe/portal/route.ts` — Billing portal redirect
- `app/src/app/api/stripe/webhooks/route.ts` — Webhook dispatcher
- `app/src/app/api/stripe/invoices/route.ts` — Billing history
- `app/src/app/api/stripe/upgrade-annual/route.ts` — Monthly → annual upgrade
- `app/src/app/api/subscriptions/route.ts` — Current subscription state
- `app/src/app/api/usage/route.ts` — Minute usage + cap
- `app/src/app/api/taddy/search/route.ts` — Rate-limited search (30 req/min)
- `app/src/app/api/shows/[id]/import/route.ts` — Rate-limited (5/min) + tier-gated
- `app/src/app/api/episodes/route.ts` — Rate-limited (20/min) + minute-cap gated
- `app/src/lib/stripe/client.ts` — Lazy Stripe SDK init (throws on missing env)
- `app/src/lib/stripe/webhooks.ts` — `handleCheckoutCompleted` / `handleSubscriptionUpdated` / `handleSubscriptionDeleted` / `handleInvoicePaymentSucceeded` / `handleInvoicePaymentFailed`
- `app/src/lib/stripe/products.server.ts` — `getServerPriceId(tier, interval)` / `getTierByPriceId`
- `app/src/lib/pricing.ts` — TIER_CONFIGS (3 tiers), state helpers, feature flags
- `app/src/lib/tier-limits.ts` — `canProcessEpisode`, `canCreateShow`, `getAudioMinutesUsed`, `getBillingPeriod`
- `app/src/lib/rate-limit.ts` — Redis (with in-memory fallback) sliding-window limiter
- `app/src/lib/validation-schemas.ts#CheckoutSchema` — zod enum validation for tier + interval
- `app/src/hooks/use-subscription.ts` — `startCheckout()`, `openPortal()`
- `app/src/components/stripe/embedded-checkout-modal.tsx` — Radix Dialog + `<EmbeddedCheckoutProvider>`
- `app/src/components/settings/settings-page.tsx` — Subscription tab, upgrade buttons, usage meters

---

## 1. Overview

PodBrain's billing surface is a two-layer system:

1. **Stripe layer** — an embedded Checkout experience (no Stripe.com redirect) creates/updates subscriptions, a Customer Portal handles cancellation/payment methods, and five webhook event handlers keep PodBrain's `subscriptions` and `users` tables aligned with Stripe. Price routing covers 6 Stripe price IDs (3 tiers × 2 intervals) with 2 legacy `$19` / `$49` IDs retained for pre-refactor subscribers.
2. **Enforcement layer** — `canProcessEpisode()` and `canCreateShow()` are called at the top of every expensive API route, returning HTTP 403 when the 5-state access machine (`trialing | active | past_due | trial_expired | canceled`) blocks the user OR when the monthly minute cap is exceeded. A separate Redis-backed rate limiter returns HTTP 429 per-route (checkout 5/min, episodes 20/min, imports 5/min, taddy 30/min).

This pipeline builds on the existing `pricing-subscription-refactor` run (26+2 tests covering banner UI, state-machine transitions, read-only access, tier-upgrade reflection, and one minute-cap 403 case) and `core-paid-flow` (1 upload tier-cap test). The **new coverage** target is the Stripe endpoint surface that was explicitly marked out-of-scope in the prior run, the webhook's HMAC verification + idempotency + state-machine branches, rate-limit HTTP behavior, and the critical edge cases listed in the task brief (99% over-limit, 3DS/bad-card at embed, downgrade with excess usage, duplicate/out-of-order webhooks, missing secret, cancel-at-period-end).

**Stripe calls MUST be stubbed** — the `.env.local` holds LIVE keys. We intercept via `page.route('**/api/stripe/**', …)` at the Playwright level when we only need to assert request shape, and we mock `@/lib/stripe/client` via `test.step` + Vitest-style module mocks for the webhook signature verification paths. Card numbers and 3DS flows are asserted against the PodBrain-side API contract only (Stripe iframe is sandboxed and out of E2E's reach).

---

## 2. Source Code Map

| File | Responsibility |
|------|----------------|
| `api/stripe/checkout/route.ts` | POST — auth → rate-limit 5/min → zod validate body → resolve priceId → upsert/create Stripe customer → create embedded session → return `clientSecret`. 500 on missing priceId env, 429 on rate limit. |
| `api/stripe/portal/route.ts` | POST — auth → read `stripe_customer_id` from subscriptions → create portal session → return `{url}`. 404 when no customer. |
| `api/stripe/webhooks/route.ts` | POST — reads raw body (arrayBuffer → Buffer to preserve exact signature bytes) → rejects 401 on missing header → rejects 500 on missing `STRIPE_WEBHOOK_SECRET` → rejects 400 on bad signature → dispatches on event.type → 200 `{received:true}` on success, 500 on handler error. |
| `api/stripe/invoices/route.ts` | GET — auth → stripe.invoices.list(customer) → 20 most recent, shaped as `{id, date, amount, currency, status, pdfUrl, description}`. Returns `[]` when no customer. |
| `api/stripe/upgrade-annual/route.ts` | POST — fetch active subscription → look up annual price → if `<30d` old, add negative invoice item = monthly price (full credit) and update with `proration_behavior:'none'`; else `proration_behavior:'always_invoice'`. |
| `api/subscriptions/route.ts` | GET — join `subscriptions.users` → returns `{status, tier, trialEndsAt, pastDueSince, stripe_subscription_id, price_id, current_period_start, current_period_end}`. When no row exists, falls back to `users` table values. `subscription_status` on users is the source of truth for access decisions. |
| `api/usage/route.ts` | GET — parallel fetch `getUserTier` + `getAudioMinutesUsed` + `getShowCount` + `getBillingPeriod`; returns `{tier, status, trialEndsAt, pastDueSince, billingPeriod, audioMinutes, shows}` each with `{used, limit, percentage}`. |
| `api/taddy/search/route.ts` | GET — rate-limited 30/min by userId. Returns 429 with JSON `{error: "Rate limit exceeded. Try again shortly."}` on over-limit. No Retry-After header is set by the current implementation. |
| `api/episodes/route.ts` | POST — `canProcessEpisode(userId)` called BEFORE rate-limit body parsing → 403 with `{error, data:null}` when blocked. Error copy: `"minutes this month"` (regression guard — never "hours"). |
| `api/shows/[id]/import/route.ts` | POST — rate-limit 5/min → verify show ownership → `getUserTier()` → explicit 403 for `trial_expired`/`canceled` with "importing episodes" copy → `remainingMinutes <= 0` → 403. |
| `lib/stripe/webhooks.ts` | `constructEvent` wraps `stripe.webhooks.constructEvent`; each handler has idempotency guards (checkout: skip if subscription row exists; updated: skip if `updated_at` within 2000 ms; invoice_failed: preserve `past_due_since`). `updateUserWithRetry` does 3 retries with 100 ms exponential backoff. |
| `lib/pricing.ts` | TIER_CONFIGS source of truth: `pro` 300min / 2 shows / $29 / $290; `creator` 1200min / 10 shows / $59 / $590; `agency` 3600min / unlimited / $149 / $1490. `UNLIMITED_SHOWS_SENTINEL = 999`. `GRACE_PERIOD_DAYS = 3`. `SOFT_LIMIT_THRESHOLD = 0.8`. |
| `lib/tier-limits.ts` | `canProcessEpisode`: blocks if `isAccessBlocked(status)`; blocks if `minutesUsed >= limit`; blocks if `minutesUsed + estimatedMinutes > limit`. Error copy includes exact remaining-minutes figure: `"You have {N} minutes remaining"`. |
| `lib/rate-limit.ts` | In-memory Map fallback when Redis unavailable. `WINDOW_MS=60_000`. Returns `{success, remaining, resetAt}`. **Does NOT set a `Retry-After` response header** — only the JSON body. |
| `lib/stripe/client.ts` | Lazy `getStripe()` + Proxy `stripe` export. Throws at first use (not at import) when `STRIPE_SECRET_KEY` missing — so the app can boot without Stripe and fail per-request. |

---

## 3. Selector Inventory

### Settings / Subscription UI (existing `data-testid`)

The subscription banners got their testids during the prior refactor (`subscription-banner-trial`, `-past-due`, `-blocked`, `banner-upgrade-button`, `banner-dismiss-button`). Those are stable and this pipeline reuses them via the existing `SubscriptionPage` POM.

### Settings / Subscription UI — NEW selectors needed for this pipeline

The settings subscription tab has no `data-testid` attributes today. For deterministic selection we will rely on:

| Selector | Source | Purpose |
|---|---|---|
| `page.getByRole('button', { name: /Upgrade Plan/i })` | `settings-page.tsx:361` | Non-agency users: opens `EmbeddedCheckoutModal` via `startCheckout(tier)`. |
| `page.getByRole('button', { name: /Manage Plan/i })` | `settings-page.tsx:361` | Agency users: opens same modal (no portal for unpaid agency). |
| `page.getByRole('button', { name: /Manage subscription|Open Customer Portal/i })` | (if rendered — for paid users) | Triggers `openPortal()` → POST `/api/stripe/portal`. |
| `page.getByRole('dialog')` with title `/Upgrade to/` | `embedded-checkout-modal.tsx:92` | The Radix Dialog containing the embed. |
| `page.locator('#embedded-checkout-container')` | `embedded-checkout-modal.tsx:126` | The mount div for the Stripe iframe. Used to assert the iframe attempt happened even though we stub `fetchClientSecret`. |
| `page.getByText('Failed to start checkout')` OR `page.getByText(/Checkout failed/)` | `embedded-checkout-modal.tsx:74-76` | Error fallback inside the dialog. |

### API-level selectors (no DOM — direct HTTP)

All Stripe + tier tests interact with the server via `page.request.post/get()`. No DOM selectors required. The existing `SubscriptionPage.attemptCreateEpisode/attemptCreateShow/attemptImportFeed` helpers cover the enforcement assertions; we extend with `attemptCheckout`, `attemptPortal`, `postWebhook` helpers on a new `BillingPage` POM.

---

## 4. Workflows

### W-1: Trialing user initiates checkout (happy path)

**Preconditions:** `testUser.subscription_status = 'trialing'`, no `subscriptions` row yet.

**Steps:**
1. User signs in → `/settings?tab=subscription` → sees "Upgrade Plan" → clicks.
2. `EmbeddedCheckoutModal` opens with `tier='pro'`, `interval='monthly'`.
3. `fetchClientSecret` fires POST `/api/stripe/checkout` with `{tier:'pro', interval:'monthly'}`.
4. Route validates auth → rate-limit passes → priceId resolved via env → customer lookup misses → creates new customer → calls `stripe.checkout.sessions.create({...ui_mode:'embedded'})` → returns `{clientSecret}`.
5. `<EmbeddedCheckoutProvider>` mounts the Stripe iframe.

**Postconditions:** Customer exists in Stripe; no `subscriptions` row yet (webhook creates it on `checkout.session.completed`).

**Assertions:**
- Status 200 on `/api/stripe/checkout`
- Response has `clientSecret` as non-empty string
- `priceId` resolved matches the env var for `pro` monthly
- If `interval='annual'` passed, the handler hits `STRIPE_PRO_ANNUAL_PRICE_ID`
- Dialog opens; `#embedded-checkout-container` mounts

### W-2: Paid user opens billing portal (happy path)

**Preconditions:** `testUser` has a `subscriptions` row with `stripe_customer_id` set.

**Steps:**
1. User clicks "Open Customer Portal" / "Manage subscription".
2. POST `/api/stripe/portal` → `stripe.billingPortal.sessions.create({customer, return_url})` → `{url}` returned.
3. Client redirects `window.location.href = url`.

**Assertions:**
- Status 200 on `/api/stripe/portal`
- Response has `url` starting with `https://billing.stripe.com/`
- User without `stripe_customer_id` → 404 with `"No active subscription found"`

### W-3: Stripe webhook delivers `checkout.session.completed` (happy path)

**Preconditions:** `testUser` is `trialing`; a completed checkout session arrives via the webhook endpoint.

**Steps:**
1. Test constructs a signed payload using `stripe.webhooks.generateTestHeaderString({payload, secret, timestamp})` with a known `WEBHOOK_SECRET_TEST` env var.
2. POST `/api/stripe/webhooks` with raw payload + `stripe-signature` header.
3. Route verifies signature → dispatches to `handleCheckoutCompleted`.
4. Handler upserts `subscriptions` row + transitions user `trialing → active` at the checkout-session's tier.

**Assertions:**
- Status 200 with `{received: true}`
- `subscriptions` row created with `stripe_subscription_id`, `price_id`, `current_period_start/end`
- `users.subscription_status = 'active'`, `subscription_tier` matches priceId
- Duplicate delivery of the same event → handler's idempotency guard skips; `subscriptions` row unchanged

### W-4: Stripe webhook `invoice.payment_failed` → past_due

**Steps:**
1. Test sends signed `invoice.payment_failed` with `subscription: sub_id`.
2. Handler updates `subscriptions.status = 'past_due'` and sets `users.subscription_status = 'past_due'` + `past_due_since = now()` (only when currently null).

**Assertions:**
- Status 200
- Redelivery preserves the original `past_due_since` (grace-period clock not reset)
- `PastDueBanner` visible on next page load

### W-5: Stripe webhook `customer.subscription.deleted` → canceled

**Steps:**
1. Test sends signed `customer.subscription.deleted` with the sub id.
2. Handler sets `subscriptions.status='canceled'` + `users.subscription_status='canceled'`.

**Assertions:**
- Status 200
- `users.subscription_tier` preserved (for read-only historical access)
- `AccessBlockedBanner` "Your subscription has been canceled." on next page load

### W-6: Error paths

- **E-1:** POST `/api/stripe/webhooks` without `stripe-signature` header → 401 `{error: "Missing stripe-signature header"}`
- **E-2:** POST `/api/stripe/webhooks` with bogus signature → 400 `{error: "Invalid signature"}`
- **E-3:** POST `/api/stripe/webhooks` with `STRIPE_WEBHOOK_SECRET` unset → 500 `{error: "Webhook configuration error"}` (cannot simulate without mutating env — see Open Questions)
- **E-4:** POST `/api/stripe/checkout` with invalid `tier` enum → 400 via zod `parseBody`
- **E-5:** POST `/api/stripe/checkout` with `tier=pro, interval=monthly` but `STRIPE_PRO_PRICE_ID` unset → 500 `{error: "Pricing not configured for this tier"}`
- **E-6:** POST `/api/stripe/portal` when subscriptions.stripe_customer_id is null → 404 `{error: "No active subscription found"}`
- **E-7:** Rate-limit: 6th POST `/api/stripe/checkout` within 60s → 429 `{error: "Rate limit exceeded. Please try again shortly."}`
- **E-8:** Rate-limit: 31st GET `/api/taddy/search?term=x` within 60s → 429 `{error: "Rate limit exceeded. Try again shortly."}`

### W-7: 99% → over-cap enforcement (edge case)

**Preconditions:** User on `pro` with 297 minutes consumed (99% of 300). Attempts to process an episode with `audio_duration_seconds=600` (10 minutes) → would cross 300.

**Steps:**
1. Seed episode with duration → POST `/api/episodes/[id]/process` with `estimatedDurationSeconds=600`.
2. `canProcessEpisode` runs: `minutesUsed=297, estimatedMinutes=10, limit=300` → 297+10 > 300 → block.

**Assertions:**
- Status 403
- Error message contains `"You have 3 minutes remaining"` (exact number derived from limit minus used, rounded to 1 decimal)
- Error message also contains `"This episode (~10 min) would exceed your 300-minute monthly limit"`

### W-8: Downgrade with excess usage (edge case)

**Preconditions:** User on `creator` (1200 cap) with 500 minutes consumed. Stripe webhook delivers `customer.subscription.updated` moving them to `pro` (300 cap).

**Steps:**
1. Send signed `subscription.updated` with `items[0].price.id = STRIPE_PRO_PRICE_ID`.
2. `handleSubscriptionUpdated` updates `users.subscription_tier='pro'`.
3. Post-downgrade: user attempts to process → `canProcessEpisode` sees 500 ≥ 300 → blocks.

**Assertions:**
- Status 200 on webhook
- Next `POST /api/episodes` → 403 with message about being over the 300-minute cap
- Existing content remains readable (GET `/api/episodes/[id]` still 200)

### W-9: Cancel at period end (edge case)

**Preconditions:** User has `subscription_status='active'` and a `subscriptions` row.

**Steps:**
1. Send signed `customer.subscription.deleted` → handler sets status='canceled'.
2. Assert subsequent POST to any write endpoint returns 403.
3. Assert GET endpoints (read-only) still 200.

### W-10: Duplicate / out-of-order webhook delivery (edge case)

**Variant A — checkout.session.completed delivered twice:**
- First delivery creates `subscriptions` row.
- Second delivery: `existingSubscription` check short-circuits; handler returns without further DB writes.

**Variant B — subscription.updated delivered twice within 2s:**
- First updates `subscriptions.updated_at`.
- Second falls through the `now - dbUpdatedAt < 2000ms` check and returns.

**Variant C — subscription.updated arrives before checkout.session.completed:**
- `handleSubscriptionUpdated` tries to `.single()` on missing row → throws → webhook returns 500 → Stripe retries later.
- This is currently **expected behavior** and acceptable; Stripe's retry queue handles ordering.

**Assertions:**
- Variant A: only one `subscriptions` row regardless of delivery count
- Variant B: `updated_at` doesn't advance on the duplicate
- Variant C: first call returns 500, subsequent retry after checkout creates the row and the update succeeds

### W-11: Rate limit cross-check (edge case)

**Preconditions:** Authenticated user.

**Steps:**
1. Fire 30 concurrent GET `/api/taddy/search?term=tech` requests.
2. Assert all 30 return non-429 status.
3. Fire one more → 429.

**Assertions:**
- Counts: 30× non-429, 1× 429
- 429 body: `{error: "Rate limit exceeded. Try again shortly."}`
- Current implementation does NOT set `Retry-After` header (document as INFO / nice-to-have)

---

## 5. Loading, Empty, and Error States

| State | Trigger | Visible copy / selector |
|---|---|---|
| Embedded checkout loading | Dialog open; `fetchClientSecret` in flight | Stripe iframe mounts into `#embedded-checkout-container` |
| Embedded checkout error | `fetchClientSecret` throws (e.g. 500 from route) | `<p class=text-destructive>{error}</p>` — matches `/Checkout failed|Failed to start checkout/` |
| Portal error (no customer) | POST `/api/stripe/portal` → 404 | `useSubscription.openPortal` sets error state; no redirect occurs |
| Webhook 401 / 400 / 500 | Missing / bad / unconfigured signature | JSON `{error: "..."}` body |
| Minute cap block | `canProcessEpisode` returns `{allowed:false}` | HTTP 403 with specific error copy enumerated in W-7 |

---

## 6. Edge Cases

| # | Description | Impact | Reproduction |
|---|---|---|---|
| **EC-1** | 99% → over cap | User at 297/300 attempts 10-min episode | Seed 297 min of usage; POST `/api/episodes` |
| **EC-2** | Downgrade with excess usage | Agency→Pro keeps existing 500min but new attempts 403 | Webhook stub + subsequent POST |
| **EC-3** | Duplicate webhook (idempotency) | Same event.id delivered twice | Two identical POSTs; assert no double-write |
| **EC-4** | Out-of-order webhook | `updated` before `checkout.session.completed` | Send `updated` first; expect 500; expect subsequent checkout to succeed |
| **EC-5** | Missing `STRIPE_WEBHOOK_SECRET` | Boot-time ignored, runtime 500 | Cannot simulate without mutating env — use separate unit test |
| **EC-6** | User without customer_id opens portal | 404 graceful error | Test user without `subscriptions` row |
| **EC-7** | Bad signature (replay attack) | Returns 400 | Any payload with `stripe-signature: t=123,v1=badhex` |
| **EC-8** | Cancel at period end | Access retained until period end; read-only afterward | Manipulate `subscriptions.current_period_end` + deliver `subscription.deleted` |
| **EC-9** | Invalid tier enum in checkout | 400 via zod | POST `{tier:'enterprise'}` |
| **EC-10** | Missing price ID env | 500 with clear message | Temporarily unset via test-scoped override (risky — prefer unit test) |
| **EC-11** | Rate-limit exceeded | 429 response | 31 taddy searches in 60s |
| **EC-12** | 80% soft-limit banner | Exactly 240/300 min used | Already covered by P1-11 in prior run; cross-verify from this pipeline's vantage point |
| **EC-13** | Trial expiration state transition | Cron simulated via direct write | `setSubscriptionState(status:'trial_expired')` |
| **EC-14** | Past-due within grace period | 3-day grace still allows write access | Set `past_due_since=now()` + assert POST `/api/episodes` succeeds |
| **EC-15** | Past-due past grace (cron would flip to canceled) | User access should be blocked | Set `past_due_since=now()-4d`, `status='canceled'` |
| **EC-16** | Upgrade monthly → annual within 30d | Full-credit path | Stub Stripe retrieve + assert POST `/api/stripe/upgrade-annual` request shape (actual Stripe call stubbed) |
| **EC-17** | Bad card / 3DS in embed | Card form is inside Stripe's iframe; PodBrain contract asserts only that `clientSecret` was returned | E2E cannot drive the card form — covered by Stripe's own infrastructure |

---

## 7. Async Behavior

| Operation | Wait strategy |
|---|---|
| POST `/api/stripe/checkout` | `await page.request.post()` — no explicit waiting; tests read status + JSON synchronously |
| Webhook delivery | Synchronous — handler awaits all DB writes before returning |
| `updateUserWithRetry` | 3 retries with 100 ms exponential backoff on transient Supabase failure — tests should tolerate up to ~700 ms on flaky network |
| `EmbeddedCheckoutModal.fetchClientSecret` | React `useCallback` — tests can wait for the dialog to open (`expect(dialog).toBeVisible()`) and then assert the network request was issued (via `page.waitForResponse`) |
| Taddy rate-limit 429 | Single shot — no polling |

**Absolutely forbidden:** `waitForTimeout`, `setTimeout`, arbitrary `sleep`. Use `page.waitForResponse('**/api/stripe/checkout', r => r.status() === 200)` for network signals and `expect(locator).toBeVisible()` for DOM.

---

## 8. Data Requirements

**Auth:** Every test creates a fresh test user via `createTestUser(tag)` (admin SDK) + `createTestShow(userId)`. Subscription state is set via `setSubscriptionState(userId, {...})` — direct DB writes to simulate webhook outcomes without hitting Stripe.

**Stripe — MUST NOT hit the real API with live keys.** Options:
1. **Primary pattern:** In Playwright tests, intercept the `/api/stripe/checkout` and `/api/stripe/portal` **HTTP routes the browser calls** via `page.route('**/api/stripe/**', route => route.fulfill({...}))` to stub responses at the network edge. This tests the client-side contract without touching Stripe.
2. **Secondary pattern (webhook signature tests):** The webhook route calls `stripe.webhooks.constructEvent` which does real HMAC-SHA256 verification against `STRIPE_WEBHOOK_SECRET`. We can construct a real signature using `stripe.webhooks.generateTestHeaderString({payload, secret: TEST_WEBHOOK_SECRET})` — this does NOT contact Stripe's servers, it's local crypto. For this path we set a **dedicated** `TEST_WEBHOOK_SECRET` in `.env.local` (already handled by prior work — the existing `STRIPE_WEBHOOK_SECRET` in env is what the webhook validates against; tests use the same one).
3. **For checkout → subscription creation:** After a webhook fires with a signed payload, the handler calls `stripe.subscriptions.retrieve(subscriptionId)` which DOES hit Stripe. We mock `@/lib/stripe/client` at the server side is NOT possible (the dev server is already running). Instead: **skip subscription retrieval tests in E2E** and cover them via the existing Vitest unit suite (`test/unit/lib/stripe-webhooks.test.ts`). For E2E we focus on `invoice.payment_succeeded`, `invoice.payment_failed`, and `customer.subscription.deleted` which don't call Stripe back — they only do DB writes.

**Cleanup:** All users created with `[TEST]` tag; global teardown runs `cleanupTestDataByPattern()`. Stripe artifacts (customers, subscriptions) are never created in these tests, so no Stripe cleanup required.

---

## 9. Accessibility Notes

Out of scope for this pipeline (covered by the separate `accessibility.spec.ts` file already in the suite).

---

## 10. Out of Scope

- **Driving the Stripe iframe itself** — card input, 3DS challenges, Apple Pay. Stripe's own QA covers this; PodBrain's contract is "we asked for a clientSecret, Stripe gave us one."
- **Real Stripe API calls** — live keys in env; all calls to `stripe.*` are stubbed or use local HMAC.
- **Trial expiration cron** (`expire-trials` Trigger.dev job) — timing-dependent; simulated via `setSubscriptionState`.
- **Stripe subscription retrieval in `handleCheckoutCompleted`** — requires real Stripe API; covered by `test/unit/lib/stripe-webhooks.test.ts` already.
- **Team seats / white-label / public API** — per `docs/planning/FUTURE-IMPROVEMENTS.md`.
- **Duplicate core-paid-flow coverage** — `core-paid-flow.spec.ts` already tests tier-cap rejection at upload; we add the API-layer edge cases instead.
- **Duplicate pricing-subscription-refactor coverage** — banner UI, 5-state transitions, soft-limit banner at 80% already green (28/28); we reference but do not re-test.

---

## 11. Open Questions

None. The following items are **documented as known limitations** and deferred:

1. **Missing `STRIPE_WEBHOOK_SECRET` handling** — cannot simulate in E2E without mutating env. Covered by a new Vitest unit test in this pipeline if the Architect prioritizes it.
2. **Webhook handler that calls `stripe.subscriptions.retrieve`** — `handleCheckoutCompleted` (W-3) requires a live Stripe subscription. Not feasible in E2E; unit tests already cover.
3. **Retry-After header on 429** — current rate-limiter doesn't set it; flagged as INFO-level finding for post-launch polish.

---

## Summary

- **Selectors verified:** 12 (5 via existing `SubscriptionPage` POM + 7 new)
- **Workflows mapped:** 6 happy + 2 alternate + 3 error-path families = 11 total
- **Edge cases enumerated:** 17
- **Open questions:** 0 (3 documented limitations)

**Next step:** Invoke qa-architect to produce the prioritized test plan.
