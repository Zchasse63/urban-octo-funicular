# PodBrain Production Deployment Checklist

## Pre-Deployment

### Code Quality
- [x] TypeScript: 0 type errors (`npx tsc --noEmit`)
- [x] Tests: 750+ passing, 0 failures (`npx vitest run`)
- [x] Build: Clean (`npm run build`)
- [x] Security headers configured (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [x] X-Powered-By header disabled
- [x] Environment variable validation at startup (instrumentation hook)
- [x] AssemblyAI client uses lazy initialization (no crash on missing env var)
- [x] Hardcoded API keys removed from settings page
- [x] CI/CD uses `netlify build` for proper serverless function packaging
- [x] Sentry SDK integrated (`@sentry/nextjs`) with client, server, edge configs
- [x] Global error boundary captures rendering errors (`global-error.tsx`)

### Database (Supabase)
- [ ] Run all 8 migrations on production Supabase project
- [ ] Verify RLS policies are active on all tables
- [ ] Verify pgvector extension enabled
- [ ] Verify `find_similar_sections` RPC function exists
- [ ] Test service role key can bypass RLS
- [ ] Verify foreign key constraints (users → shows → episodes)

### Authentication
- [ ] Supabase Auth configured (email/password, Google OAuth, magic link)
- [ ] Auth redirect URLs set to `https://getpodbrain.ai`
- [ ] Email templates customized in Supabase

### Stripe
- [ ] Products created: Pro ($19/mo), Agency ($49/mo)
- [ ] Price IDs set in env vars (`STRIPE_PRO_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`)
- [ ] Webhook endpoint: `https://getpodbrain.ai/api/stripe/webhooks`
- [ ] Webhook events subscribed (checkout.session.completed, customer.subscription.*, invoice.*)
- [ ] Webhook signing secret set in env vars
- [ ] Test a checkout flow end-to-end with Stripe test mode
- [ ] Switch to live keys for production

### External Services
- [ ] AssemblyAI API key provisioned and tested
- [ ] xAI API key provisioned and tested
- [ ] Trigger.dev project configured and connected
- [ ] Upstash Redis provisioned (or rate limiting will be disabled)
- [ ] Resend API key provisioned (or email notifications disabled)
- [ ] Taddy API credentials provisioned (or podcast search disabled)
- [ ] Sentry project created (optional but recommended)

## Netlify Configuration

### Environment Variables
- [ ] All required env vars set in Netlify dashboard (see `NETLIFY-ENV-VARS.md`)
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://getpodbrain.ai`
- [ ] Verify env vars are set for the correct deploy context (Production)

### GitHub Actions Secrets
- [ ] `NETLIFY_AUTH_TOKEN` — Personal access token from Netlify
- [ ] `NETLIFY_SITE_ID` — Site ID from Netlify dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — For build-time embedding
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — For build-time embedding
- [ ] Set repository variable `HAS_TEST_SECRETS=true` to enable CI integration tests

### Domain & DNS
- [ ] Custom domain `getpodbrain.ai` configured in Netlify
- [ ] SSL certificate provisioned (automatic via Netlify)
- [ ] DNS records pointing to Netlify

## Post-Deployment Verification

### Smoke Test
- [ ] Landing page loads at `https://getpodbrain.ai`
- [ ] Login page renders, form submits
- [ ] Register page creates account
- [ ] Dashboard loads after login
- [ ] Upload page accepts audio file
- [ ] Settings page renders all tabs

### API Routes
- [ ] `GET /api/shows` returns JSON (authenticated)
- [ ] `GET /api/episodes` returns JSON (authenticated)
- [ ] `GET /api/usage` returns tier/usage data
- [ ] `GET /api/subscriptions` returns subscription status
- [ ] `POST /api/stripe/checkout` creates checkout session
- [ ] `GET /api/taddy/search?q=test` returns results (if configured)
- [ ] Unauthenticated requests return 401

### Critical Paths
- [ ] Upload audio → trigger processing → receive webhook callback → view results
- [ ] Subscribe to Pro via Stripe → verify tier updated → verify usage limits changed
- [ ] Edit show notes → save → verify persistence
- [ ] Generate guest package → download ZIP

### Webhooks
- [ ] AssemblyAI webhook callback URL reachable
- [ ] Stripe webhook endpoint receives test events
- [ ] User-configured webhooks dispatch on episode completion

## Monitoring

### Error Tracking
- [ ] Sentry capturing server errors (if configured)
- [ ] Sentry capturing client errors (if configured)

### Logging
- [ ] Netlify function logs accessible
- [ ] Environment validation messages visible in startup logs

### Alerts
- [ ] Stripe webhook failure notifications enabled
- [ ] Uptime monitoring configured (e.g., UptimeRobot, Betteruptime)
