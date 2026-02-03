/**
 * Playwright Global Teardown
 *
 * Runs once after all E2E tests.
 * Note: Environment variables are loaded in playwright.config.ts
 */

import { cleanupTestDataByPattern } from '../setup/database'

async function globalTeardown(): Promise<void> {
  console.log('\n=== E2E Global Teardown ===\n')

  // Final cleanup of any remaining test data
  console.log('Cleaning up test data...')
  await cleanupTestDataByPattern()

  console.log('\n=== E2E Teardown Complete ===\n')
}

export default globalTeardown
