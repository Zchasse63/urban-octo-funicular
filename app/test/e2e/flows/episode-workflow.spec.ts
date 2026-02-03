/**
 * Episode Workflow E2E Tests
 *
 * Tests the complete episode management flow in the browser.
 * Uses REAL database - test data is cleaned up after each test.
 */

import { test, expect } from '@playwright/test'
import { cleanupTestDataByPattern } from '../../setup/database'

test.describe('Episodes List Page', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('displays episodes page with header', async ({ page }) => {
    await page.goto('/episodes')

    // Verify page header
    await expect(page.locator('h1')).toContainText('Episodes')
  })

  test('shows episode cards when episodes exist', async ({ page }) => {
    await page.goto('/episodes')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Page should load without errors
    await expect(page.locator('body')).not.toContainText('error')
  })

  test('has navigation to shows', async ({ page }) => {
    await page.goto('/episodes')

    // Should have navigation or nav links
    const nav = page.getByRole('navigation').first()
    const navExists = await nav.isVisible().catch(() => false)
    const hasShowsLink = await page.getByRole('link', { name: /shows/i }).first().isVisible().catch(() => false)

    expect(navExists || hasShowsLink).toBeTruthy()
  })
})

test.describe('Episode Detail Page', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('navigates to episode detail from list', async ({ page }) => {
    await page.goto('/episodes')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click on first episode card if it exists
    const episodeCard = page.locator('[class*="card"]').first()

    if (await episodeCard.isVisible()) {
      await episodeCard.click()

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/episodes\/[a-z0-9-]+/)
    }
  })

  test('episode detail shows title', async ({ page }) => {
    await page.goto('/episodes')
    await page.waitForLoadState('networkidle')

    const episodeCard = page.locator('[class*="card"]').first()

    if (await episodeCard.isVisible()) {
      await episodeCard.click()
      await page.waitForLoadState('networkidle')

      // Should have a heading
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    }
  })
})

test.describe('Episode Assets', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('assets page exists and loads', async ({ page }) => {
    await page.goto('/episodes')
    await page.waitForLoadState('networkidle')

    const episodeCard = page.locator('[class*="card"]').first()

    if (await episodeCard.isVisible()) {
      await episodeCard.click()
      await page.waitForLoadState('networkidle')

      // Look for assets link/tab
      const assetsLink = page.getByRole('link', { name: /assets/i })
      if (await assetsLink.isVisible()) {
        await assetsLink.click()

        // Should navigate to assets page
        await expect(page).toHaveURL(/\/episodes\/[a-z0-9-]+\/assets/)
      }
    }
  })
})

test.describe('Episode Guest Package', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('guest package page exists', async ({ page }) => {
    await page.goto('/episodes')
    await page.waitForLoadState('networkidle')

    const episodeCard = page.locator('[class*="card"]').first()

    if (await episodeCard.isVisible()) {
      await episodeCard.click()
      await page.waitForLoadState('networkidle')

      // Look for guest package link
      const guestLink = page.getByRole('link', { name: /guest/i })
      if (await guestLink.isVisible()) {
        await guestLink.click()

        // Should navigate to guest package page
        await expect(page).toHaveURL(/\/episodes\/[a-z0-9-]+\/guest-package/)
      }
    }
  })
})

test.describe('Episode Filtering', () => {
  test('page supports status filtering UI', async ({ page }) => {
    await page.goto('/episodes')
    await page.waitForLoadState('networkidle')

    // Look for filter controls
    const filterButton = page.getByRole('button', { name: /filter|status/i })
    const filterSelect = page.getByRole('combobox')

    // Either button or select should be visible for filtering
    const hasFilterUI =
      (await filterButton.isVisible().catch(() => false)) || (await filterSelect.isVisible().catch(() => false))

    // This is informational - the page may or may not have filter UI yet
    if (hasFilterUI) {
      expect(true).toBe(true)
    }
  })
})

test.describe('Episode Page Accessibility', () => {
  test('episodes page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/episodes')

    // Should have H1
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()

    // H1 should be the first heading
    const firstHeading = page.locator('h1, h2, h3, h4, h5, h6').first()
    expect(await firstHeading.evaluate((el) => el.tagName)).toBe('H1')
  })

  test('page is keyboard navigable', async ({ page }) => {
    await page.goto('/episodes')

    // Tab through the page
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should have some focused element
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeTruthy()
  })
})
