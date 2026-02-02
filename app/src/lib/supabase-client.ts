/**
 * Supabase client re-export for compatibility
 * Uses the server client from supabase/server.ts
 */

export { createClient as getSupabaseClient, createAdminClient } from './supabase/server';
