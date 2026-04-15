# Future Improvements — Post-Launch Backlog

**Status:** Deferred from initial launch. Revisit based on customer demand and queue pressure.
**Last updated:** 2026-04-14

This document tracks features and capabilities that were intentionally deferred from the initial launch to keep scope honest and ship a product that delivers what it promises. Each item has a rationale for deferral and a trigger condition that should prompt reconsideration.

---

## 1. Team Seats & Collaboration

**What it is:** Multiple users (owner + editors + viewers) can access the same account with role-based permissions, isolated login credentials, and per-seat audit trails.

**Current state:**
- `team_members` table exists
- Invite API route exists (`/api/team`)
- Settings UI exists (`team-section.tsx`)
- **BUT** invite emails are not actually sent (Resend call is stubbed)
- **BUT** RLS policies on `shows`/`episodes`/`generated_assets` only check `user_id = auth.uid()` — they do not reference `team_members`, so invited editors cannot see any of the owner's data even if they sign up
- **BUT** role-based authorization is not enforced anywhere in the app (no grep hits on `role` checks in `lib/auth.ts`)

**Why deferred:** Shipping broken team seats is worse than shipping none. The current state lets us insert rows in a table and nothing else. A "10 seat" promise to an Agency customer would fail on day one.

**Build scope to ship properly (~2-3 days):**
1. Fix email invites via Resend (send invite link with one-time token)
2. Update RLS policies on `shows`, `episodes`, `generated_assets`, `episode_sections`, `generated_assets`, `corrections` to check `team_members` lookup: user can see a row if `owner.id = auth.uid()` OR `auth.uid() IN (SELECT member_user_id FROM team_members WHERE owner_user_id = owner.id AND status = 'active')`
3. Add role-based authorization middleware for write operations (editor ≠ admin)
4. Add UI to switch between "my shows" and "team shows"
5. Add per-seat activity log

**Trigger to revisit:** First Agency customer says "I need 3 separate logins for my editors."

---

## 2. Priority Processing Queue

**What it is:** Tier-based prioritization in the Trigger.dev job queue so Agency customers' episodes process before Pro/Creator/Trial when there's queue pressure.

**Current state:** Zero priority awareness. Trigger.dev v4 processes jobs in first-come-first-served order across all tiers. The `trigger.config.ts` is a basic `defineConfig` with no queue configuration.

**Why deferred:**
- At 100 members with ~20% actively processing in any given hour, we have ~20 concurrent jobs max — well under Trigger.dev's concurrency limits on any paid plan
- Episode processing is bursty, not sustained — most of the day is idle
- Queue pressure likely won't become a real problem until 500+ members or a major marketing event
- Shipping a feature no customer will notice is wasted work

**Build scope when needed (~1 day):**
1. Add `queue` config to Trigger.dev task definitions:
   - `agency-queue` with reserved concurrency (e.g., `concurrencyLimit: 20`)
   - `standard-queue` shared across Pro/Creator
   - `trial-queue` with low concurrency (2-3 slots, prevents trial abuse)
2. Route jobs to queue at trigger time based on user's tier lookup
3. Surface estimated queue time in the processing status UI

**Trigger to revisit:**
- Processing time observed in Sentry/logs consistently exceeds 5 minutes wait before work starts
- First Agency customer complains about slow processing during a deadline
- 500+ active members on the platform

---

## 3. Public API Access (API Keys)

**What it is:** A separate, rate-limited set of endpoints (`/api/v1/*`) authenticated with per-user API keys instead of browser session cookies. Enables external integrations (Zapier, Make, n8n), custom dashboards, CRM sync, bulk automation scripts, and custom analytics.

**Current state:** Zero public API. No `/api/v1/` namespace, no API keys table, no key auth middleware, no rate limiting by key, no documentation. All existing routes are authenticated via Supabase session cookies only.

**Use cases when built:**
1. Agency sets up Zapier: "new episode processed → post to client Slack + add row to Airtable + notify producer"
2. Agency builds branded client dashboard at `agency.com/clients/acme` that pulls episode data from PodBrain
3. Bulk archive migration: agency writes Python script to upload 200 old episodes from backup
4. CRM sync: nightly cron pushes show/episode data to HubSpot or Airtable
5. Custom analytics: power user pulls raw data into Retool or Grafana

**Why deferred:**
- Solo podcasters (Pro) never ask for API access
- Most small agencies (Agency target) aren't technical enough to need it
- Building it properly is 1-2 weeks of work (keys table + generation UI, middleware, per-key rate limits, audit log, minimal docs)
- Deferring until a paying prospect says "we'd buy if you had API access" lets us scope it around a real customer need

**Build scope when needed (~1-2 weeks):**
1. `api_keys` table with name, key_hash, last_used, revoked_at, scopes
2. Key generation UI in Settings (one-time view, hashed storage)
3. Key auth middleware (`Authorization: Bearer <key>`) for `/api/v1/*` routes
4. Per-key rate limiting via Upstash Redis
5. `/api/v1/` namespace with read-only endpoints first: episodes, shows, assets
6. Minimal public API documentation (Mintlify or docs/)
7. Gate behind Agency tier + usage reporting

**Trigger to revisit:** First paying prospect asks about API access during a sales conversation, OR 3+ users request it via support. Build a minimal version for that customer, iterate from there.

---

## 4. White-Label Client Outputs

**What it is:** Agencies can upload their own logo and branding, which replaces PodBrain's branding on client-facing artifacts:
- Guest package PDF header (agency logo instead of PodBrain)
- Email notifications sent to guests (from agency domain via Resend)
- Public preview pages (agency branding instead of PodBrain)
- RSS feed `<generator>` tag (custom string instead of "PodBrain AI Studio")

**Why it matters to established agencies:**
- Agencies charge clients $2-5K/month for podcast production
- They position PodBrain as their internal tooling
- If the guest package PDF says "PodBrain" in the corner, clients might think "why am I paying them $5K/mo when I could use PodBrain directly for $29?"
- White-labeling lets agencies maintain the brand relationship and justify their retainer

**Current state:** No branding system. Guest package generator uses hardcoded PodBrain styling. RSS feed hardcodes `<generator>PodBrain AI Studio</generator>`. Email templates in `lib/email/templates/` use PodBrain branding throughout.

**Why deferred:**
- Our initial target (3-person agencies with 8 clients) may not care yet — they often tell clients "we use PodBrain" transparently
- White-labeling matters more at 20+ clients when brand integrity is core to the business
- Small scope (~3-4 days) but not a must-have for launch

**Build scope when needed (~3-4 days):**
1. `organization_branding` table: logo_url, brand_name, primary_color, custom_domain (optional)
2. Logo upload to Supabase Storage in Settings
3. Template replacement in guest package PDF generator
4. Email template variants with dynamic branding (Resend)
5. Strip hardcoded `<generator>` tag from RSS feed, use org brand_name
6. Gate behind Agency tier

**Trigger to revisit:** First Agency customer asks about white-labeling, OR an agency with 15+ clients churns citing branding as a reason.

---

## 5. Contractual SLA (Service Level Agreement)

**What it is:** A legally binding promise in the Terms of Service about uptime with monetary consequences if we miss it. Example: *"PodBrain guarantees 99.9% monthly uptime. If uptime falls below 99.9%, customer receives 10% credit on the next invoice."*

**Current state:** Nothing. No uptime monitoring, no status page, no incident response runbook, no credit policy in the ToS, no contractual language anywhere.

**Why deferred:**
- We have no way to *measure* whether we're meeting an SLA — no monitoring infrastructure
- We depend on 7+ external services (Netlify, Supabase, AssemblyAI, xAI, Trigger.dev, Upstash, Stripe, Resend), each with their own independent uptime
- Compound dependency math: if each dependency has 99.9% uptime, our best-case compound uptime is ~99.2% — *below* any standard enterprise SLA
- A single 2-hour xAI outage blows 99.9% monthly for our entire customer base
- Promising an SLA we can't measure and can't deliver is legal exposure, not a feature

**Prerequisites before any SLA can be offered:**
1. Uptime monitoring on every customer-facing endpoint (Better Stack, UptimeRobot, Pingdom, or custom)
2. Public status page (Statuspage, Instatus, or self-hosted)
3. Incident response runbook
4. Credit calculation and automated refund policy
5. Historical uptime data (at least 6 months)
6. Language in the ToS defining the SLA terms, exclusions (scheduled maintenance, force majeure), and credit caps

**Trigger to revisit:** An enterprise or mid-market agency prospect says "we need an SLA before signing." At that point, scope a custom contract for that deal rather than a platform-wide SLA.

---

## 6. Full RSS Feed / White-Label RSS Proxy

**What it is:** PodBrain hosts a complete RSS 2.0 feed at `/api/shows/[id]/rss?token=xxx` that the user can use in place of their hosting provider's feed. White-labeling would remove the `<generator>PodBrain AI Studio</generator>` tag and possibly serve from a custom domain.

**Current state:** Endpoint exists and works. Token-gated. Hardcoded PodBrain generator tag.

**Why deferred/deprioritized:**
- Every podcaster already has an RSS feed from their hosting provider (Buzzsprout, Transistor, Libsyn) that Apple/Spotify consume
- For our feed to be useful, the user would have to *replace* their hosting feed with ours, which means uploading all audio to PodBrain's storage and abandoning their current host
- Very few users want to do this — it's a heavy migration with no clear payoff
- **The better approach for Podcasting 2.0 delivery is the "enrichment URLs" model**: user keeps their existing host, their existing feed references PodBrain-hosted enrichment files (chapters.json, transcript.vtt, soundbites). See section below.

**Recommended replacement — Podcasting 2.0 Enrichment URLs:**
- Publicly host `chapters.json`, `transcript.vtt`, soundbite files, and per-episode metadata files on PodBrain endpoints
- Generate a one-line XML snippet users paste into their existing host's custom XML field:
  ```xml
  <podcast:chapters url="https://getpodbrain.ai/api/episodes/xxx/chapters.json" type="application/json+chapters"/>
  <podcast:transcript url="https://getpodbrain.ai/api/episodes/xxx/transcript.vtt" type="text/vtt"/>
  ```
- Apple Podcasts ignores these tags; Podcasting 2.0 players (Fountain, Podverse, Curiocaster) fetch them and deliver rich playback
- User never has to switch RSS feeds — they enrich their existing one

**Trigger to revisit full RSS proxy:** If a podcaster explicitly wants to host their entire feed on PodBrain (rare — possibly for users abandoning an old host). Until then, the enrichment model is the real product.

---

## 7. Dedicated Slack Support Channel

**What it is:** A shared Slack channel created with each Agency customer as a direct support line with the PodBrain team, replacing generic email support.

**Why deferred:**
- Zero engineering cost — it's an operational commitment from the founder
- Promising it requires actually running it, which has a daily time cost
- Better to start with priority email (24h response) and upgrade to Slack once we have the bandwidth and customer count to justify it

**Trigger to revisit:** First Agency customer asks for a faster support channel, OR once Agency tier has 5+ customers and email is too slow to scale.

---

## Summary Table

| Feature | Effort | Trigger | Priority |
|---|---|---|---|
| Team seats & collaboration | 2-3 days | First Agency customer needs multi-user | High (first Agency request) |
| Priority processing queue | 1 day | Queue time > 5 min or 500+ members | Low (monitoring needed first) |
| Public API access | 1-2 weeks | First prospect says "API required" | Medium (sales-driven) |
| White-label client outputs | 3-4 days | First Agency customer asks | Medium (agency-driven) |
| Contractual SLA | Weeks of ops prep | Enterprise deal requires it | Low (custom contracts only) |
| Full RSS feed proxy | N/A | Probably never — use enrichment URLs instead | Deprecated |
| Dedicated Slack support | 0 eng | First Agency customer asks | Medium (ops-driven) |

---

## Shipping Checklist Before Revisiting Any of These

Before building any item on this list:
1. Confirm a paying customer (or strong prospect) actually wants it
2. Scope the minimum version that solves their stated problem
3. Run the Implementation Pipeline (architect → implement → review → verify)
4. Ship behind a feature flag if possible so we can roll back quickly
5. Update the public tier comparison to reflect what actually exists
