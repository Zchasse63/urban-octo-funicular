/**
 * Auth helpers for live integration tests.
 *
 * Creates a dedicated test user via Supabase Auth, obtains a session,
 * and provides an authenticated API client for making requests.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

const TEST_EMAIL = 'live-test@podbrain-test.local';
const TEST_PASSWORD = 'LiveTest!2026SecurePassword';

let _accessToken: string | null = null;
let _userId: string | null = null;

/**
 * Get a Supabase admin client (bypasses RLS).
 */
export function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Get a Supabase anon client (for auth operations).
 */
function getAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Create or sign in the test user. Returns { userId, accessToken }.
 */
export async function ensureLiveTestUser(): Promise<{
  userId: string;
  accessToken: string;
}> {
  if (_accessToken && _userId) {
    return { userId: _userId, accessToken: _accessToken };
  }

  const admin = getAdminClient();

  // Try to find existing test user
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(u => u.email === TEST_EMAIL);

  if (existing) {
    // Sign in
    const anon = getAnonClient();
    const { data, error } = await anon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error) {
      // Password might have changed — delete and recreate
      await admin.auth.admin.deleteUser(existing.id);
    } else {
      _accessToken = data.session!.access_token;
      _userId = data.user!.id;

      // Ensure the user row exists in public.users
      await admin.from('users').upsert({
        id: _userId,
        email: TEST_EMAIL,
        subscription_tier: 'agency', // Agency tier for full access during testing
      }, { onConflict: 'id' });

      return { userId: _userId, accessToken: _accessToken };
    }
  }

  // Create new test user
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (createError || !newUser.user) {
    throw new Error(`Failed to create live test user: ${createError?.message}`);
  }

  // Ensure the user row exists in public.users
  await admin.from('users').upsert({
    id: newUser.user.id,
    email: TEST_EMAIL,
    subscription_tier: 'agency',
  }, { onConflict: 'id' });

  // Sign in to get session
  const anon = getAnonClient();
  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError || !signIn.session) {
    throw new Error(`Failed to sign in live test user: ${signInError?.message}`);
  }

  _accessToken = signIn.session.access_token;
  _userId = signIn.user.id;

  return { userId: _userId, accessToken: _accessToken };
}

/**
 * Make an authenticated API request to the dev server.
 */
export async function liveApi<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; data: T; ok: boolean }> {
  const { accessToken } = await ensureLiveTestUser();

  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sb-access-token=${accessToken}`,
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data: data as T, ok: response.ok };
}

/**
 * Upload a file to the dev server via multipart form.
 */
export async function liveUpload(
  path: string,
  formData: FormData
): Promise<{ status: number; data: unknown; ok: boolean }> {
  const { accessToken } = await ensureLiveTestUser();
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Cookie: `sb-access-token=${accessToken}`,
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, ok: response.ok };
}

/**
 * Clean up all test data created during live tests.
 */
export async function cleanupLiveTestData(): Promise<void> {
  const admin = getAdminClient();

  if (!_userId) return;

  // Delete in reverse dependency order
  const tables = [
    'generated_assets',
    'episode_sections',
    'corrections',
    'episodes',
    'vocabulary_terms',
    'experts',
    'webhooks',
    'hosting_connections',
    'shows',
  ];

  for (const table of tables) {
    // For tables that have user_id
    if (['shows', 'webhooks', 'hosting_connections'].includes(table)) {
      await admin.from(table).delete().eq('user_id', _userId);
    }
  }

  // Delete shows (cascades to episodes, vocabulary, etc.)
  await admin.from('shows').delete().eq('user_id', _userId);
}

/**
 * Get the test user ID.
 */
export function getTestUserId(): string {
  if (!_userId) throw new Error('Live test user not initialized — call ensureLiveTestUser() first');
  return _userId;
}
