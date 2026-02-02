# PodBrain

**The SEO growth engine for podcasters—with AI that actually learns your show.**

PodBrain is an AI-powered platform that transforms podcast audio into SEO-optimized show notes, 30+ content assets, and complete guest promotion packages—all while learning each show's unique vocabulary over time.

## Problem

Podcasters spend 2-4 hours per episode on post-production tasks: writing show notes, creating social posts, generating clips, and optimizing for SEO. Most AI transcription tools produce generic output with frequent errors on guest names, brand names, and technical terms.

## Solution

- AI-generated show notes in under 60 seconds
- Vocabulary learning that improves with every episode
- SEO scoring with actionable suggestions + schema markup
- Ready-made guest promotion packages
- 30+ assets (social, newsletter, clips) from one upload
- Multi-language support (English, Spanish, Portuguese)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL (Supabase) with pgvector |
| Auth | Supabase Auth (deferred for MVP) |
| LLM | xAI Grok |
| Transcription | AssemblyAI |
| Background Jobs | Trigger.dev v4 |
| Cache | Upstash Redis |
| Video Generation | Remotion (audiograms) |
| Email | Resend |
| File Storage | Supabase Storage |
| Payments | Stripe |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd urban-octo-funicular

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Environment Variables

See `.env.example` for all required variables. Key services:

- **Supabase** - Database, storage, and auth
- **AssemblyAI** - Audio transcription
- **xAI** - AI content generation
- **Trigger.dev** - Background job processing
- **Upstash Redis** - Caching and rate limiting
- **Stripe** - Payment processing
- **Resend** - Transactional email
- **Buzzsprout** - Podcast hosting integration

## Features

### Core (MVP)

- Audio upload & transcription (MP3, WAV, M4A, FLAC up to 4 hours)
- Speaker diarization and word-level timestamps
- Custom vocabulary & name accuracy
- AI show notes generation (HTML, Markdown, plain text)
- SEO intelligence layer with scoring and suggestions
- Schema markup auto-generation (PodcastEpisode JSON-LD)
- Show management (multiple shows per account)

### Month 2

- Guest promotion packages
- Social post generation (LinkedIn, Twitter, Instagram)
- Newsletter format export
- Spanish language support

### Month 3

- Portuguese language support
- Full 30-asset content engine
- Audiogram/clip generation
- Viral moment detection
- Cross-episode internal linking

### Month 4+

- Hosting platform integrations (Buzzsprout, Transistor)
- Performance correlation analytics
- Pre-interview guest intelligence

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (deferred)
│   ├── (dashboard)/       # Main app routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utilities and helpers
├── trigger/              # Trigger.dev jobs
├── supabase/             # Database migrations
└── public/               # Static assets
```

## Design System

"Alabaster Topography" — Clean whites and soft grays with subtle layered shadows. Inspired by Apple's simplicity, Linear's polish, and Notion's content-first approach.

- **Fonts:** Inter (primary), JetBrains Mono (labels)
- **UI Components:** shadcn/ui
- **Icons:** Lucide React

## Pricing

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 3 episodes/month, 1 show |
| Pro | $19/mo | Unlimited episodes, 3 shows |
| Agency | $49/mo | Unlimited episodes, 20 shows, 5 team seats |

## License

Proprietary - All rights reserved.
