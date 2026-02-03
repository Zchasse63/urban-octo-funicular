#!/usr/bin/env tsx
/**
 * Cleanup Test Data Script
 *
 * Run this script to clean up any stale test data from the database.
 * Useful for CI/CD pipelines or manual cleanup.
 *
 * Usage: npm run test:cleanup
 */

import { cleanupTestDataByPattern, checkDatabaseConnection } from '../setup/database'

async function main(): Promise<void> {
  console.log('=== Test Data Cleanup Script ===\n')

  // Verify database connection
  console.log('Checking database connection...')
  const isConnected = await checkDatabaseConnection()

  if (!isConnected) {
    console.error('ERROR: Cannot connect to database.')
    console.error('Ensure the following environment variables are set:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log('Database connection OK\n')

  // Run cleanup
  console.log('Cleaning up test data...')
  const result = await cleanupTestDataByPattern()

  console.log(`\nCleanup complete: ${result.cleaned} records removed`)
}

main().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
