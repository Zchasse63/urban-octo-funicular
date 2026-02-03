/**
 * DIRECT DATABASE ACCESS FOR TEST VERIFICATION
 *
 * After API calls, verify the actual database state.
 * This catches issues where API returns success but DB wasn't updated.
 */

import { getAdminClient } from '../setup/database'

/**
 * Verify a record exists in the database
 */
export async function verifyRecordExists(
  table: string,
  conditions: Record<string, unknown>
): Promise<boolean> {
  const adminClient = getAdminClient()
  let query = adminClient.from(table).select('id')

  for (const [key, value] of Object.entries(conditions)) {
    query = query.eq(key, value)
  }

  const { data, error } = await query.single()
  return !error && data !== null
}

/**
 * Get a single record from the database
 */
export async function getRecord<T>(
  table: string,
  conditions: Record<string, unknown>
): Promise<T | null> {
  const adminClient = getAdminClient()
  let query = adminClient.from(table).select('*')

  for (const [key, value] of Object.entries(conditions)) {
    query = query.eq(key, value)
  }

  const { data, error } = await query.single()

  if (error) {
    return null
  }

  return data as T
}

/**
 * Get multiple records from the database
 */
export async function getRecords<T>(
  table: string,
  conditions: Record<string, unknown> = {}
): Promise<T[]> {
  const adminClient = getAdminClient()
  let query = adminClient.from(table).select('*')

  for (const [key, value] of Object.entries(conditions)) {
    query = query.eq(key, value)
  }

  const { data, error } = await query

  if (error) {
    console.warn(`Failed to get records from ${table}:`, error.message)
    return []
  }

  return (data || []) as T[]
}

/**
 * Verify record count in the database
 */
export async function verifyRecordCount(
  table: string,
  conditions: Record<string, unknown>,
  expectedCount: number
): Promise<boolean> {
  const adminClient = getAdminClient()
  let query = adminClient.from(table).select('id', { count: 'exact' })

  for (const [key, value] of Object.entries(conditions)) {
    query = query.eq(key, value)
  }

  const { count } = await query
  return count === expectedCount
}

/**
 * Get record count in the database
 */
export async function getRecordCount(
  table: string,
  conditions: Record<string, unknown> = {}
): Promise<number> {
  const adminClient = getAdminClient()
  let query = adminClient.from(table).select('id', { count: 'exact', head: true })

  for (const [key, value] of Object.entries(conditions)) {
    query = query.eq(key, value)
  }

  const { count } = await query
  return count || 0
}

/**
 * Insert a record directly (for test setup)
 */
export async function insertRecord<T>(
  table: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const adminClient = getAdminClient()

  const { data: result, error } = await adminClient.from(table).insert(data).select().single()

  if (error) {
    console.warn(`Failed to insert into ${table}:`, error.message)
    return null
  }

  return result as T
}

/**
 * Update a record directly (for test setup)
 */
export async function updateRecord<T>(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const adminClient = getAdminClient()

  const { data: result, error } = await adminClient
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.warn(`Failed to update ${table}:`, error.message)
    return null
  }

  return result as T
}

/**
 * Delete a record directly (for test cleanup)
 */
export async function deleteRecord(table: string, id: string): Promise<boolean> {
  const adminClient = getAdminClient()

  const { error } = await adminClient.from(table).delete().eq('id', id)

  if (error) {
    console.warn(`Failed to delete from ${table}:`, error.message)
    return false
  }

  return true
}
