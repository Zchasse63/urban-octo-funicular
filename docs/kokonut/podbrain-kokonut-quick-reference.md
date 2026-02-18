# PodBrain Kokonut UI — Quick Reference

**Companion to:** `podbrain-kokonut-design-system.md`
**Last verified:** 2026-02-18

---

## Component Usage by Feature

### Layout & Shell

| Use Case | Component | Package | Notes |
|----------|-----------|---------|-------|
| Sidebar nav | Morphic Navbar | `@kokonutui/morphic-navbar` | Active indicator morphs between items |
| Tab sections | Smooth Tab | `@kokonutui/smooth-tab` | Sliding active indicator |
| Mobile nav | Smooth Drawer | `@kokonutui/smooth-drawer` | Slide-in with overlay blur |
| Profile menu | Profile Dropdown | `@kokonutui/profile-dropdown` | Fade/slide dropdown |
| Action toolbar | Toolbar | `@kokonutui/toolbar` | Figma-style multi-action bar |

### Cards & Surfaces

| Use Case | Component | Package | Notes |
|----------|-----------|---------|-------|
| Show notes, panels | Liquid Glass Card | `@kokonutui/liquid-glass-card` | Apple-style glassmorphism with blur |
| Episode list, experts | Mouse Effect Card | `@kokonutui/mouse-effect-card` | Cursor-tracking dot pattern |
| Health metrics | Apple Activity Card | `@kokonutui/apple-activity-card` | Animated circular progress rings |
| Expandable sections | Card Stack | `@kokonutui/card-stack` | Stacked card reveal |
| Dashboard layout | Bento Grid | `@kokonutui/bento-grid` | Animated grid sections |
| Guest info | Card-02 (Pro) | `@kokonutui-pro/card-02` | Contact card with photo, bio, links |

### Buttons

| Use Case | Component | Package | Notes |
|----------|-----------|---------|-------|
| Primary action | Gradient Button | `@kokonutui/gradient-button` | Animated gradient border |
| Secondary action | V0 Button | `@kokonutui/v0-button` | Subtle press animation |
| Publish to Notion | Slide Text Button | `@kokonutui/slide-text-button` | Hover reveals secondary text |
| Export (⌘E) | Command Button | `@kokonutui/command-button` | Shows keyboard shortcut |
| Delete / destructive | Hold Button | `@kokonutui/hold-button` | Press-hold to confirm (1s) |

### Forms & Inputs

| Use Case | Component | Package | Notes |
|----------|-----------|---------|-------|
| Search (⌘K) | Action Search Bar | `@kokonutui/action-search-bar` | Command palette with shortcuts |
| Audio upload | File Upload | `@kokonutui/file-upload` | Drag-drop with progress animation |
| Text fields | — | Tailwind + focus ring | Custom with design tokens |
| Pro inputs | Input-02 through 09 | `@kokonutui-pro/input-*` | Label, search, KBD, password variants |
| Pro forms | Form-01 through 06 | `@kokonutui-pro/form-*` | Contact, schedule, profile, etc. |

### AI & Loading States

| Use Case | Component | Package | Notes |
|----------|-----------|---------|-------|
| AI processing | AI State Loading | `@kokonutui/ai-loading` | Pulsing orb animation |
| "Thinking..." | AI Text Loading | `@kokonutui/ai-text-loading` | Shimmer text effect |
| Skeleton loading | Shimmer Text | `@kokonutui/shimmer-text` | CSS gradient sweep |
| General spinner | Loader | `@kokonutui/loader` | Animated loading indicator |
| Content reveal | Typing Text | `@kokonutui/typing-text` | Character-by-character typewriter |

### Text Effects

| Use Case | Component | Package | Notes |
|----------|-----------|---------|-------|
| Page titles | Swoosh Text | `@kokonutui/swoosh-text` | Flying-in entrance |
| Animated numbers | Dynamic Text | `@kokonutui/dynamic-text` | Counting/cycling animation |
| Scroll reveals | Scroll Text | `@kokonutui/scroll-text` | Reveal on scroll trigger |

### Backgrounds

| Use Case | Component | Package | Notes |
|----------|-----------|---------|-------|
| Upload hero | Background Paths | `@kokonutui/background-paths` | Animated SVG path flow |
| Dashboard accent | Beams Background | `@kokonutui/beams-background` | Subtle light beams |
| Dot grid | Custom CSS | — | Radial gradient pattern |

---

## The 10 "WOW" Factors

| # | Effect | Component | Where |
|---|--------|-----------|-------|
| 1 | **Cursor-aware cards** | `MouseEffectCard` | Episode list, experts, dashboard |
| 2 | **Morphing navigation** | `MorphicNavbar` + `layoutId` | Sidebar — indicator flows between items |
| 3 | **AI processing states** | `AILoading` + `AITextLoading` + `ShimmerText` | Upload flow, content generation |
| 4 | **Health score rings** | Custom with Motion (Activity Card style) | Dashboard, episode metrics |
| 5 | **Hold-to-confirm** | `HoldButton` | Delete actions — 1s press-hold with progress ring |
| 6 | **Command palette** | `ActionSearchBar` | ⌘K global search with keyboard shortcuts |
| 7 | **Glassmorphism** | `LiquidGlassCard` | Show notes, guest intelligence panels |
| 8 | **Background atmosphere** | `BackgroundPaths` | Upload hero, empty states |
| 9 | **Staggered reveals** | Motion `variants` + `staggerChildren` | Episode list, alert cards, metrics grid |
| 10 | **Content typewriter** | `TypingText` | AI-generated show notes reveal |

---

## Page-by-Page Component Map

### Dashboard (`app/page.tsx`)
- `BentoGrid` — Section layout
- Apple Activity Card style — 5-column health scores with animated rings
- `AlertCard` (custom) — Attention/Opportunities with animated entrance
- `MouseEffectCard` — Interactive dashboard sections
- `BeamsBackground` — Subtle accent

### Episodes List (`app/episodes/`)
- `ActionSearchBar` — Episode search with ⌘K
- `MouseEffectCard` — Episode row hover interactivity
- `CardStack` or Motion list — Episode rows
- Staggered `variants` — Choreographed list entrance

### Episode Detail (`app/episodes/[id]/`)
- `LiquidGlassCard` — Show notes container
- `MouseEffectCard` — Guest intelligence panel
- Apple Activity Card style — Health metrics row
- `SmoothTab` — Notes / Intelligence / Social tabs
- `GradientButton` — Publish action
- `CommandButton` — Export with ⌘E
- `TypingText` — AI content reveal

### Upload Flow (`app/upload/`)
- `BackgroundPaths` — Hero background
- `FileUpload` — Drag-drop zone with progress
- `AILoading` — Processing orb
- `AITextLoading` — "Analyzing..." shimmer
- `motion.div` — Step transitions

### Expert Discovery (`app/experts/`)
- `ActionSearchBar` — Expert search
- `MouseEffectCard` — Expert cards
- `FreshnessMeter` (custom) — Data freshness indicator
- `BentoGrid` — Results layout

### Shows (`app/shows/`)
- `LiquidGlassCard` — Show detail panels
- `CardStack` — Episode list per show
- `GradientButton` — Create new show

### Settings (`app/settings/`)
- Pro Form components — Profile, preferences
- `HoldButton` — Destructive actions (delete show, reset)
- `SmoothTab` — Settings categories

---

## Installation Commands (Copy/Paste)

### Core Free Components
```bash
bunx --bun shadcn@latest add \
  @kokonutui/morphic-navbar \
  @kokonutui/smooth-tab \
  @kokonutui/smooth-drawer \
  @kokonutui/profile-dropdown \
  @kokonutui/toolbar \
  @kokonutui/liquid-glass-card \
  @kokonutui/mouse-effect-card \
  @kokonutui/apple-activity-card \
  @kokonutui/card-stack \
  @kokonutui/bento-grid \
  @kokonutui/gradient-button \
  @kokonutui/slide-text-button \
  @kokonutui/hold-button \
  @kokonutui/command-button \
  @kokonutui/v0-button \
  @kokonutui/action-search-bar \
  @kokonutui/file-upload \
  @kokonutui/ai-loading \
  @kokonutui/ai-text-loading \
  @kokonutui/shimmer-text \
  @kokonutui/typing-text \
  @kokonutui/loader \
  @kokonutui/dynamic-text \
  @kokonutui/swoosh-text \
  @kokonutui/scroll-text \
  @kokonutui/background-paths \
  @kokonutui/beams-background
```

### Pro Components (requires KOKO_PRO_TOKEN)
```bash
bunx --bun shadcn@latest add \
  @kokonutui-pro/card-02 \
  @kokonutui-pro/animated-list \
  @kokonutui-pro/modal-01
```

### Additional Pro (install as needed)
```bash
# Forms & inputs
bunx --bun shadcn@latest add @kokonutui-pro/form-01 @kokonutui-pro/input-05

# Modals
bunx --bun shadcn@latest add @kokonutui-pro/modal-05

# Page blocks (heroes, pricing, features, etc.)
bunx --bun shadcn@latest add @kokonutui-pro/hero-01 @kokonutui-pro/pricing-01
```

---

## CSS Design Tokens (globals.css)

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-bg-base: #FDFDFD;
  --color-bg-subtle: #F7F7F6;
  --color-bg-elevated: #FFFFFF;
  --color-bg-glass: rgba(255, 255, 255, 0.72);

  /* Text */
  --color-text-primary: #121212;
  --color-text-secondary: #6A6A69;
  --color-text-tertiary: #9A9A99;

  /* Accents */
  --color-accent-blue: #007AFF;
  --color-accent-green: #34C759;
  --color-accent-amber: #F59E0B;
  --color-accent-red: #EF4444;

  /* Borders */
  --color-border-soft: #EDEDEC;
  --color-border-focus: #007AFF;

  /* Shadows */
  --shadow-topo:
    0 1px 2px rgba(0,0,0,0.02),
    0 4px 12px rgba(0,0,0,0.03),
    0 12px 32px rgba(0,0,0,0.04);
  --shadow-glass:
    0 8px 32px rgba(0,0,0,0.08),
    inset 0 0 0 1px rgba(255,255,255,0.1);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
}
```

---

## Motion Spring Presets

```tsx
// lib/motion.ts
export const springs = {
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  smooth: { type: "spring", stiffness: 200, damping: 25 },
  gentle: { type: "spring", stiffness: 120, damping: 20 },
  bouncy: { type: "spring", stiffness: 300, damping: 15 },
};

// Stagger children pattern
export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: springs.smooth },
};

// Usage
<motion.div transition={springs.snappy} />
```

---

## Target File Structure

```
src/
├── components/
│   ├── kokonutui/              # Auto-installed by CLI
│   │   ├── liquid-glass-card.tsx
│   │   ├── mouse-effect-card.tsx
│   │   ├── morphic-navbar.tsx
│   │   └── ...
│   ├── kokonutui-pro/          # Pro components
│   │   ├── card-02.tsx
│   │   └── ...
│   ├── ui/                     # shadcn/ui base
│   └── podbrain/               # Custom PodBrain compositions
│       ├── app-shell.tsx
│       ├── sidebar.tsx
│       ├── health-gauge.tsx
│       ├── freshness-meter.tsx
│       ├── alert-card.tsx
│       ├── guest-card.tsx
│       ├── episode-card.tsx
│       ├── processing-states.tsx
│       ├── buttons.tsx
│       ├── badge.tsx
│       ├── search.tsx
│       ├── audio-upload.tsx
│       ├── backgrounds.tsx
│       └── text-effects.tsx
├── lib/
│   ├── motion.ts               # Spring presets
│   └── utils.ts                # cn() helper
└── app/
    ├── layout.tsx              # AppShell wrapper
    ├── globals.css             # Design tokens
    ├── page.tsx                # Dashboard
    ├── episodes/
    │   └── [id]/page.tsx       # Episode detail
    ├── upload/page.tsx         # Upload flow
    ├── shows/page.tsx          # Show management
    ├── experts/page.tsx        # Expert discovery
    ├── settings/page.tsx       # User preferences
    └── trending/page.tsx       # Trending topics
```

---

## Key Principle: Purposeful Motion

Every animation serves a purpose:

1. **Feedback** — User knows action registered (button press)
2. **Hierarchy** — Important elements draw attention (health gauges)
3. **Continuity** — State changes feel connected (morphing nav)
4. **Delight** — Moments of unexpected polish (AI processing)
5. **Guidance** — Eye is led to next action (staggered reveals)

Avoid motion for motion's sake. Each animation should either:
- Confirm an action
- Show state change
- Guide attention
- Create continuity

---

*Quick reference companion to the full PodBrain Kokonut UI Design System*
