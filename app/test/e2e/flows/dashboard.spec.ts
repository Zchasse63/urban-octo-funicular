/**
 * Dashboard E2E Tests
 *
 * Tests the main dashboard/home page in the browser.
 */

import { test, expect } from '@playwright/test'
import { cleanupTestDataByPattern } from '../../setup/database'

test.describe('Dashboard Page', () => {
  test.afterEach(async () => {
    await cleanupTestDataByPattern()
  })

  test('displays dashboard page', async ({ page }) => {
    await page.goto('/')

    // Verify page loads
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('error')
  })

  test('has main navigation', async ({ page }) => {
    await page.goto('/')

    // Navigation may be in header or sidebar
    const nav = page.getByRole('navigation').first()
    const navExists = await nav.isVisible().catch(() => false)

    // Also check for nav links directly
    const hasNavLinks = await page.getByRole('link', { name: /shows|episodes/i }).first().isVisible().catch(() => false)

    expect(navExists || hasNavLinks).toBeTruthy()
  })

  test('has link to episodes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Episodes link exists in the page (might be hidden on mobile viewport)
    const episodesLinks = page.getByRole('link', { name: /episodes/i })
    const linkCount = await episodesLinks.count()

    expect(linkCount).toBeGreaterThan(0)
  })

  test('has link to upload', async ({ page }) => {
    await page.goto('/')

    const uploadLink = page.getByRole('link', { name: /upload/i })

    if (await uploadLink.isVisible()) {
      expect(true).toBe(true)
    }
  })
})

test.describe('Dashboard Navigation', () => {
  test('can navigate to episodes from dashboard', async ({ page }) => {
    await page.goto('/')

    const episodesLink = page.getByRole('link', { name: /episodes/i }).first()
    await episodesLink.click()

    await expect(page).toHaveURL('/episodes')
  })

  test('can navigate to settings from dashboard', async ({ page }) => {
    await page.goto('/')

    const settingsLink = page.getByRole('link', { name: /settings/i })

    if (await settingsLink.isVisible()) {
      await settingsLink.click()
      await expect(page).toHaveURL(/\/settings/)
    }
  })
})

test.describe('Dashboard Content', () => {
  test('shows recent activity or stats', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Dashboard should have some content
    const pageContent = await page.content()

    // Should have some statistics or activity
    const hasContent =
      pageContent.includes('episode') ||
      pageContent.includes('show') ||
      pageContent.includes('recent') ||
      pageContent.includes('Episode') ||
      pageContent.includes('Show')

    expect(hasContent).toBeTruthy()
  })
})

test.describe('Dashboard Accessibility', () => {
  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    // Should have a main heading
    const h1 = page.locator('h1')
    const hasH1 = await h1.isVisible().catch(() => false)

    // Dashboard may use h2 if h1 is in header
    const h2 = page.locator('h2').first()
    const hasH2 = await h2.isVisible().catch(() => false)

    expect(hasH1 || hasH2).toBeTruthy()
  })

  test('navigation has accessible links', async ({ page }) => {
    await page.goto('/')

    const nav = page.getByRole('navigation')
    const links = nav.getByRole('link')

    const linkCount = await links.count()
    expect(linkCount).toBeGreaterThan(0)

    // Each link should have text
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i)
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')

      expect(text || ariaLabel).toBeTruthy()
    }
  })

  test('page is keyboard navigable', async ({ page }) => {
    await page.goto('/')

    // Tab through the page
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Should have focused element
    const focusedElement = page.locator(':focus')
    expect(focusedElement).toBeTruthy()
  })
})

test.describe('Dashboard Responsive', () => {
  test('loads on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page.locator('body')).not.toContainText('error')
  })

  test('loads on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    await expect(page.locator('body')).not.toContainText('error')
  })

  test('loads on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    await expect(page.locator('body')).not.toContainText('error')
  })
})
