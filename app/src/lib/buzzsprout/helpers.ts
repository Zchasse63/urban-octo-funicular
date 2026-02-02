import { createClient } from '@/lib/supabase/server';
import { BuzzsproutClient } from './client';
import { decryptCredentials } from './encryption';
import { BuzzsproutCredentials } from './types';

// Defense-in-depth: decrypt credentials in isolated function to prevent exposure in stack traces
// Only select id, fetch credentials internally within encryption boundary
async function getDecryptedCredentials(connectionId: string): Promise<BuzzsproutCredentials> {
  const supabase = await createClient();

  // Retrieve encrypted credentials in isolated context
  const { data: connection, error } = await supabase
    .from('hosting_connections')
    .select('credentials')
    .eq('id', connectionId)
    .single();

  if (error || !connection) {
    throw new Error('Connection not found');
  }

  try {
    return decryptCredentials(connection.credentials) as BuzzsproutCredentials;
  } catch (error) {
    // Catch decryption errors before they propagate with credentials in stack trace
    throw new Error('Failed to decrypt connection credentials');
  }
}

export async function getBuzzsproutClient(userId: string): Promise<BuzzsproutClient> {
  const supabase = await createClient();

  // Defense-in-depth: select only id, not credentials column
  // Credentials retrieved and decrypted in isolated boundary function
  const { data: connection, error } = await supabase
    .from('hosting_connections')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', 'buzzsprout')
    .eq('status', 'active')
    .single();

  if (error || !connection) {
    throw new Error('No Buzzsprout connection found');
  }

  const credentials = await getDecryptedCredentials(connection.id);
  return new BuzzsproutClient(credentials.api_token);
}
