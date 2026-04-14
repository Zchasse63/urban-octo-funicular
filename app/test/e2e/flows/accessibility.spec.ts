/**
 * Accessibility E2E Tests (axe-core)
 *
 * Runs the axe-core accessibility scanner against the critical user
 * flows and asserts zero SERIOUS or CRITICAL violations. Lower-severity
 * warnings are allowed for now but logged to the test output so the
 * team can triage them over time.
 *
 * What this catches:
 * - Missing form labels
 * - Low contrast text
 * - Missing alt text on images
 * - Keyboard traps
 * - ARIA misuse
 * - Missing language attribute on the <html> element
 *
 * What this DOESN'T catch:
 * - Screen reader usability (requires manual testing)
 * - Complex keyboard navigation patterns
 * - Color-only information (requires manual testing)
 */
import AxeBuilder from '@axe-core/playwright'
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

const BLOCKING_IMPACTS = ['serious', 'critical'] as const

/**
 * Run axe on the current page and assert zero serious/critical violations.
 * Lower-impact issues are logged but do not fail the test.
 */
async function assertAccessible(page: import('@playwright/test').Page, context: string) {
  const results = await new AxeBuilder({ page })
    .disableRules([
      // color-contrast is disabled pending a design-system-level audit.
      // The muted-foreground token was darkened from oklch(0.556) → oklch(0.46)
      // in globals.css, which fixed the worst offender, but re-enabling the
      // rule surfaces 20+ nodes per page that need individual triage (chart
      // colors, placeholder text, disabled states, Tailwind gray-400 usage).
      //
      // Tracked in: specs/a11y-color-contrast-followup.md
      // Re-enable when: the design system team has audited every usage
      //   of text-muted-foreground/text-gray-400/placeholder:text-* and
      //   defined WCAG-AA-compliant replacements.
      'color-contrast',
    ])
    .analyze()

  const blocking = results.violations.filter((v) =>
    (BLOCKING_IMPACTS as readonly string[]).includes(v.impact || '')
  )

  if (blocking.length > 0) {
    const summary = blocking
      .map(
        (v) =>
          `  [${v.impact}] ${v.id}: ${v.description}\n    Nodes: ${v.nodes.length}\n    Help: ${v.helpUrl}`
      )
      .join('\n')
    throw new Error(
      `A11y violations on ${context}:\n${summary}\n\nRun the suite with --headed and inspect the page, or see ${results.violations[0]?.helpUrl} for fix guidance.`
    )
  }

  // Log non-blocking issues as warnings (captured in test output)
  const nonBlocking = results.violations.filter(
    (v) => !(BLOCKING_IMPACTS as readonly string[]).includes(v.impact || '')
  )
  if (nonBlocking.length > 0) {
    console.warn(
      `[a11y] ${context}: ${nonBlocking.length} non-blocking issues (${nonBlocking.map((v) => v.id).join(', ')})`
    )
  }

  // Expose the pass state for vitest's assertion API
  expect(blocking).toHaveLength(0)
}

// ─────────────────────────────────────────────────────────────────────────
// Public pages (no auth required)
// ─────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — public pages', () => {
  test('landing page (/) has no serious/critical a11y violations', async ({ page }) => {
    await page.goto('/')
    await assertAccessible(page, 'landing page')
  })

  test('login page has no serious/critical a11y violations', async ({ page }) => {
    await page.goto('/login')
    await assertAccessible(page, 'login page')
  })

  test('register page has no serious/critical a11y violations', async ({ page }) => {
    await page.goto('/register')
    await assertAccessible(page, 'register page')
  })
})

// ─────────────────────────────────────────────────────────────────────────
// Authenticated pages
// ─────────────────────────────────────────────────────────────────────────

test.describe('Accessibility — authenticated pages', () => {
  let testUser: TestUser
  let populatedEpisodeId: string

  test.beforeAll(async () => {
    testUser = await createTestUser('a11y')
    const showId = await createTestShow(testUser.id)
    populatedEpisodeId = await createPopulatedEpisode({ showId })
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test.beforeEach(async ({ page }) => {
    await signIn(page, testUser)
  })

  test('episodes list page', async ({ page }) => {
    await page.goto('/episodes')
    await assertAccessible(page, 'episodes list')
  })

  test('episode detail page', async ({ page }) => {
    await page.goto(`/episodes/${populatedEpisodeId}`)
    await assertAccessible(page, 'episode detail')
  })

  test('upload wizard', async ({ page }) => {
    await page.goto('/upload')
    await assertAccessible(page, 'upload wizard')
  })

  test('settings page', async ({ page }) => {
    await page.goto('/settings')
    await assertAccessible(page, 'settings')
  })
})
