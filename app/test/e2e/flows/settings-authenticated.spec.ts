/**
 * Authenticated Settings & Analytics Smoke Tests
 *
 * The existing settings-pages.spec.ts tests navigate unauthenticated,
 * which means they mostly verify the middleware redirects correctly.
 * This spec actually signs in and checks that the settings and analytics
 * pages render for a real user.
 *
 * Scope: smoke-level — "does the page load for an authenticated user
 * without crashing or 500ing?" Full interactive coverage (webhook CRUD,
 * team invites, rss token rotation) is out of scope; those would be
 * separate feature-pipeline runs.
 */
import { test, expect } from '../fixtures/base'
import {
  createTestUser,
  createTestShow,
  deleteTestUser,
  signIn,
  type TestUser,
} from '../helpers/auth'
import { cleanupTestDataByPattern } from '../../setup/database'

test.describe('Settings & Analytics (authenticated)', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    testUser = await createTestUser('settings-analytics')
    await createTestShow(testUser.id)
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('settings page loads and has a recognizable heading', async ({ page }) => {
    await page.goto('/settings')
    // Middleware shouldn't redirect us away — we're signed in
    await expect(page).toHaveURL(/\/settings/)
    // h1 should exist (the specific text varies across tabs)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('analytics page loads for a user with no episodes', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page).toHaveURL(/\/analytics/)
    // Should render some kind of heading or empty-state message, not a 500
    await expect(page.locator('body')).not.toContainText(/500|internal server error/i)
  })

  test('analytics page does not show any mock data', async ({ page }) => {
    await page.goto('/analytics')
    // Same regression guard as episode-detail: no Stoicism should leak in
    // via any of the analytics widgets
    const body = await page.locator('body').innerText()
    expect(body).not.toMatch(/Marcus Aurelius/i)
    expect(body).not.toMatch(/\bStoic\b/i)
  })

  test('vocabulary page loads for an authenticated user', async ({ page }) => {
    await page.goto('/vocabulary')
    await expect(page).toHaveURL(/\/vocabulary/)
    await expect(page.locator('body')).not.toContainText(/500|internal server error/i)
  })

  test('experts page loads for an authenticated user', async ({ page }) => {
    await page.goto('/experts')
    await expect(page).toHaveURL(/\/experts/)
    await expect(page.locator('body')).not.toContainText(/500|internal server error/i)
  })

  test('search page loads for an authenticated user', async ({ page }) => {
    await page.goto('/search')
    await expect(page).toHaveURL(/\/search/)
    await expect(page.locator('body')).not.toContainText(/500|internal server error/i)
  })
})
