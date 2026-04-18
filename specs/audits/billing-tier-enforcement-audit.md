# Audit Report: billing-tier-enforcement

**Sentinel:** qa-sentinel
**Date:** 2026-04-18
**Verdict:** ✅ **AUDIT PASSED** — no critical findings

---

## 1. Automated Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ PASS (0 errors) |
| `npx eslint` on new files | ✅ PASS (0 warnings) |
| Tests not run (Healer's responsibility) | ✅ correct |

---

## 2. Plan Compliance

| Plan item | Expected | Delivered | Status |
|---|---|---|---|
| Playwright spec file | `app/test/e2e/flows/billing-tier-enforcement.spec.ts` | ✅ exists, 32 tests | PASS |
| Webhook helper | `app/test/e2e/helpers/billing-webhook.ts` | ✅ exists | PASS |
| Settings billing POM | `app/test/e2e/pages/settings-billing-page.ts` | ✅ exists | PASS |
| SubscriptionPage extensions | 4 new methods | ✅ `attemptCheckout`, `attemptPortal`, `attemptUpgradeAnnual`, `attemptInvoices` | PASS |
| Vitest unit test | `app/test/unit/api/stripe-webhook-env.test.ts` | ✅ exists, 2 tests | PASS |
| Test count (Playwright) | 32 | 32 | PASS |
| P0 count | 22 | 22 (A:6 + B:3 + C:7 + D:3 + E:2 + I:1 unit) | PASS |
| P1 count | 8 | 8 (F:6 + G:2) | PASS |
| P2 count | 3 | 3 (H:3) | PASS |

All 32 Playwright tests are present. Unit test B-33 delivered as 2 tests (missing-secret + missing-signature paths).

---

## 3. Anti-Pattern Scan

| Anti-pattern | Found | Status |
|---|---|---|
| `waitForTimeout` | 0 | ✅ |
| `force: true` | 0 | ✅ |
| `test.only` | 0 | ✅ |
| `test.skip` | 0 | ✅ |
| `setTimeout` / `sleep` | 0 | ✅ |
| Hardcoded credentials | 0 | ✅ |
| Tests without `expect` | 0 (67 expects / 32 tests = 2.1 avg) | ✅ |
| Raw CSS in tests (not POM) | 0 | ✅ |
| Empty test blocks | 0 | ✅ |
| `test.only` / `test.skip` leaked | 0 | ✅ |
| Timeouts > 30s | 0 | ✅ |

---

## 4. POM Audit

### SubscriptionPage (modified)
- Existing conventions maintained
- 4 new `attempt*` methods follow the existing pattern (`attemptCreateEpisode` / `attemptCreateShow`)
- Each returns `{status, body}` (matches existing API helper contract)
- No `expect` calls in POM methods
- No test logic

### SettingsBillingPage (new)
- Class-based with `Page` in constructor ✅
- All selectors use `getByRole` / `getByText` (accessible-first) ✅
- No raw CSS selectors
- No `expect` calls in interaction methods (only in `expect*` methods, which is the convention in this codebase per the existing SubscriptionPage)
- `clickUpgrade()` handles both "Upgrade Plan" and "Manage Plan" button variants without guessing — uses `.count()` check

### billing-webhook.ts (helper, not a POM)
- Pure function module, no class needed
- Constructs minimal Stripe event shapes matching real Stripe's structure
- Uses real `stripe.webhooks.generateTestHeaderString` — same crypto the handler verifies against
- Documents the safety constraint (never use with handlers that call `stripe.*.retrieve`)

---

## 5. Plan ↔ Code Cross-Reference

Every test case ID in the plan has a corresponding test in the spec file:

- A block: B-1 ✅ B-2 ✅ B-3 ✅ B-4 ✅ B-5 ✅ B-6 ✅
- B block: B-7 ✅ B-8 ✅ B-9 ✅
- C block: B-10 ✅ B-11 ✅ B-12 ✅ B-13 ✅ B-14 ✅ B-15 ✅ B-16 ✅
- D block: B-17 ✅ B-18 ✅ B-19 ✅
- E block: B-20 ✅ B-21 ✅
- F block: B-22 ✅ B-23 ✅ B-24 ✅ B-25 ✅ B-26 ✅ B-27 ✅
- G block: B-28 ✅ B-29 ✅
- H block: B-30 ✅ B-31 ✅ B-32 ✅
- I block: B-33 ✅ (delivered as 2 tests in stripe-webhook-env.test.ts)

No scope creep detected — no extra tests added beyond the plan.

---

## 6. Selector Verification

All selectors used in tests and POMs trace back to the Analyst's inventory:

| Selector | POM | Source file:line |
|---|---|---|
| `getByTestId('subscription-banner-trial')` | SubscriptionPage (existing) | `subscription-banners.tsx` |
| `getByRole('button', { name: /Upgrade Plan/i })` | SettingsBillingPage | `settings-page.tsx:361` |
| `getByRole('button', { name: /Manage Plan/i })` | SettingsBillingPage | `settings-page.tsx:361` |
| `getByRole('dialog').filter({ hasText: /Upgrade to/i })` | SettingsBillingPage | `embedded-checkout-modal.tsx:92` |
| `getByRole('button', { name: /^Close$/i })` | SettingsBillingPage | `embedded-checkout-modal.tsx:103` |
| `getByText(/Checkout failed|.../)` | SettingsBillingPage | `embedded-checkout-modal.tsx:74-114` |

All other selectors are HTTP endpoints (not DOM) — auditable via the API route inventory in the analysis.

---

## 7. Security Audit

| Concern | Status |
|---|---|
| Credentials hardcoded | ❌ None |
| API keys in code | ❌ None |
| Real user data | ❌ All fixtures use `[TEST]` / `[BILLING-QA]` tags |
| Production URL access | ❌ All via `playwright.config.ts` baseURL |
| Stripe LIVE key usage | ❌ Tests stub or avoid live calls; webhook uses HMAC-only path |
| Real Stripe customers created | ❌ All customer IDs are fake (`cus_billingqa_*`) and never pass through real Stripe |

---

## 8. Flakiness Risk Assessment

| Test | Risk | Mitigation |
|---|---|---|
| **B-4** (5-per-min rate limit) | MEDIUM — rate limit may leak across tests if workers ever parallelize | `workers:1` default in playwright.config; per-user rate-limit keys |
| **B-20** (30-per-min taddy) | MEDIUM — shares in-memory limiter with other test users if run in parallel | Per-user rate-limit keys `taddy-search:{userId}` |
| **B-13 / B-14 / B-15** (webhook DB assertions) | LOW — handler awaits all writes before returning 200 | Reads occur synchronously after 200 response |
| **B-28 / B-29** (downgrade propagation) | LOW — uses `setSubscriptionState` which is synchronous DB write | `page.reload()` to bust SWR cache |
| **Overall** | LOW | All tests use own user; `cleanupTestDataByPattern()` runs between files |

---

## 9. Findings Summary

| Severity | Count | IDs |
|---|---:|---|
| 🚫 CRITICAL | 0 | — |
| ⚠️ HIGH | 0 | — |
| 🔶 MEDIUM | 0 | — |
| ℹ️ INFO | 2 | See below |

### ℹ️ INFO-1: `Retry-After` header not asserted
B-20 and B-21 assert the 429 status but not a `Retry-After` header, because the current rate-limiter does not set one. This was documented as a known limitation in the analysis (§6 EC-11). Not a bug; post-launch polish.

### ℹ️ INFO-2: B-18 accepts 403 or 429
The process-endpoint test accepts either status because the process route's rate limit may fire before the tier check depending on timing. The test body asserts the minute-related error message only when status is 403. This is a reasonable accommodation given the route's ordering but could be tightened if the route order is made strict in a future refactor.

---

## 10. Verdict

✅ **AUDIT PASSED** — all 32 Playwright tests + 2 unit tests match the plan, follow existing conventions, use verified selectors, and contain no anti-patterns. Type check and lint are clean.

**Proceed to qa-healer.**
