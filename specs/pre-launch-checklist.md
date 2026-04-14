# PodBrain Pre-Launch Checklist

**Created:** 2026-04-09
**Status:** 4 items remaining

## Remaining Items

### [ ] 1. Sentry DSN
- **What:** Create a Sentry project at sentry.io, copy the DSN
- **Where to set:** Add `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to `.env.local` and Netlify env vars
- **Why it matters:** The error boundary code (`global-error.tsx`, `ErrorFallback` component, `instrumentation.ts`) is fully wired but captures go nowhere without this. Production errors will be invisible.
- **Time:** 5 minutes

### [ ] 2. Trigger.dev Production Key
- **What:** Current key is `tr_dev_*` (development). Need `tr_prod_*` or `tr_live_*` for deployed environment.
- **Where to set:** Replace `TRIGGER_SECRET_KEY` in `.env.local` and Netlify env vars
- **Also:** Run `npm run trigger:deploy` to deploy the background jobs to Trigger.dev's cloud
- **Why it matters:** Without a prod key, the processing pipeline (upload → transcribe → generate assets) won't dispatch in production. Episodes will stay in `pending` status forever.
- **Time:** 10 minutes (create project + deploy jobs)

### [ ] 3. Resend Sending Domain Verification
- **What:** Add SPF and DKIM DNS records for your sending domain in your DNS registrar
- **Where:** Resend dashboard → Domains → Add domain → follow DNS instructions
- **Why it matters:** Emails from an unverified domain land in spam or get rejected. Affects: processing-complete notifications, guest package delivery, password reset emails.
- **Time:** 15 minutes (add DNS records) + up to 48 hours for propagation

### [ ] 4. `NEXT_PUBLIC_APP_URL` → Production Domain
- **What:** Change from `http://localhost:3000` to the final production URL (e.g. `https://getpodbrain.ai`)
- **Where to set:** `.env.local` line 66, plus Netlify env vars
- **Why it matters:** RSS tag URLs, Stripe checkout return URLs, OAuth callback URLs, and share links all use this value. Getting it wrong means broken redirects after payment and incorrect RSS metadata.
- **Also:** Update the Stripe webhook endpoint URL in the Stripe dashboard if the domain differs from `podbrain.netlify.app`
- **Time:** 2 minutes

## Everything Else — DONE ✅

| Category | Status | Details |
|---|---|---|
| Supabase (DB, Auth, Storage, RLS) | ✅ | Real keys, 9 migrations applied, 16 tables |
| Upstash Redis (rate limiting) | ✅ | Real keys, rate limiter active |
| xAI Grok (AI content generation) | ✅ | Real key, 8 prompt files |
| AssemblyAI (transcription) | ✅ | Real key + webhook secret generated |
| Stripe (live mode) | ✅ | Live keys, 2 products (Pro $19/mo, Agency $49/mo), 4 prices (monthly + annual), webhook endpoint, Embedded Checkout built |
| Resend (email) | ⚠️ | API key set, domain verification pending |
| Buzzsprout (hosting) | ✅ | Real key |
| Taddy (podcast search) | ✅ | Real keys |
| Encryption secret | ✅ | Set for hosting credential encryption |
| Upload pipeline | ✅ | Pre-signed URL flow (bypasses Netlify limits) |
| Show creation | ✅ | CreateShowDialog with host name field |
| Episode detail | ✅ | All mock data removed, real data wired |
| Embedded Stripe Checkout | ✅ | No-redirect inline payment form |
| Multi-file upload | ✅ | Processes all queued files, not just first |
| Error boundaries | ✅ | Per-route error.tsx + Sentry capture |
| Env validation | ✅ | Crashes loud in production if required vars missing |
| AssemblyAI webhook auth | ✅ | Bug #2 fixed (timingSafeEqual length check) |
| A11y landmarks | ✅ | `<nav>`, `<main>` wrappers added |
| Color contrast | ✅ | `--muted-foreground` darkened; full audit documented |
| Unit tests | ✅ | 898 passing |
| E2E tests | ✅ | 81 passing |
| Production build | ✅ | Clean |
| QA Council pipeline | ✅ | 3 features fully covered |
| Testing roadmap | ✅ | 18/18 tasks completed |

## Netlify Deployment Env Vars

When deploying, copy ALL of these from `.env.local` to Netlify → Site → Environment:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ASSEMBLYAI_API_KEY
ASSEMBLYAI_WEBHOOK_SECRET
XAI_API_KEY
TRIGGER_SECRET_KEY              ← needs prod key
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_PRICE_ID
STRIPE_AGENCY_PRICE_ID
STRIPE_PRO_ANNUAL_PRICE_ID
STRIPE_AGENCY_ANNUAL_PRICE_ID
RESEND_API_KEY
BUZZSPROUT_API_KEY
TADDY_API_KEY
TADDY_USER_ID
ENCRYPTION_SECRET
SENTRY_DSN                      ← needs value
NEXT_PUBLIC_SENTRY_DSN          ← needs value
NEXT_PUBLIC_APP_URL             ← needs prod domain
```
