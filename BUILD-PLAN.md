# PodBrain Complete Build Plan

## Executive Summary

Building the complete PodBrain platform from the PRD, including all Month 1-4+ features. Using Zeroshot for multi-agent orchestration with adversarial validation.

**Total Phases:** 9
**Approach:** Sequential phases, each validated before proceeding

## Progress Tracker

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1: Foundation | ✅ COMPLETE | 2026-02-02 | 2026-02-02 |
| 2: Core Pipeline | ✅ COMPLETE | 2026-02-02 | 2026-02-02 |
| 3: SEO Intelligence | 🔄 IN PROGRESS | 2026-02-02 | - |
| 4: Content Engine | ⏳ Pending | - | - |
| 5: Guest Package | ⏳ Pending | - | - |
| 6: Advanced AI | ⏳ Pending | - | - |
| 7: Integrations | ⏳ Pending | - | - |
| 8: Business Layer | ⏳ Pending | - | - |
| 9: Polish | ⏳ Pending | - | - |

---

## Available API Keys (from .env)

| Service | Key Status | Purpose |
|---------|------------|---------|
| AssemblyAI | ✅ Ready | Transcription, speaker diarization |
| Supabase | ✅ Ready | Database, storage, (future auth) |
| Upstash Redis | ✅ Ready | Caching, rate limiting |
| xAI/Grok | ✅ Ready | Show notes, content generation |
| Trigger.dev | ✅ Ready | Background job processing |
| Stripe | ✅ Ready (test) | Payments, subscriptions |
| Resend | ✅ Ready | Email delivery |
| Buzzsprout | ✅ Ready | Podcast hosting integration |

---

## What's Already Built (Loki Output)

### UI Components (scaffolded, need design system alignment)
- Layout: sidebar.tsx, app-shell.tsx
- Episodes: episode-list.tsx, episode-row.tsx, episode-header.tsx
- Upload: upload-wizard.tsx, step-upload.tsx, step-context.tsx, step-processing.tsx
- Shows: show-card.tsx, create-show-modal.tsx, vocabulary-list.tsx
- SEO: seo-score-card.tsx, seo-suggestions.tsx, schema-preview.tsx
- Assets: asset-grid.tsx, asset-card.tsx, asset-editor.tsx
- Guest Package: social-post-card.tsx, quote-cards.tsx, email-template.tsx

### Backend (scaffolded, mostly TODO placeholders)
- Database schema: 0001_initial_schema.sql (complete)
- Trigger.dev jobs: process-episode.ts, transcribe-audio.ts, generate-show-notes.ts, generate-assets.ts
- API routes: /api/shows, /api/episodes, /api/episodes/[id]/process
- Supabase clients: client.ts, server.ts (need connection testing)

### What's NOT Working
- All Supabase calls are `// TODO` comments
- AssemblyAI API calls return mock data
- xAI/Grok calls not implemented
- No file upload to Supabase Storage
- No Stripe integration
- No Resend email sending
- No Buzzsprout integration
- Design system partially applied (needs audit)

---

## Phase 1: Foundation (Zeroshot STANDARD:TASK)

**Goal:** Wire up core infrastructure, ensure design system compliance
**Status:** 🔄 IN PROGRESS
**Zeroshot Cluster:** clever-glacier-81 (terminated - manual completion)
**Classification:** STANDARD:TASK

### Tasks
1. **Supabase Connection**
   - [x] Supabase client (browser) configured - `src/lib/supabase/client.ts`
   - [x] Supabase server client configured - `src/lib/supabase/server.ts`
   - [x] Test endpoint created - `/api/test-db`
   - [ ] **MANUAL STEP REQUIRED:** Run database migration (see `supabase/SETUP.md`)
   - [ ] Verify RLS policies work
   - [ ] Test CRUD operations on all tables

2. **Design System Audit & Fix**
   - [x] CSS variables defined in globals.css (509 lines)
   - [ ] Audit all components against design system spec
   - [ ] Fix typography (Inter + JetBrains Mono)
   - [ ] Fix shadows (--shadow-topo, --shadow-topo-hover)
   - [ ] Fix color tokens usage in components
   - [ ] Add missing animations (fadeIn, hover states)

3. **Upstash Redis Setup**
   - [x] Redis client configured - `src/lib/redis/client.ts`
   - [x] Cache utilities added - `src/lib/redis/cache.ts`
   - [x] Rate limiting middleware - `src/lib/redis/rate-limit.ts`
   - [x] Test endpoint created - `/api/test-redis`

### Validation Criteria
- [ ] Supabase queries work (create show, list shows) - **Waiting on migration**
- [x] Design system CSS variables all defined
- [ ] Components match Figma/spec visually
- [x] Redis connection verified

---

## Phase 2: Core AI Pipeline (Zeroshot CRITICAL:TASK)

**Goal:** Working transcription and show notes generation

### Tasks
1. **File Upload to Supabase Storage**
   - Create upload API endpoint
   - Handle chunked uploads for large files (4hr max)
   - Progress tracking
   - Generate signed URLs for processing

2. **AssemblyAI Integration**
   - Implement real API calls (not mocks)
   - Configure speaker diarization
   - Configure word-level timestamps
   - Handle keyword boosting from vocabulary
   - Poll for completion with Trigger.dev

3. **xAI Grok Show Notes Generation**
   - Implement Grok API client
   - Create show notes generation prompt
   - Generate structured output (summary, timestamps, key points)
   - Generate HTML and Markdown versions
   - Extract resources mentioned

4. **Processing Pipeline Integration**
   - Connect all steps in Trigger.dev job
   - Save results to Supabase
   - Update episode status in real-time
   - Handle errors gracefully

### Validation Criteria
- [ ] Can upload MP3 file and see it in Supabase Storage
- [ ] Transcription returns real text with speakers
- [ ] Show notes generate with proper structure
- [ ] Episode status updates visible in UI

---

## Phase 3: SEO Intelligence (Zeroshot STANDARD:TASK)

**Goal:** Real SEO analysis and schema markup

### Tasks
1. **SEO Analyzer Implementation**
   - Real keyword density calculation
   - Flesch-Kincaid readability score
   - Header structure analysis
   - Internal link detection
   - Generate actionable suggestions

2. **Schema Markup Generator**
   - Generate valid PodcastEpisode JSON-LD
   - Include all required fields
   - Include guest as contributor
   - Include chapters as hasPart
   - Validate against Google requirements

3. **Search Preview Component**
   - Mock Google SERP appearance
   - Show title truncation
   - Show description preview
   - Show URL structure

4. **One-Click SEO Fixes**
   - Implement suggestion application
   - Track historical SEO scores

### Validation Criteria
- [ ] SEO score reflects actual content quality
- [ ] Schema validates at schema.org validator
- [ ] Suggestions are actionable and applicable

---

## Phase 4: Content Multiplication (Zeroshot CRITICAL:TASK)

**Goal:** Generate 30+ content assets per episode

### Tasks
1. **Asset Generation with Grok**
   - LinkedIn post (host perspective)
   - LinkedIn post (guest perspective)
   - Twitter/X thread (5-8 tweets)
   - Instagram carousel script
   - YouTube description
   - TikTok hooks (3 variations)
   - Newsletter email
   - Blog post (1500-2000 words)
   - Quote cards content (3-5)
   - Episode title variations

2. **Vocabulary Learning System**
   - Save user corrections to database
   - Apply corrections to vocabulary_terms table
   - Generate embeddings for fuzzy matching
   - Apply vocabulary on future transcriptions

3. **Asset Management UI**
   - Edit assets before export
   - Copy to clipboard functionality
   - Bulk download as ZIP
   - Regenerate individual assets

### Validation Criteria
- [ ] All 12+ asset types generate
- [ ] Assets maintain consistent voice/tone
- [ ] Corrections save and apply to future episodes
- [ ] Copy/download functions work

---

## Phase 5: Guest Promotion Package (Zeroshot STANDARD:TASK)

**Goal:** Complete guest promotion workflow

### Tasks
1. **Social Post Variants**
   - Platform-specific formatting
   - Character count validation
   - Hashtag suggestions
   - @mention handling

2. **Quote Cards**
   - Extract quotes from viral moments
   - Generate card content
   - (Future: image generation)

3. **Email with Resend**
   - Configure Resend client
   - Create email template
   - Include social posts in email
   - Include review request
   - Include referral request
   - Send functionality

4. **Package Export**
   - Generate ZIP with all assets
   - Shareable link generation
   - Track package opens (analytics)

### Validation Criteria
- [ ] Social posts fit platform limits
- [ ] Email sends successfully via Resend
- [ ] ZIP downloads with all assets

---

## Phase 6: Advanced AI Features (Zeroshot CRITICAL:TASK)

**Goal:** Intelligence features that differentiate PodBrain

### Tasks
1. **Viral Moment Detection**
   - Analyze transcript for high-potential clips
   - Identify emotional peaks
   - Find quotable one-liners
   - Rank by viral potential
   - Provide timestamp ranges

2. **Cross-Episode Linking**
   - Generate embeddings for episode sections
   - Similarity search with pgvector
   - Auto-suggest internal links
   - Generate "Related Episodes" section
   - Build topic clusters

3. **Pre-Interview Guest Intelligence**
   - Guest profile aggregation
   - Questions to skip (asked before)
   - Unique angles to explore
   - Stories they repeat
   - Positions they've stated

4. **Expert Discovery**
   - Search experts by topic
   - Freshness scoring
   - Over-interviewed warnings
   - Contact information

### Validation Criteria
- [ ] Viral moments have timestamps and reasoning
- [ ] Related episodes show real similarities
- [ ] Guest intel surfaces actionable insights

---

## Phase 7: Integrations (Zeroshot STANDARD:TASK)

**Goal:** Connect external services

### Tasks
1. **Stripe Payments**
   - Configure Stripe products/prices
   - Implement checkout flow
   - Handle webhooks
   - Subscription management
   - Usage tracking per tier

2. **Buzzsprout Integration**
   - OAuth or API key auth
   - Pull episode list
   - Push show notes to episodes
   - Sync metadata

3. **Hosting Connections UI**
   - Connection management page
   - Status indicators
   - Disconnect functionality

### Validation Criteria
- [ ] Can complete Stripe checkout (test mode)
- [ ] Buzzsprout episodes appear in app
- [ ] Can push show notes to Buzzsprout

---

## Phase 8: Business Layer (Zeroshot STANDARD:TASK)

**Goal:** Marketing and legal pages

### Tasks
1. **Landing Page**
   - Hero section with value prop
   - Problem/solution section
   - Benefits section
   - Pricing table (3 tiers)
   - Social proof section
   - Footer with links

2. **Legal Pages**
   - Terms of Service
   - Privacy Policy
   - Cookie Policy

3. **PWA Configuration**
   - manifest.json
   - Service worker
   - Offline support
   - Install prompt

4. **Analytics Setup**
   - Basic event tracking
   - Conversion tracking

### Validation Criteria
- [ ] Landing page loads at root
- [ ] Legal pages accessible
- [ ] PWA installable on mobile

---

## Phase 9: Polish (Zeroshot STANDARD:INQUIRY + TASK)

**Goal:** Production-ready quality

### Tasks
1. **Mobile Responsive**
   - Sidebar collapses on tablet
   - Hidden sidebar on mobile
   - Touch-friendly interactions
   - Test all breakpoints

2. **Accessibility Audit**
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader testing
   - Color contrast verification

3. **Performance Optimization**
   - Lighthouse > 90
   - Image optimization
   - Code splitting
   - Caching headers

4. **Error Handling**
   - Global error boundary
   - Toast notifications
   - Retry logic
   - Graceful degradation

### Validation Criteria
- [ ] Lighthouse performance > 90
- [ ] Mobile UI fully functional
- [ ] No accessibility violations

---

## Zeroshot Execution Strategy

### Phase Prompts

Each phase will be executed as a separate Zeroshot task:

```bash
# Phase 1
zeroshot run "Phase 1 prompt..." --worktree

# Monitor
zeroshot status <cluster-id>
zeroshot logs <cluster-id> -f
```

### Budget Estimates

| Phase | Complexity | Est. Cost |
|-------|------------|-----------|
| 1: Foundation | STANDARD | $5-10 |
| 2: Core Pipeline | CRITICAL | $15-25 |
| 3: SEO | STANDARD | $5-10 |
| 4: Content Engine | CRITICAL | $15-25 |
| 5: Guest Package | STANDARD | $5-10 |
| 6: Advanced AI | CRITICAL | $20-30 |
| 7: Integrations | STANDARD | $10-15 |
| 8: Business | STANDARD | $5-10 |
| 9: Polish | STANDARD | $5-10 |
| **Total** | | **$85-145** |

---

## Next Steps

1. Create detailed audit of current code vs design system
2. Run Phase 1 with Zeroshot
3. Validate Phase 1 completion
4. Proceed to Phase 2
5. Repeat until complete

---

*Document created: 2026-02-02*
