# PodBrain - Project Context

## What is PodBrain?

An AI-powered platform for podcasters that transforms audio into SEO-optimized show notes, 30+ content assets, and guest promotion packages. The AI learns each show's vocabulary over time for improved accuracy.

**Target Users:** Independent podcasters and podcast agencies
**Domain:** getpodbrain.ai

## Tech Stack

- **Frontend:** Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS v4
- **UI Components:** Custom "Swiss Broadcast" design system (see `ui-architect-checkpoint-podbrain.md`)
- **Database:** Supabase (PostgreSQL with pgvector for embeddings)
- **AI:** xAI Grok (content generation), AssemblyAI (transcription)
- **Background Jobs:** Trigger.dev v4
- **Cache:** Upstash Redis
- **Payments:** Stripe
- **Email:** Resend
- **Podcast Integration:** Buzzsprout API

## Critical Architecture Decisions

### Auth is DEFERRED

The app runs in **single-user mode** for the initial build. No login required.

- Do NOT implement authentication flows
- Use a placeholder default user ID in database queries
- Schema has user_id columns ready for auth to be added pre-launch

### Database Schema Key Entities

```
User → Show → Episode → EpisodeSections
                     → GeneratedAssets
                     → Corrections
     → VocabularyTerms
```

- **VocabularyTerm** has embeddings (vector 1536) for fuzzy matching
- **EpisodeSection** has embeddings for semantic search
- Use HNSW indexes on vector columns

### Processing Pipeline

1. User uploads audio → Supabase Storage
2. Trigger.dev job sends to AssemblyAI
3. Transcript returned with speaker diarization + timestamps
4. Custom vocabulary applied (keyword boosting + LLM post-processing)
5. xAI Grok generates show notes, SEO analysis, assets
6. Results stored in Episode record

### Performance Constraints

- Transcription: < 2x audio duration
- Show notes generation: < 60 seconds
- Support 4-hour audio files
- AI cost budget: ~$0.10-0.15 per episode

## API Patterns

RESTful endpoints under `/api/`:

```
/api/shows                     - Show CRUD
/api/shows/:id/episodes        - Episode listing
/api/shows/:id/vocabulary      - Vocabulary management
/api/episodes/:id              - Episode CRUD
/api/episodes/:id/process      - Trigger processing
/api/episodes/:id/assets       - Generated assets
/api/episodes/:id/seo          - SEO analysis
/api/episodes/:id/guest-package - Guest promo package
```

## UI Design System: "Swiss Broadcast"

The UI uses a custom design system called "Swiss Broadcast" — precise grid layout, editorial typography, warm stone surfaces with paper grain texture. Supports light and dark modes.

**Design checkpoint:** `ui-architect-checkpoint-podbrain.md` (full spec)

**Typography:** Space Grotesk (display) + Source Serif 4 (body) + JetBrains Mono (mono)
**Colors (light):** Warm stone background (#EDEAE5), warm white cards (#FAFAF8), electric blue accent (#2563EB), terracotta warmth (#C2693D)
**Colors (dark):** Deep charcoal (#1A1A1E), elevated surface (#232328), brightened blue (#3B82F6), warm copper (#D97A4A)
**Signature:** Status indicator dots cascade through the interface like a system status board
**Dark mode:** Class-based toggle via `data-theme="dark"` on `<html>`, stored in localStorage, FOUC prevention script in root layout

**Component structure:**
- `app/src/components/ui/` — Primitive building blocks (button, card, badge, input, tabs, skeleton, empty-state, dropdown-menu, progress, theme-toggle)
- `app/src/components/layout/` — Structural (sidebar, page-header, nav-item, show-selector)
- `app/src/components/episodes/` — Episode-specific (episode-row, episode-header, status-dot, seo-score, signal-chain)
- `app/src/components/upload/` — Upload flow (dropzone)

**Route structure:**
- `/episodes` — Episode list with search/filter
- `/episodes/[id]` — Episode workspace with 5-tab interface (Notes, Assets, Transcript, Guest Package, Intelligence)
- `/upload` — 3-step upload flow (file → details → processing)
- `/vocabulary` — Custom vocabulary management
- `/experts` — AI-powered expert/guest discovery
- `/settings` — Subscription management and integrations
- `/support` — Help center and FAQ

**Responsive:** Mobile-first with slide-out sidebar overlay on screens < 768px, hamburger menu in mobile header

**Previous design system docs** (for reference only, describes the OLD UI on `main`):
- `docs/kokonut/` — Kokonut UI design system docs from the previous build

**Backend code is fully intact** — all API routes, lib utilities, hooks, types, and Trigger.dev jobs are unchanged.

## Key Files Reference

| File | Purpose |
|------|---------|
| `docs/product/podbrain-prd.md` | Full product requirements |
| `docs/kokonut/` | Previous UI design system docs (reference only) |
| `docs/testing/TEST_STRATEGY.md` | Testing approach |
| `app/.env.local` | Environment variables (gitignored) |
| `trigger/` | Background job definitions |
| `supabase/migrations/` | Database schema |

## What's In Scope (MVP)

- Audio upload & transcription
- Custom vocabulary with learning
- AI show notes generation
- SEO scoring & schema markup
- Show management
- Episode workspace UI

## What's OUT of Scope (v1)

- Native iOS/Android apps (PWA only)
- Live transcription
- Video podcast support
- Public API access
- White-label
- Apple Podcasts Connect

## Common Tasks

### Adding a new asset type

1. Add to `asset_type` enum in database
2. Create generation logic using xAI Grok
3. Add UI component in episode detail view
4. Register in content multiplication engine

### Processing a new episode

1. Upload triggers Trigger.dev job
2. AssemblyAI handles transcription
3. Vocabulary post-processing with Grok
4. Show notes + assets generated
5. Status updated to 'completed'

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ASSEMBLYAI_API_KEY
XAI_API_KEY
TRIGGER_SECRET_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
RESEND_API_KEY
BUZZSPROUT_API_KEY
KOKO_PRO_TOKEN          # Kokonut UI Pro license (not currently in use)
```

## Pricing Tiers

- **Free:** 3 episodes/month, 1 show
- **Pro ($19/mo):** Unlimited episodes, 3 shows
- **Agency ($49/mo):** Unlimited, 20 shows, 5 team seats
