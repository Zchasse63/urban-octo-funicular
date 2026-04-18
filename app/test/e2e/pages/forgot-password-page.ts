/**
 * Page Object Model: ForgotPasswordPage
 *
 * Wraps selectors and interactions for `/forgot-password`. Selectors
 * sourced from qa-analyst inventory in specs/features/auth-and-rls-analysis.md §3.
 *
 * Critical: the generic success message ("If an account exists with this
 * email, you'll receive instructions…") is hardcoded in the success state
 * — its presence is the success marker. This is the enumeration-mitigation
 * pattern; assertions should rely on its unconditional presence.
 */
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class ForgotPasswordPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly submitButton: Locator
  readonly genericSuccess: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel(/email/i)
    this.submitButton = page.getByRole('button', { name: /send reset link/i })
    this.genericSuccess = page.getByText(/if an account exists with this email/i)
  }

  async goto(): Promise<void> {
    await this.page.goto('/forgot-password')
    await expect(this.emailInput).toBeVisible()
  }

  async request(email: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }
}
