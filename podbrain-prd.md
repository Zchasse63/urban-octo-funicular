# PodBrain - Product Requirements Document

> Loki Mode PRD | Estimated build time: ~2-4 hours (Complex)

## Quick Start
```bash
./autonomy/run.sh ./podbrain-prd.md
```

---

## Product Vision

**Name:** PodBrain
**Domain:** getpodbrain.ai (or podbrain.ai if available)
**Tagline:** The SEO growth engine for podcasters—with AI that actually learns your show.
**Target User:** Independent podcasters and podcast agencies who want to maximize episode discoverability and repurpose content efficiently.

### Problem Statement
Podcasters spend 2-4 hours per episode on post-production tasks: writing show notes, creating social posts, generating clips, and optimizing for SEO. Most AI transcription tools produce generic output with frequent errors on guest names, brand names, and technical terms. Existing solutions are English-first, leaving the fastest-growing podcast markets (Spanish, Portuguese) underserved.

### Solution Overview
An AI-powered platform that transforms podcast audio into SEO-optimized show notes, 30+ content assets, and a complete guest promotion package—all while learning each show's unique vocabulary over time. Built with multi-language support from day one, targeting the underserved Spanish and Portuguese podcast markets.

### Success Metrics
- Users save 2+ hours per episode on post-production
- 90%+ accuracy on proper nouns after vocabulary learning
- Show notes achieve measurable SEO ranking improvements
- Guest promotion packages lead to 2x more social shares
- Achieve $5K MRR within 6 months

### Out of Scope (v1)
- Native iOS/Android apps (PWA only)
- Live transcription during recording
- Video podcast support (audio-only initially)
- Public API access (V2 consideration)
- White-label capabilities (not planned)
- Apple Podcasts Connect integration (no public API)

---

## Features

### Feature: Audio Upload & Transcription

**User Story:** As a podcaster, I want to upload my audio file and get an accurate transcript so I can generate show notes.

**Acceptance Criteria:**
- [ ] Upload audio files up to 4 hours (MP3, WAV, M4A, FLAC)
- [ ] Drag-and-drop or click-to-upload interface
- [ ] Progress indicator during upload and processing
- [ ] Transcription completes within 2x audio duration
- [ ] Speaker diarization identifies different speakers
- [ ] Word-level timestamps for all content
- [ ] Support for English, Spanish, Portuguese languages
- [ ] Auto-detect language or allow manual selection

**Edge Cases:**
- Very large files (>500MB): Show upload progress, chunk if needed
- Poor audio quality: Warn user, proceed with best-effort transcription
- Multiple languages in one episode: Handle code-switching gracefully
- Upload interrupted: Resume capability or clear error message

**Priority:** Must-have

---

### Feature: Custom Vocabulary & Name Accuracy

**User Story:** As a podcaster, I want my guest names and brand mentions to be spelled correctly every time.

**Acceptance Criteria:**
- [ ] Pre-fill guest name from booking URL (Calendly, SavvyCal)
- [ ] Accept custom vocabulary list before processing (guest name, company, products)
- [ ] Keyword boosting passed to transcription API
- [ ] LLM post-processing corrects remaining errors with context
- [ ] User corrections saved to show-specific vocabulary database
- [ ] Corrections apply retroactively to full transcript
- [ ] Vocabulary compounds over time (data moat)
- [ ] Show vocabulary page to view/edit learned terms

**Edge Cases:**
- Non-Western names: Handle with care, allow phonetic hints
- Homophones: "their/there/they're" resolved by context
- Brand names with unusual spelling: Store alternatives ("Airbnb" ↔ "air be and be")

**Priority:** Must-have

---

### Feature: AI Show Notes Generation

**User Story:** As a podcaster, I want AI-generated show notes that are SEO-optimized and ready to publish.

**Acceptance Criteria:**
- [ ] Generate structured show notes with: summary, key topics, timestamps, resources mentioned
- [ ] Output in multiple formats: HTML, Markdown, plain text
- [ ] Include guest bio section (if guest episode)
- [ ] Extract and list all resources/links mentioned
- [ ] Generate episode chapters with timestamps
- [ ] Create key takeaways section (bullet points)
- [ ] Editable in rich text editor before export
- [ ] One-click copy to clipboard
- [ ] Direct export to hosting platforms (Buzzsprout, Transistor - Month 4)

**Edge Cases:**
- Very short episodes (<10 min): Adjust output length proportionally
- No clear structure: AI creates logical organization
- Multiple guests: Generate bios for each

**Priority:** Must-have

---

### Feature: SEO Intelligence Layer

**User Story:** As a podcaster, I want to know how my show notes will rank and how to improve them.

**Acceptance Criteria:**
- [ ] Real-time SEO scoring (keyword density, readability, header structure)
- [ ] Target keyword input with optimization suggestions
- [ ] Compare against top-ranking podcast pages for same topic
- [ ] Readability score (Flesch-Kincaid)
- [ ] Suggested improvements with one-click apply
- [ ] Historical SEO score tracking per episode
- [ ] Show estimated ranking position for target keywords

**Edge Cases:**
- No target keyword provided: Suggest based on content
- Highly competitive keywords: Suggest long-tail alternatives

**Priority:** Must-have

---

### Feature: Schema Markup Auto-Generation

**User Story:** As a podcaster, I want proper structured data so Google displays my episodes correctly.

**Acceptance Criteria:**
- [ ] Auto-generate PodcastEpisode schema (JSON-LD)
- [ ] Include all required fields: name, datePublished, duration, description
- [ ] Include guest info as contributor (if applicable)
- [ ] Include timestamps/chapters as hasPart
- [ ] One-click copy schema markup
- [ ] Validate schema against Google's requirements
- [ ] Preview how it will appear in search results

**Edge Cases:**
- Missing required fields: Prompt user or use sensible defaults

**Priority:** Must-have

---

### Feature: Guest Promotion Package

**User Story:** As a podcaster, I want to give my guests everything they need to promote the episode so they actually share it.

**Acceptance Criteria:**
- [ ] Auto-generate pre-written social posts (LinkedIn, Twitter, Instagram variations)
- [ ] Create 3-5 pull quote cards with guest attribution
- [ ] Generate suggested audiogram clips featuring guest
- [ ] Package all assets in a shareable link or downloadable ZIP
- [ ] One-click email to guest with promotion package
- [ ] Include request for Apple Podcast review
- [ ] Include referral request for other guest recommendations

**Edge Cases:**
- No guest (solo episode): Skip or offer host-focused package
- Guest has no photo: Generate text-only quote cards

**Priority:** Must-have (Month 2)

---

### Feature: Content Multiplication Engine (30+ Assets)

**User Story:** As a podcaster, I want to generate all my social content from one episode without manual work.

**Acceptance Criteria:**
- [ ] Generate all asset types from single episode:
  - Show notes (HTML/Markdown) - SEO-optimized
  - Newsletter email (ConvertKit/Mailchimp ready)
  - Blog post (1,500-2,000 words expanded)
  - LinkedIn post (host perspective)
  - LinkedIn post (guest perspective)
  - Twitter/X thread (5-8 tweets)
  - Instagram carousel script (5-7 slides)
  - YouTube description with chapters
  - TikTok/Reels hooks (3 viral-style openings)
  - Quote cards (3-5 shareable quotes)
  - Episode title variations (A/B test ready)
  - Key takeaways (bullet list)
- [ ] All assets editable before export
- [ ] Bulk download or individual copy
- [ ] Consistent voice/tone across all outputs

**Edge Cases:**
- Very technical content: Adjust social posts for accessibility
- Controversial topics: Flag for human review

**Priority:** Should-have (Month 3)

---

### Feature: Viral Moment Detection

**User Story:** As a podcaster, I want AI to identify the best clips for social media so I don't have to scrub through the whole episode.

**Acceptance Criteria:**
- [ ] Analyze transcript for high-potential moments:
  - Controversial or surprising statements
  - Emotional peaks (laughter, passion, frustration)
  - Quotable one-liners
  - Surprising revelations
  - Counter-intuitive advice
- [ ] Rank clips by viral potential score
- [ ] Provide reasoning for each suggestion
- [ ] Show timestamp ranges for easy extraction
- [ ] One-click send to audiogram generator

**Edge Cases:**
- Monotone episode: Focus on content quality over emotion
- Multiple potential clips: Limit to top 5 with explanation

**Priority:** Should-have (Month 3)

---

### Feature: Audiogram & Clip Generation

**User Story:** As a podcaster, I want video clips with captions I can post directly to social media.

**Acceptance Criteria:**
- [ ] Generate clips in 30/60/90 second lengths
- [ ] Support multiple aspect ratios: Square (1:1), Vertical (9:16), Landscape (16:9)
- [ ] Auto-caption overlay with animation
- [ ] Waveform visualization synced to audio
- [ ] Speaker name labels
- [ ] Customizable colors/branding
- [ ] Download as MP4
- [ ] Preview before rendering

**Edge Cases:**
- Poor audio quality: Warn user, captions may be less accurate
- Very fast speech: Adjust caption timing

**Priority:** Should-have (Month 3)

---

### Feature: Cross-Episode Internal Linking

**User Story:** As a podcaster, I want to build topic clusters across my episodes for better SEO.

**Acceptance Criteria:**
- [ ] Detect topics mentioned across episodes using embeddings
- [ ] Auto-suggest internal links for show notes ("You also discussed X in episode 45")
- [ ] Generate "Related Episodes" section
- [ ] Build topic clusters automatically
- [ ] Show topic coverage map across all episodes

**Edge Cases:**
- New show with few episodes: Provide value once 5+ episodes exist

**Priority:** Nice-to-have (Month 3)

---

### Feature: Pre-Interview Guest Intelligence

**User Story:** As a podcaster, I want to prepare better questions by knowing what my guest has already been asked elsewhere.

**Acceptance Criteria:**
- [ ] Scrape guest's other podcast appearances (with URLs provided)
- [ ] List questions guest has already answered
- [ ] Suggest novel questions they haven't been asked
- [ ] Surface trending topics in their industry
- [ ] Identify gaps in their public narrative
- [ ] Generate guest one-sheet with bio, talking points, custom vocabulary

**Edge Cases:**
- Guest with no other appearances: Focus on their content/social
- Paywalled content: Skip and note limitation

**Priority:** Nice-to-have (Month 4)

---

### Feature: Multi-Language Support

**User Story:** As a Spanish-speaking podcaster, I want a tool built for my language, not bolted-on translation.

**Acceptance Criteria:**
- [ ] Full support for English, Spanish, Portuguese
- [ ] Language-specific SEO keyword databases
- [ ] Region-aware Spanish (Mexico vs Spain vs Argentina)
- [ ] UI available in all supported languages
- [ ] Show notes generated in source language (no forced translation)
- [ ] Language auto-detection with manual override

**Edge Cases:**
- Code-switching (multiple languages in episode): Handle gracefully
- Regional slang: Learn via vocabulary system

**Priority:** Must-have (Spanish Month 2, Portuguese Month 3)

---

### Feature: User Authentication

**⚠️ DEFERRED: Skip for initial build. App runs in single-user mode (no login required). Add authentication as a pre-launch requirement.**

**User Story:** As a user, I want to create an account to save my shows and settings.

**Acceptance Criteria (implement pre-launch, not during build):**
- [ ] Register with email/password
- [ ] Login with Google OAuth (requires domain)
- [ ] Magic link option (passwordless)
- [ ] Password reset via email
- [ ] Session persists for 30 days
- [ ] Account settings page (email, password, preferences)

**Build Phase:** App operates without auth. All data is accessible without login. No user_id foreign keys enforced—use a placeholder default user ID so the schema is ready for auth later.

**Edge Cases:**
- Existing email with different auth method: Link accounts
- Weak password: Require 8+ chars, 1 number

**Priority:** Deferred (pre-launch)

---

### Feature: Show Management

**User Story:** As a podcaster with multiple shows, I want to manage them separately with their own vocabularies.

**Acceptance Criteria:**
- [ ] Create multiple shows per account
- [ ] Each show has own vocabulary database
- [ ] Each show has own style/tone preferences
- [ ] Each show has own default language
- [ ] Switch between shows easily
- [ ] Show-specific analytics

**Edge Cases:**
- Delete show: Warn about vocabulary loss, require confirmation

**Priority:** Must-have

---

### Feature: Hosting Platform Integrations

**User Story:** As a podcaster, I want to push show notes directly to my hosting platform.

**Acceptance Criteria:**
- [ ] Connect Buzzsprout account via API
- [ ] Connect Transistor account via API
- [ ] Push show notes directly to episode
- [ ] Sync episode metadata
- [ ] Pull analytics for correlation insights

**Edge Cases:**
- API rate limits: Queue and retry gracefully
- Platform API changes: Monitor and update

**Priority:** Nice-to-have (Month 4)

---

### Feature: Performance Correlation Analytics

**User Story:** As a podcaster, I want to know which show note elements lead to more downloads.

**Acceptance Criteria:**
- [ ] Connect to hosting platform analytics
- [ ] Correlate show note elements with download performance
- [ ] Identify patterns: title length, topic, guest bio length
- [ ] Provide actionable insights: "Episodes with guest bios >100 words get 23% more downloads"
- [ ] Track SEO ranking changes over time

**Edge Cases:**
- Insufficient data: Require minimum episodes before showing insights

**Priority:** Nice-to-have (Month 4)

---

## UI/UX Design

> **Design System:** "Alabaster Topography" — See `/mnt/project/podcast-intelligence-design-system-complete.md` for complete specifications.

### Design Philosophy

The visual language creates depth and hierarchy through subtle layering, shadows, and whitespace rather than color gradients or heavy visual treatments. Inspired by Apple's clean simplicity, Linear's polished components, and Notion's content-first approach.

**Core Principles:**
1. **Light as foundation** — Clean whites and soft grays create calm, focused workspaces
2. **Depth through shadow** — Layered "topographic" shadows suggest elevation without heaviness
3. **Typography as hierarchy** — Monospace labels, weight variations, and spacing define structure
4. **Restrained color** — Color used sparingly and purposefully for actions and status
5. **Generous whitespace** — Content breathes; density is avoided

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#FDFDFD` | Page background, app shell |
| `--bg-subtle` | `#F7F7F6` | Secondary backgrounds, metric cards |
| `--bg-elevated` | `#FFFFFF` | Cards, modals, elevated surfaces |
| `--border-soft` | `#EDEDEC` | Card borders, dividers |
| `--text-primary` | `#121212` | Headlines, body text |
| `--text-secondary` | `#6A6A69` | Labels, captions, nav items |
| `--accent-blue` | `#007AFF` | Links, primary actions |
| `--accent-green` | `#34C759` | Success states, positive trends |
| `--accent-amber` | `#F59E0B` | Warnings |
| `--accent-red` | `#EF4444` | Errors, urgent alerts |

### Typography

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 2rem | 600 | Page titles |
| Heading 1 | 1.5rem | 600 | Section headers |
| Heading 2 | 1.25rem | 600 | Card titles |
| Body | 0.95rem | 400 | Main content |
| Caption | 0.8rem | 400 | Metadata |
| Mono Label | 0.75rem | 500 | Section labels (uppercase, letter-spaced) |

**Fonts:** Inter (primary), JetBrains Mono (labels, timestamps, code)

### Component Library

| Component | Implementation |
|-----------|----------------|
| UI Framework | shadcn/ui |
| Icons | Lucide React |
| Cards | "Topo Card" with layered shadow system |
| Buttons | Primary (dark), Secondary (outlined) |
| Forms | Subtle backgrounds, soft borders, blue focus rings |
| Progress | Thin bars with accent colors |
| Badges | Minimal with status color variants |

### Key Screens

Reference design system document for complete wireframes and specifications:

1. **Episodes List** — Table with search, filters, health scores
2. **Episode Detail (Show Notes Tab)** — Two-column canvas grid, editable notes, guest intelligence
3. **Episode Detail (Intelligence Tab)** — Attention alerts, insights, topic coverage
4. **Content Health Dashboard** — 5-column health scores, trends, opportunities
5. **Pre-Interview Brief** — Guest profile, questions to skip/ask, stories, positions
6. **Expert Discovery** — Search, freshness meters, categorized results
7. **Trending Topics** — Vertical card stack with coverage status
8. **Upload Flow** — 3-step wizard (upload, context, processing)

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar 240px]  │  [Main Content - max 1400px centered]   │
│                   │                                          │
│  WORKSPACE        │  ┌─────────────────────────────────────┐│
│  □ Episodes       │  │ Page Header                         ││
│  + New Upload     │  │ [Badges] [Title] [Actions]          ││
│  👤 Guests        │  └─────────────────────────────────────┘│
│                   │                                          │
│  ─────────────    │  ┌────────────┐ ┌────────────┐ ┌──────┐ │
│                   │  │ Metric     │ │ Metric     │ │Metric│ │
│  DISCOVER         │  │ Card       │ │ Card       │ │Card  │ │
│  🔥 Trending      │  └────────────┘ └────────────┘ └──────┘ │
│  🔍 Experts       │                                          │
│  📊 Competitors   │  ┌─────────────────────────────────────┐│
│                   │  │ Topo Card (Main Content)            ││
│  [spacer]         │  │                                     ││
│                   │  │                                     ││
│  Settings         │  └─────────────────────────────────────┘│
│  Support          │                                          │
└─────────────────────────────────────────────────────────────┘
```

### User Flows

#### Primary Flow: Process New Episode
1. User clicks "+ New Upload" in sidebar
2. Drag-drop audio or paste RSS URL
3. Optional: Enter guest name, target keywords
4. System shows processing progress with steps
5. Redirects to Episode Detail on completion
6. User reviews/edits show notes
7. SEO score shown with actionable suggestions
8. User generates additional assets
9. User exports or copies to clipboard

#### Onboarding Flow (Build Phase - No Auth)
1. Landing page → "Get Started Free"
2. Skip straight to: Create first show (name, language, tone)
3. Upload first episode
4. Guided first upload with tooltips
5. Processing screen explains each step
6. First episode reveals vocabulary learning feature
7. Dashboard shows next steps

### UX Patterns

| Pattern | Implementation |
|---------|----------------|
| Loading | Skeleton loaders matching card shapes |
| Empty States | Illustration + clear CTA |
| AI Processing | Step checklist with timestamps |
| Errors | Toast with retry, red accent |
| Success | Green toast, subtle confetti on milestones |
| Hover | Cards lift with enhanced shadow |

### Accessibility

- **Target:** WCAG 2.1 AA compliance
- Minimum 4.5:1 contrast ratio for text
- Focus rings on all interactive elements (`box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15)`)
- Full keyboard navigation
- Screen reader labels for icons
- Alt text for charts (data tables as fallback)
- Respect `prefers-reduced-motion`

### Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Desktop | 1280px+ | Full layout, sidebar visible |
| Tablet | 768-1279px | Collapsed sidebar, single-column grid |
| Mobile | <768px | Hidden sidebar (hamburger), stacked cards |

---

## Technical Requirements

### Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (Supabase) with pgvector extension
- **Auth:** Supabase Auth (deferred — single-user mode for build, add Email + Google OAuth pre-launch)
- **LLM:** xAI Grok (Grok 4.1 Fast for generation, Grok 4 for reasoning)
- **Transcription:** AssemblyAI (Auto Chapters, LeMUR, 99+ languages)
- **Background Jobs:** Trigger.dev v4
- **Cache:** Upstash Redis
- **Video Generation:** Remotion (audiograms)
- **Email:** Resend (transactional)
- **File Storage:** Supabase Storage
- **Hosting:** Vercel or Netlify

### Platform Strategy
- **Primary:** PWA (Progressive Web App)
- **Desktop:** Full-featured responsive web app
- **Mobile:** Responsive design + PWA install
- **Future:** Capacitor wrapper if native needed

### Constraints
- **Performance:** Transcription < 2x audio duration, show notes generation < 60s
- **Scale:** Support 4-hour audio files, 10,000 episodes per show
- **AI Cost Budget:** ~$0.10-0.15 per episode processed
- **Concurrent Users:** Design for 1,000+ concurrent

### Integrations
- **AssemblyAI:** Transcription, speaker diarization, auto chapters
- **xAI Grok API:** Show notes, social posts, SEO analysis, viral detection
- **Google OAuth:** Social login
- **Buzzsprout API:** Hosting integration (Month 4)
- **Transistor API:** Hosting integration (Month 4)
- **Resend:** Email delivery

---

## Data Model

### Entities

#### User
- id (uuid, primary key)
- email (string, unique, required)
- name (string)
- google_id (string, nullable)
- avatar_url (string, nullable)
- preferences (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

#### Show
- id (uuid, primary key)
- user_id (uuid, foreign key → User)
- name (string, required)
- description (text)
- default_language (string, default 'en')
- style_preferences (jsonb) - tone, format preferences
- artwork_url (string, nullable)
- created_at (timestamp)
- updated_at (timestamp)

#### VocabularyTerm
- id (uuid, primary key)
- show_id (uuid, foreign key → Show)
- term (string, required) - correct spelling
- alternatives (text[]) - common misspellings
- embedding (vector, 1536) - for fuzzy matching
- occurrence_count (integer, default 1)
- created_at (timestamp)
- updated_at (timestamp)
- UNIQUE(show_id, term)

#### Episode
- id (uuid, primary key)
- show_id (uuid, foreign key → Show)
- title (string)
- description (text)
- audio_url (string, required)
- audio_duration_seconds (integer)
- language (string)
- status (enum: pending, processing, completed, failed)
- transcript (text)
- transcript_segments (jsonb) - word-level timestamps
- show_notes (text)
- show_notes_html (text)
- schema_markup (jsonb)
- seo_score (integer)
- seo_analysis (jsonb)
- guest_name (string, nullable)
- guest_bio (text, nullable)
- guest_email (string, nullable)
- viral_moments (jsonb)
- metadata (jsonb)
- published_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)

#### EpisodeSection
- id (uuid, primary key)
- episode_id (uuid, foreign key → Episode)
- content (text, required)
- start_time (float)
- end_time (float)
- speaker (string, nullable)
- embedding (vector, 1536)
- metadata (jsonb)
- created_at (timestamp)

#### GeneratedAsset
- id (uuid, primary key)
- episode_id (uuid, foreign key → Episode)
- asset_type (enum: linkedin_post, twitter_thread, instagram_carousel, newsletter, blog_post, youtube_description, tiktok_hook, quote_card, audiogram, etc.)
- content (text)
- metadata (jsonb) - format-specific data
- file_url (string, nullable) - for audiograms/images
- created_at (timestamp)
- updated_at (timestamp)

#### Correction
- id (uuid, primary key)
- episode_id (uuid, foreign key → Episode)
- original_text (string, required)
- corrected_text (string, required)
- applied_to_vocabulary (boolean, default false)
- created_at (timestamp)

#### HostingConnection
- id (uuid, primary key)
- user_id (uuid, foreign key → User)
- platform (enum: buzzsprout, transistor, podbean)
- access_token (string, encrypted)
- refresh_token (string, encrypted, nullable)
- metadata (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

### Relationships
- User has many Shows
- Show has many Episodes
- Show has many VocabularyTerms
- Episode has many EpisodeSections
- Episode has many GeneratedAssets
- Episode has many Corrections
- User has many HostingConnections

### Indexes
- EpisodeSection.embedding: HNSW index for vector similarity search
- VocabularyTerm.embedding: HNSW index for fuzzy term matching
- Episode.show_id + status: For filtering episodes
- Episode.show_id + created_at: For chronological listing

---

## API Design

### Endpoints

#### Authentication (DEFERRED - skip for build phase)
<!-- Add pre-launch:
- POST /api/auth/register - Email registration
- POST /api/auth/login - Email login
- POST /api/auth/magic-link - Send magic link
- GET /api/auth/callback - OAuth callback
- POST /api/auth/logout - Logout
- GET /api/auth/session - Get current session
-->

#### Shows
- GET /api/shows - List user's shows
- POST /api/shows - Create show
- GET /api/shows/:id - Get show details
- PUT /api/shows/:id - Update show
- DELETE /api/shows/:id - Delete show
- GET /api/shows/:id/vocabulary - Get show vocabulary
- POST /api/shows/:id/vocabulary - Add vocabulary term
- DELETE /api/shows/:id/vocabulary/:termId - Remove term

#### Episodes
- GET /api/shows/:showId/episodes - List episodes
- POST /api/shows/:showId/episodes - Create episode (upload)
- GET /api/episodes/:id - Get episode details
- PUT /api/episodes/:id - Update episode
- DELETE /api/episodes/:id - Delete episode
- POST /api/episodes/:id/process - Trigger processing
- GET /api/episodes/:id/status - Get processing status
- POST /api/episodes/:id/correction - Submit correction

#### Generated Assets
- GET /api/episodes/:id/assets - List generated assets
- POST /api/episodes/:id/assets/generate - Generate specific asset type
- PUT /api/assets/:id - Update asset content
- DELETE /api/assets/:id - Delete asset
- POST /api/episodes/:id/audiogram - Generate audiogram

#### SEO
- GET /api/episodes/:id/seo - Get SEO analysis
- POST /api/episodes/:id/seo/analyze - Re-run SEO analysis
- GET /api/episodes/:id/schema - Get schema markup

#### Guest Package
- GET /api/episodes/:id/guest-package - Get guest promotion package
- POST /api/episodes/:id/guest-package/send - Email package to guest

#### Integrations
- GET /api/integrations - List connected platforms
- POST /api/integrations/connect - Initiate OAuth flow
- DELETE /api/integrations/:id - Disconnect platform
- POST /api/episodes/:id/publish - Push to hosting platform

#### Search & Similarity
- POST /api/shows/:id/search - Semantic search across episodes
- GET /api/episodes/:id/related - Get related episodes

---

## Deployment

### Environments
- **Production:** Vercel/Netlify (auto-deploy from main)
- **Staging:** Preview deployments on PR

### Domain
- podnotes.ai (or similar - TBD)
- app.podnotes.ai (main application)

### CI/CD
- GitHub Actions for testing
- Auto-deploy on push to main
- Preview deployments for PRs

### Environment Variables
```
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Auth (DEFERRED - skip for build phase)
# NEXTAUTH_SECRET=
# NEXTAUTH_URL=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# AI Services
XAI_API_KEY=
ASSEMBLYAI_API_KEY=

# Background Jobs
TRIGGER_API_KEY=
TRIGGER_API_URL=

# Cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Email
RESEND_API_KEY=

# Storage
SUPABASE_STORAGE_BUCKET=

# Integrations (Month 4)
BUZZSPROUT_CLIENT_ID=
BUZZSPROUT_CLIENT_SECRET=
TRANSISTOR_API_KEY=
```

### Monitoring & Alerts
- **Error Tracking:** Sentry
- **Uptime:** Better Uptime or similar
- **Analytics:** Vercel Analytics + PostHog
- **Alert Channels:** Email, Slack (if team grows)

---

## Business Operations

### Pricing Model

**Model:** Freemium with usage-based tiers
**Payment Processor:** Stripe

| Tier | Price | Limits | Features |
|------|-------|--------|----------|
| **Free** | $0 | 3 episodes/month, 1 show | Basic show notes, SEO score, social posts |
| **Pro** | $19/mo | Unlimited episodes, 3 shows | All assets, guest packages, vocabulary learning, Spanish/Portuguese, priority support |
| **Agency** | $49/mo | Unlimited episodes, 20 shows | Everything in Pro + 5 team seats, priority processing, bulk exports, dedicated support |

**V2 Considerations (not v1):**
- Public API access for Agency tier
- Usage-based pricing for high-volume users

**Billing Logic:**
- Monthly billing, cancel anytime
- Upgrade/downgrade prorated
- Episode count resets monthly
- Team seats are per-account (Agency only)

### Legal Pages

Generate using standard SaaS templates:

| Page | Requirements |
|------|--------------|
| Terms of Service | User responsibilities, content ownership (user owns their content), service limitations, termination |
| Privacy Policy | Data collected (email, audio files, usage), GDPR compliance, no data selling, retention policy |
| Cookie Policy | Minimal cookies (auth, analytics only), consent banner for EU |

### Landing Page

**URL:** getpodbrain.ai (or podbrain.ai)

**Hero Section:**
- Headline: "Turn podcast episodes into SEO-optimized content—automatically"
- Subheadline: "AI that learns your show's vocabulary. 30+ assets from every episode. 2+ hours saved."
- CTA: "Start Free — No Credit Card Required"
- Visual: Animated demo of audio → show notes transformation

**Problem/Solution Section:**
| Pain Point | PodBrain Solution |
|------------|-------------------|
| "Show notes take forever" | AI-generated in under 60 seconds |
| "AI gets names wrong" | Vocabulary learning improves with every episode |
| "My podcast doesn't rank on Google" | SEO scoring with actionable suggestions + schema markup |
| "Guests never share episodes" | Ready-made promotion packages they can post instantly |
| "I repurpose content manually" | 30+ assets (social, newsletter, clips) from one upload |

**Key Benefits Section:**
1. **Save 2+ Hours Per Episode** — Show notes, social posts, and clips generated automatically
2. **AI That Actually Learns Your Show** — Names, brands, and jargon improve over time
3. **SEO Intelligence Platforms Won't Build** — Scoring, suggestions, and schema markup
4. **Guest Promotion That Gets Shares** — Ready-made packages guests can post in seconds
5. **Multi-Language Support** — Built for Spanish and Portuguese markets from day one

**Social Proof Section:**
- "Join X podcasters saving Y hours every week"
- Testimonials (gather post-launch)
- Episode counter: "X episodes processed"
- Logos of early users (if permitted)

**Pricing Section:**
- 3-tier comparison table
- Highlight Pro as "Most Popular"
- FAQ below pricing

**Footer:**
- Links: Features, Pricing, Terms, Privacy, Contact
- Social: Twitter/X, LinkedIn
- © 2025 PodBrain

### Marketing Channels (Post-Launch)

| Channel | Strategy |
|---------|----------|
| Twitter/X | Share tips for podcasters, show product updates |
| LinkedIn | Target B2B podcasters and agencies |
| Product Hunt | Launch for initial visibility |
| Podcast communities | Reddit (r/podcasting), Facebook groups |
| SEO | Blog content on podcast growth, show notes best practices |

---

## Quality Requirements

### Performance
- Page load: < 2s (Lighthouse > 90)
- Episode processing: < 2x audio duration
- Show notes generation: < 60s
- SEO analysis: < 10s
- Asset generation: < 30s each

### Security
- HTTPS only
- Input sanitization on all user input
- Rate limiting (100 requests/minute for API)
- File upload validation (audio types only)
- Secure token storage for integrations

### Reliability
- 99.9% uptime target
- Graceful degradation if AI services unavailable
- Retry logic for all external API calls
- Queue-based processing with dead letter handling

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus indicators

---

## Implementation Roadmap

### MVP (Weeks 1-4)
- [ ] User authentication — DEFERRED (single-user mode for build)
- [ ] Show management (CRUD)
- [ ] Audio upload to Supabase Storage
- [ ] AssemblyAI transcription integration
- [ ] Basic vocabulary pre-fill (guest name input)
- [ ] Grok show notes generation
- [ ] Basic SEO scoring
- [ ] Schema markup generation
- [ ] Episode workspace UI

### Month 2
- [ ] Vocabulary learning system (corrections → database)
- [ ] Guest promotion package generation
- [ ] Social post variations (LinkedIn, Twitter, Instagram)
- [ ] Newsletter format export
- [ ] Spanish language support
- [ ] PWA configuration

### Month 3
- [ ] Portuguese language support
- [ ] Full 30-asset content engine
- [ ] Audiogram/clip generation (Remotion)
- [ ] Viral moment detection
- [ ] Cross-episode internal linking
- [ ] Bulk export options

### Month 4+
- [ ] Buzzsprout/Transistor integrations
- [ ] Performance correlation analytics
- [ ] Pre-interview guest intelligence
- [ ] Vertical-specific features (business, true crime)
- [ ] Public API access (V2 consideration)

---

## PRD Completeness Check

### Discovery Phase
- [x] Product vision clear
- [x] Target user defined
- [x] Success metrics specified
- [x] Scope boundaries set

### Architecture Phase
- [x] Tech stack specified
- [x] Constraints documented
- [x] Integrations listed

### Infrastructure Phase
- [x] Deployment target specified
- [x] Database requirements clear
- [x] Environment variables listed

### Development Phase
- [x] All features have acceptance criteria
- [x] User stories complete
- [x] Edge cases documented
- [x] UI/UX design direction defined (Alabaster Topography design system)
- [x] Key screens identified
- [x] User flows documented

### QA Phase
- [x] Testable criteria exist
- [x] Expected behaviors documented
- [x] Accessibility requirements specified

### Deployment Phase
- [x] Platform specified
- [x] Domain configured (getpodbrain.ai)
- [x] Monitoring approach defined

### Business Phase
- [x] Pricing model defined (Free/Pro/Agency tiers)
- [x] Legal pages specified (Terms, Privacy, Cookies)
- [x] Marketing requirements set (Landing page spec complete)

---

## Appendix: Loki Mode Instructions

### Expected Build Time
- Complex application: ~2-4 hours

### Recommended Flags
- For first run: Default (review output)
- For overnight builds: `LOKI_MAX_RETRIES=100`

### Monitoring
```bash
watch -n 2 cat .loki/STATUS.txt
```

### Post-Build Checklist
1. Verify all environment variables configured
2. Test app loads without auth (single-user mode)
3. Upload test audio file
4. Verify transcription completes
5. Check show notes quality
6. Test SEO scoring
7. Verify mobile responsiveness
8. Test PWA installation
