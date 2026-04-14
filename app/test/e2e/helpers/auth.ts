/**
 * Shared authentication helpers for E2E tests.
 *
 * These helpers are used by multiple spec files to create/delete test users
 * and sign them into the real UI. All test artifacts are prefixed with
 * `[TEST]` so the global `cleanupTestDataByPattern()` catches strays.
 */
import type { Page } from '@playwright/test'
import { getAdminClient } from '../../setup/database'

export interface TestUser {
  id: string
  email: string
  password: string
}

/**
 * Create a fresh test user via Supabase admin, insert the corresponding
 * `users` row, and return credentials. Email pattern ensures cleanup.
 *
 * @param tag  Short identifier for the calling test (helps debugging)
 */
export async function createTestUser(tag: string): Promise<TestUser> {
  const admin = getAdminClient()
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `test-${tag}-${uid}@test.local`
  const password = `TestPass-${uid}!`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message ?? 'no user returned'}`)
  }

  // Insert the corresponding public.users row (RLS bypassed via service key)
  const { error: upsertErr } = await admin
    .from('users')
    .upsert({ id: data.user.id, email, name: '[TEST] QA User' }, { onConflict: 'id' })
  if (upsertErr) {
    throw new Error(`Failed to insert users row: ${upsertErr.message}`)
  }

  return { id: data.user.id, email, password }
}

/**
 * Create a show belonging to the given test user. Returns the show id.
 */
export async function createTestShow(userId: string, name?: string): Promise<string> {
  const admin = getAdminClient()
  const showName = name ?? `[TEST] Show ${Date.now()}`
  const { data, error } = await admin
    .from('shows')
    .insert({
      user_id: userId,
      name: showName,
      default_language: 'en',
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Failed to create show: ${error?.message}`)
  return data.id
}

/**
 * Delete a test user and all associated shows/episodes/assets.
 * Safe to call in `afterAll` regardless of test outcome.
 */
export async function deleteTestUser(user: TestUser): Promise<void> {
  const admin = getAdminClient()
  // Shows cascade to episodes → generated_assets via FK constraints
  await admin.from('shows').delete().eq('user_id', user.id)
  await admin.from('users').delete().eq('id', user.id)
  await admin.auth.admin.deleteUser(user.id)
}

/**
 * Sign a user in via the app's real login flow. This sets the Supabase
 * session cookies on the browser context so subsequent navigation works
 * through the Next.js middleware.
 *
 * Throws if the redirect to /episodes does not happen within 10 seconds.
 */
export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(user.email)
  await page.getByLabel(/password/i).fill(user.password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
  // Middleware redirects to /episodes on success
  await page.waitForURL(/\/episodes/, { timeout: 10_000 })
}
