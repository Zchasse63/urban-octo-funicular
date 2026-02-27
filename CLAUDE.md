# PodBrain - Project Context

## What is PodBrain?

An AI-powered platform for podcasters that transforms audio into SEO-optimized show notes, 30+ content assets, guest promotion packages, and Podcasting 2.0 RSS tags. The AI learns each show's vocabulary over time for improved accuracy.

**Target Users:** Independent podcasters and podcast agencies
**Domain:** getpodbrain.ai
**Build Status:** Feature-complete (all 8 phases of launch roadmap implemented). Needs end-to-end testing, debugging, and deployment hardening before production launch.

## Tech Stack

- **Frontend:** Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS v4
- **UI Components:** Custom "Swiss Broadcast" design system
- **Database:** Supabase (PostgreSQL with pgvector for embeddings)
- **AI Model:** xAI Grok (`grok-4-1-fast`) — used in 8 files for content generation
- **Transcription:** AssemblyAI (webhook-based for long audio support)
- **Background Jobs:** Trigger.dev v4
- **Cache:** Upstash Redis
- **Payments:** Stripe (checkout, webhooks, portal, invoices)
- **Email:** Resend (guest packages, processing notifications)
- **Podcast Data:** Taddy API (GraphQL, expert discovery, guest appearances)
- **Hosting Integrations:** Buzzsprout API, Transistor API
- **Error Tracking:** Sentry
- **CI/CD:** GitHub Actions → Netlify

## Architecture Overview

### Authentication (IMPLEMENTED)

Auth is fully implemented using Supabase Auth with `@supabase/ssr`:

- **Middleware** (`src/lib/supabase/middleware.ts`) refreshes sessions on every request
- **`requireAuth()`** utility in API routes extracts user from session, returns 401 if missing
- **`verifyShowOwnership()`** checks user owns the resource before allowing access
- **RLS policies** enforce `user_id = auth.uid()` on all tables
- **Auth pages:** `/login`, `/register`, `/forgot-password`
- **Auth hook:** `useAuth()` for client-side auth state

### Database Schema

```
User → Show → Episode → EpisodeSections (embeddings)
                     → GeneratedAssets
                     → Corrections
     → VocabularyTerms (embeddings)
     → TeamMembers

Taddy Cache:
  → TaddyPodcastCache
  → TaddyEpisodeCache
  → GuestAppearances
  → PreInterviewCache

System:
  → Webhooks
  → HostingConnections
```

**8 migrations** in `supabase/migrations/`:
- `0001_initial_schema.sql` — Core tables
- `20260202_phase6_advanced_features.sql` — Advanced features
- `20260202000000_phase7_integrations.sql` — Hosting integrations
- `20260218000000_schema_alignment.sql` — Schema fixes
- `20260226000000_auth_rls_policies.sql` — Auth & RLS
- `20260226100000_taddy_cache.sql` — Taddy caching tables
- `20260226200000_webhooks.sql` — Webhooks table
- `20260226300000_team_features.sql` — Team members table

### Processing Pipeline

1. User uploads audio → Supabase Storage
2. `POST /api/episodes/[id]/process` triggers Trigger.dev job
3. AssemblyAI transcription via **webhook callback** (supports 4-hour audio)
4. Custom vocabulary applied (keyword boosting + Grok post-processing)
5. Transcript chunked for long episodes (replaces 8000-char truncation)
6. xAI Grok (`grok-4-1-fast`) generates show notes, SEO analysis, 30+ assets
7. Circuit breaker protects against xAI outages
8. Webhook dispatched on completion (`episode.completed` / `episode.failed`)
9. Email notification sent to user
10. Results stored in Episode record

### Rate Limiting

Applied to all AI-heavy routes via `src/lib/rate-limit.ts`:
- `/api/episodes/[id]/process` — rate limited
- `/api/episodes/[id]/assets` — rate limited
- `/api/taddy/search` — 30 req/min

### Tier Enforcement

Middleware in `src/lib/tier-limits.ts` enforces:
- **Free:** 3 episodes/month, 1 show
- **Pro ($19/mo):** 50 episodes/month, 5 shows
- **Agency ($49/mo):** 200 episodes/month, unlimited shows, 5 team seats

## API Routes (48 total)

All routes require authentication (via `requireAuth()`) except webhooks and public endpoints.

### Core CRUD
```
GET/POST    /api/shows                          - Show listing & creation
GET/PATCH/DELETE /api/shows/[id]                 - Show detail/update/delete
GET/POST    /api/episodes                       - Episode listing & creation
GET/PUT     /api/episodes/[id]                  - Episode detail & update
POST        /api/upload                         - Audio file upload
```

### Episode Processing & Content
```
GET/POST/PUT/DELETE /api/episodes/[id]/process   - Trigger/monitor processing
GET/POST    /api/episodes/[id]/assets            - Generated assets
GET/PATCH   /api/episodes/[id]/assets/[assetId]  - Individual asset edit
GET         /api/episodes/[id]/assets/download   - ZIP download
GET/POST/PUT /api/episodes/[id]/seo              - SEO analysis
GET/POST    /api/episodes/[id]/guest-package     - Guest promotion package
GET         /api/episodes/[id]/guest-package/download
GET         /api/episodes/[id]/viral-moments     - Viral moment detection
GET         /api/episodes/[id]/related           - Cross-episode links
GET         /api/episodes/[id]/rss-tags          - Podcasting 2.0 RSS tags
GET/POST    /api/episodes/[id]/pre-interview     - Pre-interview intelligence
GET/POST    /api/episodes/[id]/ab-test           - Content A/B testing
GET/POST/DELETE /api/episodes/[id]/schedule      - Episode scheduling
GET         /api/episodes/[id]/learnings         - AI learning insights
POST        /api/episodes/[id]/buzzsprout-inject - Push to Buzzsprout
POST        /api/episodes/[id]/transistor-inject - Push to Transistor
POST        /api/episodes/[id]/audiogram         - Audiogram (501 scaffold)
```

### Shows & Discovery
```
GET/POST/DELETE /api/shows/[id]/vocabulary       - Vocabulary management
GET         /api/shows/[id]/experts              - Expert/guest discovery
POST        /api/shows/[id]/import               - RSS feed import
GET         /api/shows/[id]/related-episodes     - Related episodes
GET         /api/shows/[id]/rss                  - Public RSS proxy feed
```

### Podcast Search & Data
```
GET         /api/taddy/search                    - Taddy podcast search
```

### Billing & Subscriptions
```
POST        /api/stripe/checkout                 - Create checkout session
POST        /api/stripe/portal                   - Customer portal
POST        /api/stripe/webhooks                 - Stripe webhook handler
GET         /api/stripe/invoices                 - Billing history
GET         /api/subscriptions                   - Current subscription
GET         /api/usage                           - Usage statistics
```

### Hosting Integrations
```
GET         /api/buzzsprout/podcasts             - List Buzzsprout shows
GET         /api/buzzsprout/episodes             - List Buzzsprout episodes
POST        /api/buzzsprout/push-notes           - Push notes to Buzzsprout
POST/DELETE /api/buzzsprout/connect              - Connect/disconnect
GET         /api/transistor/shows                - List Transistor shows
GET         /api/transistor/episodes             - List Transistor episodes
```

### Team & Webhooks
```
GET/POST    /api/team                            - Team member management
PATCH/DELETE /api/team/[id]                      - Individual team member
GET/POST    /api/webhooks                        - Webhook CRUD
DELETE      /api/webhooks/[id]                   - Delete webhook
POST        /api/webhooks/assemblyai             - AssemblyAI callback
```

### Analytics & Publishing
```
GET         /api/analytics/overview              - Dashboard analytics
GET/POST    /api/publishing/[platform]            - Publishing (501 scaffolds)
```

## Page Routes (16 total)

### App Pages (authenticated)
- `/episodes` — Episode list with search/filter
- `/episodes/[id]` — Episode workspace (7-tab interface: Notes, Assets, Transcript, Guest Package, Intelligence, RSS Tags, + Pre-Interview in Intelligence tab)
- `/upload` — 3-step upload wizard (file → details → processing)
- `/vocabulary` — Custom vocabulary management
- `/experts` — Taddy-powered expert/guest discovery
- `/search` — Podcast search & discovery
- `/analytics` — Performance analytics dashboard
- `/settings` — Subscription, integrations (Buzzsprout, Transistor), webhooks, team, RSS proxy
- `/support` — Help center and FAQ

### Auth Pages
- `/login` — Email/password + Google OAuth + magic link
- `/register` — Account creation
- `/forgot-password` — Password reset

### Legal Pages
- `/terms` — Terms of Service
- `/privacy` — Privacy Policy
- `/cookies` — Cookie Policy

### Public
- `/` — Landing page (hero, problem/solution, pricing, CTA)

## Component Structure

```
app/src/components/
├── ui/               — button, card, input, upgrade-prompt
├── layout/           — app-shell, sidebar, page-header, mobile-header
├── episodes/         — episode-detail, episode-list, asset-editor,
│                       rss-tags-panel, pre-interview-panel, ab-test-panel,
│                       related-episodes, schedule-dialog, learning-insights
├── settings/         — settings-page, webhooks-section, team-section,
│                       rss-proxy-section
├── upload/           — upload-wizard
├── experts/          — experts-page
├── vocabulary/       — vocabulary-page
├── search/           — podcast-search-page
├── analytics/        — analytics-dashboard
└── shows/            — import-feed-dialog
```

## Lib Modules (82 files, 28 directories)

### Core Services
| Directory | Purpose |
|-----------|---------|
| `lib/xai/` | xAI Grok client, prompts, types (`grok-4-1-fast`) |
| `lib/assemblyai/` | AssemblyAI client with webhook support |
| `lib/content/` | Content generation engine, chunker, asset prompts |
| `lib/seo/` | SEO analyzer, schema generator |
| `lib/viral-moments/` | Viral moment detector with scoring |
| `lib/cross-episode/` | Embedding-based similarity search |
| `lib/vocabulary/` | Vocabulary service with learning |
| `lib/corrections/` | User correction tracking |

### Podcast Ecosystem
| Directory | Purpose |
|-----------|---------|
| `lib/taddy/` | GraphQL client, cache, search, queries, types |
| `lib/podcasting2/` | RSS tag generators, VTT, location extractor, value tags |
| `lib/rss/` | Zero-dependency RSS 2.0 parser |
| `lib/buzzsprout/` | Buzzsprout API client |
| `lib/transistor/` | Transistor API client |
| `lib/experts/` | Taddy-backed expert discovery (Grok fallback) |
| `lib/guest-package/` | Guest promo package generator |
| `lib/guest-intel/` | Guest intelligence service |

### Infrastructure
| Directory | Purpose |
|-----------|---------|
| `lib/supabase/` | Client, server, middleware, trigger client |
| `lib/stripe/` | Client, products, server products, webhooks |
| `lib/redis/` | Cache client with TTL management |
| `lib/email/` | Resend client, templates, processing notifications |
| `lib/webhooks/` | HMAC-signed webhook dispatcher |
| `lib/learning/` | AI learning insights tracker |

### Utilities
| File | Purpose |
|------|---------|
| `lib/auth.ts` | requireAuth(), verifyShowOwnership() |
| `lib/circuit-breaker.ts` | Circuit breaker for external APIs |
| `lib/rate-limit.ts` | Redis-based rate limiting |
| `lib/tier-limits.ts` | Subscription tier enforcement |
| `lib/sanitize.ts` | XSS/injection sanitization |
| `lib/validation.ts` | Input validation with Zod |
| `lib/constants.ts` | App constants (tiers, Taddy config, etc.) |

### Scaffolds (require external dependencies)
| Directory | Purpose | Needs |
|-----------|---------|-------|
| `lib/audiogram/` | Types + architecture README | Remotion dependency |
| `lib/i18n/` | Framework + English translations | ES/PT translations |
| `lib/publishing/` | Platform configs + types | OAuth credentials |
| `lib/podcasting2/value-tag.ts` | V4V tag generator | Lightning Network (Alby) |

## Hooks (17 total)

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state |
| `useShows` | Shows list with SWR |
| `useEpisode` | Single episode data |
| `useEpisodes` | Episodes list with search/filter |
| `useEpisodeAssets` | Episode assets |
| `useEpisodeSeo` | SEO analysis data |
| `useGuestPackage` | Guest promotion package |
| `useVocabulary` | Custom vocabulary CRUD |
| `useExperts` | Expert/guest discovery |
| `usePreInterview` | Pre-interview intelligence |
| `usePodcastSearch` | Taddy podcast search |
| `useSubscription` | Stripe subscription state |
| `useUsage` | Usage statistics |
| `usePolling` | Generic polling utility |
| `useDebounce` | Debounce utility |
| `useToast` | Toast notifications |
| `useKeyboardShortcuts` | Keyboard shortcut handler |

## Testing

- **Framework:** Vitest with happy-dom, @testing-library/react
- **Tests:** 513 passing, 1 skipped across 22 test files
- **Coverage thresholds:** 60% (lines, functions, branches, statements)
- **CI:** GitHub Actions (lint → typecheck → test → build → deploy)
- **Test files:** `app/test/unit/` (15 files) + `app/test/integration/` (17 files)
- **Run tests:** `cd app && npx vitest run`
- **Type check:** `cd app && npx tsc --noEmit`

## UI Design System: "Swiss Broadcast"

**Typography:** Space Grotesk (display) + Source Serif 4 (body) + JetBrains Mono (mono)
**Colors (light):** Warm stone background (#EDEAE5), warm white cards (#FAFAF8), electric blue accent (#2563EB), terracotta warmth (#C2693D)
**Colors (dark):** Deep charcoal (#1A1A1E), elevated surface (#232328), brightened blue (#3B82F6), warm copper (#D97A4A)
**Signature:** Status indicator dots cascade through the interface like a system status board
**Dark mode:** Class-based toggle via `data-theme="dark"` on `<html>`, stored in localStorage

## Key Files Reference

| File | Purpose |
|------|---------|
| `docs/Archived/PODBRAIN-PRD-ALABASTER.md` | Original product requirements |
| `docs/planning/LAUNCH-ROADMAP.md` | 8-phase launch roadmap (all complete) |
| `docs/planning/TADDY-INTEGRATION-PLAN.md` | Taddy API integration plan |
| `docs/planning/PODCASTING-2.0-STRATEGY.md` | Podcasting 2.0 tag strategy |
| `docs/testing/TEST_STRATEGY.md` | Testing approach |
| `docs/design/DATA-FLOW.md` | Data flow & status mapping |
| `docs/design/COMPONENT-INVENTORY.md` | Component inventory |
| `app/.env.local` | Environment variables (gitignored) |
| `supabase/migrations/` | Database schema (8 migrations) |
| `.github/workflows/test.yml` | CI/CD pipeline |

## Environment Variables Required

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# AI Services
ASSEMBLYAI_API_KEY
XAI_API_KEY                    # xAI Grok (grok-4-1-fast)

# Background Jobs
TRIGGER_SECRET_KEY

# Cache
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Payments
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Email
RESEND_API_KEY

# Podcast Hosting
BUZZSPROUT_API_KEY
TRANSISTOR_API_KEY             # Optional

# Podcast Data
TADDY_API_KEY                  # Taddy podcast search
TADDY_USER_ID                  # Taddy auth header

# Error Tracking
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN

# Analytics
NEXT_PUBLIC_POSTHOG_KEY        # Optional
```

## Pricing Tiers

| Tier | Price | Episodes/mo | Shows | Team Seats | Features |
|------|-------|-------------|-------|------------|----------|
| Free | $0 | 3 | 1 | 1 | Core features |
| Pro | $19/mo | 50 | 5 | 1 | Advanced assets, priority processing |
| Agency | $49/mo | 200 | Unlimited | 5 | Team collaboration, white-label ready |

## Current Project Status

**All 8 phases of the launch roadmap are complete.** The app is feature-complete but needs:

1. **End-to-end testing** — Verify all features work with real API keys and data
2. **Integration testing** — Test Stripe, AssemblyAI, xAI, Taddy, Buzzsprout flows
3. **Bug fixing** — Address issues found during E2E testing
4. **Deployment hardening** — Production environment setup, monitoring
5. **External dependencies** — Audiogram (Remotion), i18n translations, OAuth credentials, V4V Lightning

See `docs/planning/PHASE-2-ROADMAP.md` for the detailed next-steps plan.

## Common Tasks

### Running the app
```bash
cd app && npm run dev
```

### Running tests
```bash
cd app && npx vitest run          # All tests
cd app && npx tsc --noEmit        # Type check
```

### Adding a new asset type
1. Add to `asset_type` enum in database migration
2. Create generation logic in `lib/content/asset-prompts.ts`
3. Add UI component in episode detail view
4. Register in content multiplication engine

### Processing a new episode
1. Upload audio via dropzone → Supabase Storage
2. `POST /api/episodes/[id]/process` triggers Trigger.dev job
3. AssemblyAI transcribes via webhook callback
4. Vocabulary post-processing with Grok
5. Show notes + 30+ assets generated
6. Webhooks dispatched, email sent
7. Status updated to 'completed'
