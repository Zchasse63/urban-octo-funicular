/**
 * Page Object Model: CreateShowDialog
 *
 * Wraps all selectors and interactions for the show-creation feature so
 * individual test files never touch raw locators.
 *
 * Selector strategy: stable HTML IDs (#show-name, #show-description,
 * #show-language), Radix ARIA roles (`role=dialog`, `role=alert`), and
 * stable visible text labels ("Create new show", "Add new show", etc.).
 * No data-testids yet — the Analyst flagged this as a minor gap but all
 * required anchors exist in the source.
 */
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class ShowCreationPage {
  constructor(private readonly page: Page) {}

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/episodes')
    // Wait for the sidebar brand header to confirm hydration
    await expect(this.page.getByText('PodBrain').first()).toBeVisible()
  }

  // ── Sidebar entry points ───────────────────────────────────────────────

  /**
   * Click the show selector when the user has 0 shows. This short-circuits
   * the dropdown and opens the dialog directly.
   */
  async openDialogFromEmptyState(): Promise<void> {
    await this.page.getByRole('button', { name: /Create your first show/i }).click()
  }

  /**
   * Click the show selector to open the dropdown, then click "Add new show"
   * at the bottom of the dropdown.
   *
   * We locate the show selector by finding the button that contains the
   * specific current show name. The caller must pass that name so the
   * locator is unambiguous — there can be multiple buttons containing the
   * show name elsewhere on the page (e.g. episode lists), but in the
   * sidebar the show-selector button is the only one that both contains
   * the show name AND contains the 2-letter initials avatar span.
   */
  async openDialogFromDropdown(currentShowName: string): Promise<void> {
    // Click the sidebar show selector. Match by the visible show name text.
    // `getByRole('button', { name: ... })` checks the accessible name which
    // includes the initials span text + the show name text, so matching by
    // substring of the show name is stable.
    await this.page
      .getByRole('button', { name: new RegExp(currentShowName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .first()
      .click()
    // Then click "Add new show" inside the dropdown
    await this.page.getByRole('button', { name: /Add new show/i }).click()
  }

  // ── Dialog locators ────────────────────────────────────────────────────

  dialog(): Locator {
    return this.page.getByRole('dialog')
  }

  dialogTitle(): Locator {
    return this.dialog().getByText('Create new show', { exact: true })
  }

  nameInput(): Locator {
    return this.page.locator('#show-name')
  }

  descriptionInput(): Locator {
    return this.page.locator('#show-description')
  }

  languageSelect(): Locator {
    return this.page.locator('#show-language')
  }

  submitButton(): Locator {
    return this.dialog().getByRole('button', { name: /Create show|Creating/i })
  }

  cancelButton(): Locator {
    return this.dialog().getByRole('button', { name: /Cancel/i })
  }

  errorAlert(): Locator {
    return this.dialog().getByRole('alert')
  }

  // ── Actions ────────────────────────────────────────────────────────────

  async fillName(name: string): Promise<void> {
    await this.nameInput().fill(name)
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput().fill(description)
  }

  async selectLanguage(code: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ja'): Promise<void> {
    await this.languageSelect().selectOption(code)
  }

  async submit(): Promise<void> {
    await this.submitButton().click()
  }

  /**
   * High-level helper: open the dialog from the empty state, fill, and submit.
   */
  async createShowFromEmptyState(name: string, opts?: { description?: string }): Promise<void> {
    await this.openDialogFromEmptyState()
    await this.expectDialogOpen()
    await this.fillName(name)
    if (opts?.description) await this.fillDescription(opts.description)
    await this.submit()
  }

  // ── Assertions ─────────────────────────────────────────────────────────

  async expectDialogOpen(): Promise<void> {
    await expect(this.dialog()).toBeVisible()
    await expect(this.dialog()).toHaveAttribute('data-state', 'open')
  }

  async expectDialogClosed(): Promise<void> {
    // Radix unmounts on close; wait for the dialog to be hidden/detached
    await expect(this.dialog()).toBeHidden({ timeout: 5000 })
  }

  async expectErrorMessage(pattern: RegExp | string): Promise<void> {
    await expect(this.errorAlert()).toBeVisible()
    await expect(this.errorAlert()).toContainText(pattern)
  }
}
