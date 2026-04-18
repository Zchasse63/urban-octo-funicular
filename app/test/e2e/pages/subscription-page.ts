/**
 * Page Object Model: Subscription State Banners + Usage
 *
 * Wraps all selectors and interactions for the subscription state machine
 * surface area introduced in the pricing refactor:
 *   - The three status banners rendered by AppShell (trial, past_due, blocked)
 *   - The Settings > Subscription usage meters
 *   - API helper methods that carry the browser's session cookie so
 *     tests can assert on JSON responses without a separate HTTP client
 *
 * Selectors are backed by data-testid attributes added to
 * `app/src/components/ui/subscription-banners.tsx` as part of this pipeline.
 */
import type { Locator, Page } from '@playwright/test'
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

  /** The upgrade/update/reactivate button inside any visible banner. */
  bannerUpgradeButton(): Locator {
    return this.page.getByTestId('banner-upgrade-button')
  }

  /** The dismiss (×) button on the trial countdown banner only. */
  bannerDismissButton(): Locator {
    return this.page.getByTestId('banner-dismiss-button')
  }

  // ── Banner assertions ───────────────────────────────────────────────────

  /**
   * Assert the trial countdown banner is visible.
   * If daysPattern is provided, also assert the banner text matches.
   */
  async expectTrialBanner(daysPattern?: RegExp): Promise<void> {
    await expect(this.trialBanner()).toBeVisible()
    if (daysPattern) {
      await expect(this.trialBanner()).toContainText(daysPattern)
    }
  }

  /** Assert none of the three banners are visible (expected for active users). */
  async expectNoBanner(): Promise<void> {
    await expect(this.trialBanner()).not.toBeVisible()
    await expect(this.pastDueBanner()).not.toBeVisible()
    await expect(this.blockedBanner()).not.toBeVisible()
  }

  /** Assert the past-due payment failure banner is visible. */
  async expectPastDueBanner(): Promise<void> {
    await expect(this.pastDueBanner()).toBeVisible()
    await expect(this.pastDueBanner()).toContainText(/Payment failed/i)
  }

  /**
   * Assert the access-blocked banner is visible with the correct message
   * and that NO dismiss button is present (blocked banner is persistent).
   */
  async expectBlockedBanner(reason: 'trial_expired' | 'canceled'): Promise<void> {
    await expect(this.blockedBanner()).toBeVisible()
    if (reason === 'trial_expired') {
      await expect(this.blockedBanner()).toContainText('Your trial has ended.')
    } else {
      await expect(this.blockedBanner()).toContainText('Your subscription has been canceled.')
    }
    // The blocked banner intentionally has no dismiss button
    await expect(this.bannerDismissButton()).not.toBeVisible()
  }

  // ── Banner interactions ─────────────────────────────────────────────────

  /** Click the dismiss button and assert the trial banner disappears. */
  async dismissTrialBanner(): Promise<void> {
    await this.bannerDismissButton().click()
    await expect(this.trialBanner()).not.toBeVisible()
  }

  /** Click the upgrade/update/reactivate button in whichever banner is visible. */
  async clickUpgradeInBanner(): Promise<void> {
    await this.bannerUpgradeButton().first().click()
  }

  // ── Settings page ────────────────────────────────────────────────────────

  async goToSettingsSubscription(): Promise<void> {
    await this.page.goto('/settings')
    await expect(this.page).toHaveURL(/\/settings/)
  }

  /** The "Audio Minutes" label in the Settings usage meters section. */
  usageMeterLabel(): Locator {
    return this.page.getByText('Audio Minutes', { exact: true })
  }

  /** The nearing-limit warning banner inside the Settings subscription tab. */
  nearingLimitBanner(): Locator {
    return this.page.getByText("You're nearing your plan limits")
  }

  // ── API helpers — use the browser's authenticated session ───────────────

  /**
   * GET /api/usage with the authenticated browser session.
   * Returns the parsed `data` field from the response body.
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
   * Attempt POST /api/episodes and return the raw status + body.
   * Used to assert 403 when subscription access is blocked.
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
   * Attempt POST /api/episodes/{id}/process and return the raw status + body.
   * Used to assert 403 for blocked users and minute-cap enforcement.
   */
  async attemptProcessEpisode(episodeId: string): Promise<{ status: number; body: unknown }> {
    const response = await this.page.request.post(
      `/api/episodes/${episodeId}/process`,
      { data: {} }
    )
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }

  /**
   * Attempt POST /api/shows and return the raw status + body.
   * Used to assert 403 when subscription access is blocked.
   */
  async attemptCreateShow(): Promise<{ status: number; body: unknown }> {
    const response = await this.page.request.post('/api/shows', {
      data: { name: '[TEST] API Show', default_language: 'en' },
    })
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }

  /**
   * Attempt POST /api/shows/{id}/import and return the raw status + body.
   * Used to assert 403 when subscription access is blocked. The server
   * validates status BEFORE parsing the RSS feed, so any syntactically-valid
   * feedUrl is fine — the request never reaches the RSS parser.
   */
  async attemptImportFeed(showId: string): Promise<{ status: number; body: unknown }> {
    const response = await this.page.request.post(`/api/shows/${showId}/import`, {
      data: { feedUrl: 'https://example.test/feed.xml' },
    })
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }

  /**
   * Attempt POST /api/stripe/checkout and return status + body.
   * Used for Stripe checkout route contract tests (validation, rate limit,
   * pricing-not-configured errors).
   */
  async attemptCheckout(
    body: { tier?: string; interval?: string } = {},
  ): Promise<{ status: number; body: { error?: string; clientSecret?: string } }> {
    const response = await this.page.request.post('/api/stripe/checkout', {
      data: body,
    })
    const parsed = await response.json().catch(() => ({}))
    return { status: response.status(), body: parsed }
  }

  /**
   * Attempt POST /api/stripe/portal and return status + body.
   * Returns 404 for users without a Stripe customer ID.
   */
  async attemptPortal(): Promise<{ status: number; body: { error?: string; url?: string } }> {
    const response = await this.page.request.post('/api/stripe/portal')
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }

  /**
   * Attempt POST /api/stripe/upgrade-annual and return status + body.
   * Returns 404 for users without an active subscription.
   */
  async attemptUpgradeAnnual(): Promise<{ status: number; body: { error?: string } }> {
    const response = await this.page.request.post('/api/stripe/upgrade-annual')
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }

  /**
   * Attempt GET /api/stripe/invoices and return status + body.
   * Returns {data: []} for users without a Stripe customer ID.
   */
  async attemptInvoices(): Promise<{ status: number; body: { data?: unknown[]; error?: string } }> {
    const response = await this.page.request.get('/api/stripe/invoices')
    const body = await response.json().catch(() => ({}))
    return { status: response.status(), body }
  }
}
