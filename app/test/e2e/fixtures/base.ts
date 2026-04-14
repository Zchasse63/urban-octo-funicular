/**
 * Extended Playwright test fixture with global regression guards.
 *
 * Every test that imports `test` from this module gets:
 *   1. `expectNoMockData` automatic after-test check — the page body
 *      text is scanned for Stoicism/Marcus Aurelius strings that were
 *      hardcoded in the original episode-detail mock data. If any match,
 *      the test fails even if the explicit assertions passed.
 *   2. `safeSignIn` helper accessible as a test-scoped helper.
 *
 * Import this from new specs instead of `@playwright/test`:
 *
 *   import { test, expect } from '../fixtures/base'
 */
import { test as base, expect, type Page } from '@playwright/test'

/**
 * Brute-force regression guard — catches any reintroduction of the
 * Stoicism / Marcus Aurelius mock data regardless of which tab it
 * surfaces in, by scanning the whole body text.
 *
 * Runs as `afterEach` on every test using this fixture.
 */
export async function assertNoMockData(page: Page): Promise<void> {
  // Only run the check if the page actually navigated somewhere — tests
  // that never loaded a page (e.g. API-only tests) have no body to scan.
  const url = page.url()
  if (url === 'about:blank' || url === '') return

  const bodyText = await page.locator('body').innerText().catch(() => '')
  if (!bodyText) return

  const forbidden = [
    { pattern: /Marcus Aurelius/i, label: 'Marcus Aurelius' },
    { pattern: /\bStoic\b/i, label: 'Stoic' },
    { pattern: /\bMeditations\b/i, label: 'Meditations' },
    { pattern: /The Stoic Entrepreneur/i, label: 'The Stoic Entrepreneur' },
    { pattern: /Daily Stoic/i, label: 'Daily Stoic' },
  ]

  for (const { pattern, label } of forbidden) {
    expect(
      bodyText,
      `Mock data regression: "${label}" detected on ${url}. ` +
        'The MOCK_* constants were removed from episode-detail.tsx — something has reintroduced them.'
    ).not.toMatch(pattern)
  }
}

/**
 * Extended `test` fixture. Identical API to `@playwright/test.test`
 * plus the global `assertNoMockData` check after every test.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page)
    // Fire after the test body completes, before teardown. If the
    // mock-data check fails, the test fails with a clear error.
    await assertNoMockData(page)
  },
})

export { expect }
