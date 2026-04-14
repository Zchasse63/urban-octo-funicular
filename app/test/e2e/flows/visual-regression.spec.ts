/**
 * Visual Regression Tests (Playwright native snapshots)
 *
 * Uses Playwright's built-in `toHaveScreenshot()` matcher — no Percy or
 * Chromatic subscription needed. Screenshots are stored in
 * `test/e2e/flows/visual-regression.spec.ts-snapshots/` and diffed on
 * every run.
 *
 * First run: `npx playwright test visual-regression --update-snapshots`
 *   This generates the baseline images. Review them manually and commit.
 *
 * Subsequent runs: `npx playwright test visual-regression`
 *   Diffs against the baselines. Test fails if pixels differ more than
 *   the threshold allows.
 *
 * Gotchas:
 * - Animations disabled via `{ animations: 'disabled' }`
 * - Time-sensitive content (timestamps, "time ago") can cause false positives
 * - Fonts must be loaded; use `waitForFunction` to check document.fonts.ready
 * - Dev server needs to be running
 */
import { test, expect } from '../fixtures/base'
import {
  createTestUser,
  createTestShow,
  deleteTestUser,
  signIn,
  type TestUser,
} from '../helpers/auth'
import { createPopulatedEpisode } from '../helpers/factories'
import { cleanupTestDataByPattern } from '../../setup/database'

/**
 * Wait for fonts, suspense boundaries, and animations to settle before
 * snapshotting. Reduces flakes.
 */
async function waitForStability(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  // Give motion/react animations a beat to finish
  await page.waitForTimeout(500)
}

// Visual regression tests are skipped by default until baselines are
// generated for this machine/CI. To enable:
//   1. Run `npx playwright test visual-regression --update-snapshots`
//   2. Review the generated .png files in the snapshots directory
//   3. Commit the approved baselines
//   4. Remove the `.skip` below (or convert to a separate project)
test.describe.skip('Visual Regression — public pages', () => {
  test('landing page looks right', async ({ page }) => {
    await page.goto('/')
    await waitForStability(page)
    await expect(page).toHaveScreenshot('landing.png', {
      fullPage: true,
      animations: 'disabled',
      // Allow 0.2% pixel difference to absorb OS-level font rendering
      maxDiffPixelRatio: 0.002,
    })
  })

  test('login page looks right', async ({ page }) => {
    await page.goto('/login')
    await waitForStability(page)
    await expect(page).toHaveScreenshot('login.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.002,
    })
  })
})

test.describe.skip('Visual Regression — authenticated pages', () => {
  let testUser: TestUser
  let populatedEpisodeId: string

  test.beforeAll(async () => {
    testUser = await createTestUser('visual')
    const showId = await createTestShow(testUser.id)
    populatedEpisodeId = await createPopulatedEpisode({
      showId,
      title: '[TEST] Visual Fixture',
      guestName: 'Visual Guest',
    })
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('episode detail page looks right', async ({ page }) => {
    await page.goto(`/episodes/${populatedEpisodeId}`)
    await waitForStability(page)
    // Mask timestamps and dynamic counters that change per-run
    await expect(page).toHaveScreenshot('episode-detail.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.005,
      mask: [
        page.locator('text=/\\d+:\\d+/'), // mm:ss durations
        page.locator('[data-testid="sidebar-show-selector"]'), // has random test user info
      ],
    })
  })

  test('upload wizard step 1 looks right', async ({ page }) => {
    await page.goto('/upload')
    await waitForStability(page)
    await expect(page).toHaveScreenshot('upload-wizard-step-1.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.005,
      mask: [
        page.locator('[data-testid="sidebar-show-selector"]'),
      ],
    })
  })
})
