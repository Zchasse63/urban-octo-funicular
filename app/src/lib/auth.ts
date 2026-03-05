/**
 * Auth module - Supabase Auth integration
 * Provides authentication utilities for API routes and server components
 */

import { createClient } from './supabase/server'

/**
 * Get the authenticated user from the current request context.
 * Returns the user ID or null if not authenticated.
 * In API routes, use this instead of DEFAULT_USER_ID.
 */
export async function getAuthUser(): Promise<{ userId: string; email: string } | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return {
    userId: user.id,
    email: user.email || '',
  }
}

/**
 * Require authentication - throws/returns 401 response data if not authenticated.
 * Use in API route handlers.
 */
export async function requireAuth(): Promise<{ userId: string; email: string }> {
  const user = await getAuthUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Verify episode ownership - checks if the episode belongs to the user's show
 */
export async function verifyEpisodeOwnership(
  episodeId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('episodes')
    .select('id, shows!inner(user_id)')
    .eq('id', episodeId)
    .eq('shows.user_id', userId)
    .single()

  return !!data
}

/**
 * Verify show ownership - checks if the show belongs to the user
 */
export async function verifyShowOwnership(
  showId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shows')
    .select('id')
    .eq('id', showId)
    .eq('user_id', userId)
    .single()

  return !!data
}

// Re-export from canonical location so existing callers don't break
export { isValidUUID } from './validation'
