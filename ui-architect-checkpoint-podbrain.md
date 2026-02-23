# UI Architect Checkpoint — PodBrain
**Project**: PodBrain UI Rebuild
**Created**: 2026-02-19
**Current Phase**: Complete — All phases finished
**Branch**: `ui-rebuild-v2`

## Phase 1: Discovery Summary

**Purpose:** AI content command center for podcasters. Upload audio → get show notes, 30+ assets, SEO, guest packages.
**Users:** Independent podcasters and podcast agencies.
**Core Action:** Upload episode → review AI-generated content → export/distribute.
**Emotion:** Powerful control — "I have superpowers now"
**Metaphor:** Pilot's cockpit — everything at a glance, functional density
**Density:** Medium with progressive disclosure
**Mode:** Light default, dark mode available

**Anti-Patterns:**
- NO enterprise SaaS (grey tables, corporate dashboards)
- NO toy/gimmicky (candy colors, excessive animation)
- NO developer tool (terminal aesthetic, monospace everything)
- NO generic AI tool (purple gradients, sparkle icons)

## Phase 2: Design Direction — "Swiss Broadcast"

### Typography
- Display: **Space Grotesk** (geometric, condensed — headlines, section titles)
- Body: **Source Serif 4** (refined serif — body text, descriptions)
- Mono: **JetBrains Mono** (timestamps, metadata, code)

### Color Palette (Light)
| Role | Hex | Token |
|------|-----|-------|
| Background | `#EDEAE5` | `--color-bg-base` |
| Surface | `#FAFAF8` | `--color-bg-surface` |
| Sidebar | `#E4E0DA` | `--color-bg-sidebar` |
| Border | `#E0DDD7` | `--color-border` |
| Ink | `#1A1A1A` | `--color-text-ink` |
| Secondary | `#71717A` | `--color-text-secondary` |
| Primary accent | `#2563EB` | `--color-accent-blue` |
| Warm accent | `#C2693D` | `--color-accent-warm` |
| Success | `#16A34A` | `--color-status-success` |
| Error | `#DC2626` | `--color-status-error` |
| Processing | `#2563EB` | `--color-status-processing` |

### Color Palette (Dark)
| Role | Hex |
|------|-----|
| Background | `#1A1A1E` |
| Surface | `#232328` |
| Sidebar | `#161619` |
| Border | `#2E2E35` |
| Text | `#F5F5F5` |
| Secondary | `#A1A1AA` |
| Blue accent | `#3B82F6` |
| Warm accent | `#D97A4A` |

### Visual Treatment
- Background: Warm stone with subtle paper/noise grain at 3% opacity (1.5% in dark mode with overlay blend)
- Cards: Warm white, 1px warm border, subtle shadow, no texture inside
- Corners: 6px border-radius on cards, 4px on buttons
- Signature: Status indicator dots cascading through the interface
- Dark mode: `data-theme="dark"` on `<html>`, localStorage persistence, FOUC prevention

## Phase 3: Architecture

### Routing
```
app/src/app/
├── layout.tsx              (root: fonts, theme, metadata, FOUC script)
├── globals.css             (tokens, light + dark themes, base styles, grain, animations)
├── not-found.tsx           (404 page)
├── (app)/
│   ├── layout.tsx          (app shell: sidebar + content, mobile responsive)
│   ├── loading.tsx         (skeleton loading state)
│   ├── page.tsx            (redirect → /episodes)
│   ├── episodes/
│   │   ├── page.tsx        (episodes list with search/filter)
│   │   └── [id]/
│   │       └── page.tsx    (5-tab episode workspace)
│   ├── upload/
│   │   └── page.tsx        (3-step upload flow)
│   ├── vocabulary/
│   │   └── page.tsx        (vocabulary CRUD)
│   ├── experts/
│   │   └── page.tsx        (expert search)
│   ├── settings/
│   │   └── page.tsx        (subscription + integrations)
│   └── support/
│       └── page.tsx        (help center + FAQ)
└── api/                    (untouched)
```

### Component Structure
```
components/
├── ui/          button, card, badge, input, tabs, skeleton, empty-state,
│                dropdown-menu, progress, theme-toggle
├── layout/      sidebar, page-header, nav-item, show-selector
├── episodes/    episode-row, episode-header, status-dot, seo-score, signal-chain
└── upload/      dropzone
```

## Build Complete — All Files

### UI Primitives (`components/ui/`)
- `button.tsx` — CVA variants: primary, secondary, ghost, warm, danger, link
- `card.tsx` — Card, CardHeader, CardTitle, CardContent, CardFooter
- `badge.tsx` — default, success, error, processing, warm, blue
- `input.tsx` — Input + Textarea
- `tabs.tsx` — Custom context-based tabs (Tabs, TabList, TabTrigger, TabContent)
- `skeleton.tsx` — Loading placeholder
- `empty-state.tsx` — Icon + title + description + optional action
- `dropdown-menu.tsx` — Radix-based dropdown
- `progress.tsx` — Progress bar with color variants
- `theme-toggle.tsx` — Dark/light mode toggle

### Layout (`components/layout/`)
- `sidebar.tsx` — Collapsible sidebar with show selector, nav sections, theme toggle
- `nav-item.tsx` — Navigation link with icon, label, badge, active state
- `show-selector.tsx` — Show dropdown switcher
- `page-header.tsx` — Reusable page header with entrance animation

### Episode Components (`components/episodes/`)
- `status-dot.tsx` — Status indicator mapping
- `episode-row.tsx` — Episode list row with hover actions
- `episode-header.tsx` — Back nav, status badge, title, actions, signal chain
- `signal-chain.tsx` — Processing progress (Upload → Transcribe → Generate → Ready)
- `seo-score.tsx` — Small + large circular SVG gauge

### Upload (`components/upload/`)
- `dropzone.tsx` — Drag-and-drop audio file selector with validation

### Pages
- `episodes/page.tsx` — Episode list with search, status filter, loading states
- `episodes/[id]/page.tsx` — 5-tab workspace (Notes, Assets, Transcript, Guest Package, Intelligence)
- `upload/page.tsx` — 3-step upload flow (file → details → uploading)
- `vocabulary/page.tsx` — Vocabulary term management with inline editing
- `experts/page.tsx` — AI-powered expert discovery with card grid results
- `settings/page.tsx` — Subscription tiers, billing, integrations
- `support/page.tsx` — Resource cards, FAQ accordion

### Design System (`globals.css`)
- Google Fonts imports (Space Grotesk, Source Serif 4, JetBrains Mono)
- Full CSS custom property system in `@theme` block
- Dark mode token overrides via `[data-theme="dark"]`
- Paper grain texture via SVG feTurbulence
- Custom utilities: `.text-label`, `.text-mono`, `.status-dot-*`
- Entrance animations: `.animate-enter`, `.animate-fade-in`, `.animate-slide-in-left`
- Stagger delay utilities: `.stagger-1` through `.stagger-6`
- Reduced motion media query support
- Mobile sidebar overlay styles
