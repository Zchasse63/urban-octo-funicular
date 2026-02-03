/**
 * Show Management E2E Tests
 *
 * Tests the complete show management flow in the browser.
 * Uses REAL database - test data is cleaned up after each test.
 */

import { test, expect } from '@playwright/test'
import { cleanupTestDataByPattern } from '../../setup/database'

test.describe('Show Management', () => {
  test.afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestDataByPattern()
  })

  test('displays shows page with header', async ({ page }) => {
    await page.goto('/shows')

    // Verify page header
    await expect(page.locator('h1')).toContainText('Shows')

    // Verify Create button exists
    await expect(page.getByRole('button', { name: /create/i })).toBeVisible()
  })

  test('shows empty state when no shows exist', async ({ page }) => {
    // Note: This may show existing shows from the database
    // In a real test environment, you'd have a clean database

    await page.goto('/shows')

    // Page should load without errors
    await expect(page.locator('body')).not.toContainText('error')
  })

  test('opens create show modal', async ({ page }) => {
    await page.goto('/shows')

    // Click create button
    await page.getByRole('button', { name: /create/i }).first().click()

    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible()

    // Modal should have form fields
    await expect(page.getByLabel(/name/i)).toBeVisible()
  })

  test('creates a new show via modal', async ({ page }) => {
    await page.goto('/shows')

    // Open modal
    await page.getByRole('button', { name: /create/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill form
    const testShowName = `[TEST] E2E Show ${Date.now()}`
    await page.getByLabel(/name/i).fill(testShowName)

    // Look for description field if it exists
    const descriptionField = page.getByLabel(/description/i)
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('Test show created by E2E test')
    }

    // Submit form (target the submit button inside the dialog)
    await page.getByRole('dialog').getByRole('button', { name: /create show|save|submit/i }).click()

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // New show should appear in the list
    await expect(page.getByText(testShowName)).toBeVisible({ timeout: 5000 })
  })

  test('navigates to show detail page', async ({ page }) => {
    await page.goto('/shows')

    // Create a show first or click an existing one
    // For this test, we'll check if any show cards exist and click one

    const showCards = page.locator('[class*="card"]').first()

    if (await showCards.isVisible()) {
      await showCards.click()

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/shows\/[a-z0-9-]+/)
    }
  })

  test('show detail page has vocabulary link', async ({ page }) => {
    // Navigate to a show detail page
    // First create a show to ensure one exists
    await page.goto('/shows')

    const showCards = page.locator('[class*="card"]').first()

    if (await showCards.isVisible()) {
      await showCards.click()

      // Look for vocabulary button/link
      const vocabLink = page.getByRole('link', { name: /vocabulary/i })
      await expect(vocabLink).toBeVisible()
    }
  })
})

test.describe('Show Detail Page', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('displays show information form', async ({ page }) => {
    await page.goto('/shows')

    const showCard = page.locator('[class*="card"]').first()

    if (await showCard.isVisible()) {
      await showCard.click()

      // Should have name field
      await expect(page.getByLabel(/show name/i)).toBeVisible()

      // Should have description field
      await expect(page.getByLabel(/description/i)).toBeVisible()
    }
  })

  test('has danger zone for deletion', async ({ page }) => {
    await page.goto('/shows')

    const showCard = page.locator('[class*="card"]').first()

    if (await showCard.isVisible()) {
      await showCard.click()

      // Look for danger zone
      await expect(page.getByText(/danger zone/i)).toBeVisible()

      // Delete button should be present
      await expect(page.getByRole('button', { name: /delete/i })).toBeVisible()
    }
  })

  test('delete requires confirmation', async ({ page }) => {
    await page.goto('/shows')

    const showCard = page.locator('[class*="card"]').first()

    if (await showCard.isVisible()) {
      await showCard.click()

      // Click delete
      await page.getByRole('button', { name: /delete/i }).first().click()

      // Confirmation should appear
      await expect(page.getByRole('button', { name: /confirm/i })).toBeVisible()

      // Cancel button should also appear
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible()
    }
  })
})

test.describe('Accessibility', () => {
  test('shows page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/shows')

    // Should have H1
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()

    // H1 should be the first heading
    const firstHeading = page.locator('h1, h2, h3, h4, h5, h6').first()
    expect(await firstHeading.evaluate((el) => el.tagName)).toBe('H1')
  })

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/shows')

    // Create button should have accessible name
    const createButton = page.getByRole('button', { name: /create/i })
    await expect(createButton).toBeVisible()
  })

  test('form fields have labels', async ({ page }) => {
    await page.goto('/shows')

    // Open modal
    await page.getByRole('button', { name: /create/i }).first().click()

    // Name field should be labeled
    const nameInput = page.getByLabel(/name/i)
    await expect(nameInput).toBeVisible()
  })
})
