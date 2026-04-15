/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are present at startup.
 * Call validateEnv() early in the application lifecycle to get clear errors
 * instead of cryptic runtime failures.
 *
 * In production, missing required vars will FAIL LOUD — the function
 * throws a descriptive error which crashes the Node process on startup.
 * This is deliberate: a silent misconfiguration in production is worse
 * than a hard crash because the first symptom is a paying customer hitting
 * an opaque 500.
 *
 * In development, missing required vars just log a warning so the dev
 * can iterate without re-setting everything.
 */

type EnvVarConfig = {
  name: string
  required: boolean
  description: string
  /** Only required when NODE_ENV === 'production' (e.g. rate limiting) */
  productionOnly?: boolean
}

/** Client-side env vars (baked into the bundle at build time) */
const CLIENT_ENV_VARS: EnvVarConfig[] = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase anon/public key' },
  { name: 'NEXT_PUBLIC_APP_URL', required: false, productionOnly: true, description: 'Application URL — required in prod so RSS tags, share links, and OAuth redirects resolve correctly' },
  // NOTE: Sentry DSNs are strongly recommended in production but NOT enforced
  // as required. Enforcing them crashed the prod boot when the Sentry project
  // had not yet been created — the instrumentation hook threw [ENV FATAL]
  // before the app could serve a single request. See BUG-LP-6 in
  // specs/plans/LAUNCH-PLAN.md for the post-mortem. Once a Sentry project
  // exists and the DSN is pushed to Netlify, consider tightening this back
  // to `productionOnly: true`.
  { name: 'NEXT_PUBLIC_SENTRY_DSN', required: false, description: 'Sentry client-side DSN — strongly recommended in prod so client errors are captured' },
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

  // Cache / rate limiting — optional in dev, REQUIRED in production
  // (without Redis, lib/rate-limit.ts silently no-ops — real security hole)
  { name: 'UPSTASH_REDIS_REST_URL', required: false, productionOnly: true, description: 'Upstash Redis URL — required in prod or rate limiting is silently disabled' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', required: false, productionOnly: true, description: 'Upstash Redis token — required in prod' },

  // Payments
  { name: 'STRIPE_SECRET_KEY', required: true, description: 'Stripe secret key' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: true, description: 'Stripe webhook signing secret' },
  { name: 'STRIPE_PRO_PRICE_ID', required: true, description: 'Stripe price ID for Pro tier' },
  { name: 'STRIPE_AGENCY_PRICE_ID', required: true, description: 'Stripe price ID for Agency tier' },
  { name: 'STRIPE_CREATOR_PRICE_ID', required: false, description: 'Stripe price ID for Creator tier (if offered)' },
  { name: 'STRIPE_PRO_ANNUAL_PRICE_ID', required: false, description: 'Stripe price ID for Pro annual billing' },
  { name: 'STRIPE_AGENCY_ANNUAL_PRICE_ID', required: false, description: 'Stripe price ID for Agency annual billing' },

  // Email — required in prod so processing-complete notifications actually send
  { name: 'RESEND_API_KEY', required: false, productionOnly: true, description: 'Resend API key — required in prod for email notifications' },

  // Podcast data
  { name: 'TADDY_API_KEY', required: false, description: 'Taddy API key for podcast search' },
  { name: 'TADDY_USER_ID', required: false, description: 'Taddy user ID for auth' },

  // Hosting integrations (optional)
  { name: 'BUZZSPROUT_API_KEY', required: false, description: 'Buzzsprout API key' },
  { name: 'TRANSISTOR_API_KEY', required: false, description: 'Transistor API key' },

  // Error tracking — strongly recommended but not enforced. See comment on
  // NEXT_PUBLIC_SENTRY_DSN above for the rationale.
  { name: 'SENTRY_DSN', required: false, description: 'Sentry server-side DSN — strongly recommended in prod' },

  // Webhook auth — required in prod so AssemblyAI callbacks are authenticated
  { name: 'ASSEMBLYAI_WEBHOOK_SECRET', required: false, productionOnly: true, description: 'AssemblyAI webhook token — required in prod so the callback endpoint is authenticated' },
]

export type EnvValidationResult = {
  valid: boolean
  missing: { name: string; description: string }[]
  warnings: { name: string; description: string }[]
}

/**
 * Validate environment variables and return a report.
 * Only checks server-side vars when running on the server.
 *
 * `productionOnly` vars are treated as required only when
 * `NODE_ENV === 'production'`. This lets dev iteration work without
 * every var set while still catching misconfigurations at deploy time.
 */
export function validateEnv(): EnvValidationResult {
  const isServer = typeof window === 'undefined'
  const isProduction = process.env.NODE_ENV === 'production'
  const vars = isServer ? [...CLIENT_ENV_VARS, ...SERVER_ENV_VARS] : CLIENT_ENV_VARS

  const missing: { name: string; description: string }[] = []
  const warnings: { name: string; description: string }[] = []

  for (const v of vars) {
    const value = process.env[v.name]
    const isMissing = !value || value.trim() === ''
    if (!isMissing) continue

    // Treat a productionOnly var as required when we're in production
    const effectiveRequired = v.required || (v.productionOnly && isProduction)

    if (effectiveRequired) {
      missing.push({ name: v.name, description: v.description })
    } else {
      warnings.push({ name: v.name, description: v.description })
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
 *
 * In production: throws an Error if any required var is missing. This
 * crashes the Node process loudly instead of letting the app start in
 * a silently broken state.
 *
 * In development: logs missing required vars as errors but does NOT
 * throw, so devs can iterate without setting every optional var.
 */
export function logEnvValidation(): void {
  const result = validateEnv()
  const isProduction = process.env.NODE_ENV === 'production'

  if (result.missing.length > 0) {
    const message =
      `Missing required environment variables:\n` +
      result.missing.map((m) => `  - ${m.name}: ${m.description}`).join('\n') +
      `\n\nSet these in your deployment environment (e.g. Netlify → Site → Environment) and redeploy.`

    if (isProduction) {
      // Fail loud: crashing the process is better than serving broken pages.
      throw new Error(`[ENV FATAL] ${message}`)
    }
    console.error(`[ENV] ${message}`)
  }

  if (result.warnings.length > 0 && !isProduction) {
    console.warn(
      `[ENV] Optional environment variables not set (ok in dev):\n` +
        result.warnings.map((w) => `  - ${w.name}: ${w.description}`).join('\n')
    )
  }

  if (result.valid && isProduction) {
    console.log(
      `[ENV] All ${CLIENT_ENV_VARS.length + SERVER_ENV_VARS.length} environment variables validated.`
    )
  }
}
