/**
 * Page Object Model: RegisterPage
 *
 * Wraps selectors and interactions for `/register`. Selectors sourced
 * from qa-analyst inventory in specs/features/auth-and-rls-analysis.md §3.
 */
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class RegisterPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmInput: Locator
  readonly submitButton: Locator
  readonly mismatchInlineError: Locator
  readonly checkEmailHeading: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel(/email/i)
    this.passwordInput = page.getByLabel(/^password$/i)
    this.confirmInput = page.getByLabel(/confirm password/i)
    this.submitButton = page.getByRole('button', { name: /create account/i })
    this.mismatchInlineError = page.getByText(/passwords do not match/i)
    this.checkEmailHeading = page.getByRole('heading', { name: /check your email/i })
  }

  async goto(): Promise<void> {
    await this.page.goto('/register')
    await expect(this.emailInput).toBeVisible()
  }

  async register(email: string, password: string, confirm: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmInput.fill(confirm)
    await this.submitButton.click()
  }
}
