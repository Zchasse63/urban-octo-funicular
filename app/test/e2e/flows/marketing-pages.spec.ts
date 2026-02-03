/**
 * Marketing Pages E2E Tests
 *
 * Tests the marketing and legal pages in the browser.
 */

import { test, expect } from '@playwright/test'

test.describe('Pricing Page', () => {
  test('displays pricing page', async ({ page }) => {
    await page.goto('/pricing')

    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('shows pricing tiers', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')

    const pageContent = await page.content()

    // Should show tier names
    const hasTiers =
      pageContent.includes('Free') || pageContent.includes('Pro') || pageContent.includes('Agency')

    expect(hasTiers).toBeTruthy()
  })

  test('shows pricing amounts', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')

    const pageContent = await page.content()

    // Should show prices
    const hasPrices = pageContent.includes('$') || pageContent.includes('month')

    expect(hasPrices).toBeTruthy()
  })

  test('has call-to-action buttons', async ({ page }) => {
    await page.goto('/pricing')

    const ctaButton = page.getByRole('button', { name: /start|subscribe|get started|sign up/i })
    const ctaLink = page.getByRole('link', { name: /start|subscribe|get started|sign up/i })

    const hasCTA =
      (await ctaButton.first().isVisible().catch(() => false)) ||
      (await ctaLink.first().isVisible().catch(() => false))

    expect(hasCTA).toBeTruthy()
  })
})

test.describe('Support Page', () => {
  test('displays support page', async ({ page }) => {
    await page.goto('/support')

    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('has contact information or form', async ({ page }) => {
    await page.goto('/support')
    await page.waitForLoadState('networkidle')

    const pageContent = await page.content()

    // Should have some contact method
    const hasContact =
      pageContent.includes('email') ||
      pageContent.includes('contact') ||
      pageContent.includes('help') ||
      pageContent.includes('support')

    expect(hasContact).toBeTruthy()
  })
})

test.describe('Legal Pages', () => {
  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy')

    await expect(page.locator('h1, h2').first()).toBeVisible()

    const pageContent = await page.content()
    expect(pageContent.toLowerCase()).toContain('privacy')
  })

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms')

    await expect(page.locator('h1, h2').first()).toBeVisible()

    const pageContent = await page.content()
    expect(pageContent.toLowerCase()).toContain('terms')
  })

  test('cookies page loads', async ({ page }) => {
    await page.goto('/cookies')

    await expect(page.locator('h1, h2').first()).toBeVisible()

    const pageContent = await page.content()
    expect(pageContent.toLowerCase()).toContain('cookie')
  })
})

test.describe('Other Feature Pages', () => {
  test('guests page loads', async ({ page }) => {
    await page.goto('/guests')

    // Should load without error
    await expect(page.locator('body')).not.toContainText('404')
  })

  test('expert-finder page loads', async ({ page }) => {
    await page.goto('/expert-finder')

    // Should load without error
    await expect(page.locator('body')).not.toContainText('404')
  })

  test('trending page loads', async ({ page }) => {
    await page.goto('/trending')

    // Should load without error
    await expect(page.locator('body')).not.toContainText('404')
  })

  test('competitors page loads', async ({ page }) => {
    await page.goto('/competitors')

    // Should load without error
    await expect(page.locator('body')).not.toContainText('404')
  })
})

test.describe('Marketing Pages Accessibility', () => {
  test('pricing page has proper heading', async ({ page }) => {
    await page.goto('/pricing')

    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('support page has proper heading', async ({ page }) => {
    await page.goto('/support')

    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('legal pages are readable', async ({ page }) => {
    await page.goto('/privacy')

    // Should have substantial content
    const pageContent = await page.content()
    expect(pageContent.length).toBeGreaterThan(1000)
  })
})
