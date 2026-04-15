# Test Plan: Pricing Refactor + Subscription State Machine

**Architect:** QA Architect
**Date:** 2026-04-14
**Pipeline:** `pricing-subscription-refactor`
**Source FDD:** `specs/features/pricing-subscription-refactor-analysis.md`

---

## 1. Suite Overview

**Spec file:** `app/test/e2e/flows/pricing-subscription-refactor.spec.ts`
**Page objects:** `app/test/e2e/pages/subscription-page.ts` _(new)_
**Helper additions:** `setSubscriptionState()` in `app/test/e2e/helpers/factories.ts`
**Component changes required:** 5 `data-testid` attributes must be added to `subscription-banners.tsx` before tests can run (see §3 below).

### Coverage philosophy

This spec does **not** test Stripe webhooks directly (untestable in E2E), the daily cron job (timing-dependent), or the Embedded Checkout modal flow (requires Stripe test mode and is a Stripe responsibility). All subscription state changes are simulated via direct Supabase admin writes.

The spec guards the revenue-critical invariants:
- Blocked users (trial_expired / canceled) cannot trigger expensive API operations
- Trial banner renders correctly and is dismissible
- Past-due users retain access during grace period
- Minute cap enforcement at the API layer
- Landing page pricing accuracy after removal of the free tier

### Skipped scenarios (not testable in E2E)

| Scenario | Why Skipped |
|---|---|
| Stripe checkout flow | Requires Stripe test mode; out of E2E scope |
| Webhook race conditions (invoice.payment_succeeded simultaneous with subscription.updated) | Race conditions are unit-test territory |
| Daily cron job expiring trials | Cannot control scheduler timing in E2E |
| Cross-tab session storage behavior | Playwright supports this but adds complexity beyond current priority |
| OAuth signup trial state | Would require Google OAuth in test mode |

---

## 2. Test Isolation Pattern

All describe blocks use the same `beforeAll → sign-in → afterAll` lifecycle:

```typescript
test.describe('Group [Px]', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    testUser = await createTestUser('sub-px')
    await createTestShow(testUser.id)           // most tests need at least one show
    await setSubscriptionState(testUser.id, { ... }) // explicit state per group
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)               // fresh sign-in per test
  })
})
```

**Important:** DB state is set in `beforeAll`, not `beforeEach`. Banner state reads from `/api/usage` which fetches from DB on each page load. Changing DB state in `beforeAll` + signing in in `beforeEach` ensures each test sees the correct initial state without re-seeding per test.

When a test needs to mutate state mid-test (e.g., Journey 3: simulate upgrade while signed in), it should call `setSubscriptionState()` directly then `await page.reload()`.

---

## 3. Required `data-testid` Attribute Additions

The Engineer must add these before writing any tests. All in `app/src/components/ui/subscription-banners.tsx`:

| Attribute | Element | Current Line | Action |
|---|---|---|---|
| `data-testid="subscription-banner-trial"` | Outer `<div>` of `TrialCountdownBanner` | `subscription-banners.tsx:44` | Add to the `<div className={cn(...)}` element |
| `data-testid="subscription-banner-past-due"` | Outer `<div>` of `PastDueBanner` | `subscription-banners.tsx:105` | Add to `<div className="flex items-center..."` |
| `data-testid="subscription-banner-blocked"` | Outer `<div>` of `AccessBlockedBanner` | `subscription-banners.tsx:138` | Add to `<div className="flex items-center..."` |
| `data-testid="banner-upgrade-button"` | Upgrade/Reactivate button in ALL three banners | Lines 67, 115, 151 | Add to each button element |
| `data-testid="banner-dismiss-button"` | Dismiss button in `TrialCountdownBanner` only | `subscription-banners.tsx:79` | Add to the dismiss `<button>` |

---

## 4. New Helper: `setSubscriptionState()`

Add to `app/test/e2e/helpers/factories.ts`:

```typescript
/**
 * Set a test user's subscription state directly in the DB.
 * Use this instead of triggering Stripe webhooks in E2E tests.
 *
 * Optionally creates a backdated episode to simulate audio minute consumption
 * within the current calendar-month billing period.
 *
 * @param userId  - The Supabase user ID to update
 * @param state   - The desired subscription state
 */
export interface SubscriptionState {
  status: 'trialing' | 'active' | 'past_due' | 'trial_expired' | 'canceled'
  tier?: 'pro' | 'creator' | 'agency'
  trialEndsAt?: Date     // defaults: trialing → now+14d, others → now-1d
  pastDueSince?: Date | null
  minutesConsumed?: number // synthetic audio minutes; creates a backdated episode
}

export async function setSubscriptionState(
  userId: string,
  state: SubscriptionState,
): Promise<void> {
  const admin = getAdminClient()

  // Compute defaults for time fields
  const now = new Date()
  const defaultTrialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const trialEndsAt = state.trialEndsAt
    ?? (state.status === 'trialing' ? defaultTrialEnd : pastDate)

  const { error } = await admin
    .from('users')
    .update({
      subscription_status: state.status,
      subscription_tier: state.tier ?? 'pro',
      trial_ends_at: trialEndsAt.toISOString(),
      past_due_since: state.pastDueSince?.toISOString() ?? null,
    })
    .eq('id', userId)

  if (error) throw new Error(`setSubscriptionState failed: ${error.message}`)

  // If minutesConsumed is specified, create an episode with appropriate
  // audio_duration_seconds so getAudioMinutesUsed() returns that value.
  // The episode is created with created_at = start of current month to ensure
  // it falls within the billing period window.
  if (state.minutesConsumed !== undefined && state.minutesConsumed > 0) {
    // Find the user's first show to attach the episode to
    const { data: shows } = await admin
      .from('shows')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (!shows || shows.length === 0) {
      throw new Error('setSubscriptionState: minutesConsumed requires the user to have at least one show')
    }

    const billingStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const { error: epError } = await admin
      .from('episodes')
      .insert({
        show_id: shows[0].id,
        title: '[TEST] Synthetic usage episode',
        audio_url: 'https://example.test/synthetic.mp3',
        audio_duration_seconds: state.minutesConsumed * 60,
        status: 'completed',
        created_at: billingStart.toISOString(), // within billing period
        metadata: {},
      })

    if (epError) throw new Error(`setSubscriptionState: failed to create usage episode: ${epError.message}`)
  }
}
```

---

## 5. New Page Object: `SubscriptionPage`

Create `app/test/e2e/pages/subscription-page.ts`:

```typescript
/**
 * Page Object: Subscription Banners + Settings Usage
 *
 * Wraps all selectors related to the subscription state machine:
 * - The three status banners in AppShell
 * - The Usage section in Settings > Subscription tab
 * - API usage calls for plan-limit verification
 */
import type { Locator, Page, APIRequestContext } from '@playwright/test'
import { expect } from '@playwright/test'

export class SubscriptionPage {
  constructor(private readonly page: Page) {}

  // ── Banner locators ─────────────────────────────────────────────────────

  trialBanner(): Locator {
    return this.page.getByTestId('subscription-banner-trial')
  }

  pastDueBanner(): Locator {
    return this.page.getByTestId('subscription-banner-past-due')
  }

  blockedBanner(): Locator {
    return this.page.getByTestId('subscription-banner-blocked')
  }

  bannerUpgradeButton(): Locator {
    return this.page.getByTestId('banner-upgrade-button')
  }

  bannerDismissButton(): Locator {
    return this.page.getByTestId('banner-dismiss-button')
  }

  // ── Banner assertions ───────────────────────────────────────────────────

  async expectTrialBanner(daysPattern?: RegExp): Promise<void> {
    await expect(this.trialBanner()).toBeVisible()
    if (daysPattern) {
      await expect(this.trialBanner()).toContainText(daysPattern)
    }
  }

  async expectNoBanner(): Promise<void> {
    await expect(this.trialBanner()).not.toBeVisible()
    await expect(this.pastDueBanner()).not.toBeVisible()
    await expect(this.blockedBanner()).not.toBeVisible()
  }

  async expectPastDueBanner(): Promise<void> {
    await expect(this.pastDueBanner()).toBeVisible()
    await expect(this.pastDueBanner()).toContainText(/Payment failed/i)
  }

  async expectBlockedBanner(reason: 'trial_expired' | 'canceled'): Promise<void> {
    await expect(this.blockedBanner()).toBeVisible()
    if (reason === 'trial_expired') {
      await expect(this.blockedBanner()).toContainText('Your trial has ended.')
    } else {
      await expect(this.blockedBanner()).toContainText('Your subscription has been canceled.')
    }
    // Blocked banner has no dismiss button
    await expect(this.bannerDismissButton()).not.toBeVisible()
  }

  // ── Banner interactions ─────────────────────────────────────────────────

  async dismissTrialBanner(): Promise<void> {
    await this.bannerDismissButton().click()
    await expect(this.trialBanner()).not.toBeVisible()
  }

  async clickUpgradeInBanner(): Promise<void> {
    await this.bannerUpgradeButton().first().click()
  }

  // ── Settings page usage ──────────────────────────────────────────────────

  async goToSettingsSubscription(): Promise<void> {
    await this.page.goto('/settings?tab=subscription')
    await expect(this.page).toHaveURL(/\/settings/)
  }

  usageMeterLabel(): Locator {
    return this.page.getByText('Audio Minutes', { exact: true })
  }

  nearingLimitBanner(): Locator {
    return this.page.getByText("You're nearing your plan limits")
  }

  // ── API helpers ──────────────────────────────────────────────────────────

  /**
   * Call GET /api/usage using the authenticated browser context.
   * Returns the parsed `data` object.
   */
  async getUsageData(): Promise<{
    tier: string
    status: string
    trialEndsAt: string
    pastDueSince: string | null
    audioMinutes: { used: number; limit: number; percentage: number }
    shows: { used: number; limit: number; percentage: number }
  }> {
    const response = await this.page.request.get('/api/usage')
    const json = await response.json()
    return json.data
  }

  /**
   * Attempt to create an episode via the API.
   * Returns the full response for status assertion.
   */
  async attemptCreateEpisode(showId: string): Promise<{ status: number; body: unknown }> {
    const response = await this.page.request.post('/api/episodes', {
      data: {
        show_id: showId,
        audio_url: 'https://example.test/audio.mp3',
        title: '[TEST] API Episode',
      },
    })
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }

  /**
   * Attempt to process an existing episode via the API.
   */
  async attemptProcessEpisode(episodeId: string): Promise<{ status: number; body: unknown }> {
    const response = await this.page.request.post(`/api/episodes/${episodeId}/process`, {
      data: {},
    })
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }

  /**
   * Attempt to create a show via the API.
   */
  async attemptCreateShow(): Promise<{ status: number; body: unknown }> {
    const response = await this.page.request.post('/api/shows', {
      data: { name: '[TEST] API Show', default_language: 'en' },
    })
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }
}
```

---

## 6. P0 Tests — Critical (Must Pass Before Launch)

These 8 tests constitute the "5-minute smoke test." If all pass, the subscription state machine is fundamentally working.

| ID | Test Name | Preconditions | Steps | Expected Result | Selectors Used |
|---|---|---|---|---|---|
| P0-1 | `should show trial countdown banner for new trialing user` | User created, defaults applied (status=trialing, tier=pro, trial_ends_at=+14d) | 1. Sign in → `/episodes` 2. Wait for hydration | `subscription-banner-trial` visible; text matches `/\d+ days? left in your Pro trial/i`; `banner-dismiss-button` visible | `getByTestId('subscription-banner-trial')`, `getByTestId('banner-dismiss-button')` |
| P0-2 | `should show access-blocked banner when trial has expired` | status=trial_expired (set via `setSubscriptionState`) | 1. Sign in → `/episodes` 2. Assert blocked banner | `subscription-banner-blocked` visible; "Your trial has ended."; NO dismiss button | `getByTestId('subscription-banner-blocked')`, `getByTestId('banner-dismiss-button').not.toBeVisible()` |
| P0-3 | `should return 403 from POST /api/episodes when trial has expired` | status=trial_expired, show exists | 1. Sign in 2. Call `page.request.post('/api/episodes', ...)` | HTTP 403; body contains "trial has ended" | `page.request.post()` |
| P0-4 | `should return 403 from POST /api/episodes/[id]/process when trial has expired` | status=trial_expired, pending episode exists with known ID | 1. Sign in 2. Call `page.request.post('/api/episodes/{id}/process')` | HTTP 403; body contains "trial has ended" | `page.request.post()` |
| P0-5 | `should show 3-column pricing grid with no free tier on landing page` | None (public page) | 1. Go to `/` 2. Scroll to `#pricing` | Grid has exactly 3 pricing cards (Pro, Creator, Agency); no "Free" card or "$0" | `getByText('Pro')`, `getByText('Creator')`, `getByText('Agency')`; `getByText('Free').not.toBeVisible()` |
| P0-6 | `should show "Start 14-Day Free Trial" CTA on landing page hero` | None (public page) | 1. Go to `/` 2. Look for hero CTA | Link text is "Start 14-Day Free Trial"; badge text is "14-DAY PRO TRIAL · NO CREDIT CARD REQUIRED" | `getByText('Start 14-Day Free Trial')`, `getByText('14-DAY PRO TRIAL')` |
| P0-7 | `should block episode creation at the minute cap (API 403)` | status=active, minutesConsumed=300 (at Pro limit) | 1. Sign in 2. POST `/api/episodes` | HTTP 403; body contains "minutes this month" | `page.request.post()` |
| P0-8 | `should dismiss trial banner for the session` | status=trialing (fresh user) | 1. Sign in → `/episodes` 2. Assert banner visible 3. Click dismiss 4. Assert banner gone 5. Navigate away and back 6. Assert banner still hidden | Banner hidden after dismiss; remains hidden on same-session navigation | `getByTestId('banner-dismiss-button').click()`, `getByTestId('subscription-banner-trial').not.toBeVisible()` |

---

## 7. P1 Tests — Important

| ID | Test Name | Preconditions | Steps | Expected Result | Selectors Used |
|---|---|---|---|---|---|
| P1-1 | `should show past-due banner with grace period date` | status=past_due, past_due_since=now() | 1. Sign in → `/episodes` | `subscription-banner-past-due` visible; text matches `/Payment failed/i`; date shown matches today+3 days regex `/[A-Z][a-z]+ \d+/` | `getByTestId('subscription-banner-past-due')` |
| P1-2 | `should show no banner for an active paid user` | status=active, tier=pro | 1. Sign in → `/episodes` | None of the 3 banner testids are visible | All three banner `getByTestId(...).not.toBeVisible()` |
| P1-3 | `should show "Reactivate" CTA for canceled user` | status=canceled | 1. Sign in → `/episodes` | `subscription-banner-blocked` visible; text "Your subscription has been canceled."; button text "Reactivate" | `getByTestId('subscription-banner-blocked')`, `getByTestId('banner-upgrade-button')` containing "Reactivate" |
| P1-4 | `should allow trial_expired user to view existing episodes (read-only)` | status=trial_expired, 1 completed episode | 1. Sign in → `/episodes` 2. Assert blocked banner 3. Click episode card | Blocked banner visible AND episode workspace opens (episode detail page loads) | `getByTestId('subscription-banner-blocked')`, episode card click, URL changes to `/episodes/{id}` |
| P1-5 | `should route to /settings?tab=subscription when upgrade clicked` | status=trialing | 1. Sign in → `/episodes` 2. Assert trial banner 3. Click `banner-upgrade-button` | URL changes to `/settings` (subscription tab) | `getByTestId('banner-upgrade-button').click()`, `page.waitForURL(/\/settings/)` |
| P1-6 | `should reflect creator tier minute limit after tier upgrade` | status=active, tier=pro initially | 1. Sign in 2. GET /api/usage → assert limit=300 3. Admin sets tier=creator 4. Reload 5. GET /api/usage | First call: `audioMinutes.limit === 300`; after reload: `audioMinutes.limit === 1200` | `page.request.get('/api/usage')` |
| P1-7 | `should show "Audio Minutes" label in settings usage section` | status=active | 1. Sign in → `/settings` | "Audio Minutes" text visible on page | `getByText('Audio Minutes', { exact: true })` |
| P1-8 | `should show correct tier label in sidebar` | status=active, tier=pro | 1. Sign in → `/episodes` | Sidebar contains "Pro Plan" text (not "Creator Plan" or "Agency Plan") | `getByText('Pro Plan')` |
| P1-9 | `should return 403 from POST /api/shows when trial has expired` | status=trial_expired | 1. Sign in 2. POST `/api/shows` | HTTP 403; body mentions subscription or trial | `page.request.post('/api/shows', ...)` |

---

## 8. P2 Tests — Edge Cases

| ID | Test Name | Preconditions | Steps | Expected Result | Selectors Used |
|---|---|---|---|---|---|
| P2-1 | `should show "Your trial ends today." when trial expires today` | status=trialing, trial_ends_at=today 23:59 | 1. Sign in → `/episodes` | Trial banner shows "Your trial ends today." (not a days count) | `getByTestId('subscription-banner-trial')`, `getByText('Your trial ends today.')` |
| P2-2 | `should use amber styling when ≤3 days remain on trial` | status=trialing, trial_ends_at=now+2d | 1. Sign in → `/episodes` 2. Check banner class | Banner container has amber bg classes (`bg-amber-50`) | `getByTestId('subscription-banner-trial')` has class check or computed background |
| P2-3 | `should use blue styling when >3 days remain on trial` | status=trialing, trial_ends_at=now+7d | 1. Sign in → `/episodes` 2. Check banner class | Banner container has blue bg classes (`bg-blue-50`) | `getByTestId('subscription-banner-trial')` class check |
| P2-4 | `should return correct shape from GET /api/usage including new fields` | status=trialing | 1. Sign in 2. GET /api/usage | Response has `status`, `trialEndsAt`, `pastDueSince`, `audioMinutes.{used,limit,percentage}` | `page.request.get('/api/usage')` |
| P2-5 | `should show trial subtext in landing page pricing section` | None | 1. Go to `/` → `#pricing` | Text "All plans start with a free 14-day Pro trial. No credit card required." visible | `getByText(/14-day Pro trial/)` |
| P2-6 | `should display Pro tier at $29 with 300 min/mo` | None | 1. Go to `/` → scroll to `#pricing` | Pro card shows "$29" and "300 min/mo"; "Most Popular" badge | `getByText('$29')`, `getByText('300')`, `getByText('Most Popular')` |
| P2-7 | `should display Creator tier at $59 with 1,200 min/mo` | None | 1. Go to `/` → scroll to `#pricing` | Creator card shows "$59" and "1,200" | `getByText('$59')`, `getByText(/1,?200/)` |
| P2-8 | `should display Agency tier at $149 with 3,600 min/mo` | None | 1. Go to `/` → scroll to `#pricing` | Agency card shows "$149" and "3,600" | `getByText('$149')`, `getByText(/3,?600/)` |
| P2-9 | `should show "Most Popular" badge only on Pro tier card` | None | 1. Go to `/` → `#pricing` | Exactly 1 element with text "Most Popular" visible | `getByText('Most Popular')` count === 1 |

---

## 9. Test Group Structure in Spec File

```
pricing-subscription-refactor.spec.ts
│
├── describe: 'Subscription Banners [P0]'           — P0-1, P0-2, P0-8
│   ├── beforeAll: createTestUser('sub-banner-p0') with default trialing state
│   ├── test: P0-1 trial banner visible
│   ├── test: P0-2 blocked banner for trial_expired (changes state mid-test)
│   └── test: P0-8 trial banner dismissible
│
├── describe: 'Episode API Enforcement [P0]'        — P0-3, P0-4, P0-7
│   ├── beforeAll: createTestUser('sub-api-p0'), setSubscriptionState(trial_expired)
│   ├── test: P0-3 POST /api/episodes → 403
│   ├── test: P0-4 POST /api/episodes/[id]/process → 403
│   └── test (separate user): P0-7 minute cap enforcement
│
├── describe: 'Landing Page Pricing [P0/P2]'        — P0-5, P0-6, P2-5…P2-9
│   └── No beforeAll needed (all tests are unauthenticated)
│
├── describe: 'Subscription State Banners [P1]'     — P1-1…P1-3, P1-5
│   └── Separate user per state (trialing, active, past_due, canceled)
│       or use a single user and change state between test groups
│
├── describe: 'Read-Only Access [P1]'               — P1-4, P1-9
│   └── beforeAll: user with trial_expired + existing content
│
├── describe: 'Tier Limits & Settings [P1]'         — P1-6, P1-7, P1-8
│   └── beforeAll: active pro user
│
└── describe: 'Banner Edge Cases [P2]'              — P2-1…P2-4
    └── Separate user per edge case (today trial end, ≤3 days, >3 days)
```

---

## 10. Database Seed Requirements

| Group | User State | Extra Data |
|---|---|---|
| Banners P0 | Default trialing (no explicit set needed) | 1 show |
| Episode API P0 | trial_expired | 1 show, 1 pending episode (for process test) |
| Minute Cap P0 | active, minutesConsumed=300 | 1 show, 1 completed episode (auto-created by helper) |
| Banners P1 | 4 separate states: active, past_due, canceled, trialing (for dismiss test) | 1 show each |
| Read-Only P1 | trial_expired | 1 show, 1 completed episode |
| Tier Label P1 | active, tier=pro | 1 show |
| API Usage P1 | active, tier=pro → upgraded to creator mid-test | 1 show |
| Edge Cases P2 | trialing with trial_ends_at=today, +2d, +7d variants | 1 show each |
| Landing Page | None (unauthenticated) | — |

---

## 11. File Modification Summary for Engineer

| File | Action | Detail |
|---|---|---|
| `app/src/components/ui/subscription-banners.tsx` | Modify | Add 5 `data-testid` attributes (see §3) |
| `app/test/e2e/helpers/factories.ts` | Modify | Add `setSubscriptionState()` helper and `SubscriptionState` interface |
| `app/test/e2e/pages/subscription-page.ts` | Create | New Page Object (see §5) |
| `app/test/e2e/flows/pricing-subscription-refactor.spec.ts` | Create | New E2E spec with 27 tests total |
