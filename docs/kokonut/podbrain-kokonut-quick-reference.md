# PodBrain Design System Migration — Quick Reference

## Complete Component Mapping Table

| Alabaster Component | Kokonut UI Replacement | Package | WOW Enhancement |
|---------------------|------------------------|---------|-----------------|
| **LAYOUT** |
| App Container | Custom with Motion | — | Staggered page entrance animation |
| Sidebar | Morphic Navbar | `@kokonutui/morphic-navbar` | Active state morphs between items |
| Nav Items | Smooth Tab | `@kokonutui/smooth-tab` | Sliding indicator animation |
| Mobile Nav | Smooth Drawer | `@kokonutui/smooth-drawer` | Slide-in with overlay blur |
| **CARDS** |
| Topo Card (primary) | Liquid Glass Card | `@kokonutui/liquid-glass-card` | Apple-style glassmorphism with blur |
| Interactive Card | Mouse Effect Card | `@kokonutui/mouse-effect-card` | Cursor-tracking dot pattern |
| Metric Card | Apple Activity Card | `@kokonutui/apple-activity-card` | Animated circular progress rings |
| Guest Item Card | Card-02 (Pro) | `@kokonutui-pro/card-02` | Contact card with social links |
| Alert Card | Custom with Motion | — | Animated entrance/exit, slide-in |
| Episode Cards | Card Stack | `@kokonutui/card-stack` | Expandable stacked reveal |
| **BUTTONS** |
| Primary Button | Gradient Button | `@kokonutui/gradient-button` | Animated gradient border |
| Secondary Button | V0 Button | `@kokonutui/v0-button` | Subtle press animation |
| Publish Action | Slide Text Button | `@kokonutui/slide-text-button` | Hover reveals "to Notion" |
| Export Action | Command Button | `@kokonutui/command-button` | Shows ⌘E keyboard shortcut |
| Dangerous Action | Hold Button | `@kokonutui/hold-button` | Press-hold to confirm (1s) |
| **FORMS** |
| Search Bar | Action Search Bar | `@kokonutui/action-search-bar` | Command palette with shortcuts |
| File Upload | File Upload | `@kokonutui/file-upload` | Drag-drop with progress animation |
| Text Input | — | Tailwind + Focus Ring | Focus ring animation |
| **PROGRESS & METRICS** |
| Progress Bar | Custom Motion | — | Spring-animated fill |
| Health Scores | Apple Activity Card | `@kokonutui/apple-activity-card` | Animated rings fill on load |
| Freshness Meter | Custom Motion | — | Color-coded animated fill |
| **LOADING STATES** |
| Spinner | Loader | `@kokonutui/loader` | Animated loading indicator |
| AI Processing | AI State Loading | `@kokonutui/ai-loading` | Pulsing orb animation |
| Text Loading | AI Text Loading | `@kokonutui/ai-text-loading` | "Thinking" shimmer effect |
| Skeleton | Shimmer Text | `@kokonutui/shimmer-text` | CSS gradient sweep |
| Content Reveal | Typewriter | `@kokonutui/typewriter` | Character-by-character reveal |
| **TEXT EFFECTS** |
| Page Titles | Swoosh Text | `@kokonutui/swoosh-text` | Flying-in entrance |
| Animated Numbers | Dynamic Text | `@kokonutui/dynamic-text` | Counting/cycling animation |
| Long Content | Scroll Text | `@kokonutui/scroll-text` | Reveal on scroll trigger |
| **BACKGROUNDS** |
| Upload Hero | Background Paths | `@kokonutui/background-paths` | Animated SVG path flow |
| Dashboard Accent | Beams Background | `@kokonutui/beams-background` | Subtle light beams |
| Dot Grid | Custom CSS | — | Radial gradient pattern |
| **NAVIGATION** |
| Profile Menu | Profile Dropdown | `@kokonutui/profile-dropdown` | Fade/slide dropdown |
| Tab Switcher | Smooth Tab | `@kokonutui/smooth-tab` | Sliding active indicator |

---

## The 10 "WOW" Factors

### 1. Cursor-Aware Cards
**Component:** `MouseEffectCard`  
**Where:** Episode list, Expert discovery, Dashboard sections  
**Effect:** Dot pattern follows cursor position, creating subtle depth awareness

### 2. Morphing Navigation
**Component:** `MorphicNavbar` + `layoutId` animation  
**Where:** Sidebar navigation  
**Effect:** Active indicator flows between items instead of snapping

### 3. AI Processing States
**Components:** `AILoading`, `AITextLoading`, `ShimmerText`  
**Where:** Upload flow, content generation  
**Effect:** Pulsing orb + "thinking" text shimmer feels genuinely intelligent

### 4. Health Score Rings
**Component:** Custom with Motion (inspired by `AppleActivityCard`)  
**Where:** Dashboard, Episode metrics  
**Effect:** Apple Watch-style rings animate on page load with number counting

### 5. Hold-to-Confirm
**Component:** `HoldButton`  
**Where:** Delete actions, reset operations  
**Effect:** Requires 1s press-hold with filling progress ring — prevents accidents

### 6. Command Palette Search
**Component:** `ActionSearchBar`  
**Where:** Episode search, global search  
**Effect:** ⌘K opens, keyboard shortcuts displayed, smooth dropdown

### 7. Glassmorphism Surfaces
**Component:** `LiquidGlassCard`  
**Where:** Show notes, Guest intelligence panels  
**Effect:** Frosted glass with backdrop blur feels premium and modern

### 8. Background Atmosphere
**Component:** `BackgroundPaths`  
**Where:** Upload hero, empty states  
**Effect:** Flowing SVG paths create visual drama without distraction

### 9. Staggered List Reveals
**Component:** Motion `variants` with `staggerChildren`  
**Where:** Episode list, Alert cards, Metrics grid  
**Effect:** Items enter in choreographed sequence, not all at once

### 10. Content Typewriter
**Component:** `Typewriter`  
**Where:** AI-generated show notes reveal  
**Effect:** Show notes appear character-by-character like AI is writing live

---

## Installation Commands (Copy/Paste Ready)

### Essential Free Components
```bash
# Run all at once
bunx --bun shadcn@latest add @kokonutui/morphic-navbar @kokonutui/smooth-tab @kokonutui/smooth-drawer @kokonutui/profile-dropdown @kokonutui/liquid-glass-card @kokonutui/mouse-effect-card @kokonutui/apple-activity-card @kokonutui/card-stack @kokonutui/bento-grid @kokonutui/gradient-button @kokonutui/slide-text-button @kokonutui/hold-button @kokonutui/command-button @kokonutui/v0-button @kokonutui/action-search-bar @kokonutui/file-upload @kokonutui/ai-text-loading @kokonutui/ai-loading @kokonutui/shimmer-text @kokonutui/typewriter @kokonutui/loader @kokonutui/dynamic-text @kokonutui/swoosh-text @kokonutui/scroll-text @kokonutui/background-paths @kokonutui/beams-background
```

### Pro Components
```bash
bunx --bun shadcn@latest add @kokonutui-pro/card-02 @kokonutui-pro/animated-list @kokonutui-pro/modal-01
```

---

## CSS Variables (globals.css)

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

// Usage
<motion.div transition={springs.snappy} />
```

---

## Page-by-Page Component Usage

### Episode Detail
- `LiquidGlassCard` — Show notes container
- `MouseEffectCard` — Guest intelligence
- `AppleActivityCard` style — Health metrics row
- `SmoothTab` — Notes/Intelligence/Social tabs
- `GradientButton` — Publish action
- `CommandButton` — Export with ⌘E

### Upload Flow
- `BackgroundPaths` — Hero background
- `FileUpload` — Drag-drop zone
- `AILoading` — Processing orb
- `AITextLoading` — "Analyzing..." shimmer
- `motion.div` — Step transitions

### Dashboard
- `BentoGrid` — Section layout
- `AppleActivityCard` style — 5-column health scores
- `AlertCard` (custom) — Attention/Opportunities
- `MouseEffectCard` — Interactive sections

### Episodes List
- `ActionSearchBar` — Episode search
- `CardStack` or Motion list — Episode rows
- `MouseEffectCard` — Hover interactivity
- Staggered `variants` — List reveal

### Expert Discovery
- `ActionSearchBar` — Expert search
- `MouseEffectCard` — Expert cards
- `FreshnessMeter` (custom) — Freshness indicator
- `BentoGrid` — Results layout

### Pre-Interview Brief
- `LiquidGlassCard` — Guest profile
- `CardStack` — Collapsible sections
- Animated list — Questions to skip

---

## File Structure

```
components/
├── kokonutui/              # Auto-installed by CLI
│   ├── liquid-glass-card.tsx
│   ├── mouse-effect-card.tsx
│   ├── morphic-navbar.tsx
│   └── ...
├── ui/                     # shadcn/ui base
└── podbrain/               # Custom compositions
    ├── app-shell.tsx
    ├── sidebar.tsx
    ├── content-card.tsx
    ├── health-gauge.tsx
    ├── freshness-meter.tsx
    ├── alert-card.tsx
    ├── guest-card.tsx
    ├── episode-list.tsx
    ├── processing-states.tsx
    ├── buttons.tsx
    ├── badge.tsx
    ├── search.tsx
    ├── audio-upload.tsx
    ├── backgrounds.tsx
    └── text-effects.tsx

lib/
└── motion.ts               # Spring presets

app/
├── layout.tsx              # AppShell wrapper
├── page.tsx                # Dashboard
├── episodes/
│   └── [id]/page.tsx       # Episode detail
├── upload/page.tsx         # Upload flow
├── experts/page.tsx        # Expert discovery
└── trending/page.tsx       # Trending topics
```

---

## Before/After Comparison

| Aspect | Alabaster (Before) | Kinetic Alabaster (After) |
|--------|-------------------|---------------------------|
| Card hover | `translateY(-2px)` | Cursor-tracking dot pattern |
| Active nav | Background change | Morphing indicator flow |
| Health scores | Static numbers | Animated filling rings |
| Search | Basic input | Command palette with shortcuts |
| Loading | Spinner | AI orb + shimmer text |
| Buttons | Opacity hover | Gradient animation + hold-confirm |
| Lists | Instant render | Staggered entrance |
| Upload | Static zone | Animated background paths |
| Content | Static text | Typewriter reveal |
| Cards | Box shadow | Glassmorphism + blur |

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

*Reference companion to the full PodBrain Kokonut UI Design System*
