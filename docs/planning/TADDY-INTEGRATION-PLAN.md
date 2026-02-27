# Taddy API Integration Plan for PodBrain

**Date:** 2026-02-26
**Status:** PLANNING — No code yet
**Priority:** CRITICAL — Core feature dependency

---

## 1. Problem Statement

PodBrain's Expert Discovery system (`/experts`) currently uses **xAI Grok to hallucinate expert suggestions**. The AI invents names, appearance counts, contact info, and bios from its training data. This means:

- **Expert data is fabricated** — appearance counts, bios, and contact links may not exist
- **No verification** — users cannot validate suggestions against real podcast data
- **Guest Package is generic** — social posts use placeholder templates, not real episode data
- **Pre-Interview Intelligence (PRD feature) is NOT STARTED** — finding what a guest said on other podcasts requires real podcast data
- **Cross-show intelligence is impossible** — no access to external podcast ecosystem data
- **Guest credits database doesn't exist** — no way to track who appeared where

Taddy API solves all of these by providing access to **4M+ podcasts and 200M+ episodes** with real metadata, transcripts, guest credits, and search.

---

## 2. What Taddy Provides

### Data Available
| Data Type | Details |
|-----------|---------|
| **Podcast metadata** | Name, description, image, genres, language, country, popularity rank, RSS URL, iTunes ID |
| **Episode metadata** | Title, description, audio URL, duration, publish date, season/episode numbers, chapters |
| **Person/Guest credits** | Name, role (HOST/GUEST/PRODUCER), profile URL, avatar — from `persons` field (Podcasting 2.0 `<podcast:person>` tag) |
| **Transcripts** | Full text, speaker segmentation, timecodes — for any episode (Pro plan: 100/month) |
| **Search** | Full-text search across all podcasts and episodes with 15+ filters |
| **Charts** | Daily top charts by country/genre from Apple Podcasts |
| **Popularity rankings** | TOP_200, TOP_1000, TOP_5000, TOP_10000 |
| **Webhooks** | Real-time notifications for new episodes, updates (Business plan) |
| **Creator profiles** | Bio, content portfolio, social links, roles across shows |

### API Characteristics
- **GraphQL** — query exactly what you need, no over-fetching
- **Caching allowed** — Taddy explicitly permits storing data on your servers
- **Cached responses are FREE** — repeated queries don't count against quota
- **Pro plan:** $75/mo for 100,000 requests + 100 transcript credits
- **Business plan:** $150/mo for 350,000 requests + 2,000 transcript credits + webhooks
- **Auth:** `X-USER-ID` + `X-API-KEY` headers
- **Pagination:** Up to 25 results/page, 1000 pages max
- **Transcript speed:** ~10 seconds per 1 hour of audio (on-demand)

### Key Limitations
- `persons` field depends on podcast creators adding `<podcast:person>` tags — not all shows have this
- Search is text-based (name in title/description), not a dedicated guest credits database
- Max 500 results per search term (25/page × 20 pages)
- Free plan: only 1,000 requests/month — insufficient for production
- Transcript quality varies; uses OpenAI Whisper v3-turbo

---

## 3. Current Codebase — What Exists vs. What Changes

### Files That Must Change

| File | Current State | After Taddy Integration |
|------|--------------|------------------------|
| `lib/experts/discovery.ts` | Grok-only hallucinated experts | Taddy search → real results, Grok as fallback/enrichment |
| `lib/experts/types.ts` | Basic Expert type | Extended with Taddy source data, podcast appearances |
| `hooks/use-experts.ts` | Calls Grok-based API | Same interface, backed by Taddy data |
| `components/experts/experts-page.tsx` | Shows AI-generated cards | Shows real podcast appearance data with links |
| `lib/guest-package/generator.ts` | Static template social posts, placeholder quotes | Enriched with real episode data from Taddy |
| `app/api/shows/[id]/experts/route.ts` | Calls discoverExperts (Grok) | Calls Taddy search, caches results |
| `.env.local` | No Taddy credentials | Add TADDY_USER_ID, TADDY_API_KEY |

### Files That Must Be Created

| New File | Purpose |
|----------|---------|
| `lib/taddy/client.ts` | GraphQL client with auth, error handling, retry |
| `lib/taddy/types.ts` | TypeScript types matching Taddy GraphQL schema |
| `lib/taddy/queries.ts` | Pre-built GraphQL query strings |
| `lib/taddy/cache.ts` | Local caching strategy — check DB before API call |
| `lib/taddy/search.ts` | Search orchestration — combine text search + persons field |
| `app/api/taddy/search/route.ts` | General podcast/episode search endpoint |
| `app/api/episodes/[id]/pre-interview/route.ts` | Pre-interview guest intelligence endpoint |
| `supabase/migrations/XXXXXX_taddy_cache.sql` | Cache tables for Taddy data |

### Database Schema Additions

```sql
-- Cache for podcast series data from Taddy
CREATE TABLE taddy_podcast_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  taddy_uuid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rss_url TEXT,
  itunes_id INTEGER,
  genres TEXT[],
  language TEXT,
  country TEXT,
  popularity_rank TEXT,
  total_episodes INTEGER,
  author_name TEXT,
  website_url TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache for episode data from Taddy
CREATE TABLE taddy_episode_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  taddy_uuid TEXT UNIQUE NOT NULL,
  podcast_taddy_uuid TEXT REFERENCES taddy_podcast_cache(taddy_uuid),
  name TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  duration INTEGER,
  date_published TIMESTAMPTZ,
  episode_number INTEGER,
  season_number INTEGER,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest appearances tracked from Taddy (the credits database)
CREATE TABLE guest_appearances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  guest_name TEXT NOT NULL,
  guest_name_normalized TEXT NOT NULL, -- lowercase, trimmed for matching
  guest_image_url TEXT,
  guest_profile_url TEXT,
  role TEXT DEFAULT 'guest', -- HOST, GUEST, PRODUCER, etc.
  episode_taddy_uuid TEXT,
  podcast_taddy_uuid TEXT,
  podcast_name TEXT,
  episode_name TEXT,
  date_published TIMESTAMPTZ,
  duration_seconds INTEGER,
  audio_url TEXT,
  source TEXT DEFAULT 'taddy_search', -- taddy_search, taddy_persons, manual
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_name_normalized, episode_taddy_uuid)
);

CREATE INDEX idx_guest_appearances_name ON guest_appearances(guest_name_normalized);
CREATE INDEX idx_guest_appearances_podcast ON guest_appearances(podcast_taddy_uuid);
CREATE INDEX idx_guest_appearances_date ON guest_appearances(date_published DESC);

-- Pre-interview intelligence cache
CREATE TABLE pre_interview_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  appearances JSONB NOT NULL, -- Array of {podcast, episode, date, topics}
  common_questions JSONB, -- AI-extracted from transcripts
  talking_points JSONB, -- AI-generated interview prep
  cached_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Feature Integration Map

### Feature 1: Expert Discovery (REPLACE Grok with Taddy)

**Current:** Grok hallucinates 10-15 experts from its training data
**After:** Taddy searches real podcast episodes for people who appear as guests in the topic niche

**Flow:**
1. User enters topic (e.g., "AI ethics")
2. Search Taddy for episodes matching the topic
3. Extract `persons` field from results (names tagged as HOST/GUEST)
4. Also search Taddy for creators in the topic
5. Cross-reference: find people who appear across multiple shows
6. Calculate real freshness score from actual appearance dates
7. Cache results in `guest_appearances` table
8. Optionally enrich with Grok for bios/insights where Taddy data is sparse

**Taddy Queries Used:**
- `search(term: "AI ethics", filterForTypes: PODCASTEPISODE)` — find episodes
- `getCreator(name: "Expert Name")` — get creator profiles
- `getPodcastEpisode(uuid: "...")` — get full episode details with persons

### Feature 2: Pre-Interview Guest Intelligence (NEW — PRD Feature)

**Current:** NOT IMPLEMENTED
**After:** Given a guest name, find all their previous podcast appearances, extract topics discussed, identify questions already answered

**Flow:**
1. User enters guest name for upcoming episode
2. Search Taddy: `search(term: "Guest Name", filterForTypes: PODCASTEPISODE, matchBy: EXACT_PHRASE)`
3. Paginate through results (up to 500 episodes)
4. For top 10-20 appearances by popularity, fetch transcripts (if available)
5. Use Grok to analyze transcripts: extract topics, questions answered, key positions
6. Generate "Questions to Skip" list (already answered elsewhere)
7. Generate "Fresh Angles" list (topics not yet covered)
8. Generate one-sheet with bio, talking points, vocabulary
9. Cache all results in `pre_interview_cache`

**Taddy Queries Used:**
- `search(term: "Guest Name", filterForTypes: PODCASTEPISODE, matchBy: EXACT_PHRASE, sortBy: POPULARITY)`
- `getPodcastEpisode(uuid: "...", transcript, transcriptWithSpeakersAndTimecodes)`

### Feature 3: Enhanced Guest Package (IMPROVE Existing)

**Current:** Static template social posts, placeholder quotes, generic email
**After:** Real episode data from Taddy enriches the package

**Enhancements:**
- Pull guest's other appearances to include "Also heard on..." section
- Use real podcast cover art and episode links
- Generate social posts that reference actual content topics
- Include guest's profile image from Taddy `persons.img`
- Add "Similar episodes your audience might enjoy" from Taddy search

### Feature 4: Podcast Search & Discovery (NEW)

**Current:** NOT IMPLEMENTED
**After:** Users can search the entire podcast ecosystem

**Use Cases:**
- Find podcasts in their niche for cross-promotion
- Research competitors' shows
- Discover trending topics via top charts
- Find shows to pitch themselves as a guest

**Taddy Queries Used:**
- `search(term: "topic", filterForTypes: PODCASTSERIES)`
- `getTopChartsByGenre(genre: TECHNOLOGY, country: US)`
- `getPopularContent(taddyType: PODCASTSERIES)`

### Feature 5: Cross-Show Intelligence (NEW)

**Current:** Cross-episode similarity only works within user's own episodes
**After:** Can compare with external podcast data

**Enhancements:**
- "What are other shows in your niche talking about this week?"
- Topic trending analysis from top charts
- Competitive positioning against similar shows

### Feature 6: Guest Credits Database (NEW — Growing Asset)

**Current:** No guest tracking
**After:** Every Taddy search incrementally builds a local credits database

**Strategy:**
- Cache ALL Taddy results locally (Taddy allows this)
- Normalize guest names for fuzzy matching
- Track appearances over time
- Build a data moat that makes the product more valuable with use
- Cached responses don't count against Taddy quota

---

## 5. Implementation Phases

### Phase T1: Foundation (Taddy Client + Cache Infrastructure)
- [ ] Create `lib/taddy/client.ts` — GraphQL client with auth, error handling, retry, rate limit tracking
- [ ] Create `lib/taddy/types.ts` — TypeScript types for Taddy responses
- [ ] Create `lib/taddy/queries.ts` — Pre-built GraphQL queries
- [ ] Create `lib/taddy/cache.ts` — Check cache before API call pattern
- [ ] Add TADDY_USER_ID and TADDY_API_KEY to `.env.local` and env docs
- [ ] Write migration for `taddy_podcast_cache`, `taddy_episode_cache`, `guest_appearances`, `pre_interview_cache` tables
- [ ] Add rate limit tracking for Taddy (100K/month Pro plan)

### Phase T2: Expert Discovery Rewrite
- [ ] Rewrite `lib/experts/discovery.ts` to use Taddy search as primary source
- [ ] Keep Grok as enrichment layer (bios, insights) for results Taddy returns
- [ ] Update `lib/experts/types.ts` with Taddy source fields (taddy_uuid, podcast info, real appearance data)
- [ ] Update `app/api/shows/[id]/experts/route.ts` to use new discovery
- [ ] Update `components/experts/experts-page.tsx` to show real podcast appearance data
- [ ] Add "View on [Podcast Name]" links to expert cards
- [ ] Add appearance timeline visualization
- [ ] Cache all search results in `guest_appearances` table

### Phase T3: Pre-Interview Intelligence (New Feature)
- [ ] Create `lib/taddy/search.ts` — orchestrate guest appearance search
- [ ] Create `app/api/episodes/[id]/pre-interview/route.ts` — API endpoint
- [ ] Build pre-interview intelligence generation pipeline:
  - Taddy search for guest appearances
  - Transcript fetching for top appearances
  - Grok analysis of transcripts for questions/topics
- [ ] Create `components/episodes/pre-interview-tab.tsx` — UI component
- [ ] Add pre-interview tab to episode workspace (6th tab)
- [ ] Wire into upload wizard: guest name → auto-trigger pre-interview search
- [ ] Cache results in `pre_interview_cache`

### Phase T4: Guest Package Enhancement
- [ ] Update `lib/guest-package/generator.ts` to use Taddy data
- [ ] Pull guest's real appearance history for "Also heard on..." section
- [ ] Use real podcast cover art and links from Taddy
- [ ] Generate AI-powered social posts using actual episode topics (not templates)
- [ ] Include guest profile image from Taddy `persons.img`

### Phase T5: Podcast Search & Discovery
- [ ] Create `app/api/taddy/search/route.ts` — general search endpoint
- [ ] Create `components/discover/podcast-search.tsx` — search UI
- [ ] Add discover/search page or integrate into existing navigation
- [ ] Implement top charts display
- [ ] Add "Find shows to pitch as guest" workflow

---

## 6. Integration with Existing Launch Roadmap

### Where Taddy Fits in the 8-Phase Plan

**Phase 0 (Critical Fixes):** No Taddy dependency — fix bugs first
**Phase 1 (Auth & Security):** No Taddy dependency — secure routes first
**Phase 2 (Data Integrity):** Add Taddy cache tables in this migration batch
**Phase 3 (Processing Pipeline):** No Taddy dependency
**Phase 4 (UX Polish):** Taddy T2 (Expert Discovery rewrite) fits here
**Phase 5 (Integration):** Taddy T1 (Foundation), T3 (Pre-Interview), T4 (Guest Package) fit here
**Phase 6 (Testing):** Taddy integration tests, mock Taddy responses for unit tests
**Phase 7 (Launch Prep):** Taddy T5 (Search & Discovery) is post-launch

### Recommended Insertion

The Taddy foundation (T1) should be built in **Phase 2** alongside other database migrations.
Expert Discovery rewrite (T2) should happen in **Phase 4** (UX Polish).
Pre-Interview Intelligence (T3) and Guest Package Enhancement (T4) should happen in **Phase 5** (Integration).
Podcast Search (T5) is a **post-launch feature**.

---

## 7. Cost Analysis

### Taddy API Costs
| Plan | Monthly Cost | Requests | Transcripts | Webhooks |
|------|-------------|----------|-------------|----------|
| Pro | $75/mo | 100,000 | 100/mo | No |
| Business | $150/mo | 350,000 | 2,000/mo | Yes |

### Per-User Cost Estimates
- Expert search: ~5 queries per search (paginated) = 5 API calls
- Pre-interview intelligence: ~25 queries (search + episode details + transcripts) = 25 API calls + 5-10 transcript credits
- Guest package enhancement: ~3 queries = 3 API calls
- Average user: ~50 API calls/month

**Pro plan supports:** ~2,000 active users (100K requests / 50 per user)
**Business plan supports:** ~7,000 active users

### Cost Per Episode
- With Taddy: ~$0.04 per episode (Taddy portion, assuming 50 calls at $75/100K)
- Total per episode: ~$0.18-0.20 (Taddy + AssemblyAI + xAI Grok)
- Within the $0.10-0.15 budget? **No — budget needs updating to $0.20**

---

## 8. Risk Assessment

### Technical Risks
1. **`persons` field coverage is incomplete** — Not all podcasts tag guests. Mitigation: Fall back to text search + AI extraction from descriptions.
2. **Search is text-based, not a guest database** — "Shane Gillis" search finds episodes mentioning him, but some may not be appearances. Mitigation: AI post-filtering to determine if the person is actually a guest.
3. **Rate limits** — 100K/month on Pro could be exhausted by heavy users. Mitigation: Aggressive local caching (Taddy allows this), cached responses are free.
4. **Transcript credits are limited** — 100/month on Pro for pre-interview feature. Mitigation: Only fetch transcripts for top appearances, check if transcript exists before requesting.
5. **GraphQL client complexity** — Need proper error handling for partial responses, rate limit errors, query complexity limits. Mitigation: Use graphql-request library, add retry logic.

### Business Risks
1. **Taddy pricing could change** — They're a startup. Mitigation: Data caching means we're not locked in; can switch to Podchaser or Listen Notes.
2. **Data quality varies** — Some podcast metadata is poorly maintained. Mitigation: Validate and clean data before displaying.
3. **Cost per episode increases** — From $0.15 to $0.20. Mitigation: Taddy costs are shared across users (amortized), not per-episode.

### Dependencies
- Need Taddy API credentials (user must sign up at taddy.org)
- Pro plan minimum ($75/mo) for transcripts and adequate request volume
- `graphql-request` npm package for GraphQL client
- No dependency on Taddy for core processing pipeline (transcription, show notes, assets)

---

## 9. Environment Variables Needed

```
TADDY_USER_ID=your_taddy_user_id
TADDY_API_KEY=your_taddy_api_key
```

---

## 10. Questions for Scrutiny

1. Should Taddy be the PRIMARY data source for expert discovery, or should Grok remain primary with Taddy as supplementary?
2. Is the pre-interview intelligence feature worth the transcript credit cost at scale?
3. Should we build the guest credits database incrementally (search-triggered) or do a bulk import upfront?
4. How do we handle the `persons` field gap — when podcasts don't tag their guests?
5. Should Taddy search be exposed directly to users, or only used internally?
6. Is $75/mo Taddy Pro sufficient for launch, or should we start with Business ($150/mo)?
7. How does Taddy fit with the existing Buzzsprout integration? Are they complementary or overlapping?
8. Should Taddy webhook integration (real-time new episodes) be a launch feature or post-launch?
