import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for use in Trigger.dev jobs.
 * Uses service role key for elevated privileges.
 * This client doesn't require cookies and can run in background jobs.
 */
export function createTriggerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for Trigger.dev')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Export a singleton instance for reuse
let triggerClient: ReturnType<typeof createClient> | null = null

export function getTriggerClient() {
  if (!triggerClient) {
    triggerClient = createTriggerClient()
  }
  return triggerClient
}
