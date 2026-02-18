/**
 * Global Setup for Vitest
 *
 * Runs once before all tests.
 * Verifies database connection and prepares test environment.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

export default async function globalSetup(): Promise<void> {
  // Load environment variables FIRST before any other imports
  config({ path: resolve(__dirname, '../../.env.local') })

  console.log('\n=== Global Test Setup ===\n')

  // Dynamic import after env vars are loaded
  const { checkDatabaseConnection, cleanupTestDataByPattern } = await import('./database')

  // 1. Verify database connection
  console.log('Checking database connection...')
  const isConnected = await checkDatabaseConnection()

  if (!isConnected) {
    console.warn(
      '⚠️  Database is not available. Integration tests requiring live DB will be skipped.\n' +
      '   Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set and the Supabase project is active.'
    )
    // Set a global flag so tests can check and skip
    process.env.TEST_DB_AVAILABLE = 'false'
  } else {
    process.env.TEST_DB_AVAILABLE = 'true'
    console.log('Database connection verified')

    // 2. Clean up any stale test data from previous runs
    console.log('Cleaning up stale test data...')
    await cleanupTestDataByPattern()
  }

  console.log('\n=== Global Setup Complete ===\n')
}
