# PodBrain Design Guide — "Swiss Broadcast"

> Single authoritative reference for all UI decisions. Every color, font, spacing value, shadow,
> animation, and status indicator documented with exact values and usage context.

---

## 1. Design Philosophy

**Name:** Swiss Broadcast
**Metaphor:** Pilot's cockpit — everything at a glance, functional density
**Emotion:** "I have superpowers now" — powerful control with editorial elegance
**Density:** Medium with progressive disclosure
**Mode:** Light default, dark mode available

### Anti-Patterns (DO NOT)
- Enterprise SaaS (grey tables, corporate dashboards)
- Toy/gimmicky (candy colors, excessive animation)
- Developer tool (terminal aesthetic, monospace everything)
- Generic AI tool (purple gradients, sparkle icons)

### Signature Details
- **Paper grain texture** on page background (3% opacity light, 1.5% dark with overlay blend)
- **Blueprint dot grid** — 24px spacing, subtle blue tint
- **Status indicator dots** cascading through the interface like a system status board
- **Warm stone surfaces** — never cold/clinical
- **Cards are clean** — warm white or dark elevated, NO texture inside cards

---

## 2. Color System

### 2.1 Surface Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-bg-base` | `#EDEAE5` | `#1A1A1E` | Page background (with grain texture) |
| `--color-bg-surface` | `#FAFAF8` | `#232328` | Cards, panels, elevated surfaces |
| `--color-bg-sidebar` | `#E4E0DA` | `#161619` | Sidebar background |
| `--color-bg-hover` | `#F5F3F0` | `#2A2A30` | Hover state on interactive elements |
| `--color-bg-active` | `#ECEAE6` | `#323238` | Active/pressed state |
| `--color-bg-overlay` | `rgba(26,26,26,0.4)` | `rgba(0,0,0,0.6)` | Modal/dialog backdrop |

### 2.2 Border Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-border` | `#E0DDD7` | `#2E2E35` | Standard borders on cards, dividers |
| `--color-border-strong` | `#D0CDC7` | `#3A3A42` | Emphasized borders, scrollbar thumb |
| `--color-border-focus` | `#2563EB` | `#3B82F6` | Focus ring color |

### 2.3 Text Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-text-ink` | `#1A1A1A` | `#F5F5F5` | Primary text, headings |
| `--color-text-secondary` | `#71717A` | `#A1A1AA` | Secondary text, descriptions, labels |
| `--color-text-tertiary` | `#A1A1AA` | `#71717A` | Muted text, placeholders |
| `--color-text-on-accent` | `#FFFFFF` | `#FFFFFF` | Text on accent-colored backgrounds |

### 2.4 Accent Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-accent-blue` | `#2563EB` | `#3B82F6` | Primary CTAs, links, active states |
| `--color-accent-blue-hover` | `#1D4FD8` | `#2563EB` | Blue hover state |
| `--color-accent-blue-light` | `rgba(37,99,235,0.08)` | `rgba(59,130,246,0.12)` | Blue tinted backgrounds |
| `--color-accent-warm` | `#C2693D` | `#D97A4A` | Secondary accent, brand warmth |
| `--color-accent-warm-hover` | `#A8572F` | `#C2693D` | Warm hover state |
| `--color-accent-warm-light` | `rgba(194,105,61,0.08)` | `rgba(217,122,74,0.12)` | Warm tinted backgrounds |

### 2.5 Status Colors

| Token | Light | Dark | Meaning |
|-------|-------|------|---------|
| `--color-status-success` | `#16A34A` | `#22C55E` | Completed, active, synced, verified |
| `--color-status-success-light` | `rgba(22,163,74,0.08)` | `rgba(34,197,94,0.12)` | Success background tint |
| `--color-status-error` | `#DC2626` | `#EF4444` | Failed, error, destructive |
| `--color-status-error-light` | `rgba(220,38,38,0.08)` | `rgba(239,68,68,0.12)` | Error background tint |
| `--color-status-processing` | `#2563EB` | `#3B82F6` | Processing, in-progress |
| `--color-status-processing-light` | `rgba(37,99,235,0.08)` | `rgba(59,130,246,0.12)` | Processing background tint |
| `--color-status-pending` | `#A1A1AA` | `#71717A` | Pending, draft, idle |
| `--color-status-pending-light` | `rgba(161,161,170,0.08)` | `rgba(113,113,122,0.12)` | Pending background tint |

### 2.6 Warning Color (New — for usage thresholds)

| Token | Light | Dark | Meaning |
|-------|-------|------|---------|
| `--color-status-warning` | `#F59E0B` | `#FBBF24` | High usage (>80%), needs review |
| `--color-status-warning-light` | `rgba(245,158,11,0.08)` | `rgba(251,191,36,0.12)` | Warning background tint |

### 2.7 Platform Brand Colors

| Platform | Color | Hex | Usage |
|----------|-------|-----|-------|
| Spotify | Green | `#1DB954` | Integration badge, sync indicator |
| Apple Podcasts | Violet | `#A34EBE` | Integration badge, sync indicator |
| YouTube | Red | `#DC143C` | Integration badge, sync indicator |
| RSS | Orange | `#F4A600` | Integration badge, sync indicator |
| Slack | Sky | `#36C5F0` | Integration badge, sync indicator |

### 2.8 Vocabulary Category Colors

| Category | Badge BG (light) | Badge Text | Hex Accent |
|----------|-----------------|------------|------------|
| Person | Blue tint | Blue | `#2563EB` |
| Brand | Orange tint | Orange | `#F59E0B` |
| Technical | Green tint | Green | `#16A34A` |
| Acronym | Purple tint | Purple | `#8B5CF6` |
| Custom | Gray tint | Gray | `#71717A` |

### 2.9 Grid & Grain Pattern Colors

| Token | Light | Dark |
|-------|-------|------|
| `--color-grid-line` | `rgba(37,99,235,0.08)` | `rgba(59,130,246,0.07)` |
| `--color-grid-dot` | `rgba(37,99,235,0.15)` | `rgba(59,130,246,0.12)` |

---

## 3. Typography

### 3.1 Font Stack

| Role | Family | Weight Range | CSS Token |
|------|--------|-------------|-----------|
| Display | Space Grotesk | 400–700 | `--font-display` |
| Body | Source Serif 4 | 400–700 | `--font-body` |
| Mono | JetBrains Mono | 400–500 | `--font-mono` |

### 3.2 Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--text-display` | 2rem (32px) | 1.2 | Page titles: "Episodes", "Vocabulary", "Experts" |
| `--text-h1` | 1.5rem (24px) | 1.2 | Section titles, episode names in detail view |
| `--text-h2` | 1.25rem (20px) | 1.3 | Card titles, modal headers, tab group titles |
| `--text-h3` | 1.1rem (17.6px) | 1.3 | Sub-section titles, stat card headers |
| `--text-body` | 0.9375rem (15px) | 1.6 | Primary body text, descriptions |
| `--text-body-sm` | 0.875rem (14px) | 1.5 | Secondary body text, list items |
| `--text-caption` | 0.8125rem (13px) | 1.4 | Captions, helper text, timestamps |
| `--text-label` | 0.6875rem (11px) | 1.2 | Labels, badges, metadata (uppercase, tracked) |

### 3.3 Usage Rules

**Space Grotesk (Display):**
- ALL headings (h1–h6)
- Navigation item labels
- Button text
- Form labels and placeholders
- Card titles
- Tab trigger text
- Badge text (when not using mono variant)

**Source Serif 4 (Body):**
- Show notes content
- Episode descriptions
- Long-form text blocks
- Settings descriptions
- Support/FAQ content

**JetBrains Mono (Mono):**
- Status labels: "COMPLETED", "PROCESSING", "DRAFT"
- Section labels: "WORKSPACE", "TOOLS", "SETTINGS"
- Timestamps and dates
- Phonetic transcriptions in vocabulary
- Processing step labels in signal chain
- Stat values and metrics
- API key display
- Duration displays
- Usage percentage numbers

### 3.4 Special Text Styles

**`.text-label`** — The signature label style
```css
font-family: var(--font-mono);
font-size: var(--text-label); /* 11px */
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.06em;
color: var(--color-text-secondary);
```
Used for: Section headers in sidebar ("WORKSPACE", "TOOLS"), stat card labels ("TOTAL TERMS"), processing step labels ("UPLOAD", "TRANSCRIBE")

**`.text-mono`** — Mono metadata
```css
font-family: var(--font-mono);
font-size: var(--text-caption); /* 13px */
```
Used for: Timestamps, phonetics, duration values

---

## 4. Spacing

### 4.1 Spacing Scale

| Token | Value | Common Usage |
|-------|-------|-------------|
| `--space-1` | 0.25rem (4px) | Micro gaps, icon-to-text in badges |
| `--space-2` | 0.5rem (8px) | Tight element groups, badge padding |
| `--space-3` | 0.75rem (12px) | Form field gaps, list item padding |
| `--space-4` | 1rem (16px) | Standard content padding, card body |
| `--space-5` | 1.25rem (20px) | Card header padding |
| `--space-6` | 1.5rem (24px) | Section gaps, page padding |
| `--space-8` | 2rem (32px) | Large section separation |
| `--space-10` | 2.5rem (40px) | Page top margin |
| `--space-12` | 3rem (48px) | Hero section spacing |
| `--space-16` | 4rem (64px) | Major layout gaps |

### 4.2 Layout Dimensions

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | 240px | Sidebar expanded width |
| `--sidebar-collapsed` | 64px | Sidebar collapsed width |
| `--content-max` | 1400px | Max content area width |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Buttons, badges, input fields |
| `--radius-md` | 6px | Cards, dropdowns, panels |
| `--radius-lg` | 8px | Modals, large cards |
| `--radius-full` | 9999px | Pills, avatars, status dots |

---

## 6. Shadows

| Token | Light Value | Usage |
|-------|------------|-------|
| `--shadow-card` | `0 1px 2px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)` | Default card shadow with inner highlight |
| `--shadow-card-hover` | `0 2px 4px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)` | Card hover state (deeper lift) |
| `--shadow-dropdown` | `0 4px 16px rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.08)` | Dropdown menus, popovers |
| `--shadow-focus` | `0 0 0 3px rgba(37,99,235,0.15)` | Focus visible ring |
| `--shadow-button` | `0 1px 2px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.15)` | Button depth (Zed-style double border) |
| `--shadow-button-active` | `inset 0 2px 4px rgba(0,0,0,0.1)` | Button pressed state |

Dark mode shadows are deeper with higher opacity values to create contrast against dark surfaces.

---

## 7. Animation & Motion

### 7.1 Duration & Easing

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 120ms | Micro-interactions: hover color changes, focus rings |
| `--duration-normal` | 200ms | Standard transitions: fade, slide |
| `--duration-slow` | 350ms | Entrance animations, page transitions |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements entering view (decelerate) |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` | Continuous animations, hover |

### 7.2 Animation Utilities

| Class | Effect | Duration | Usage |
|-------|--------|----------|-------|
| `.animate-enter` | Fade + slide up 6px | 200ms | Page content entrance |
| `.animate-fade-in` | Opacity 0→1 | 200ms | Overlays, modals |
| `.animate-slide-in-left` | Slide from left 12px | 350ms | Sidebar entrance |
| `.stagger-1` through `.stagger-6` | Delay 50ms increments | — | Sequential list item entrances |

### 7.3 Status Dot Animation

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```
Applied to `.status-dot-processing` — 2s infinite ease-in-out pulse.

### 7.4 Reduced Motion

All animations are disabled when `prefers-reduced-motion: reduce` is active. Status dot pulse also stops.

---

## 8. Component Sizing Standards

### 8.1 Buttons

| Size | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| `sm` | 32px | 12px horizontal | 13px | 14px |
| `md` | 36px | 16px horizontal | 14px | 16px |
| `lg` | 40px | 20px horizontal | 15px | 18px |
| `icon` | 36px × 36px | centered | — | 16px |

### 8.2 Input Fields

| Property | Value |
|----------|-------|
| Height | 36px (single line) |
| Padding | 8px 12px |
| Border radius | `--radius-sm` (4px) |
| Font size | `--text-body-sm` (14px) |
| Border | 1px `--color-border` |
| Focus ring | 3px `--color-border-focus` |

### 8.3 Cards

| Property | Value |
|----------|-------|
| Padding | 16–20px |
| Border | 1px `--color-border-strong` |
| Border radius | `--radius-md` (6px) |
| Background | `--color-bg-surface` |
| Shadow | `--shadow-card` |
| Inner highlight | `inset 0 1px 0 rgba(255,255,255,0.6)` |

### 8.4 Badges

| Property | Value |
|----------|-------|
| Padding | 2px 8px |
| Font | `--font-mono`, 11px, weight 500, uppercase |
| Border radius | `--radius-full` |
| Border | 1px (color varies by variant) |

### 8.5 Status Dots

| Property | Value |
|----------|-------|
| Size | 8px × 8px |
| Border radius | `--radius-full` |
| Glow ring | 2px spread of status-light color |

---

## 9. Icon System

All icons from `lucide-react`. Standard size: 16px (w-4 h-4). Small: 14px (w-3.5 h-3.5). Large: 18px (w-4.5 h-4.5).

### 9.1 Navigation Icons

| Location | Icon Name | Size |
|----------|-----------|------|
| Episodes | `LayoutGrid` | 16px |
| Upload | `Upload` | 16px |
| Vocabulary | `BookOpen` | 16px |
| Experts | `Users` | 16px |
| Settings | `Settings` | 16px |
| Support | `HelpCircle` | 16px |

### 9.2 Action Icons

| Action | Icon Name | Context |
|--------|-----------|---------|
| Add/New | `Plus` | New Episode, Add Term |
| Search | `Search` | Search bars |
| Sort | `SlidersHorizontal` | Sort controls |
| Views/Save | `Bookmark` | Saved views |
| More actions | `MoreHorizontal` | Dropdown trigger |
| Back | `ArrowLeft` | Episode detail back nav |
| Process | `Play` | Trigger processing |
| Export/Download | `Download` | Export assets |
| Retry | `RotateCw` | Retry failed processing |
| Delete | `Trash2` | Delete actions |
| Copy | `Copy` | Copy API keys, copy text |
| External link | `ExternalLink` | "Manage in Stripe" |
| Edit | `Pencil` | Edit actions |
| Close | `X` | Close modals/panels |
| Check | `Check` | Checkmarks, feature list |
| Alert | `AlertTriangle` | Warning indicators |

### 9.3 State Icons

| State | Icon Name | Context |
|-------|-----------|---------|
| Theme light | `Sun` | Theme toggle |
| Theme dark | `Moon` | Theme toggle |
| Sidebar collapse | `ChevronLeft` | Sidebar footer |
| Show selector | `ChevronDown` | Show dropdown |
| Trending up | `TrendingUp` | Plan card stats |
| Lightning | `Zap` | Change Plan button |
| Loading | `Loader2` | Spinning loader |

### 9.4 Signal Chain Icons

| Stage | Icon Name | Meaning |
|-------|-----------|---------|
| Upload | `Upload` | Audio uploaded |
| Transcribe | `FileText` | Transcription complete |
| Generate | `Wand2` | Show notes generated |
| Ready | `CheckCircle` | Processing complete |

---

## 10. Status Indicator System

### 10.1 Status Dot Mapping

Every status dot in the UI maps to a specific data field:

| Dot Color | CSS Class | Data Condition |
|-----------|-----------|----------------|
| Green (solid + glow) | `.status-dot-success` | `status === 'completed'` |
| Blue (solid + glow + pulse) | `.status-dot-processing` | `status === 'processing'` |
| Red (solid + glow) | `.status-dot-error` | `status === 'failed'` |
| Gray (hollow ring) | `.status-dot-pending` | `status === 'pending'` |

### 10.2 Signal Chain Visualization

4-stage horizontal pipeline for episode processing. Each stage has:
- A dot (colored by completion status)
- A connector line (colored if stage complete, gray if not)
- A label in `.text-label` style

| Stage | Label | Active When | Data Field |
|-------|-------|-------------|------------|
| 1 | UPLOAD | `processing_step in ['uploading']` | `episode.metadata.processing_step` |
| 2 | TRANSCRIBE | `processing_step in ['transcribing', 'vocabulary_processing']` | Same |
| 3 | GENERATE | `processing_step in ['generating_show_notes', 'seo_analysis', 'generating_assets']` | Same |
| 4 | READY | `processing_step === 'completed'` | Same |

### 10.3 SEO Score Gauge

Circular SVG progress (88px diameter for large, inline text for small):

| Score Range | Color | Token |
|-------------|-------|-------|
| 90–100 | Green | `--color-status-success` |
| 75–89 | Blue | `--color-accent-blue` |
| 60–74 | Amber | `--color-status-warning` |
| 0–59 | Red | `--color-status-error` |

### 10.4 Usage Meters

Linear progress bars with threshold-based coloring:

| Usage Level | Color | Label |
|-------------|-------|-------|
| 0–59% | Green (`--color-status-success`) | Normal |
| 60–79% | Blue (`--color-accent-blue`) | Normal |
| 80–100% | Orange (`--color-status-warning`) | "HIGH" badge shown |

### 10.5 Processing Banner

Yellow-tinted banner at top of Episodes page:
- Background: `rgba(245, 158, 11, 0.08)` (amber tint)
- Text: Amber-600 (`#D97706`)
- Shows count of episodes with `status === 'processing'`
- Animated dots indicator on right side
- Only visible when count > 0

---

## 11. Dark Mode Implementation

### 11.1 Toggle Mechanism
- `data-theme="dark"` attribute on `<html>` element
- Stored in `localStorage` key `"theme"`
- System preference detection via `prefers-color-scheme`
- FOUC prevention: inline `<script>` in `<head>` reads localStorage before render

### 11.2 Token Override Strategy
All design tokens are overridden in `[data-theme="dark"]` CSS selector. Components should ONLY use CSS custom properties — never hardcode hex colors.

### 11.3 Special Dark Mode Adjustments
- Grid pattern opacity reduced to 80%
- Grain texture opacity reduced to 1.5% with `mix-blend-mode: overlay`
- Card inner highlight ring reduced from 60% to 6% white opacity
- Shadows use higher opacity values for visibility on dark surfaces

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Sidebar becomes fixed overlay, hamburger menu in header |
| Tablet | 768px–1024px | Sidebar can be toggled, content responsive |
| Desktop | > 1024px | Full sidebar visible, content area expands |

### 12.1 Mobile Sidebar
- Fixed position overlay (`z-index: 50`)
- Background overlay behind sidebar (`z-index: 40`, `--color-bg-overlay`)
- Full `--sidebar-width` (240px)
- Closes on route change or overlay click
- Hamburger trigger in mobile header bar

---

## 13. Accessibility

### 13.1 Focus Management
- All interactive elements have `:focus-visible` ring (`--shadow-focus`)
- Focus ring uses `--radius-sm` border radius
- Tab order follows visual reading order

### 13.2 Color Contrast
- All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large)
- Status colors are never the sole indicator — always paired with text or icons

### 13.3 Motion
- `prefers-reduced-motion: reduce` disables all animations
- Processing pulse animation stops
- Page transitions are instant

### 13.4 Semantic HTML
- Navigation uses `<nav>` with `aria-label`
- Tabs use proper `role="tablist"`, `role="tab"`, `role="tabpanel"`
- Status dots include visually hidden label text
- Forms use proper `<label>` associations
