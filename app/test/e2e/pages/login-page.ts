/**
 * Page Object Model: LoginPage
 *
 * Wraps selectors and interactions for `/login`. All selectors come from
 * the qa-analyst inventory in specs/features/auth-and-rls-analysis.md §3.
 */
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly googleButton: Locator
  readonly magicLinkButton: Locator
  readonly forgotPasswordLink: Locator
  readonly registerLink: Locator
  readonly magicLinkSentHeading: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel(/email/i)
    this.passwordInput = page.getByLabel(/^password$/i)
    this.submitButton = page.getByRole('button', { name: /^sign in$/i })
    this.googleButton = page.getByRole('button', { name: /continue with google/i })
    this.magicLinkButton = page.getByRole('button', { name: /send me a magic link/i })
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })
    this.registerLink = page.getByRole('link', { name: /create one/i })
    this.magicLinkSentHeading = page.getByRole('heading', { name: /check your email/i })
  }

  async goto(redirect?: string): Promise<void> {
    const url = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
    await this.page.goto(url)
    await expect(this.emailInput).toBeVisible()
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async requestMagicLink(email: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.magicLinkButton.click()
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/)
  }
}
