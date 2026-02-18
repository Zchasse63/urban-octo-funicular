# PodBrain - Project Context

## What is PodBrain?

An AI-powered platform for podcasters that transforms audio into SEO-optimized show notes, 30+ content assets, and guest promotion packages. The AI learns each show's vocabulary over time for improved accuracy.

**Target Users:** Independent podcasters and podcast agencies
**Domain:** getpodbrain.ai

## Tech Stack

- **Frontend:** Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS v4
- **UI Components:** Kokonut UI + Kokonut UI Pro, shadcn/ui, Motion (animations)
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

## Design System: "Kinetic Alabaster"

Motion-rich UI built on Kokonut UI with cursor-aware interactions and AI-native feedback patterns.

**Key Design Docs:**
- `docs/kokonut/podbrain-kokonut-design-system.md` - Full design system
- `docs/kokonut/podbrain-kokonut-quick-reference.md` - Component quick reference
- `docs/kokonut/kokonut-ui-pro-setup-guide.md` - Pro license setup

**Core Tokens:**
- `--bg-base: #FDFDFD` | `--bg-elevated: #FFFFFF` | `--bg-glass: rgba(255, 255, 255, 0.72)`
- `--text-primary: #121212` | `--accent-blue: #007AFF`
- **Fonts:** Inter (body), JetBrains Mono (labels/code)

**Component Libraries:**
- `src/components/kokonutui/` - Free Kokonut UI components
- `src/components/kokonutui-pro/` - Pro components (card-02, modal-01)
- `src/components/podbrain/` - Custom compositions
- `src/components/ui/` - shadcn/ui base components

## Key Files Reference

| File | Purpose |
|------|---------|
| `docs/product/podbrain-prd.md` | Full product requirements |
| `docs/kokonut/` | Kokonut UI design system + quick reference + Pro setup |
| `docs/testing/TEST_STRATEGY.md` | Testing approach |
| `app/.env.local` | Environment variables (gitignored) |
| `app/components.json` | Kokonut UI registry config |
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
KOKO_PRO_TOKEN          # Kokonut UI Pro license
```

## Pricing Tiers

- **Free:** 3 episodes/month, 1 show
- **Pro ($19/mo):** Unlimited episodes, 3 shows
- **Agency ($49/mo):** Unlimited, 20 shows, 5 team seats
