/**
 * Page Object Model: Settings → Billing / Subscription Tab
 *
 * Covers the embedded Stripe Checkout dialog interactions. The Stripe
 * iframe itself is NOT interacted with — that's Stripe's sandbox.
 * We assert that:
 *   - Clicking "Upgrade Plan" opens the Radix dialog
 *   - The dialog mounts `<EmbeddedCheckoutProvider>` and sends a POST
 *     to `/api/stripe/checkout` (observable via `page.route` stubs)
 *   - Error state renders when `/api/stripe/checkout` fails
 */
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class SettingsBillingPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/settings?tab=subscription')
    await expect(this.page).toHaveURL(/\/settings/)
  }

  upgradeButton(): Locator {
    return this.page.getByRole('button', { name: /Upgrade Plan/i })
  }

  managePlanButton(): Locator {
    return this.page.getByRole('button', { name: /Manage Plan/i })
  }

  /** The Radix dialog containing the embedded Stripe Checkout. */
  checkoutDialog(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: /Upgrade to/i })
  }

  /** Close button on the dialog — uses aria-label. */
  closeButton(): Locator {
    return this.page.getByRole('button', { name: /^Close$/i })
  }

  /**
   * Error fallback inside the checkout dialog — rendered when
   * `fetchClientSecret` throws.
   */
  checkoutError(): Locator {
    return this.page.getByText(/Checkout failed|Failed to start checkout|Pricing not configured/i)
  }

  /** Click the upgrade button (present for non-agency tiers). */
  async clickUpgrade(): Promise<void> {
    // Either 'Upgrade Plan' or 'Manage Plan' depending on current tier.
    const btn = (await this.upgradeButton().count())
      ? this.upgradeButton()
      : this.managePlanButton()
    await btn.first().click()
  }

  async expectDialogOpen(): Promise<void> {
    await expect(this.checkoutDialog()).toBeVisible()
  }

  async expectDialogClosed(): Promise<void> {
    await expect(this.checkoutDialog()).not.toBeVisible()
  }

  async expectCheckoutError(pattern: RegExp): Promise<void> {
    await expect(this.checkoutError()).toBeVisible()
    await expect(this.checkoutError()).toContainText(pattern)
  }
}
