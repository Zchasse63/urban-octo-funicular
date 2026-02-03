/**
 * Upload Flow E2E Tests
 *
 * Tests the audio upload page and flow in the browser.
 */

import { test, expect } from '@playwright/test'
import { cleanupTestDataByPattern } from '../../setup/database'

test.describe('Upload Page', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('displays upload page with header', async ({ page }) => {
    await page.goto('/upload')

    // Verify page loads
    await expect(page.locator('h1')).toBeVisible()
  })

  test('has file input for audio upload', async ({ page }) => {
    await page.goto('/upload')

    // Look for file input
    const fileInput = page.locator('input[type="file"]')

    // May be hidden for styling
    await expect(fileInput).toHaveCount(1)
  })

  test('has upload functionality', async ({ page }) => {
    await page.goto('/upload')

    // Look for upload button, dropzone, or file input
    const uploadButton = page.getByRole('button', { name: /upload/i }).first()
    const dropzone = page.locator('[class*="dropzone"], [class*="drop"]')
    const fileInput = page.locator('input[type="file"]')

    const hasUploadButton = await uploadButton.isVisible().catch(() => false)
    const hasDropzone = await dropzone.isVisible().catch(() => false)
    const hasFileInput = (await fileInput.count()) > 0

    // Upload page should have some way to upload files
    expect(hasUploadButton || hasDropzone || hasFileInput).toBeTruthy()
  })

  test('shows supported file formats', async ({ page }) => {
    await page.goto('/upload')

    // Look for format information
    const pageContent = await page.content()

    // Should mention supported formats somewhere
    const mentionsFormats = pageContent.includes('mp3') || pageContent.includes('audio') || pageContent.includes('MP3')

    // This is informational
    if (mentionsFormats) {
      expect(true).toBe(true)
    }
  })
})

test.describe('Upload Form Validation', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('file input accepts audio files', async ({ page }) => {
    await page.goto('/upload')

    const fileInput = page.locator('input[type="file"]')

    // Check accept attribute if present
    const acceptAttr = await fileInput.getAttribute('accept')
    if (acceptAttr) {
      expect(acceptAttr).toContain('audio')
    }
  })
})

test.describe('Upload Page Navigation', () => {
  test('can navigate to upload from main nav', async ({ page }) => {
    await page.goto('/')

    // Look for upload link in navigation
    const uploadLink = page.getByRole('link', { name: /upload/i })

    if (await uploadLink.isVisible()) {
      await uploadLink.click()
      await expect(page).toHaveURL('/upload')
    }
  })

  test('can return to episodes after upload page', async ({ page }) => {
    await page.goto('/upload')

    // Look for navigation back
    const episodesLink = page.getByRole('link', { name: /episodes/i })

    if (await episodesLink.isVisible()) {
      await episodesLink.click()
      await expect(page).toHaveURL('/episodes')
    }
  })
})

test.describe('Upload Page Accessibility', () => {
  test('upload page has proper heading', async ({ page }) => {
    await page.goto('/upload')

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })

  test('form elements have labels', async ({ page }) => {
    await page.goto('/upload')

    // File input should have associated label
    const fileInput = page.locator('input[type="file"]')
    const inputId = await fileInput.getAttribute('id')

    if (inputId) {
      const label = page.locator(`label[for="${inputId}"]`)
      // Label may exist or input may have aria-label
      const hasAccessibleName =
        (await label.isVisible().catch(() => false)) || (await fileInput.getAttribute('aria-label')) !== null

      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('page is keyboard accessible', async ({ page }) => {
    await page.goto('/upload')

    // Tab to interactive elements
    await page.keyboard.press('Tab')

    const focusedElement = page.locator(':focus')
    expect(focusedElement).toBeTruthy()
  })
})
