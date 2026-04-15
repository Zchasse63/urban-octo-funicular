/**
 * Pricing Refactor + Subscription State Machine — E2E Tests
 *
 * Guards the revenue-critical invariants introduced by the pricing refactor:
 *   - Blocked users (trial_expired / canceled) cannot trigger expensive API calls
 *   - Trial banner renders correctly and is dismissible per session
 *   - Past-due users retain access during the 3-day grace period
 *   - Minute cap enforcement blocks episode creation at the API layer
 *   - Landing page pricing is accurate (3 tiers, no free card, correct prices)
 *
 * All subscription state changes are simulated via direct Supabase admin writes
 * using setSubscriptionState(). No Stripe webhooks, no cron, no OAuth.
 *
 * Sources:
 *   - specs/features/pricing-subscription-refactor-analysis.md
 *   - specs/plans/pricing-subscription-refactor-test-plan.md
 */

import { test, expect } from '../fixtures/base'
import { getAdminClient, cleanupTestDataByPattern } from '../../setup/database'
import { createTestUser, createTestShow, deleteTestUser, signIn, type TestUser } from '../helpers/auth'
import { createPopulatedEpisode, setSubscriptionState } from '../helpers/factories'
import { SubscriptionPage } from '../pages/subscription-page'
import { LandingPage } from '../pages/landing-page'

// ─────────────────────────────────────────────────────────────────────────────
// P0 — Subscription Banners (Critical smoke tests for banner display)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Subscription Banners [P0]', () => {
  let testUser: TestUser
  let showId: string

  test.beforeAll(async () => {
    testUser = await createTestUser('sub-banner-p0')
    showId = await createTestShow(testUser.id)
    // Default createTestUser sets status=trialing via the DB trigger — no
    // explicit setSubscriptionState needed for the trialing tests.
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P0-1: should show trial countdown banner for new trialing user', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    // Navigate to app — the AppShell always renders banners
    await page.goto('/episodes')

    // Trial banner must be visible with the countdown text
    await sub.expectTrialBanner(/\d+ days? left in your Pro trial|Your trial ends today/i)

    // The dismiss button must be present on the trial banner
    await expect(sub.bannerDismissButton()).toBeVisible()
  })

  test('P0-2: should show access-blocked banner when trial has expired', async ({ page }) => {
    const sub = new SubscriptionPage(page)

    try {
      // Simulate trial expiration mid-test (state changes take effect on reload)
      await setSubscriptionState(testUser.id, {
        status: 'trial_expired',
        trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      })

      await page.goto('/episodes')

      await sub.expectBlockedBanner('trial_expired')
    } finally {
      // ALWAYS restore trialing state — even if the assertion above throws —
      // so that P0-1 and P0-8 (which share this user) still see trialing.
      await setSubscriptionState(testUser.id, { status: 'trialing' })
    }
  })

  test('P0-8: should dismiss trial banner for the session', async ({ page }) => {
    const sub = new SubscriptionPage(page)

    // Ensure trialing state is current
    await setSubscriptionState(testUser.id, { status: 'trialing' })

    await page.goto('/episodes')

    // Banner must be visible before dismissal
    await sub.expectTrialBanner()

    // Click dismiss and confirm it disappears
    await sub.dismissTrialBanner()

    // Navigate away and back — sessionStorage persists within the same context
    await page.goto('/upload')
    await page.goto('/episodes')

    // Banner should still be dismissed (sessionStorage not cleared between navigations)
    await expect(sub.trialBanner()).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// P0 — Episode API Enforcement
// Tests the revenue-critical 403 gates added to /api/episodes and
// /api/episodes/[id]/process for blocked users and minute-capped users.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Episode API Enforcement [P0]', () => {
  // Two users: one trial_expired (for P0-3, P0-4) and one at minute cap (P0-7)
  let blockedUser: TestUser
  let blockedShowId: string
  let pendingEpisodeId: string

  let cappedUser: TestUser
  let cappedShowId: string

  test.beforeAll(async () => {
    const admin = getAdminClient()

    // ── Blocked user setup ──────────────────────────────────────────────────
    blockedUser = await createTestUser('sub-api-blocked-p0')
    blockedShowId = await createTestShow(blockedUser.id)

    // Create a pending episode to use in the process test
    const { data: ep } = await admin
      .from('episodes')
      .insert({
        show_id: blockedShowId,
        title: '[TEST] Pending for process block',
        audio_url: 'https://example.test/pending.mp3',
        audio_duration_seconds: 1800,
        status: 'pending',
        metadata: {},
      })
      .select('id')
      .single()
    if (!ep) throw new Error('Failed to create pending episode for process block test')
    pendingEpisodeId = ep.id

    await setSubscriptionState(blockedUser.id, {
      status: 'trial_expired',
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })

    // ── Minute-capped user setup ────────────────────────────────────────────
    cappedUser = await createTestUser('sub-api-capped-p0')
    cappedShowId = await createTestShow(cappedUser.id)

    // Set active + consume 301 minutes (1 over the 300-min Pro cap)
    await setSubscriptionState(cappedUser.id, {
      status: 'active',
      tier: 'pro',
      minutesConsumed: 301,
    })
  })

  test.afterAll(async () => {
    await deleteTestUser(blockedUser)
    await deleteTestUser(cappedUser)
    await cleanupTestDataByPattern()
  })

  test('P0-3: should return 403 from POST /api/episodes when trial has expired', async ({ page }) => {
    const sub = new SubscriptionPage(page)

    await signIn(page, blockedUser)

    const result = await sub.attemptCreateEpisode(blockedShowId)

    expect(result.status).toBe(403)
    // The error message should mention the trial ending
    const body = result.body as { error?: string }
    expect(body.error ?? '').toMatch(/trial has ended|subscription.*canceled/i)
  })

  test('P0-4: should return 403 from POST /api/episodes/[id]/process when trial has expired', async ({ page }) => {
    const sub = new SubscriptionPage(page)

    await signIn(page, blockedUser)

    const result = await sub.attemptProcessEpisode(pendingEpisodeId)

    expect(result.status).toBe(403)
    const body = result.body as { error?: string }
    expect(body.error ?? '').toMatch(/trial has ended|subscription.*canceled/i)
  })

  test('P0-7: should block episode creation at the minute cap (API 403)', async ({ page }) => {
    const sub = new SubscriptionPage(page)

    await signIn(page, cappedUser)

    const result = await sub.attemptCreateEpisode(cappedShowId)

    expect(result.status).toBe(403)
    const body = result.body as { error?: string }
    // Error message should mention minutes (not "hours" — regression guard)
    expect(body.error ?? '').toMatch(/minutes this month|minute.*limit/i)
    expect(body.error ?? '').not.toMatch(/hours this month/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// P0 + P2 — Landing Page Pricing
// Unauthenticated tests — no user setup required.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Landing Page Pricing [P0/P2]', () => {
  test('P0-5: should show 3-column pricing grid with no free tier', async ({ page }) => {
    const landing = new LandingPage(page)
    await landing.goto()
    await landing.scrollToPricingSection()

    await landing.expectThreeColumnPricingGrid()
  })

  test('P0-6: should show "Start 14-Day Free Trial" CTA on landing page hero', async ({ page }) => {
    const landing = new LandingPage(page)
    await landing.goto()

    // Hero primary CTA — the landing page intentionally renders the same
    // CTA copy in two places (hero + final CTA section). Assert both exist
    // and the hero one is visible.
    await landing.expectHeroTrialCta()
  })

  test('P2-5: should show trial subtext in landing page pricing section', async ({ page }) => {
    const landing = new LandingPage(page)
    await landing.goto()
    await landing.scrollToPricingSection()

    await expect(landing.pricingSectionSubtext()).toBeVisible()
  })

  test('P2-6: should display Pro tier at $29 with 300 min/mo and Most Popular badge', async ({
    page,
  }) => {
    const landing = new LandingPage(page)
    await landing.goto()
    await landing.scrollToPricingSection()

    // Pro price — use exact match so '$29' doesn't also match '$290/yr' (annual subtext)
    await expect(landing.monthlyPriceText('$29')).toBeVisible()
    // Minutes line for Pro
    await expect(landing.minuteCapText(/300.*min\/mo/i)).toBeVisible()
    // Most Popular badge — exactly one
    await expect(landing.mostPopularBadge()).toBeVisible()
  })

  test('P2-7: should display Creator tier at $59 with 1,200 min/mo', async ({ page }) => {
    const landing = new LandingPage(page)
    await landing.goto()
    await landing.scrollToPricingSection()

    // Exact match — '$59' must not also match '$590/yr' (annual subtext)
    await expect(landing.monthlyPriceText('$59')).toBeVisible()
    await expect(landing.minuteCapText(/1[,.]?200.*min\/mo/i)).toBeVisible()
  })

  test('P2-8: should display Agency tier at $149 with 3,600 min/mo', async ({ page }) => {
    const landing = new LandingPage(page)
    await landing.goto()
    await landing.scrollToPricingSection()

    // Exact match — '$149' must not also match '$1490/yr' (annual subtext)
    await expect(landing.monthlyPriceText('$149')).toBeVisible()
    await expect(landing.minuteCapText(/3[,.]?600.*min\/mo/i)).toBeVisible()
  })

  test('P2-9: should show "Most Popular" badge on exactly one pricing card', async ({ page }) => {
    const landing = new LandingPage(page)
    await landing.goto()
    await landing.scrollToPricingSection()

    await expect(landing.mostPopularBadge()).toHaveCount(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Subscription State Banners (per-state user, state set in beforeAll)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Subscription State Banners [P1]', () => {
  // Separate users per subscription state to avoid state bleed between tests
  let activeUser: TestUser
  let pastDueUser: TestUser
  let canceledUser: TestUser
  let trialingUser: TestUser

  test.beforeAll(async () => {
    activeUser = await createTestUser('sub-active-p1')
    await createTestShow(activeUser.id)
    await setSubscriptionState(activeUser.id, { status: 'active', tier: 'pro' })

    pastDueUser = await createTestUser('sub-pastdue-p1')
    await createTestShow(pastDueUser.id)
    await setSubscriptionState(pastDueUser.id, {
      status: 'past_due',
      pastDueSince: new Date(),
    })

    canceledUser = await createTestUser('sub-canceled-p1')
    await createTestShow(canceledUser.id)
    await setSubscriptionState(canceledUser.id, { status: 'canceled' })

    trialingUser = await createTestUser('sub-trialing-p1')
    await createTestShow(trialingUser.id)
    // Default state from createTestUser is already trialing
  })

  test.afterAll(async () => {
    await deleteTestUser(activeUser)
    await deleteTestUser(pastDueUser)
    await deleteTestUser(canceledUser)
    await deleteTestUser(trialingUser)
    await cleanupTestDataByPattern()
  })

  test('P1-1: should show past-due banner with grace period date', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    await signIn(page, pastDueUser)
    await page.goto('/episodes')

    // The past-due banner must be visible with payment failure text
    await sub.expectPastDueBanner()

    // Grace period end date should be displayed (today + 3 days, locale format)
    await expect(sub.pastDueBanner()).toContainText(/[A-Z][a-z]+ \d+/)
  })

  test('P1-2: should show no banner for an active paid user', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    await signIn(page, activeUser)
    await page.goto('/episodes')

    // Active users should not be shown any subscription banner
    await sub.expectNoBanner()
  })

  test('P1-3: should show "Reactivate" CTA for canceled user', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    await signIn(page, canceledUser)
    await page.goto('/episodes')

    await sub.expectBlockedBanner('canceled')

    // The CTA button must say "Reactivate" (not "Upgrade")
    await expect(sub.bannerUpgradeButton()).toContainText('Reactivate')
  })

  test('P1-5: should route to /settings when upgrade button clicked', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    await signIn(page, trialingUser)
    await page.goto('/episodes')

    // Confirm trial banner is visible first
    await sub.expectTrialBanner()

    // Click the upgrade button and confirm navigation
    await sub.clickUpgradeInBanner()
    await page.waitForURL(/\/settings/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/settings/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Read-Only Access After Trial Expires
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Read-Only Access [P1]', () => {
  let testUser: TestUser
  let showId: string
  let episodeId: string

  test.beforeAll(async () => {
    testUser = await createTestUser('sub-readonly-p1')
    showId = await createTestShow(testUser.id)
    // Create a completed episode the user should still be able to read
    episodeId = await createPopulatedEpisode({ showId })
    // Now expire the trial
    await setSubscriptionState(testUser.id, {
      status: 'trial_expired',
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    })
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('P1-4: should allow trial_expired user to view existing episodes (read-only)', async ({
    page,
  }) => {
    const sub = new SubscriptionPage(page)
    await page.goto('/episodes')

    // Blocked banner must be showing
    await sub.expectBlockedBanner('trial_expired')

    // Episode list should still be readable — the user's content is not hidden
    await expect(page.locator('body')).not.toContainText('404')

    // Navigate directly to the episode workspace — read access is still allowed
    await page.goto(`/episodes/${episodeId}`)
    await expect(page).toHaveURL(new RegExp(`/episodes/${episodeId}`))
    await expect(page.locator('body')).not.toContainText('404')
  })

  test('P1-9: should return 403 from POST /api/shows when trial has expired', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    // signIn is handled by the describe block's beforeEach — no duplicate needed

    const result = await sub.attemptCreateShow()

    expect(result.status).toBe(403)
    const body = result.body as { error?: string }
    expect(body.error ?? '').toMatch(/trial|subscription|canceled/i)
  })

  test('P1-10: should return 403 from POST /api/shows/[id]/import when trial has expired', async ({
    page,
  }) => {
    const sub = new SubscriptionPage(page)
    // signIn is handled by the describe block's beforeEach. The blocked user
    // owns `showId` (created in beforeAll above). The import route runs the
    // status check BEFORE parsing the RSS feed, so the fake feedUrl never
    // reaches the parser — the request bails out with 403 first.

    const result = await sub.attemptImportFeed(showId)

    expect(result.status).toBe(403)
    const body = result.body as { error?: string }
    expect(body.error ?? '').toMatch(/trial|subscription|canceled/i)
    // Regression guard: must mention "importing" since that's the action the
    // blocked user was attempting (not a generic "upgrade" message).
    expect(body.error ?? '').toMatch(/importing episodes/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Tier Limits & Settings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Tier Limits & Settings [P1]', () => {
  let proUser: TestUser
  let softLimitUser: TestUser

  test.beforeAll(async () => {
    proUser = await createTestUser('sub-tier-p1')
    await createTestShow(proUser.id)
    await setSubscriptionState(proUser.id, { status: 'active', tier: 'pro' })

    // Separate user pinned at 80% of the Pro minute cap (240 of 300).
    // Isolated from proUser so the P1-6 tier upgrade test doesn't see the
    // synthetic usage episode created by setSubscriptionState.
    softLimitUser = await createTestUser('sub-softlimit-p1')
    await createTestShow(softLimitUser.id)
    await setSubscriptionState(softLimitUser.id, {
      status: 'active',
      tier: 'pro',
      minutesConsumed: 240, // exactly 80% of 300-min Pro cap
    })
  })

  test.afterAll(async () => {
    await deleteTestUser(proUser)
    await deleteTestUser(softLimitUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, proUser)
  })

  test('P1-6: should reflect creator tier minute limit after tier upgrade', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    // signIn is handled by the describe block's beforeEach — no duplicate needed

    // Initial state: Pro tier → 300 min limit
    const before = await sub.getUsageData()
    expect(before.tier).toBe('pro')
    expect(before.audioMinutes.limit).toBe(300)

    // Simulate upgrade to Creator via direct DB write (normally done by Stripe webhook)
    await setSubscriptionState(proUser.id, { status: 'active', tier: 'creator' })

    // Reload so useUsage hook re-fetches from the API
    await page.reload()

    const after = await sub.getUsageData()
    expect(after.tier).toBe('creator')
    expect(after.audioMinutes.limit).toBe(1200)

    // Reset to pro for subsequent tests (re-using the same user across beforeEach)
    await setSubscriptionState(proUser.id, { status: 'active', tier: 'pro' })
  })

  test('P1-7: should show "Audio Minutes" label in settings usage section', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    await sub.goToSettingsSubscription()

    // The usage meter must display "Audio Minutes" — not "Audio Hours" (renamed in refactor)
    await expect(sub.usageMeterLabel()).toBeVisible()
  })

  test('P1-8: should show correct tier label in sidebar', async ({ page }) => {
    await page.goto('/episodes')

    // The sidebar shows "[TierName] Plan" — "Pro Plan" for the pro tier
    await expect(page.getByText('Pro Plan')).toBeVisible()

    // Verify the wrong tier labels are not shown
    await expect(page.getByText('Creator Plan')).not.toBeVisible()
    await expect(page.getByText('Agency Plan')).not.toBeVisible()
    // The old "Free Plan" label must be gone
    await expect(page.getByText('Free Plan')).not.toBeVisible()
  })

  test('P1-11: should show "You\'re nearing your plan limits" banner at 80% minute usage', async ({
    page,
  }) => {
    const sub = new SubscriptionPage(page)
    // beforeEach already signed in as proUser — we need to switch to softLimitUser.
    // Clearing cookies invalidates the existing Supabase session so the /login
    // middleware stops redirecting us to /episodes on the next signIn call.
    await page.context().clearCookies()
    await signIn(page, softLimitUser)
    await sub.goToSettingsSubscription()

    // The soft-limit banner renders when audioMinutes.percentage >= 80.
    // The `nearingLimitBanner()` POM locator matches the copy rendered in
    // `app/src/components/settings/settings-page.tsx:424`.
    await expect(sub.nearingLimitBanner()).toBeVisible()

    // Regression guard: the banner body should mention the user's exact
    // usage (`240 of 300 minutes used.`) so we know the percentage is
    // being read from /api/usage, not hard-coded.
    await expect(
      page.getByText(/240 of 300 minutes used/i)
    ).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// P2 — Banner Edge Cases (countdown precision, urgency styling, API contract)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Banner Edge Cases [P2]', () => {
  let todayUser: TestUser     // trial ends today
  let urgentUser: TestUser    // trial ends in 2 days (≤3 → amber)
  let normalUser: TestUser    // trial ends in 7 days (>3 → blue)
  let apiContractUser: TestUser

  test.beforeAll(async () => {
    // "Today" trial end: simulate the moment the trial just expired but
    // before the daily cron has flipped status to trial_expired. The banner
    // uses `Math.ceil(msRemaining / DAY)` so anything still in the future
    // returns 1 (rounds up). Only a trialEndsAt already in the past produces
    // daysRemaining === 0, which is the condition for the "ends today" copy.
    const justEnded = new Date(Date.now() - 1000) // 1 second ago

    todayUser = await createTestUser('sub-today-p2')
    await createTestShow(todayUser.id)
    await setSubscriptionState(todayUser.id, {
      status: 'trialing',
      trialEndsAt: justEnded,
    })

    // Urgent: 2 days
    const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    urgentUser = await createTestUser('sub-urgent-p2')
    await createTestShow(urgentUser.id)
    await setSubscriptionState(urgentUser.id, {
      status: 'trialing',
      trialEndsAt: in2Days,
    })

    // Normal: 7 days
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    normalUser = await createTestUser('sub-normal-p2')
    await createTestShow(normalUser.id)
    await setSubscriptionState(normalUser.id, {
      status: 'trialing',
      trialEndsAt: in7Days,
    })

    // API contract user
    apiContractUser = await createTestUser('sub-api-p2')
    await createTestShow(apiContractUser.id)
    // Default state is trialing — fine for this test
  })

  test.afterAll(async () => {
    await deleteTestUser(todayUser)
    await deleteTestUser(urgentUser)
    await deleteTestUser(normalUser)
    await deleteTestUser(apiContractUser)
    await cleanupTestDataByPattern()
  })

  test('P2-1: should show "Your trial ends today." when trial expires today', async ({
    page,
  }) => {
    const sub = new SubscriptionPage(page)
    await signIn(page, todayUser)
    await page.goto('/episodes')

    await sub.expectTrialBanner()
    await expect(sub.trialBanner()).toContainText('Your trial ends today.')
  })

  test('P2-2: should use amber styling when ≤3 days remain on trial', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    await signIn(page, urgentUser)
    await page.goto('/episodes')

    await sub.expectTrialBanner()

    // When daysRemaining ≤ 3, the banner div gets bg-amber-50
    const bannerClass = await sub.trialBanner().getAttribute('class')
    expect(bannerClass).toContain('bg-amber-50')
    expect(bannerClass).not.toContain('bg-blue-50')
  })

  test('P2-3: should use blue styling when >3 days remain on trial', async ({ page }) => {
    const sub = new SubscriptionPage(page)
    await signIn(page, normalUser)
    await page.goto('/episodes')

    await sub.expectTrialBanner()

    // When daysRemaining > 3, the banner div gets bg-blue-50
    const bannerClass = await sub.trialBanner().getAttribute('class')
    expect(bannerClass).toContain('bg-blue-50')
    expect(bannerClass).not.toContain('bg-amber-50')
  })

  test('P2-4: should return correct shape from GET /api/usage including new fields', async ({
    page,
  }) => {
    const sub = new SubscriptionPage(page)
    await signIn(page, apiContractUser)
    await page.goto('/episodes')

    const usage = await sub.getUsageData()

    // Status field is new — must be one of the 5 valid states
    expect(['trialing', 'active', 'past_due', 'trial_expired', 'canceled']).toContain(
      usage.status
    )
    // trialEndsAt must be a valid ISO timestamp string
    expect(() => new Date(usage.trialEndsAt).toISOString()).not.toThrow()
    // pastDueSince is null for non-past_due users
    expect(usage.pastDueSince).toBeNull()
    // audioMinutes shape (replacing the old audioHours)
    expect(typeof usage.audioMinutes.used).toBe('number')
    expect(typeof usage.audioMinutes.limit).toBe('number')
    expect(typeof usage.audioMinutes.percentage).toBe('number')
    expect(usage.audioMinutes.limit).toBe(300) // Pro tier
  })
})
