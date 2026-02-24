# PodBrain Data Flow & Status Mapping

> Maps every UI indicator to its data source. Every status dot, progress bar, badge, meter, and
> score in the UI is backed by a real database field, API endpoint, or computed value.
> Nothing is decorative.

---

## 1. Episode Processing Pipeline

### 1.1 Complete Flow

```
User Action                          System Response                        UI Update
────────────────────────────────────────────────────────────────────────────────────────
Upload audio file                 →  POST /api/upload                    →  File preview shown
                                     (→ Supabase Storage)

Create episode record             →  POST /api/episodes                  →  Episode appears in list
                                     (status: 'pending')                    Status dot: gray hollow

Trigger processing                →  POST /api/episodes/[id]/process     →  Status dot: blue pulsing
                                     (→ Trigger.dev job started)            Signal chain: stage 1 active
                                     (status: 'processing')                 Processing banner count +1

  Step 1: uploading (0%)          →  metadata.processing_step updated    →  Signal chain: Upload active
  Step 2: transcribing (10%)      →  metadata.processing_progress: 10   →  Signal chain: Transcribe active
  Step 3: vocabulary (40%)        →  metadata.processing_progress: 40   →  Signal chain: Transcribe active
  Step 4: show_notes (50%)        →  metadata.processing_progress: 50   →  Signal chain: Generate active
  Step 5: seo_analysis (70%)      →  metadata.processing_progress: 70   →  Signal chain: Generate active
  Step 6: generating_assets (80%) →  metadata.processing_progress: 80   →  Signal chain: Generate active
  Step 7: completed (100%)        →  status: 'completed'                →  Signal chain: Ready (all green)
                                     seo_score populated                    Status dot: green solid
                                     show_notes populated                   Processing banner count -1
                                     assets generated                       SEO gauge appears

  On failure:                     →  status: 'failed'                   →  Status dot: red
                                     metadata.error_message set             Error badge shown
                                                                            "Retry" action button
```

### 1.2 Trigger.dev Run Status Mapping

| Trigger.dev Status | Episode Status | UI Indicator |
|-------------------|----------------|--------------|
| PENDING | processing | Blue pulsing dot, "Queued" label |
| QUEUED | processing | Blue pulsing dot, "Queued" label |
| EXECUTING | processing | Blue pulsing dot, step label from metadata |
| COMPLETED | completed | Green solid dot |
| FAILED | failed | Red solid dot, error message |
| CANCELED | pending | Gray hollow dot (reset to pending) |
| REATTEMPTING | processing | Blue pulsing dot, "Retrying" label |
| FROZEN | processing | Amber dot, "Frozen" label |

---

## 2. Real-Time Polling

### 2.1 Polling Configuration

| Context | Condition | Interval | Endpoint | Hook |
|---------|-----------|----------|----------|------|
| Episode detail | `episode.status === 'processing'` | 3s | GET /api/episodes/[id]/process | `usePolling()` |
| Episode list | Any episode has `status === 'processing'` | 10s | GET /api/episodes | `usePolling()` |
| Processing banner | Same as episode list | 10s | Same (count derived) | Same |

### 2.2 Polling Stops When

- Episode transitions to `completed` or `failed`
- User navigates away from the page
- No episodes in `processing` state (for list view)

---

## 3. Page-Level Data Requirements

### 3.1 Episodes List (`/episodes`)

| UI Element | Data Source | API Endpoint | Hook |
|------------|------------|--------------|------|
| Episode rows | `Episode[]` | GET /api/episodes?show_id=X | `useEpisodes()` |
| Status dots | `episode.status` | Same | Same |
| SEO scores (inline) | `episode.seo_score` | Same | Same |
| Filter counts (All/Completed/Processing/Draft) | Aggregated from episode list | Same (client-side count) | Same |
| Processing banner count | Count where `status === 'processing'` | Same | Same |
| Episode count (nav badge) | `total` from paginated response | Same | Same |
| Show selector | `Show[]` | GET /api/shows | `useShows()` |
| Current show | First show or localStorage last-selected | Same | Same |
| Sidebar plan card | Subscription tier + usage | GET /api/subscriptions | `useSubscription()` |
| "+ New Episode" | Routes to /upload | — | — |

### 3.2 Episode Detail (`/episodes/[id]`)

| UI Element | Data Source | API Endpoint | Hook |
|------------|------------|--------------|------|
| Episode header | `Episode` | GET /api/episodes/[id] | `useEpisode(id)` |
| Status badge | `episode.status` | Same | Same |
| Signal chain | `episode.metadata.processing_step` | GET /api/episodes/[id]/process | `usePolling()` |
| Signal chain progress | `episode.metadata.processing_progress` | Same | Same |
| Show Notes (tab 1) | `episode.show_notes_html` | GET /api/episodes/[id] | `useEpisode(id)` |
| SEO gauge | `episode.seo_score` | GET /api/episodes/[id]/seo | `useEpisodeSeo(id)` |
| SEO details | `episode.seo_analysis` | Same | Same |
| Assets (tab 2) | `GeneratedAsset[]` | GET /api/episodes/[id]/assets | `useEpisodeAssets(id)` |
| Transcript (tab 3) | `episode.transcript_segments` | GET /api/episodes/[id] | `useEpisode(id)` |
| Guest Package (tab 4) | Package data | GET /api/episodes/[id]/guest-package | fetch on tab select |
| Viral Moments (tab 5) | `ViralMoment[]` | GET /api/episodes/[id]/viral-moments | fetch on tab select |
| Guest Intel (tab 5) | Intel data | GET /api/episodes/[id]/guest-intel | fetch on tab select |
| Process action | Triggers job | POST /api/episodes/[id]/process | — |
| Export action | Downloads assets | Multiple asset downloads | — |
| Retry action | Replays job | PUT /api/episodes/[id]/process | — |

### 3.3 Upload (`/upload`)

| UI Element | Data Source | API Endpoint |
|------------|------------|--------------|
| File dropzone | Browser File API | — |
| File upload | FormData | POST /api/upload |
| Create episode | Form data | POST /api/episodes |
| Trigger processing | Form data + episode ID | POST /api/episodes/[id]/process |
| URL validation | Client-side regex | — |

### 3.4 Vocabulary (`/vocabulary`)

| UI Element | Data Source | API Endpoint |
|------------|------------|--------------|
| Vocabulary list | `VocabularyTerm[]` | GET /api/shows/[id]/vocabulary |
| Total terms stat | `terms.length` | Same (computed) |
| Avg accuracy boost | Mean of `occurrence_count` trends | Same (computed) |
| Category count | Distinct categories | Same (computed) |
| Needs review count | Terms with low confidence | Same (computed) |
| Category filter | Client-side filter | — |
| Search | Client-side filter on term/phonetic | — |
| Sparkline data | `occurrence_count` over last 7 episodes | Derived from term history |
| AI suggestions | Embedding similarity matches | Computed from vocab embeddings vs transcript |
| Add term | Form data | POST /api/shows/[id]/vocabulary |
| Delete term | Term ID | DELETE /api/shows/[id]/vocabulary/[termId] |
| Validate term | Term ID | PUT /api/shows/[id]/vocabulary/[termId] |

### 3.5 Experts (`/experts`)

| UI Element | Data Source | API Endpoint |
|------------|------------|--------------|
| Expert list | `Expert[]` | GET /api/shows/[id]/experts |
| Expert search | Query param | GET /api/shows/[id]/experts?topic=X |
| Match score | `expert.freshness_score` | Same |
| Availability | Derived from expert metadata | Same |
| AI insight | Computed from expert analysis | Same |
| Added count | Count of shortlisted | Client-side state |
| Total count | `experts.length` | Same |
| Pending count | Count with pending review | Same |
| Shortlist toggle | Local state + persistence | POST/DELETE /api/shows/[id]/experts/[id]/shortlist |

### 3.6 Settings (`/settings`)

| UI Element | Data Source | API Endpoint |
|------------|------------|--------------|
| Current plan | `subscription.tier` | GET /api/subscriptions |
| Plan status badge | `subscription.status` | Same |
| Price | From SUBSCRIPTION_TIERS constant | constants.ts |
| Billing cycle | `subscription.current_period_start/end` | Same |
| Features list | From SUBSCRIPTION_TIERS constant | constants.ts |
| Audio Minutes used | Sum of `episode.audio_duration_seconds` this period | Computed: query episodes in period |
| Audio Minutes limit | From SUBSCRIPTION_TIERS per tier | constants.ts |
| Storage used | Supabase Storage usage | Supabase admin API or computed |
| Storage limit | From SUBSCRIPTION_TIERS per tier | constants.ts |
| API calls | API call counter | Tracked via middleware or Upstash |
| API call limit | From SUBSCRIPTION_TIERS per tier | constants.ts |
| Integration status | `hosting_connections` table | GET hosting connections |
| API keys | User preferences or keys table | GET API keys |
| Account Health | Composite check | Derived from subscription + episodes + integrations |
| Stripe portal | Stripe URL | GET /api/subscriptions → Stripe portal link |

### 3.7 Sidebar (Global)

| UI Element | Data Source | API Endpoint | Hook |
|------------|------------|--------------|------|
| Show selector | `Show[]` | GET /api/shows | `useShows()` |
| Episode count badge | Episode total for show | GET /api/episodes (total) | `useEpisodes()` |
| Vocabulary count badge | Term count for show | GET /api/shows/[id]/vocabulary | — |
| Experts green dot | Has new suggestions | GET /api/shows/[id]/experts | `useExperts()` |
| Plan card (tier) | `subscription.tier` | GET /api/subscriptions | `useSubscription()` |
| Plan card (usage %) | Audio minutes used/limit | Computed | `useSubscription()` |
| Active nav item | Current route pathname | Next.js `usePathname()` | — |

---

## 4. Subscription Tier → UI Impact Matrix

| Feature | Free | Pro | Agency |
|---------|------|-----|--------|
| Episode limit display | "X/3 episodes" | "Unlimited" | "Unlimited" |
| Show selector max | 1 show only | Up to 3 shows | Up to 20 shows |
| "New Show" action | Hidden | Visible (up to 3) | Visible (up to 20) |
| Asset types available | Basic subset | All 40+ | All 40+ |
| Priority processing badge | Hidden | Hidden | Shown on episode rows |
| API tab in settings | Hidden | Visible | Visible |
| Usage meters | Shown | Shown | Shown |
| "Upgrade" prominence | CTA in sidebar, settings | Subtle in sidebar | Hidden |
| Team seats | Hidden | Hidden | Shown (future) |

---

## 5. Status Indicator Complete Registry

Every status indicator in the entire UI, what data drives it, and where it appears:

| # | Indicator | Visual | Page(s) | Data Source | Refresh |
|---|-----------|--------|---------|-------------|---------|
| 1 | Episode status dot | 8px colored dot | Episodes list, Episode detail | `episode.status` | Poll 10s (list), 3s (detail) |
| 2 | Signal chain | 4-stage dot+line | Episode detail header | `episode.metadata.processing_step` | Poll 3s while processing |
| 3 | Processing progress | Implied in signal chain stages | Episode detail header | `episode.metadata.processing_progress` | Poll 3s while processing |
| 4 | SEO gauge (large) | 88px circular SVG | Episode detail → Show Notes tab | `episode.seo_score` | Static (after completion) |
| 5 | SEO score (inline) | Mono text number | Episodes list rows | `episode.seo_score` | With episode list refresh |
| 6 | Processing banner | Yellow bar + count + dots | Episodes list | Count of `status==='processing'` | Poll 10s |
| 7 | Filter pill counts | Number in pill | Episodes list | Client-side aggregation | With episode list |
| 8 | Nav episode badge | Number | Sidebar → Episodes | `episodes.total` | With episode list |
| 9 | Nav vocab badge | Number | Sidebar → Vocabulary | Vocabulary term count | On page load |
| 10 | Nav experts dot | Green dot | Sidebar → Experts | Has new suggestions | On page load |
| 11 | Vocab "ACTIVE" badge | Green badge | Vocabulary page header | Static (always active when show has terms) | — |
| 12 | Vocab category badge | Colored pill | Vocabulary rows | `term.category` (derived) | With vocab list |
| 13 | Vocab accuracy sparkline | Mini line chart | Vocabulary rows | `term.occurrence_count` trends | With vocab list |
| 14 | Vocab "Verify" badge | Green checkmark | Vocabulary rows | `term.pronunciationValidated` | With vocab list |
| 15 | AI suggestion confidence | Horizontal bar | Vocabulary → AI panel | Embedding cosine similarity | On page load |
| 16 | Vocab stats cards | 4 numbers | Vocabulary page | Computed from term list | With vocab list |
| 17 | Expert "AI POWERED" badge | Green badge | Experts page header | Static | — |
| 18 | Expert match score | Number (0-100) | Expert cards | `expert.freshness_score` | With expert list |
| 19 | Expert availability | Colored badge | Expert cards | Expert metadata | With expert list |
| 20 | Expert stats | 3 numbers | Experts page | Computed from expert list | With expert list |
| 21 | Plan "ACTIVE" badge | Green badge | Settings → Subscription | `subscription.status` | On page load |
| 22 | Usage: Audio Minutes | Progress bar + numbers | Settings → Subscription | Episode durations sum / tier limit | On page load |
| 23 | Usage: Storage | Progress bar + numbers | Settings → Subscription | Storage used / tier limit | On page load |
| 24 | Usage: API Calls | Progress bar + numbers | Settings → Subscription | API call count / tier limit | On page load |
| 25 | Usage "HIGH" warning | Orange badge | Settings → Usage meter | Usage > 80% threshold | On page load |
| 26 | Account Health | Green dot + text | Settings page header | Composite health check | On page load |
| 27 | Integration connected | Status badge | Settings → Integrations | `hosting_connection.status` | On page load |
| 28 | Sidebar plan card | Tier + usage % + bar | Sidebar | `subscription.tier` + usage | On page load |
| 29 | Upload step indicator | 3 numbered circles | Upload page | Local wizard state | On step change |
| 30 | Processing step labels | `.text-label` under dots | Signal chain | `episode.metadata.processing_step` | Poll 3s |

---

## 6. Error State Mapping

| Error Condition | UI Response | Data Source |
|----------------|-------------|-------------|
| Episode processing failed | Red status dot + "Failed" badge + error message + "Retry" button | `episode.status === 'failed'`, `episode.metadata.error_message` |
| Upload file too large | Error text below dropzone | Client-side file size check (>500MB) |
| Upload wrong format | Error text below dropzone | Client-side MIME type check |
| API rate limited | Toast notification with retry timer | 429 response from API |
| Network error | Toast notification | fetch error handler |
| Empty episode list | Empty state component | `episodes.length === 0` |
| No vocabulary terms | Empty state component | `terms.length === 0` |
| No expert results | Empty state with search suggestion | `experts.length === 0` |
| Subscription expired | Warning banner + "Renew" CTA | `subscription.status !== 'active'` |

---

## 7. Data Type Reference

Key types from `app/src/types/database.ts` that directly feed UI components:

```typescript
type EpisodeStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface Episode {
  id: string
  show_id: string
  title: string
  description: string | null
  audio_url: string | null
  audio_duration_seconds: number | null
  status: EpisodeStatus
  seo_score: number | null          // 0-100, feeds SEO gauge
  seo_analysis: SEOAnalysis | null  // detailed breakdown
  show_notes: string | null         // markdown
  show_notes_html: string | null    // rendered HTML
  transcript: string | null
  transcript_segments: TranscriptSegment[] | null
  guest_name: string | null
  guest_bio: string | null
  viral_moments: ViralMoment[] | null
  metadata: {                       // JSONB — processing tracking
    processing_step?: string        // feeds signal chain
    processing_progress?: number    // 0-100
    processing_run_id?: string
    error_message?: string
  } | null
  published_at: string | null
  created_at: string
  updated_at: string
}

interface VocabularyTerm {
  id: string
  show_id: string
  term: string
  alternatives: string[] | null
  embedding: number[] | null        // vector(1536)
  occurrence_count: number
  created_at: string
  updated_at: string
}

interface GeneratedAsset {
  id: string
  episode_id: string
  asset_type: AssetType             // 40+ types
  content: string
  metadata: Record<string, unknown> | null
  file_url: string | null
  created_at: string
  updated_at: string
}
```

---

## 8. Hooks Reuse Map

Existing hooks that must be reused (NOT recreated):

| Hook | File | Used By Pages |
|------|------|---------------|
| `useEpisodes` | `hooks/use-episodes.ts` | Episodes list |
| `useEpisode` | `hooks/use-episode.ts` | Episode detail |
| `useEpisodeAssets` | `hooks/use-episode-assets.ts` | Episode detail → Assets tab |
| `useEpisodeSeo` | `hooks/use-episode-seo.ts` | Episode detail → Show Notes tab |
| `useShows` | `hooks/use-shows.ts` | Sidebar (show selector) |
| `useExperts` | `hooks/use-experts.ts` | Experts page |
| `useSubscription` | `hooks/use-subscription.ts` | Settings, Sidebar plan card |
| `usePolling` | `hooks/use-polling.ts` | Episode detail (processing), Episode list |
| `useDebounce` | `hooks/use-debounce.ts` | Search inputs |
| `useToast` | `hooks/use-toast.ts` | Success/error notifications |
| `useKeyboardShortcuts` | `hooks/use-keyboard-shortcuts.ts` | ⌘K search, global shortcuts |

---

## 9. Utility Reuse Map

Existing utilities that must be reused (NOT recreated):

| Utility | File | Used For |
|---------|------|----------|
| `cn()` | `lib/utils.ts` | Every component — class merging |
| `formatDuration()` | `lib/utils.ts` | Episode duration display |
| `formatRelativeTime()` | `lib/utils.ts` | "2 hours ago" dates |
| `formatDate()` | `lib/utils.ts` | "Jan 15, 2026" dates |
| `truncate()` | `lib/utils.ts` | Text truncation in cards |
| `getScoreColor()` | `lib/utils.ts` | SEO gauge color by score |
| `getScoreBgColor()` | `lib/utils.ts` | SEO gauge background |
| `DEFAULT_USER_ID` | `constants.ts` | All API calls (single-user mode) |
| `SUBSCRIPTION_TIERS` | `constants.ts` | Feature gating, limits |
| `ASSET_TYPES` | `constants.ts` | Asset tab grouping |
