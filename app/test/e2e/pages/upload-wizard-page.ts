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
    // Matches the actual placeholder "https://example.com/episode.mp3"
    // rendered by the UrlImportPanel component.
    return this.page.getByPlaceholder(/example\.com\/episode|podcasts?|youtube/i)
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

  // ── Step 2 locators (added for core-paid-flow) ────────────────────────

  episodeTitleInput(): Locator {
    return this.page.getByPlaceholder(/Lessons from Marcus Aurelius/i)
  }

  episodeDescriptionInput(): Locator {
    return this.page.getByPlaceholder(/Brief summary of what this episode covers/i)
  }

  guestNameInput(): Locator {
    return this.page.getByPlaceholder(/Full name or "Solo Episode"/i)
  }

  guestBioInput(): Locator {
    return this.page.getByPlaceholder(/Author & Stoic philosopher/i)
  }

  /**
   * Fill any subset of the Step 2 expert-context fields. Each field is
   * located by its component placeholder (stable text tied to the copy
   * of the wizard — no CSS/XPath, and no placeholder-count-dependent
   * indexing). Used by the core-paid-flow happy path (T-001).
   */
  async fillExpertContext(ctx: {
    episodeTitle?: string
    description?: string
    guestName?: string
    guestBio?: string
  }): Promise<void> {
    if (ctx.episodeTitle) {
      await this.episodeTitleInput().fill(ctx.episodeTitle)
    }
    if (ctx.description) {
      await this.episodeDescriptionInput().fill(ctx.description)
    }
    if (ctx.guestName) {
      await this.guestNameInput().fill(ctx.guestName)
    }
    if (ctx.guestBio) {
      await this.guestBioInput().fill(ctx.guestBio)
    }
  }

  // ── Explicit data-testid accessors ────────────────────────────────────

  /**
   * Prefer the data-testid-based submit locator when the test knows it's
   * on step 3. Works for both idle and in-flight labels.
   */
  submitButtonByTestId(): Locator {
    return this.page.getByTestId('upload-submit-button')
  }

  nextButtonByTestId(): Locator {
    return this.page.getByTestId('upload-next-button')
  }
}
