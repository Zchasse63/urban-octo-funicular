/**
 * Page Object Model: Upload Wizard
 *
 * Wraps the 3-step upload flow at /upload. Selectors rely on stable visible
 * text and the hidden `<input type=file>` inside the DropZone. No data-testids
 * exist on the wizard yet — flagged by the Analyst as a minor gap.
 */
import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class UploadWizardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/upload')
    // Wait for the step indicator to confirm the wizard mounted
    await expect(this.page.getByText('Select Audio')).toBeVisible()
  }

  // ── Step 1 locators ────────────────────────────────────────────────────

  dropZone(): Locator {
    // The drop zone label switches between these two strings based on
    // whether the queue is empty. The `.or` gives us one resilient locator.
    return this.page
      .getByText('Drag & drop audio files')
      .or(this.page.getByText('Add more files'))
  }

  /**
   * The hidden `<input type=file>` inside the DropZone. `setInputFiles`
   * attaches a file to this element without triggering the native picker.
   */
  hiddenFileInput(): Locator {
    return this.page.locator('input[type="file"]')
  }

  urlTab(): Locator {
    return this.page.getByRole('button', { name: /URL Import/i })
  }

  fileTab(): Locator {
    return this.page.getByRole('button', { name: /File Upload/i })
  }

  urlInput(): Locator {
    return this.page.getByPlaceholder(/youtube.com\/watch/i)
  }

  addToQueueButton(): Locator {
    return this.page.getByRole('button', { name: /Add to Queue/i })
  }

  /**
   * Any queue row in the current step. The rows don't have a stable role;
   * we locate them by the remove button they contain.
   */
  queueItems(): Locator {
    return this.page.locator('[data-queue-item], [aria-label^="Remove "]')
  }

  // ── Navigation buttons ─────────────────────────────────────────────────

  /**
   * The "Next" button on steps 1 and 2. Its actual label is dynamic:
   *   "Continue to Expert Context"  (on step 1)
   *   "Continue to Style & Assets"  (on step 2)
   * On step 3 there is no Next button — `submitButton()` takes its place.
   */
  nextButton(): Locator {
    return this.page.getByRole('button', { name: /^Continue to /i })
  }

  backButton(): Locator {
    return this.page.getByRole('button', { name: /^Back$/i })
  }

  /**
   * The final submit button on Step 3. The label is dynamic:
   *   "Start Processing Episode"  (1 item)
   *   "Start Processing 2 Episodes"  (>1 item)
   *   "Uploading & Processing…"  (in flight)
   */
  submitButton(): Locator {
    return this.page.getByRole('button', {
      name: /Start Processing.*Episode|Uploading .* Processing/,
    })
  }

  // ── Actions ────────────────────────────────────────────────────────────

  async attachFile(filePath: string): Promise<void> {
    await this.hiddenFileInput().setInputFiles(filePath)
  }

  async addUrl(url: string): Promise<void> {
    await this.urlTab().click()
    await this.urlInput().fill(url)
    await this.addToQueueButton().click()
  }

  async clickNext(): Promise<void> {
    await this.nextButton().click()
  }

  async clickBack(): Promise<void> {
    await this.backButton().click()
  }

  async submit(): Promise<void> {
    await this.submitButton().click()
  }

  // ── Assertions ─────────────────────────────────────────────────────────

  async expectStep1Visible(): Promise<void> {
    await expect(this.page.getByText('Select Audio')).toBeVisible()
    await expect(this.dropZone()).toBeVisible()
  }

  async expectStep2Visible(): Promise<void> {
    await expect(this.page.getByText('Expert Context')).toBeVisible()
  }

  async expectStep3Visible(): Promise<void> {
    await expect(this.page.getByText('Style & Assets')).toBeVisible()
  }

  async expectNextDisabled(): Promise<void> {
    await expect(this.nextButton()).toBeDisabled()
  }

  async expectNextEnabled(): Promise<void> {
    await expect(this.nextButton()).toBeEnabled()
  }
}
