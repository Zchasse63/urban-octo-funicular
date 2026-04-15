/**
 * Page Object Model: Public Landing Page
 *
 * Wraps selectors and interactions for the marketing landing page at `/`.
 * Used by E2E tests that verify pricing grid accuracy, hero CTA copy, and
 * pricing-section content after the pricing refactor.
 *
 * Selectors prefer stable HTML ids, ARIA roles, and unique text content.
 * The `#pricing` anchor lives in `app/src/app/page.tsx` and is the scroll
 * target for the pricing section.
 */
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class LandingPage {
  constructor(private readonly page: Page) {}

  /** Navigate to the landing page root. */
  async goto(): Promise<void> {
    await this.page.goto('/')
  }

  /**
   * Scroll the pricing section into view. The pricing section has id="pricing"
   * on `app/src/app/page.tsx:322`. Called before any pricing-card assertion.
   */
  async scrollToPricingSection(): Promise<void> {
    await this.page.locator('#pricing').scrollIntoViewIfNeeded()
  }

  // ── Hero section ────────────────────────────────────────────────────────

  /**
   * The "Start 14-Day Free Trial" CTA link(s). The landing page intentionally
   * renders this copy in two places: the hero and a final bottom CTA. Callers
   * should use `.first()` when they only care about the hero instance, or
   * assert `.toHaveCount(2)` to document the dual placement.
   */
  startTrialCtas(): Locator {
    return this.page.getByRole('link', { name: 'Start 14-Day Free Trial' })
  }

  /** The hero social-proof badge text (unique to the hero). */
  heroTrialBadge(): Locator {
    return this.page.getByText('14-DAY PRO TRIAL · NO CREDIT CARD REQUIRED')
  }

  // ── Pricing section ─────────────────────────────────────────────────────

  /** Heading locator for a specific tier card ("Pro", "Creator", "Agency"). */
  tierHeading(tier: 'Pro' | 'Creator' | 'Agency' | 'Free'): Locator {
    return this.page.getByRole('heading', { name: tier, exact: true })
  }

  /**
   * Monthly price text on a pricing card. Uses `exact: true` so that `$29`
   * does not substring-match the `$290/yr` annual caption under the same card.
   */
  monthlyPriceText(price: '$0' | '$29' | '$59' | '$149'): Locator {
    return this.page.getByText(price, { exact: true })
  }

  /** The minute-cap line for a tier ("300 min/mo", "1,200 min/mo", etc). */
  minuteCapText(cap: RegExp): Locator {
    return this.page.getByText(cap)
  }

  /** "Most Popular" badge — appears on exactly one card (Pro). */
  mostPopularBadge(): Locator {
    return this.page.getByText('Most Popular')
  }

  /** The pricing-section subtext about the free trial. */
  pricingSectionSubtext(): Locator {
    return this.page.getByText(
      'All plans start with a free 14-day Pro trial. No credit card required.'
    )
  }

  // ── Composite assertions ────────────────────────────────────────────────

  /**
   * Assert the 3-column pricing grid is present with no free tier leftover.
   * Used by P0-5.
   */
  async expectThreeColumnPricingGrid(): Promise<void> {
    await expect(this.tierHeading('Pro')).toBeVisible()
    await expect(this.tierHeading('Creator')).toBeVisible()
    await expect(this.tierHeading('Agency')).toBeVisible()

    // The free tier must NOT be present (removed in this refactor)
    await expect(this.tierHeading('Free')).not.toBeVisible()
    await expect(this.page.getByText('$0', { exact: false })).not.toBeVisible()
    await expect(
      this.page.getByText('Get Started Free', { exact: false })
    ).not.toBeVisible()
  }

  /**
   * Assert the hero "Start 14-Day Free Trial" CTA is present and visible.
   * The CTA copy is rendered in two places (hero + final section) — this
   * checks both exist and the hero instance is visible.
   */
  async expectHeroTrialCta(): Promise<void> {
    const ctas = this.startTrialCtas()
    await expect(ctas).toHaveCount(2)
    await expect(ctas.first()).toBeVisible()
    await expect(this.heroTrialBadge()).toBeVisible()
  }
}
