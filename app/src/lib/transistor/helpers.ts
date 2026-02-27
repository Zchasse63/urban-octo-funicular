/**
 * Transistor.fm Helpers
 * Follows the same pattern as the Buzzsprout helpers.
 */

import { createClient } from '@/lib/supabase/server';
import { TransistorClient } from './client';
import { decryptCredentials } from '@/lib/buzzsprout/encryption';
import type { TransistorCredentials } from './types';

/**
 * Defense-in-depth: decrypt credentials in isolated function
 * to prevent exposure in stack traces.
 */
async function getDecryptedCredentials(connectionId: string): Promise<TransistorCredentials> {
  const supabase = await createClient();

  const { data: connection, error } = await supabase
    .from('hosting_connections')
    .select('credentials')
    .eq('id', connectionId)
    .single();

  if (error || !connection) {
    throw new Error('Connection not found');
  }

  try {
    return decryptCredentials(connection.credentials) as TransistorCredentials;
  } catch {
    throw new Error('Failed to decrypt connection credentials');
  }
}

/**
 * Get an authenticated Transistor client for a user.
 * Looks up the user's active Transistor hosting connection
 * and returns a configured client.
 */
export async function getTransistorClient(userId: string): Promise<TransistorClient> {
  const supabase = await createClient();

  // Select only the connection ID; credentials are fetched in an isolated boundary
  const { data: connection, error } = await supabase
    .from('hosting_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', 'transistor')
    .eq('status', 'active')
    .single();

  if (error || !connection) {
    throw new Error('No Transistor connection found');
  }

  const credentials = await getDecryptedCredentials(connection.id);
  return new TransistorClient(credentials.api_key);
}
