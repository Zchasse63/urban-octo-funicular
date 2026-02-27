# Netlify Environment Variables Setup

All server-side environment variables must be configured in the Netlify dashboard under **Site settings > Environment variables**. Client-side `NEXT_PUBLIC_*` vars are baked in at build time via the CI workflow.

## Required Variables

These must be set for the app to function:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard > Settings > API |
| `XAI_API_KEY` | xAI Grok API key | https://console.x.ai |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key | https://www.assemblyai.com/dashboard |
| `TRIGGER_SECRET_KEY` | Trigger.dev secret key | https://cloud.trigger.dev |
| `STRIPE_SECRET_KEY` | Stripe secret key (live) | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard > Developers > Webhooks |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro tier | Stripe Dashboard > Products |
| `STRIPE_AGENCY_PRICE_ID` | Stripe Price ID for Agency tier | Stripe Dashboard > Products |
| `NEXT_PUBLIC_APP_URL` | `https://getpodbrain.ai` | Hardcoded |

## Optional Variables

Features degrade gracefully if these are missing:

| Variable | Description | Impact if missing |
|----------|-------------|-------------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Rate limiting and caching disabled |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | Rate limiting and caching disabled |
| `RESEND_API_KEY` | Resend email API key | Email notifications disabled |
| `RESEND_FROM_EMAIL` | Sender email address | Defaults to `onboarding@resend.dev` |
| `TADDY_API_KEY` | Taddy podcast search API key | Podcast search/discovery disabled |
| `TADDY_USER_ID` | Taddy user ID | Podcast search/discovery disabled |
| `BUZZSPROUT_API_KEY` | Buzzsprout hosting API key | Buzzsprout integration disabled |
| `TRANSISTOR_API_KEY` | Transistor hosting API key | Transistor integration disabled |
| `SENTRY_DSN` | Sentry server-side DSN | Error tracking disabled |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry client-side DSN | Client error tracking disabled |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key | Analytics disabled |

## GitHub Actions Secrets

These secrets must be configured in the GitHub repository settings for CI/CD:

| Secret | Used by |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Deploy build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Deploy build |
| `NEXT_PUBLIC_SENTRY_DSN` | Deploy build |
| `NETLIFY_AUTH_TOKEN` | Netlify CLI auth |
| `NETLIFY_SITE_ID` | Netlify site identifier |
| `SUPABASE_URL` | Integration/E2E tests |
| `SUPABASE_ANON_KEY` | Integration/E2E tests |
| `SUPABASE_SERVICE_ROLE_KEY` | Integration/E2E tests |

Also set the repository variable `HAS_TEST_SECRETS` to `true` to enable integration and E2E test jobs.

## Stripe Setup

1. Create products in Stripe Dashboard for Pro ($19/mo) and Agency ($49/mo)
2. Copy the Price IDs to `STRIPE_PRO_PRICE_ID` and `STRIPE_AGENCY_PRICE_ID`
3. Create a webhook endpoint pointing to `https://getpodbrain.ai/api/stripe/webhooks`
4. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## AssemblyAI Webhook Setup

Configure the AssemblyAI webhook callback URL to: `https://getpodbrain.ai/api/webhooks/assemblyai`

This is set automatically in the transcription job when `NEXT_PUBLIC_APP_URL` is configured.
