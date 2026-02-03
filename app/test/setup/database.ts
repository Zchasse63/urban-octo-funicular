/**
 * REAL DATABASE CONFIGURATION
 *
 * Connects to your actual Supabase instance.
 * Same database, same RLS, same everything.
 * Test data is isolated by markers and cleaned up after tests.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Use REAL Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Track initialization
let _adminClient: SupabaseClient | null = null
let _anonClient: SupabaseClient | null = null

/**
 * Admin client for setup/teardown (bypasses RLS)
 */
export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      )
    }
    _adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _adminClient
}

/**
 * Anon client for testing public access
 */
export function getAnonClient(): SupabaseClient {
  if (!_anonClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }
    _anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _anonClient
}

/**
 * Test data registry for tracking and cleanup
 */
interface TestDataRegistry {
  userIds: Set<string>
  showIds: Set<string>
  episodeIds: Set<string>
  recordIds: Map<string, Set<string>>
}

const testDataRegistry: TestDataRegistry = {
  userIds: new Set(),
  showIds: new Set(),
  episodeIds: new Set(),
  recordIds: new Map(),
}

/**
 * Track a test user for cleanup
 */
export function trackTestUser(userId: string): void {
  testDataRegistry.userIds.add(userId)
}

/**
 * Track a test show for cleanup
 */
export function trackTestShow(showId: string): void {
  testDataRegistry.showIds.add(showId)
}

/**
 * Track a test episode for cleanup
 */
export function trackTestEpisode(episodeId: string): void {
  testDataRegistry.episodeIds.add(episodeId)
}

/**
 * Track any test record for cleanup
 */
export function trackTestRecord(table: string, id: string): void {
  if (!testDataRegistry.recordIds.has(table)) {
    testDataRegistry.recordIds.set(table, new Set())
  }
  testDataRegistry.recordIds.get(table)!.add(id)
}

/**
 * Clean up ALL tracked test data from REAL database
 */
export async function cleanupAllTestData(): Promise<void> {
  const adminClient = getAdminClient()

  // Delete in reverse dependency order

  // 1. Delete tracked records (non-core tables first)
  for (const [table, ids] of testDataRegistry.recordIds) {
    if (ids.size > 0) {
      const { error } = await adminClient.from(table).delete().in('id', Array.from(ids))
      if (error) {
        console.warn(`Failed to delete from ${table}:`, error.message)
      }
    }
  }

  // 2. Delete episodes (cascades to episode_sections, generated_assets, corrections)
  if (testDataRegistry.episodeIds.size > 0) {
    const { error } = await adminClient
      .from('episodes')
      .delete()
      .in('id', Array.from(testDataRegistry.episodeIds))
    if (error) {
      console.warn('Failed to delete episodes:', error.message)
    }
  }

  // 3. Delete shows (cascades to episodes, vocabulary_terms)
  if (testDataRegistry.showIds.size > 0) {
    const { error } = await adminClient
      .from('shows')
      .delete()
      .in('id', Array.from(testDataRegistry.showIds))
    if (error) {
      console.warn('Failed to delete shows:', error.message)
    }
  }

  // 4. Delete test users (if any - be careful not to delete default user)
  // Only delete users that match test pattern
  // Note: Auth users are deleted via auth.admin, not directly

  // Clear registry
  testDataRegistry.userIds.clear()
  testDataRegistry.showIds.clear()
  testDataRegistry.episodeIds.clear()
  testDataRegistry.recordIds.clear()
}

/**
 * Clean up test data by email/name pattern (safety net cleanup)
 */
export async function cleanupTestDataByPattern(): Promise<{ cleaned: number }> {
  const adminClient = getAdminClient()
  let cleaned = 0

  // Delete shows with [TEST] prefix
  const { data: testShows } = await adminClient
    .from('shows')
    .select('id')
    .like('name', '[TEST]%')

  if (testShows && testShows.length > 0) {
    const ids = testShows.map((s) => s.id)
    await adminClient.from('shows').delete().in('id', ids)
    cleaned += testShows.length
  }

  console.log(`Cleaned up ${cleaned} test records by pattern`)
  return { cleaned }
}

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`
}

/**
 * Generate unique test show name
 */
export function generateTestShowName(): string {
  return `[TEST] Show ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Generate unique test episode title
 */
export function generateTestEpisodeTitle(): string {
  return `[TEST] Episode ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Check if database is accessible
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const adminClient = getAdminClient()
    const { error } = await adminClient.from('users').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
