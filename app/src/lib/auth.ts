/**
 * Auth module - DEFERRED for MVP
 * Using single-user mode with DEFAULT_USER_ID
 */

import { DEFAULT_USER_ID } from './constants';
import { createClient } from './supabase/server';

/**
 * Validate auth - returns default user in single-user mode
 */
export async function validateAuth(): Promise<{ userId: string }> {
  // Auth is deferred - always return default user
  return { userId: DEFAULT_USER_ID };
}

/**
 * Verify episode ownership - always passes in single-user mode
 */
export async function verifyEpisodeOwnership(
  episodeId: string,
  _userId?: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('episodes')
    .select('id')
    .eq('id', episodeId)
    .single();

  return !!data;
}

/**
 * Verify show ownership - always passes in single-user mode
 */
export async function verifyShowOwnership(
  showId: string,
  _userId?: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('shows')
    .select('id')
    .eq('id', showId)
    .single();

  return !!data;
}
