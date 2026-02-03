/**
 * Playwright Global Setup
 *
 * Runs once before all E2E tests.
 * Note: Environment variables are loaded in playwright.config.ts
 */

import { cleanupTestDataByPattern, checkDatabaseConnection } from '../setup/database'

async function globalSetup(): Promise<void> {
  console.log('\n=== E2E Global Setup ===\n')

  // Verify database connection
  console.log('Checking database connection...')
  const isConnected = await checkDatabaseConnection()

  if (!isConnected) {
    throw new Error(
      'Cannot connect to database. Ensure environment variables are set correctly.'
    )
  }
  console.log('Database connection verified')

  // Clean up stale test data
  console.log('Cleaning up stale test data...')
  await cleanupTestDataByPattern()

  console.log('\n=== E2E Setup Complete ===\n')
}

export default globalSetup
