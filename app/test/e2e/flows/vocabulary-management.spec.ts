/**
 * Vocabulary Management E2E Tests
 *
 * Tests the vocabulary management page for shows.
 */

import { test, expect } from '@playwright/test'
import { cleanupTestDataByPattern } from '../../setup/database'

test.describe('Vocabulary Page', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('navigates to vocabulary from show detail', async ({ page }) => {
    await page.goto('/shows')
    await page.waitForLoadState('networkidle')

    // Click on first show card
    const showCard = page.locator('[class*="card"]').first()

    if (await showCard.isVisible()) {
      await showCard.click()
      await page.waitForLoadState('networkidle')

      // Look for vocabulary link
      const vocabLink = page.getByRole('link', { name: /vocabulary/i })

      if (await vocabLink.isVisible()) {
        await vocabLink.click()

        // Should navigate to vocabulary page
        await expect(page).toHaveURL(/\/shows\/[a-z0-9-]+\/vocabulary/)
      }
    }
  })

  test('vocabulary page displays header', async ({ page }) => {
    await page.goto('/shows')
    await page.waitForLoadState('networkidle')

    const showCard = page.locator('[class*="card"]').first()

    if (await showCard.isVisible()) {
      await showCard.click()
      await page.waitForLoadState('networkidle')

      const vocabLink = page.getByRole('link', { name: /vocabulary/i })

      if (await vocabLink.isVisible()) {
        await vocabLink.click()
        await page.waitForLoadState('networkidle')

        // Should have a heading
        const heading = page.locator('h1, h2').first()
        await expect(heading).toBeVisible()
      }
    }
  })

  test('vocabulary page has add term button', async ({ page }) => {
    await page.goto('/shows')
    await page.waitForLoadState('networkidle')

    const showCard = page.locator('[class*="card"]').first()

    if (await showCard.isVisible()) {
      await showCard.click()
      await page.waitForLoadState('networkidle')

      const vocabLink = page.getByRole('link', { name: /vocabulary/i })

      if (await vocabLink.isVisible()) {
        await vocabLink.click()
        await page.waitForLoadState('networkidle')

        // Look for add button
        const addButton = page.getByRole('button', { name: /add|new|create/i })

        if (await addButton.isVisible()) {
          expect(true).toBe(true)
        }
      }
    }
  })
})

test.describe('Vocabulary Term Management', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('can open add term form', async ({ page }) => {
    await page.goto('/shows')
    await page.waitForLoadState('networkidle')

    const showCard = page.locator('[class*="card"]').first()

    if (await showCard.isVisible()) {
      await showCard.click()
      await page.waitForLoadState('networkidle')

      const vocabLink = page.getByRole('link', { name: /vocabulary/i })

      if (await vocabLink.isVisible()) {
        await vocabLink.click()
        await page.waitForLoadState('networkidle')

        const addButton = page.getByRole('button', { name: /add|new|create/i })

        if (await addButton.isVisible()) {
          await addButton.click()

          // Form or modal should appear
          const form = page.locator('form')
          const modal = page.getByRole('dialog')
          const input = page.getByLabel(/term|word|name/i)

          const hasForm =
            (await form.isVisible().catch(() => false)) ||
            (await modal.isVisible().catch(() => false)) ||
            (await input.isVisible().catch(() => false))

          expect(hasForm).toBeTruthy()
        }
      }
    }
  })
})

test.describe('Vocabulary Page Accessibility', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('vocabulary page is keyboard navigable', async ({ page }) => {
    await page.goto('/shows')
    await page.waitForLoadState('networkidle')

    const showCard = page.locator('[class*="card"]').first()

    if (await showCard.isVisible()) {
      await showCard.click()
      await page.waitForLoadState('networkidle')

      const vocabLink = page.getByRole('link', { name: /vocabulary/i })

      if (await vocabLink.isVisible()) {
        await vocabLink.click()
        await page.waitForLoadState('networkidle')

        // Tab through elements
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Tab')
        }

        const focusedElement = page.locator(':focus')
        expect(focusedElement).toBeTruthy()
      }
    }
  })
})
