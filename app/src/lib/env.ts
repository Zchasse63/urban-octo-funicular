/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are present at startup.
 * Call validateEnv() early in the application lifecycle to get clear errors
 * instead of cryptic runtime failures.
 */

type EnvVarConfig = {
  name: string
  required: boolean
  description: string
}

/** Client-side env vars (baked into the bundle at build time) */
const CLIENT_ENV_VARS: EnvVarConfig[] = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase anon/public key' },
  { name: 'NEXT_PUBLIC_APP_URL', required: false, description: 'Application URL (defaults to localhost:3000)' },
  { name: 'NEXT_PUBLIC_SENTRY_DSN', required: false, description: 'Sentry client-side DSN' },
  { name: 'NEXT_PUBLIC_POSTHOG_KEY', required: false, description: 'PostHog analytics key' },
]

/** Server-side env vars (available only at runtime) */
const SERVER_ENV_VARS: EnvVarConfig[] = [
  // Core infrastructure
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true, description: 'Supabase service role key (bypasses RLS)' },

  // AI services
  { name: 'XAI_API_KEY', required: true, description: 'xAI Grok API key for content generation' },
  { name: 'ASSEMBLYAI_API_KEY', required: true, description: 'AssemblyAI API key for transcription' },

  // Background jobs
  { name: 'TRIGGER_SECRET_KEY', required: true, description: 'Trigger.dev secret key' },

  // Cache
  { name: 'UPSTASH_REDIS_REST_URL', required: false, description: 'Upstash Redis URL (rate limiting, caching)' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', required: false, description: 'Upstash Redis token' },

  // Payments
  { name: 'STRIPE_SECRET_KEY', required: true, description: 'Stripe secret key' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: true, description: 'Stripe webhook signing secret' },
  { name: 'STRIPE_PRO_PRICE_ID', required: true, description: 'Stripe price ID for Pro tier' },
  { name: 'STRIPE_AGENCY_PRICE_ID', required: true, description: 'Stripe price ID for Agency tier' },

  // Email
  { name: 'RESEND_API_KEY', required: false, description: 'Resend API key for emails' },

  // Podcast data
  { name: 'TADDY_API_KEY', required: false, description: 'Taddy API key for podcast search' },
  { name: 'TADDY_USER_ID', required: false, description: 'Taddy user ID for auth' },

  // Hosting integrations (optional)
  { name: 'BUZZSPROUT_API_KEY', required: false, description: 'Buzzsprout API key' },
  { name: 'TRANSISTOR_API_KEY', required: false, description: 'Transistor API key' },

  // Error tracking
  { name: 'SENTRY_DSN', required: false, description: 'Sentry server-side DSN' },
]

export type EnvValidationResult = {
  valid: boolean
  missing: { name: string; description: string }[]
  warnings: { name: string; description: string }[]
}

/**
 * Validate environment variables and return a report.
 * Only checks server-side vars when running on the server.
 */
export function validateEnv(): EnvValidationResult {
  const isServer = typeof window === 'undefined'
  const vars = isServer ? [...CLIENT_ENV_VARS, ...SERVER_ENV_VARS] : CLIENT_ENV_VARS

  const missing: { name: string; description: string }[] = []
  const warnings: { name: string; description: string }[] = []

  for (const v of vars) {
    const value = process.env[v.name]
    if (!value || value.trim() === '') {
      if (v.required) {
        missing.push({ name: v.name, description: v.description })
      } else {
        warnings.push({ name: v.name, description: v.description })
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  }
}

/**
 * Log environment validation results. Call once at startup.
 * Only logs warnings in production to avoid leaking info.
 */
export function logEnvValidation(): void {
  const result = validateEnv()

  if (result.missing.length > 0) {
    console.error(
      `[ENV] Missing required environment variables:\n` +
        result.missing.map((m) => `  - ${m.name}: ${m.description}`).join('\n')
    )
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[ENV] Optional environment variables not set:\n` +
        result.warnings.map((w) => `  - ${w.name}: ${w.description}`).join('\n')
    )
  }
}
