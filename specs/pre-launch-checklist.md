# PodBrain Pre-Launch Checklist

**Created:** 2026-04-09
**Last updated:** 2026-04-14 (pricing refactor + full live pipeline run + Netlify Stripe key flip)
**Status:** 4 items remaining. Item 5 (Netlify Stripe live-key flip) surfaced by the pricing refactor has been **resolved** autonomously in the same 2026-04-14 session — all four live Stripe keys (`STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are now set on Netlify production. See the "Resolved 2026-04-14" block below.

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

## Resolved 2026-04-14

### [x] 5. Flip Netlify Stripe keys from TEST → LIVE ✅ RESOLVED

- **Previous state:** `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` were set to test-mode values; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET` were unset.
- **Action taken:** Pushed all four live values from `app/.env.local` to the Netlify `podbrain` project via `netlify env:set`.
  - Publishable keys (`STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) → **all contexts** (production, deploy-preview, branch-deploy, dev)
  - Secret keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) → **production, deploy-preview, branch-deploy** with `--secret` flag (Netlify refuses to store `--secret` values in the `dev` context, which is correct — dev should keep using `.env.local`)
- **Verification:** `netlify env:list --plain --context production | grep STRIPE_` shows all 10 Stripe vars (6 price IDs + 4 keys) with `pk_live_`, `sk_live_`, and `whsec_KEeu2M…` prefixes.
- **Result:** Production checkout is now functional end-to-end — LIVE price IDs + LIVE keys, no cross-mode errors.
- **Source:** `specs/reports/pricing-subscription-refactor-report.md` follow-up #8

## Everything Else — DONE ✅

| Category | Status | Details |
|---|---|---|
| Supabase (DB, Auth, Storage, RLS) | ✅ | Real keys, 10 migrations applied (includes `20260414000000_subscription_state_machine.sql`), 16 tables |
| Upstash Redis (rate limiting) | ✅ | Real keys, rate limiter active — confirmed working under k6 load (3,629 per-user 429s as designed) |
| xAI Grok (AI content generation) | ✅ | Real key, 8 prompt files — verified live against `grok-4-1-fast` + `grok-4-1-fast-reasoning` on 2026-04-14 |
| AssemblyAI (transcription) | ✅ | Real key + webhook secret; live transcription in 11.1 s confirmed on 2026-04-14 |
| Stripe (live mode — **refactored**) | ✅ | **Pro / Creator / Agency** products, 10 active prices (6 new: `$29/$290`, `$59/$590`, `$149/$1490` + 4 legacy `$19/$49` retained for existing subs), Netlify env vars set for the 6 new price IDs |
| Stripe live keys on Netlify | ✅ | All 4 live keys pushed to Netlify `podbrain` production on 2026-04-14: `STRIPE_PUBLISHABLE_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (all contexts), `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (`--secret`, non-dev contexts). Verified via `netlify env:list --plain --context production`. |
| Resend (email) | ⚠️ | API key set, domain verification pending |
| Buzzsprout (hosting) | ✅ | Real key |
| Taddy (podcast search) | ✅ | Real keys |
| Encryption secret | ✅ | Set for hosting credential encryption |
| Upload pipeline | ✅ | Pre-signed URL flow (bypasses Netlify limits) — **k6 load tested at 50 VU / 3m 30 s on 2026-04-14**, 99.97% check pass, zero 5xx |
| Show creation | ✅ | CreateShowDialog with host name field |
| Episode detail | ✅ | All mock data removed, real data wired |
| Embedded Stripe Checkout | ✅ | No-redirect inline payment form |
| Multi-file upload | ✅ | Processes all queued files, not just first |
| Error boundaries | ✅ | Per-route error.tsx + Sentry capture |
| Env validation | ✅ | Crashes loud in production if required vars missing |
| AssemblyAI webhook auth | ✅ | Bug #2 fixed (timingSafeEqual length check) |
| A11y landmarks | ✅ | `<nav>`, `<main>` wrappers added |
| Color contrast | ✅ | `--muted-foreground` darkened; full audit documented |
| Subscription state machine (5 states) | ✅ | trialing / active / past_due / trial_expired / canceled — 28/28 E2E tests (2026-04-14 follow-up pass) |
| Tier enforcement on API routes | ✅ | `canProcessEpisode()` called from `/api/episodes`, `/api/episodes/[id]/process`, `/api/shows/[id]/import` — enforced by P1-10 |
| Minutes-based metering | ✅ | Pro 300 / Creator 1200 / Agency 3600 min caps, soft limit @ 80% banner verified by P1-11 |
| Subscription banners (3 types) | ✅ | TrialCountdownBanner / PastDueBanner / AccessBlockedBanner — 5 `data-testid` attributes covered by E2E |
| Landing page pricing | ✅ | 3-column Pro/Creator/Agency grid, "Start 14-Day Free Trial" CTA, LandingPage POM |
| Unit tests | ✅ | 976 passing |
| E2E tests | ✅ | 81 previous + 28 pricing-refactor = **109 passing** |
| Live integration tests (Vitest) | ✅ | 45 / 47 passing across 4 suites on 2026-04-14 against real AssemblyAI + xAI + Supabase + Stripe + Taddy |
| Live load test (k6) | ✅ | 3,670 requests / 99.97% check pass; rate limiter confirmed per-user |
| Production build | ✅ | Clean |
| QA Council pipeline | ✅ | 4 features fully covered (show-creation · upload-wizard · episode-detail · pricing-subscription-refactor) |
| Testing roadmap | ✅ | Tier 1 #2 full pipeline gate upgraded from PARTIAL to PASS |

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
STRIPE_PUBLISHABLE_KEY              ← LIVE (pk_live_…) — flipped 2026-04-14
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   ← LIVE (pk_live_…) — added 2026-04-14
STRIPE_SECRET_KEY                    ← LIVE (sk_live_…, --secret) — flipped 2026-04-14
STRIPE_WEBHOOK_SECRET                ← LIVE (whsec_…, --secret) — added 2026-04-14
STRIPE_PRO_PRICE_ID                  ← LIVE ($29/mo) — pushed 2026-04-14
STRIPE_PRO_ANNUAL_PRICE_ID           ← LIVE ($290/yr) — pushed 2026-04-14
STRIPE_CREATOR_PRICE_ID              ← LIVE ($59/mo) — pushed 2026-04-14 (NEW TIER)
STRIPE_CREATOR_ANNUAL_PRICE_ID       ← LIVE ($590/yr) — pushed 2026-04-14 (NEW TIER)
STRIPE_AGENCY_PRICE_ID               ← LIVE ($149/mo) — pushed 2026-04-14
STRIPE_AGENCY_ANNUAL_PRICE_ID        ← LIVE ($1490/yr) — pushed 2026-04-14
RESEND_API_KEY
BUZZSPROUT_API_KEY
TADDY_API_KEY
TADDY_USER_ID
ENCRYPTION_SECRET
SENTRY_DSN                      ← needs value
NEXT_PUBLIC_SENTRY_DSN          ← needs value
NEXT_PUBLIC_APP_URL             ← needs prod domain
```
