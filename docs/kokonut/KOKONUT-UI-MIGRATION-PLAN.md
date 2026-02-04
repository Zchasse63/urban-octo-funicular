# PodBrain UI Migration Plan: Kokonut UI Implementation

## Overview

This document outlines the phased migration from "Alabaster Topography" to "Kinetic Alabaster" using Kokonut UI components. The goal is to transform static CSS-based design into a motion-rich, cursor-aware, AI-native interface with 10 distinct "WOW" factors.

**Design System Reference:** `docs/kokonut/podbrain-kokonut-design-system.md`
**Quick Reference:** `docs/kokonut/podbrain-kokonut-quick-reference.md`

---

## Current State

### Installed Kokonut UI Components

Located in `src/components/kokonutui/`:
- **Layout/Nav:** morphic-navbar, smooth-tab, smooth-drawer, profile-dropdown
- **Cards:** liquid-glass-card, mouse-effect-card, apple-activity-card, card-stack, bento-grid
- **Buttons:** gradient-button, slide-text-button, hold-button, command-button, v0-button
- **Forms:** action-search-bar, file-upload
- **Loading:** ai-loading, ai-text-loading, shimmer-text, loader
- **Backgrounds:** background-paths, beams-background

Located in `src/components/kokonutui-pro/`:
- card-02 (contact/guest cards)
- modal-01

### Existing Components to Migrate

Located in `src/components/`:
- `layout/app-shell.tsx` - Main app container
- `layout/sidebar.tsx` - Navigation sidebar
- `ui/card.tsx` - Base card component
- `ui/button.tsx` - Base button component
- `ui/badge.tsx` - Status badges
- `episodes/` - Episode list, detail, metrics components
- `upload/` - Upload wizard, processing states
- `shows/` - Show cards, vocabulary management
- `assets/` - Asset grid and cards
- `seo/` - SEO score cards and suggestions
- `guest-package/` - Guest package components
- `experts/` - Expert finder cards
- `LoadingStates.tsx` - Current loading components

### CSS to Update

- `src/app/globals.css` - Needs Kinetic Alabaster tokens + glassmorphism variables

---

## Phase 1: Foundation & Design Tokens

**Goal:** Update CSS variables, add Motion library integration, create motion utility file.

### Tasks

1. **Update `globals.css`** with Kinetic Alabaster tokens:
   - Add glassmorphism variables (`--glass-blur`, `--glass-saturation`, `--color-bg-glass`)
   - Add shadow-glass token
   - Add status semantic colors for alerts
   - Keep existing tokens for backwards compatibility during migration

2. **Create `lib/motion.ts`** with spring presets:
   ```typescript
   export const springs = {
     snappy: { type: "spring", stiffness: 400, damping: 30 },
     smooth: { type: "spring", stiffness: 200, damping: 25 },
     gentle: { type: "spring", stiffness: 120, damping: 20 },
     bouncy: { type: "spring", stiffness: 300, damping: 15 },
   };

   export const durations = {
     fast: 0.15,
     normal: 0.2,
     slow: 0.3,
     enter: 0.5,
     exit: 0.2,
   };
   ```

3. **Verify Motion package** is properly integrated (already installed)

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/globals.css` | Update with new tokens |
| `src/lib/motion.ts` | Create new file |

---

## Phase 2: Layout & Navigation

**Goal:** Add morphing navigation animation, staggered page entrance, mobile drawer.

### Tasks

1. **Update `layout/app-shell.tsx`**:
   - Add Motion wrapper for staggered page entrance animation
   - Integrate SmoothDrawer for mobile navigation (replace current mobile sidebar)
   - Add subtle dot grid background with proper opacity

2. **Update `layout/sidebar.tsx`**:
   - Add `layoutId="activeNav"` for morphing active indicator
   - Add `motion.div` wrapper with spring animation on nav items
   - Add `whileHover` and `whileTap` interactions
   - Keep existing route structure

3. **Create `components/podbrain/` folder** for custom compositions that combine Kokonut components

### Component Mapping

| Current | New Implementation |
|---------|-------------------|
| Mobile sidebar overlay | SmoothDrawer from kokonutui |
| Nav item active state (CSS) | Motion layoutId morphing animation |
| Static page mount | Motion fadeInUp entrance |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/app-shell.tsx` | Add Motion entrance, SmoothDrawer |
| `src/components/layout/sidebar.tsx` | Add layoutId morphing, motion interactions |

---

## Phase 3: Cards & Surfaces

**Goal:** Implement glassmorphism surfaces, cursor-aware cards, animated health gauges.

### Tasks

1. **Create `components/podbrain/content-card.tsx`**:
   - Wrapper using LiquidGlassCard for primary content
   - Standard header pattern with mono label

2. **Create `components/podbrain/interactive-card.tsx`**:
   - Wrapper using MouseEffectCard for interactive items
   - Used for episode cards, expert cards, dashboard sections

3. **Create `components/podbrain/health-gauge.tsx`**:
   - Animated circular progress rings (Apple Watch style)
   - Uses Motion for ring fill animation
   - Number counting animation on mount

4. **Create `components/podbrain/alert-card.tsx`**:
   - Motion-enhanced alerts with slide-in animation
   - Status variants (warning, error, success, info)
   - AnimatePresence for enter/exit

5. **Update existing episode/show components** to use new card variants

### Component Mapping

| Current | New Implementation |
|---------|-------------------|
| `.topo-card` CSS class | LiquidGlassCard component |
| Episode row hover (CSS) | MouseEffectCard with dot pattern |
| Static health scores | HealthGauge with animated rings |
| Alert cards (CSS borders) | AlertCard with Motion enter/exit |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/podbrain/content-card.tsx` | Glassmorphism content card |
| `src/components/podbrain/interactive-card.tsx` | Cursor-aware card wrapper |
| `src/components/podbrain/health-gauge.tsx` | Animated circular progress |
| `src/components/podbrain/alert-card.tsx` | Motion-enhanced alerts |
| `src/components/podbrain/guest-card.tsx` | Guest/contact card using card-02 |
| `src/components/podbrain/freshness-meter.tsx` | Animated linear progress |

---

## Phase 4: Buttons & Interactions

**Goal:** Replace static buttons with animated variants, add hold-to-confirm for dangerous actions.

### Tasks

1. **Create `components/podbrain/buttons.tsx`**:
   - PrimaryButton using GradientButton
   - SecondaryButton using V0Button
   - PublishButton using SlideTextButton
   - ExportButton using CommandButton (shows keyboard shortcut)
   - DangerButton using HoldButton (press-hold to confirm)

2. **Update existing button usage** across the app to use new variants

3. **Add keyboard shortcut hints** to appropriate actions

### Component Mapping

| Current | New Implementation |
|---------|-------------------|
| `.btn-primary` | GradientButton (animated border) |
| `.btn-secondary` | V0Button (subtle press animation) |
| Delete/Reset buttons | HoldButton (1s press-hold confirm) |
| Export actions | CommandButton (shows ⌘E shortcut) |
| Publish actions | SlideTextButton (reveals "to Notion") |

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/podbrain/buttons.tsx` | Create button variants |
| `src/components/ui/button.tsx` | Keep for backwards compat, add deprecation note |

---

## Phase 5: Forms & Search

**Goal:** Implement command palette search, animated file upload.

### Tasks

1. **Create `components/podbrain/search.tsx`**:
   - EpisodeSearch using ActionSearchBar
   - GlobalSearch with ⌘K shortcut
   - Shows recent searches, keyboard hints

2. **Create `components/podbrain/audio-upload.tsx`**:
   - Uses FileUpload component
   - Validates audio file types (mp3, wav, m4a, mp4)
   - Progress animation during upload

3. **Update upload wizard** to use new components

### Component Mapping

| Current | New Implementation |
|---------|-------------------|
| `.search-bar` CSS | ActionSearchBar with shortcuts |
| File input in upload | FileUpload with drag-drop |

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/podbrain/search.tsx` | Command palette search |
| `src/components/podbrain/audio-upload.tsx` | Animated file upload |
| `src/components/upload/step-upload.tsx` | Use new AudioUpload |

---

## Phase 6: Loading & AI States

**Goal:** Create AI-native loading experiences with shimmer, orbs, and typewriter effects.

### Tasks

1. **Create `components/podbrain/processing-states.tsx`**:
   - ProcessingState component with:
     - AILoading orb
     - ShimmerText for episode title
     - Progress bar with spring animation
     - Staggered step list with status indicators
   - AIContentReveal using typewriter effect for show notes

2. **Update `LoadingStates.tsx`** to use new components

3. **Update upload processing step** to use ProcessingState

### Component Mapping

| Current | New Implementation |
|---------|-------------------|
| CSS spinner | Loader or AILoading orb |
| Static "Processing..." text | AITextLoading with shimmer |
| Progress bar (CSS) | Motion-animated progress |
| Show notes render | Typewriter reveal effect |

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/podbrain/processing-states.tsx` | AI processing UI |
| `src/components/LoadingStates.tsx` | Update to use new components |
| `src/components/upload/step-processing.tsx` | Use ProcessingState |

---

## Phase 7: Backgrounds & Atmosphere

**Goal:** Add atmospheric backgrounds to hero sections and empty states.

### Tasks

1. **Create `components/podbrain/backgrounds.tsx`**:
   - UploadHero using BackgroundPaths
   - DashboardBackground using BeamsBackground (subtle)
   - EmptyStateBackground for empty states

2. **Update upload page** hero section

3. **Add subtle backgrounds** to dashboard sections

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/podbrain/backgrounds.tsx` | Background wrappers |
| Upload page | Add UploadHero background |
| Dashboard page | Add subtle BeamsBackground |

---

## Phase 8: Lists & Collections

**Goal:** Add staggered list reveals, episode list animations.

### Tasks

1. **Create `components/podbrain/episode-list.tsx`**:
   - Uses Motion staggerChildren for reveal
   - Each row uses MouseEffectCard
   - AnimatePresence for add/remove animations

2. **Update existing episode-list.tsx** or replace

3. **Add staggered animations** to:
   - Alert card lists
   - Asset grids
   - Guest lists

### Animation Pattern

```typescript
const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/episodes/episode-list.tsx` | Add stagger animation |
| `src/components/assets/asset-grid.tsx` | Add stagger animation |

---

## Phase 9: Page-Specific Updates

**Goal:** Assemble components into complete page experiences.

### Episode Detail Page

- Header with EpisodeBadge, AIBadge
- InsightGrid with 3-5 HealthGauges
- SmoothTab for Notes/Intelligence/Social
- CanvasGrid two-column layout
- ContentCard for show notes (LiquidGlassCard)
- GuestCard for guest intelligence
- ButtonGroup with Export and Publish

### Upload Page

- UploadHero with BackgroundPaths
- AudioUpload in ContentCard
- ProcessingState with AILoading
- Step transitions with AnimatePresence

### Dashboard

- BentoGrid layout
- 5-column HealthGauge row
- AlertCard lists (Attention/Opportunities)
- MouseEffectCard for interactive sections

### Episodes List

- ActionSearchBar at top
- EpisodeList with stagger reveal
- MouseEffectCard for each row

### Expert Finder

- ActionSearchBar
- BentoGrid results layout
- FreshnessMeter on each card

---

## Phase 10: Polish & Accessibility

**Goal:** Final polish, accessibility audit, reduced motion support.

### Tasks

1. **Add reduced motion support**:
   ```typescript
   import { useReducedMotion } from "motion/react";
   ```

2. **Accessibility audit**:
   - All interactive elements keyboard accessible
   - ARIA attributes on animated elements
   - Focus indicators visible
   - Color contrast maintained

3. **Performance optimization**:
   - Use `will-change` sparingly
   - Lazy load heavy animation components
   - Test on lower-end devices

4. **Clean up deprecated CSS**:
   - Remove old animation keyframes
   - Remove unused CSS classes
   - Keep backwards-compat classes with deprecation notes

---

## Implementation Order for Zeroshot

Each phase should be implemented as a separate zeroshot task:

1. **Phase 1** - Foundation (globals.css, motion.ts) - Prerequisites for all other phases
2. **Phase 2** - Layout & Navigation - High visibility, core structure
3. **Phase 3** - Cards & Surfaces - Most components depend on these
4. **Phase 4** - Buttons - Used throughout the app
5. **Phase 5** - Forms & Search - Key interaction patterns
6. **Phase 6** - Loading States - Important for AI-native feel
7. **Phase 7** - Backgrounds - Visual polish
8. **Phase 8** - Lists - Animation polish
9. **Phase 9** - Page Assembly - Bring it all together
10. **Phase 10** - Polish & A11y - Final quality pass

---

## Testing Checklist

For each phase, verify:

- [ ] Components render without errors
- [ ] Animations play smoothly (60fps)
- [ ] Reduced motion respected
- [ ] Keyboard navigation works
- [ ] Mobile responsive
- [ ] Dark mode compatible (if applicable)
- [ ] No layout shifts during animations

---

## Resources

- **Kokonut UI Docs:** kokonutui.com
- **Motion Docs:** motion.dev
- **Design System:** `docs/kokonut/podbrain-kokonut-design-system.md`
- **Quick Reference:** `docs/kokonut/podbrain-kokonut-quick-reference.md`
- **Pro Token:** Already configured in `.env.local`
