# PodBrain Component Inventory

> Full audit of every component needed for the UI rebuild. Each component includes its location,
> props, data source, variants, dependencies, and build status (Rebuild vs New).

---

## Legend

- **Rebuild** — Existed in previous build (v2), needs to be re-created from checkpoint spec + MagicPath designs
- **New** — Not in previous build, derived from MagicPath designs
- **Data Source** — The hook, API endpoint, or prop that feeds this component

---

## 1. UI Primitives (`components/ui/`)

### button.tsx — Rebuild

**Variants (CVA):** primary, secondary, ghost, warm, danger, link
**Sizes:** sm (32px), md (36px), lg (40px), icon (36×36)
**Props:** `variant`, `size`, `asChild`, `disabled`, `className`, standard button attrs
**Dependencies:** `@radix-ui/react-slot`, `class-variance-authority`, `lib/utils.ts:cn()`
**Data Source:** None (UI only)
**Key Details:**
- Zed-style double-border shadow (`--shadow-button`)
- Active state uses `--shadow-button-active`
- `asChild` via Radix Slot for polymorphic rendering
- Display font (Space Grotesk) for all button text

### card.tsx — Rebuild

**Variants:** default, premium (grid texture), featured (accent border: blue | warm)
**Sub-components:** `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
**Props:** `variant`, `className`
**Dependencies:** `lib/utils.ts:cn()`
**Data Source:** None (UI only)
**Key Details:**
- `--shadow-card` with inner white highlight ring
- 1px `--color-border-strong` border
- `--radius-md` (6px) corners
- NO background texture inside cards

### badge.tsx — Rebuild

**Variants:** default, success, error, processing, warm, blue
**Props:** `variant`, `className`, children
**Dependencies:** `class-variance-authority`, `lib/utils.ts:cn()`
**Data Source:** Status enums (episode status, vocab status, subscription status)
**Key Details:**
- `--font-mono`, 11px, weight 500, uppercase, letter-spaced
- 1px border matching variant color at low opacity
- `--radius-full` (pill shape)

### input.tsx — Rebuild

**Components:** `Input`, `Textarea`
**Props:** Standard HTML input/textarea attrs + `className`
**Dependencies:** `lib/utils.ts:cn()`
**Data Source:** None (form binding)
**Key Details:**
- 36px height (Input), variable height (Textarea)
- `--color-border` border, `--color-bg-surface` background
- Focus: `--shadow-focus` ring
- Placeholder: `--color-text-tertiary`

### tabs.tsx — Rebuild

**Components:** `Tabs`, `TabList`, `TabTrigger`, `TabContent`
**Props:** `Tabs`: `defaultValue`, `value`, `onValueChange`; `TabTrigger`: `value`; `TabContent`: `value`
**Dependencies:** React context (custom, NOT Radix)
**Data Source:** None (UI state)
**Key Details:**
- Active indicator: bottom border line on active tab
- Display font for trigger text
- Content area switches via controlled state

### skeleton.tsx — Rebuild

**Props:** `className`
**Dependencies:** None
**Data Source:** None (loading state)
**Key Details:**
- `animate-pulse` with `--color-bg-hover` background
- Used for episode rows, cards, content areas while loading

### empty-state.tsx — Rebuild

**Props:** `icon` (Lucide icon component), `title`, `description`, `action` (ReactNode)
**Dependencies:** None
**Data Source:** None (empty condition check)
**Key Details:**
- Centered layout with decorative grid pattern
- Icon at 48px in muted color
- Optional action button below description

### dropdown-menu.tsx — Rebuild

**Components:** `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuLabel`
**Dependencies:** `@radix-ui/react-dropdown-menu`
**Data Source:** None (UI interaction)
**Key Details:**
- `--shadow-dropdown` shadow
- Fade + zoom enter animation
- `--color-bg-surface` background
- Items use `--color-bg-hover` on hover

### progress.tsx — Rebuild

**Variants:** circular, linear
**Color Variants:** blue, warm, success, error
**Props:** `value` (0-100), `variant`, `color`, `size` (for circular: diameter in px)
**Dependencies:** None (SVG-based)
**Data Source:** `episode.seo_score`, `subscription.usage`, `processing_progress`
**Key Details:**
- Circular: SVG with `strokeDashoffset` animation
- Linear: div with width percentage
- Score-based color automatic mode (90+=green, 75+=blue, 60+=amber, <60=red)

### theme-toggle.tsx — Rebuild

**Props:** `className`
**Dependencies:** `lucide-react` (Sun, Moon)
**Data Source:** `localStorage("theme")`, `prefers-color-scheme`
**Key Details:**
- Toggles `data-theme` on `<html>`
- `mounted` state check to prevent hydration mismatch
- Ghost button style

### search-bar.tsx — New

**Props:** `value`, `onChange`, `placeholder`, `shortcutHint` (e.g. "⌘K")
**Dependencies:** `lucide-react` (Search)
**Data Source:** None (controlled input)
**Key Details:**
- Search icon prefix
- Keyboard shortcut hint badge on right
- `--color-bg-surface` background
- Appears on: Episodes, Vocabulary, Experts pages

### filter-pills.tsx — New

**Props:** `options: { label, value, count }[]`, `activeValue`, `onChange`
**Dependencies:** None
**Data Source:** Aggregated counts from API responses
**Key Details:**
- Horizontal row of pill buttons
- Active pill: filled background, contrasting text
- Inactive: ghost style
- Count badges inside pills
- Appears on: Episodes (All/Completed/Processing/Draft), Vocabulary (All/Person/Brand/Technical/Acronym)

### stat-card.tsx — New

**Props:** `icon` (Lucide icon), `label`, `value`, `trend` (optional: +/-%), `trendColor`
**Dependencies:** `lucide-react`
**Data Source:** Computed from API data (vocab count, accuracy boost, etc.)
**Key Details:**
- Small card with icon + label (`.text-label`) + large value
- Optional trend indicator with color
- Appears on: Vocabulary page (4 stats), Experts page (3 stats)

### sparkline.tsx — New

**Props:** `data: number[]` (array of values), `color`, `width`, `height`
**Dependencies:** None (SVG path)
**Data Source:** `vocabulary_term.occurrence_count` trends (last 7 episodes)
**Key Details:**
- Mini SVG line chart
- No axes, no labels — just the trend line
- Appears on: Vocabulary page vocab rows

### usage-meter.tsx — New

**Props:** `label`, `current`, `max`, `unit`, `warningThreshold` (default 80)
**Dependencies:** None
**Data Source:** `useSubscription()` → usage vs tier limits
**Key Details:**
- Label + current/max text on top row
- Linear progress bar below
- Color: green (0-59%), blue (60-79%), orange (80-100%)
- "HIGH" warning badge when above threshold
- Shows "X% used" and "Y remaining" text
- Appears on: Settings page → Subscription tab

### processing-banner.tsx — New

**Props:** `processingCount: number`
**Dependencies:** `lucide-react` (Loader2)
**Data Source:** Count of episodes where `status === 'processing'`
**Key Details:**
- Yellow/amber tinted background
- Spinner icon + "{N} episodes processing" text
- Description: "transcription & AI assets being generated"
- Animated dots on right side
- Conditionally rendered: only when count > 0
- Appears on: Episodes list page

---

## 2. Layout Components (`components/layout/`)

### app-shell.tsx — New

**Props:** `children`
**Dependencies:** `sidebar.tsx`
**Data Source:** None
**Key Details:**
- Flex container: sidebar (fixed width) + main content (flex-1)
- Main content has `max-width: var(--content-max)`, centered
- Responsive: sidebar overlay on mobile
- Used in `app/(app)/layout.tsx`

### sidebar.tsx — Rebuild

**Sections:** Brand → Show Selector → Navigation (Workspace + Tools) → Plan Card → Footer
**Dependencies:** `nav-item.tsx`, `show-selector.tsx`, `plan-card.tsx`, `theme-toggle.tsx`
**Data Source:** `useShows()`, `useSubscription()`, route state, episode/vocab counts
**Key Details:**
- `--sidebar-width` (240px), `--color-bg-sidebar` background
- Collapsible (icon-only mode at 64px)
- Mobile: fixed overlay with backdrop
- Brand: PodBrain logo + "AI STUDIO V2.4" in `.text-label`
- Navigation sections divided by `.text-label` headers: "WORKSPACE", "TOOLS"
- Footer: theme toggle + keyboard icon + collapse chevron

### nav-item.tsx — Rebuild

**Props:** `href`, `icon` (Lucide component), `label`, `badge` (number/ReactNode), `isActive`, `accent` (boolean for Upload)
**Dependencies:** Next.js `Link`, `lucide-react`
**Data Source:** Route pathname for active state, counts from API
**Key Details:**
- Active state: left accent bar (3px), filled background
- Badge: count number or green dot
- Accent variant: blue text for Upload nav item
- Hover: `--color-bg-hover` background

### show-selector.tsx — Rebuild

**Props:** `shows`, `currentShowId`, `onShowChange`
**Dependencies:** `useShows()` hook, dropdown-menu
**Data Source:** `useShows()` → show list
**Key Details:**
- Show name + colored initial circle
- ChevronDown indicator
- Dropdown with show list
- "New Show" action at bottom
- Success dot on current show

### page-header.tsx — Rebuild

**Props:** `title`, `subtitle` (optional), `badge` (optional ReactNode), `actions` (optional ReactNode)
**Dependencies:** None
**Data Source:** Per-page props
**Key Details:**
- h1 title in display font
- Subtitle in body text, secondary color
- Action buttons aligned right
- `.animate-enter` on mount

### plan-card.tsx — New

**Props:** None (self-contained)
**Dependencies:** `useSubscription()` hook
**Data Source:** Subscription tier + usage stats
**Key Details:**
- Dark background card at bottom of sidebar
- "PRO PLAN" label in `.text-label` with TrendingUp icon
- "Monthly Audio" + percentage
- Progress bar (colored by usage level)
- "Upgrade Capacity" button
- Appears in sidebar above footer

### mobile-header.tsx — New

**Props:** `onMenuOpen`
**Dependencies:** `lucide-react` (Menu)
**Data Source:** None
**Key Details:**
- Visible only at < 768px
- PodBrain logo + hamburger menu button
- Fixed top bar
- Triggers sidebar overlay

---

## 3. Episode Components (`components/episodes/`)

### status-dot.tsx — Rebuild

**Props:** `status: EpisodeStatus`, `label` (optional boolean to show text)
**Dependencies:** None
**Data Source:** `episode.status`
**Key Details:**
- Maps status → CSS class: completed→success, processing→processing, failed→error, pending→pending
- Optional text label beside dot
- Uses `.status-dot-*` utility classes from globals.css

### episode-row.tsx — Rebuild

**Props:** `episode: EpisodeListItem`
**Dependencies:** `status-dot.tsx`, `seo-score.tsx`, `dropdown-menu.tsx`, Next.js `Link`
**Data Source:** `Episode` type from `useEpisodes()`
**Key Details:**
- Row layout: checkbox | status dot | title + guest | SEO score (inline) | date | actions
- Left accent bar on hover
- Hover reveals action menu trigger
- Links to `/episodes/[id]`
- Uses `formatRelativeTime()` for dates

### episode-list.tsx — New

**Props:** `showId: string`
**Dependencies:** `episode-row.tsx`, `search-bar.tsx`, `filter-pills.tsx`, `skeleton.tsx`, `processing-banner.tsx`
**Data Source:** `useEpisodes({ showId, status, page, perPage, search })`
**Key Details:**
- Search bar with ⌘K shortcut
- Filter pills: All | Completed | Processing | Draft (with counts)
- Sort + Views buttons
- Select All checkbox
- Episode rows or skeleton loading states
- Processing banner above list when applicable
- Empty state when no episodes match filters

### episode-header.tsx — Rebuild

**Props:** `episode: Episode`
**Dependencies:** `status-dot.tsx`, `badge.tsx`, `signal-chain.tsx`, `button.tsx`
**Data Source:** `useEpisode(id)`
**Key Details:**
- Back button (ArrowLeft → /episodes)
- Status badge (colored by status)
- Episode title (h1) + guest name
- Action buttons based on status:
  - pending: "Process" (Play icon)
  - completed: "Export" (Download icon)
  - failed: "Retry" (RotateCw icon)
  - All: "More" dropdown
- Signal chain below actions

### signal-chain.tsx — Rebuild

**Props:** `processingStep: string`, `progress: number`
**Dependencies:** `lucide-react` (Upload, FileText, Wand2, CheckCircle)
**Data Source:** `episode.metadata.processing_step`, `episode.metadata.processing_progress`
**Key Details:**
- 4 stages: Upload → Transcribe → Generate → Ready
- Each stage: icon + dot + connector line + `.text-label`
- Completed stages: green dots, green connector lines
- Active stage: blue pulsing dot
- Future stages: gray hollow dots, gray connectors
- Uses Motion (framer-motion) for step transitions

### seo-score.tsx — Rebuild

**Props:** `score: number` (0-100), `size: 'sm' | 'lg'`
**Dependencies:** None (SVG)
**Data Source:** `episode.seo_score`, `useEpisodeSeo()`
**Key Details:**
- `lg`: 88px circular SVG gauge with animated stroke
- `sm`: inline mono text only (e.g. "94")
- Color: green (90+), blue (75+), amber (60+), red (<60)
- Uses `getScoreColor()` utility

### episode-tabs.tsx — New

**Props:** `episode: Episode`
**Dependencies:** `tabs.tsx`, all tab components
**Data Source:** Episode data + assets + SEO
**Key Details:**
- 5 tabs: Show Notes | Assets | Transcript | Guest Package | Intelligence
- Default: Show Notes tab
- Tab content lazy-loaded per tab

### show-notes-tab.tsx — New

**Props:** `episode: Episode`, `seoData: SEOAnalysis`
**Dependencies:** `seo-score.tsx`, `button.tsx`
**Data Source:** `episode.show_notes_html`, `useEpisodeSeo()`
**Key Details:**
- Left: rendered HTML show notes (Source Serif 4 body font)
- Right sidebar: SEO score gauge (large) + score details
- "Regenerate" button below content
- Markdown-rendered content with heading structure

### assets-tab.tsx — New

**Props:** `episodeId: string`
**Dependencies:** `card.tsx`, `badge.tsx`, `button.tsx`
**Data Source:** `useEpisodeAssets(episodeId)`
**Key Details:**
- Grid of asset cards grouped by category:
  - Social (LinkedIn, Twitter, Instagram, TikTok)
  - Long-form (Blog, Newsletter, Press Release)
  - Video (YouTube, Shorts, TikTok scripts)
  - Visual (Quote Cards, Audiograms, Infographics)
  - Engagement (Discussion, Polls, CTAs)
  - Guest (Bio, Promo Kit)
- Each card: asset type name, content preview, copy/download actions
- Status: generated (content present) or not yet generated (empty)
- "Generate" button for individual assets

### transcript-tab.tsx — New

**Props:** `episode: Episode`
**Dependencies:** None
**Data Source:** `episode.transcript_segments` (JSONB array)
**Key Details:**
- Speaker-diarized transcript view
- Each segment: speaker label (badge), timestamp (mono), text
- Color-coded by speaker
- Scrollable container
- Search/highlight functionality (optional v1)

### guest-package-tab.tsx — New

**Props:** `episodeId: string`, `episode: Episode`
**Dependencies:** `card.tsx`, `button.tsx`, `input.tsx`
**Data Source:** GET `/api/episodes/[id]/guest-package`
**Key Details:**
- Social post previews (LinkedIn, Twitter, Instagram)
- Quote cards (visual)
- Email send form: guest email, custom message, send button
- Uses POST `/api/episodes/[id]/guest-package` to send

### intelligence-tab.tsx — New

**Props:** `episodeId: string`
**Dependencies:** `card.tsx`, `badge.tsx`
**Data Source:** GET `/api/episodes/[id]/viral-moments`, GET `/api/episodes/[id]/guest-intel`
**Key Details:**
- **Viral Moments section:**
  - Moments with: start_time, end_time, text, score, reason, type
  - Type badges: controversial, emotional, quotable, revelation, counter_intuitive
  - Score (0-100) with color coding
- **Guest Intel section:**
  - Questions asked before, unique angles, repeated stories
  - Public positions, trending topics

---

## 4. Upload Components (`components/upload/`)

### dropzone.tsx — Rebuild

**Props:** `onFileSelect(file: File)`, `accept` (MIME types), `maxSize`
**Dependencies:** `lucide-react` (Plus, Upload, X)
**Data Source:** File API
**Key Details:**
- Dashed border container
- Drag-over visual feedback (highlighted border)
- Click to browse trigger
- File validation: format (MP3, WAV, M4A, AAC, OGG, WebM) + size (<500MB)
- Selected file display: name + size + remove button
- Error state with message
- Format badges below dropzone

### upload-wizard.tsx — New

**Props:** None (self-contained page component)
**Dependencies:** `step-indicator.tsx`, `dropzone.tsx`, `url-import.tsx`, `expert-context-form.tsx`, `style-assets-form.tsx`
**Data Source:** Local React state, POST /api/upload, POST /api/episodes, POST /api/episodes/[id]/process
**Key Details:**
- 3-step wizard: Select Audio → Expert Context → Style & Assets
- Step state management (current step, completed steps)
- Forward/back navigation
- Final step triggers processing pipeline

### step-indicator.tsx — New

**Props:** `steps: { label: string }[]`, `currentStep: number`
**Dependencies:** None
**Data Source:** Wizard step state
**Key Details:**
- Horizontal layout: numbered circles + connecting lines + labels
- Current step: filled dark circle
- Completed steps: filled with check
- Future steps: outlined circle
- "Step X of Y" text on right

### url-import.tsx — New

**Props:** `onUrlSubmit(url: string, sourceType: string)`
**Dependencies:** `input.tsx`, `lucide-react` (Link, Youtube)
**Data Source:** None (form)
**Key Details:**
- URL input field
- Auto-detection badges: YouTube, RSS Feed, Direct Link
- Validation of URL format
- Tab alongside File Upload in Step 1

### expert-context-form.tsx — New

**Props:** `onSubmit(data)`, `onBack`
**Dependencies:** `input.tsx`, `button.tsx`
**Data Source:** Form state → passed to processing endpoint
**Key Details:**
- Guest Name input
- Guest Bio textarea
- Context Notes textarea
- "Continue" and "Back" buttons
- Fields passed to POST /api/episodes/[id]/process body

### style-assets-form.tsx — New

**Props:** `onSubmit(data)`, `onBack`
**Dependencies:** `input.tsx`, `button.tsx`
**Data Source:** Form state → passed to processing endpoint
**Key Details:**
- Content style selector (educational, conversational, interview, storytelling, news)
- Tone selector (professional, casual, inspirational, technical, humorous)
- Asset type checkboxes (which of the 40+ types to generate)
- "Process Episode" primary action button

---

## 5. Vocabulary Components (`components/vocabulary/`)

### vocabulary-page.tsx — New

**Props:** None (page-level)
**Dependencies:** All vocabulary sub-components
**Data Source:** GET `/api/shows/[id]/vocabulary`
**Key Details:**
- Full page layout: header + stats + search/filter + table + AI suggestions sidebar
- Main content area with right sidebar panel

### vocab-stats.tsx — New

**Props:** `totalTerms`, `avgAccuracyBoost`, `categoryCount`, `needsReviewCount`
**Dependencies:** `stat-card.tsx`
**Data Source:** Computed from vocabulary list
**Key Details:**
- 4 stat cards in horizontal row
- Total Terms (number), Accuracy Boost (+X%), Categories (count), Need Review (count)

### vocab-row.tsx — New

**Props:** `term: VocabularyTerm`
**Dependencies:** `vocab-category-badge.tsx`, `sparkline.tsx`, `dropdown-menu.tsx`
**Data Source:** `VocabularyTerm` from vocabulary list
**Key Details:**
- Term name (display font) + phonetic (mono, smaller)
- Category badge
- Usage count
- Accuracy boost percentage + sparkline
- Added date (relative)
- Actions: edit, delete, validate
- Pronunciation validation badge (green "Verify" if validated)

### vocab-category-badge.tsx — New

**Props:** `category: 'Person' | 'Brand' | 'Technical' | 'Acronym' | 'Custom'`
**Dependencies:** None
**Data Source:** Vocabulary term category
**Key Details:**
- Color-coded pill badge per category
- Person=blue, Brand=orange, Technical=green, Acronym=purple, Custom=gray

### ai-suggestions-panel.tsx — New

**Props:** `showId: string`
**Dependencies:** `card.tsx`, `badge.tsx`, `button.tsx`
**Data Source:** Computed from vocabulary embeddings + episode transcripts
**Key Details:**
- Right sidebar panel
- "AI SUGGESTIONS" header with confidence indicator
- List of suggested terms:
  - Term name + phonetic
  - Confidence bar (0-100%)
  - Category badge
  - "+ Add Term" button per suggestion
- Terms detected from recent episode transcripts via embedding similarity

### add-term-dialog.tsx — New

**Props:** `open`, `onClose`, `showId`, `initialData?`
**Dependencies:** `@radix-ui/react-dialog`, `input.tsx`, `button.tsx`
**Data Source:** POST to vocabulary API
**Key Details:**
- Modal dialog for adding/editing vocabulary terms
- Fields: term, phonetic, category (dropdown), alternatives (tag input)
- Submit creates via POST /api/shows/[id]/vocabulary

---

## 6. Expert Components (`components/experts/`)

### experts-page.tsx — New

**Props:** None (page-level)
**Dependencies:** All expert sub-components
**Data Source:** `useExperts(showId)` or GET `/api/shows/[id]/experts`
**Key Details:**
- Full page: header + stats + search + filters + expert grid
- "AI POWERED" badge in header

### expert-card.tsx — New

**Props:** `expert: Expert`
**Dependencies:** `match-score.tsx`, `availability-badge.tsx`, `badge.tsx`, `button.tsx`
**Data Source:** Expert entity
**Key Details:**
- Avatar: colored circle with initials
- Name (h3), title, organization
- Match score indicator
- AI insight text (italic, secondary)
- Expertise tags (pill badges)
- Availability badge
- Past appearances count
- "Add to Shortlist" / "Remove" toggle button

### expert-stats.tsx — New

**Props:** `addedCount`, `totalCount`, `pendingCount`
**Dependencies:** `stat-card.tsx`
**Data Source:** Computed from expert list
**Key Details:**
- 3 stat cards: Added, Total Experts, Pending

### match-score.tsx — New

**Props:** `score: number` (0-100)
**Dependencies:** None
**Data Source:** `expert.freshness_score`
**Key Details:**
- Numeric display with color coding
- High (90+): green, Medium (70-89): blue, Low (<70): amber

### availability-badge.tsx — New

**Props:** `availability: 'available' | 'limited' | 'busy'`
**Dependencies:** `badge.tsx`
**Data Source:** Derived from expert metadata
**Key Details:**
- Available: green badge
- Limited: amber badge
- Busy: red badge

---

## 7. Settings Components (`components/settings/`)

### settings-page.tsx — New

**Props:** None (page-level)
**Dependencies:** `tabs.tsx`, all settings sub-components
**Data Source:** `useSubscription()`, hosting connections
**Key Details:**
- Page header with "Account Health" indicator
- 3 tabs: Subscription | Integrations | API & Developer

### subscription-card.tsx — New

**Props:** None (self-contained)
**Dependencies:** `card.tsx`, `badge.tsx`, `button.tsx`
**Data Source:** `useSubscription()`
**Key Details:**
- Current plan name + "ACTIVE" badge
- Billing cycle + renewal date
- Price display ($X/month)
- Feature checkmark pills
- "Change Plan" button + "Manage in Stripe" link

### usage-section.tsx — New

**Props:** None (self-contained)
**Dependencies:** `usage-meter.tsx`
**Data Source:** `useSubscription()` → usage vs tier limits
**Key Details:**
- "USAGE — {MONTH} {YEAR}" header with reset date
- 3 usage meters: Audio Minutes, Storage, API Calls
- Computed from: episode durations sum, storage used, API call count

### integrations-panel.tsx — New

**Props:** None (self-contained)
**Dependencies:** `card.tsx`, `badge.tsx`, `button.tsx`
**Data Source:** `hosting_connections` table
**Key Details:**
- Grid of integration cards:
  - Spotify (green icon), Apple Podcasts (violet), YouTube (red), RSS (orange), Slack (sky)
- Each card: platform icon, name, description, connection status badge, connected since date
- Connect/Disconnect toggle button

### api-keys-panel.tsx — New

**Props:** None (self-contained)
**Dependencies:** `card.tsx`, `button.tsx`, `input.tsx`
**Data Source:** API keys from user preferences or dedicated endpoint
**Key Details:**
- List of API keys: name, masked key, last used, created date
- Copy button (copies full key)
- Delete button with confirmation
- "Create New Key" button
- Key visibility toggle (show/hide masked)

### account-health.tsx — New

**Props:** None (self-contained)
**Dependencies:** `badge.tsx`
**Data Source:** Composite: subscription active + no failed episodes + integrations connected
**Key Details:**
- Green status dot + "All Systems Nominal" text
- Positioned in page header
- Degrades: amber if warnings, red if critical issues

---

## 8. Support Components (`components/support/`)

### support-page.tsx — New

**Props:** None (page-level)
**Dependencies:** `card.tsx`, basic accordion
**Data Source:** Static content
**Key Details:**
- Help center heading
- FAQ accordion (static content)
- Contact/feedback section
- Minimal implementation — not in MagicPath designs

---

## Component Count Summary

| Category | Rebuild | New | Total |
|----------|---------|-----|-------|
| UI Primitives | 10 | 6 | 16 |
| Layout | 4 | 3 | 7 |
| Episodes | 5 | 7 | 12 |
| Upload | 1 | 5 | 6 |
| Vocabulary | 0 | 6 | 6 |
| Experts | 0 | 5 | 5 |
| Settings | 0 | 6 | 6 |
| Support | 0 | 1 | 1 |
| **Total** | **20** | **39** | **59** |
