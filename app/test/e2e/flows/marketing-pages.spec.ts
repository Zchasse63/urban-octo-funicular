/**
 * Marketing Pages E2E Tests
 *
 * SKIPPED: Marketing and legal pages (/pricing, /privacy, /terms, /cookies,
 * /guests, /expert-finder, /trending, /competitors) do not exist yet.
 * These tests should be re-enabled when those routes are created.
 */

import { test, expect } from '@playwright/test'

test.describe.skip('Pricing Page', () => {
  test('displays pricing page', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('shows pricing tiers', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')
    const pageContent = await page.content()
    const hasTiers =
      pageContent.includes('Free') || pageContent.includes('Pro') || pageContent.includes('Agency')
    expect(hasTiers).toBeTruthy()
  })
})

test.describe.skip('Legal Pages', () => {
  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})

test.describe.skip('Other Feature Pages', () => {
  test('guests page loads', async ({ page }) => {
    await page.goto('/guests')
    await expect(page.locator('body')).not.toContainText('404')
  })

  test('expert-finder page loads', async ({ page }) => {
    await page.goto('/expert-finder')
    await expect(page.locator('body')).not.toContainText('404')
  })
})
