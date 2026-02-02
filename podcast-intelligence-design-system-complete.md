# Podcast Intelligence Platform — Complete Design System
## Visual Language: "Alabaster Topography"

---

## Part 1: Design Foundation

### 1.1 Design Philosophy

This design system creates depth and hierarchy through subtle layering, shadows, and whitespace rather than color gradients or heavy visual treatments. The aesthetic is inspired by Apple's clean simplicity, Linear's polished components, and Notion's content-first approach.

**Core Principles:**
1. **Light as foundation** — Clean whites and soft grays create calm, focused workspaces
2. **Depth through shadow** — Layered "topographic" shadows suggest elevation without heaviness
3. **Typography as hierarchy** — Monospace labels, weight variations, and spacing define structure
4. **Restrained color** — Color is used sparingly and purposefully for actions and status
5. **Generous whitespace** — Content breathes; density is avoided

---

### 1.2 Color Tokens

#### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#FDFDFD` | Page background, app shell |
| `--bg-subtle` | `#F7F7F6` | Secondary backgrounds, input fields, metric cards |
| `--bg-elevated` | `#FFFFFF` | Cards, modals, elevated surfaces |

#### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border-soft` | `#EDEDEC` | Card borders, dividers, input borders |
| `--border-focus` | `#007AFF` | Focus rings, active states |

#### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#121212` | Headlines, body text, primary content |
| `--text-secondary` | `#6A6A69` | Labels, captions, supporting text, nav items |
| `--text-tertiary` | `#9A9A99` | Placeholders, disabled text |

#### Accent Colors (Use Sparingly)
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-blue` | `#007AFF` | Links, timestamps, primary actions, confidence indicators |
| `--accent-green` | `#34C759` | Success states, positive trends, progress bars |
| `--accent-amber` | `#F59E0B` | Warnings, attention needed |
| `--accent-red` | `#EF4444` | Errors, urgent alerts, overdue items |

#### Semantic Status Colors
| Status | Background | Text/Icon |
|--------|------------|-----------|
| Success | `rgba(52, 199, 89, 0.08)` | `#34C759` |
| Warning | `rgba(245, 158, 11, 0.08)` | `#F59E0B` |
| Error | `rgba(239, 68, 68, 0.08)` | `#EF4444` |
| Info | `rgba(0, 122, 255, 0.05)` | `#007AFF` |

---

### 1.3 Typography

#### Font Families
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;
```

#### Type Scale
| Name | Size | Weight | Letter Spacing | Usage |
|------|------|--------|----------------|-------|
| Display | 2rem (32px) | 600 | -0.02em | Page titles, episode titles |
| Heading 1 | 1.5rem (24px) | 600 | -0.02em | Section headers |
| Heading 2 | 1.25rem (20px) | 600 | -0.02em | Card titles |
| Heading 3 | 1.1rem (17.6px) | 600 | -0.01em | Subsection headers |
| Body | 0.95rem (15.2px) | 400 | 0 | Main content, show notes |
| Body Small | 0.875rem (14px) | 400 | 0 | Secondary content, nav items |
| Caption | 0.8rem (12.8px) | 400 | 0 | Metadata, helper text |
| Mono Label | 0.75rem (12px) | 500 | 0.05em | Section labels, status indicators |

#### Mono Label Style (`.mono`)
```css
.mono {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
}
```

---

### 1.4 Shadows (Topographic Depth)

#### Shadow Tokens
```css
/* Primary card shadow - layered for depth */
--shadow-topo: 
    0 1px 2px rgba(0,0,0,0.02), 
    0 4px 12px rgba(0,0,0,0.03), 
    0 12px 32px rgba(0,0,0,0.04);

/* Hover state - elevated */
--shadow-topo-hover: 
    0 4px 6px rgba(0,0,0,0.02), 
    0 15px 45px rgba(0,0,0,0.06);

/* Subtle shadow for nested elements */
--shadow-subtle: 
    0 1px 3px rgba(0,0,0,0.04);

/* Focus ring */
--shadow-focus: 
    0 0 0 3px rgba(0, 122, 255, 0.15);
```

#### Card Top Highlight
Cards include a subtle top edge highlight for additional depth:
```css
.topo-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; 
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
}
```

---

### 1.5 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps, icon padding |
| `--space-2` | 8px | Related element spacing |
| `--space-3` | 12px | Component internal padding |
| `--space-4` | 16px | Card padding, list gaps |
| `--space-5` | 20px | Section gaps |
| `--space-6` | 24px | Card padding standard |
| `--space-8` | 32px | Section separation, grid gaps |
| `--space-10` | 40px | Major section breaks |
| `--space-12` | 48px | Page header margin |
| `--space-16` | 64px | Main content padding |

---

### 1.6 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 3px | Timestamp links, inline badges |
| `--radius-md` | 6px | Buttons, inputs, nav items |
| `--radius-lg` | 8px | Small cards, metric cards, badges |
| `--radius-xl` | 12px | Primary cards (topo-card) |

---

### 1.7 Animation & Easing

```css
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
--duration-fast: 0.15s;
--duration-normal: 0.2s;
--duration-slow: 0.3s;
--duration-enter: 0.8s;
```

#### Page Enter Animation
```css
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

main {
    animation: fadeIn 0.8s var(--ease-out-expo);
}
```

#### Card Hover
```css
.topo-card {
    transition: transform 0.3s var(--ease-out-expo), 
                box-shadow 0.3s var(--ease-out-expo);
}

.topo-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-topo-hover);
}
```

---

### 1.8 Background Pattern

Subtle dot grid pattern on base background:
```css
body {
    background-color: var(--bg-base);
    background-image: 
        radial-gradient(circle at 2px 2px, var(--border-soft) 1px, transparent 0);
    background-size: 40px 40px;
}
```

---

### 1.9 Scrollbar Styling

```css
::-webkit-scrollbar { 
    width: 6px; 
}
::-webkit-scrollbar-track { 
    background: transparent; 
}
::-webkit-scrollbar-thumb { 
    background: #E0E0DE; 
    border-radius: 10px; 
}
```

---

## Part 2: Component Library

### 2.1 Layout Components

#### App Container
```css
.app-container {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 100vh;
}
```

#### Main Content Area
```css
main {
    padding: 40px 64px;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
}
```

#### Canvas Grid (Two-Column Layout)
```css
.canvas-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 32px;
}
```

#### Insight Grid (Three-Column Metrics)
```css
.insight-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 32px;
}
```

---

### 2.2 Navigation

#### Sidebar
```
┌─────────────────────────┐
│  [Logo]                 │
│                         │
│  WORKSPACE              │  ← Mono label
│  ┌───────────────────┐  │
│  │ □ Episodes        │  │  ← Active state
│  └───────────────────┘  │
│  + New Transformation   │
│  👤 Guest Library       │
│                         │
│  ─────────────────────  │
│                         │
│  DISCOVER               │  ← Mono label
│  🔥 Trending Topics     │
│  🔍 Expert Finder       │
│  📊 Competitors         │
│                         │
│  [spacer]               │
│                         │
│  Settings               │
│  Support                │
└─────────────────────────┘
```

#### Sidebar Styles
```css
aside {
    border-right: 1px solid var(--border-soft);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 32px;
    background: var(--bg-base);
}

.nav-group { 
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
}

.nav-item {
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 10px;
}

.nav-item:hover { 
    background: var(--bg-subtle); 
    color: var(--text-primary); 
}

.nav-item.active { 
    background: #fff; 
    box-shadow: var(--shadow-topo); 
    color: var(--text-primary); 
}
```

#### Nav Group Label
```html
<span class="mono" style="margin-bottom: 8px; margin-left: 12px;">Workspace</span>
```

---

### 2.3 Cards

#### Topo Card (Primary Card Component)
The main elevated card used throughout the application.

```css
.topo-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow-topo);
    transition: transform 0.3s var(--ease-out-expo), 
                box-shadow 0.3s var(--ease-out-expo);
    position: relative;
    overflow: hidden;
}

.topo-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-topo-hover);
}

/* Top edge highlight */
.topo-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; 
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
}
```

#### Metric Card
Used for displaying scores and KPIs.

```css
.metric-card {
    padding: 16px;
    background: var(--bg-subtle);
    border-radius: 8px;
    border: 1px solid transparent;
}

.metric-value { 
    font-size: 1.5rem; 
    font-weight: 700; 
    margin: 4px 0; 
}

.metric-label { 
    font-size: 0.75rem; 
    color: var(--text-secondary); 
    display: flex; 
    align-items: center; 
    gap: 4px; 
}

.trend-up { 
    color: var(--accent-green); 
}

.trend-down {
    color: var(--accent-red);
}
```

```
┌─────────────────────────────┐
│ Retention Score  ↑ 12%     │  ← metric-label with trend
│ 84.2%                       │  ← metric-value
│ ████████████████░░░░        │  ← progress bar
└─────────────────────────────┘
```

#### Guest Item Card
```css
.guest-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-soft);
    margin-bottom: 12px;
}

.guest-avatar {
    width: 40px; 
    height: 40px;
    background: linear-gradient(135deg, #E0E0DE 0%, #F5F5F4 100%);
    border-radius: 50%;
    flex-shrink: 0;
}

.guest-info h4 { 
    font-size: 0.9rem; 
    margin-bottom: 2px; 
}

.guest-info p { 
    font-size: 0.75rem; 
    color: var(--text-secondary); 
}
```

```
┌─────────────────────────────────────────┐
│  ┌────┐  Dr. Aris Thorne                │
│  │ 👤 │  Spatial Design Lead at Ocular  │
│  └────┘                                 │
└─────────────────────────────────────────┘
```

#### Alert Card
For attention items and warnings.

```css
.alert-card {
    padding: 16px;
    border-radius: 8px;
    border-left: 3px solid;
    background: var(--bg-subtle);
}

.alert-card.warning {
    border-left-color: var(--accent-amber);
}

.alert-card.error {
    border-left-color: var(--accent-red);
}

.alert-card.success {
    border-left-color: var(--accent-green);
}

.alert-card.info {
    border-left-color: var(--accent-blue);
}
```

---

### 2.4 Buttons

#### Primary Button (Glow Button)
```css
.btn-primary {
    background: var(--text-primary);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn-primary:hover { 
    opacity: 0.9; 
}
```

#### Secondary Button
```css
.btn-secondary {
    background: white;
    color: var(--text-primary);
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid var(--border-soft);
    cursor: pointer;
    transition: background 0.2s;
}

.btn-secondary:hover {
    background: var(--bg-subtle);
}
```

#### Button Group
```html
<div style="display: flex; gap: 12px;">
    <button class="btn-secondary">Export PDF</button>
    <button class="btn-primary">Publish to Notion</button>
</div>
```

---

### 2.5 Badges

```css
.badge {
    display: inline-flex;
    padding: 4px 8px;
    background: var(--bg-subtle);
    border: 1px solid var(--border-soft);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
}

/* Variations */
.badge.badge-new {
    background: rgba(0, 122, 255, 0.08);
    border-color: rgba(0, 122, 255, 0.2);
    color: var(--accent-blue);
}

.badge.badge-warning {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.2);
    color: var(--accent-amber);
}
```

```
┌───────────────┐  ┌──────────────┐  ┌─────────────┐
│ EPISODE #142  │  │ AI Assisted  │  │ 🆕 NEW      │
└───────────────┘  └──────────────┘  └─────────────┘
```

---

### 2.6 Form Elements

#### Search Bar
```css
.search-bar {
    background: var(--bg-subtle);
    border: 1px solid var(--border-soft);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    width: 100%;
    color: var(--text-primary);
}

.search-bar::placeholder {
    color: var(--text-secondary);
}

.search-bar:focus {
    outline: none;
    border-color: var(--accent-blue);
    box-shadow: var(--shadow-focus);
}
```

#### Text Input
```css
.input {
    background: var(--bg-elevated);
    border: 1px solid var(--border-soft);
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    width: 100%;
    color: var(--text-primary);
    transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus {
    outline: none;
    border-color: var(--accent-blue);
    box-shadow: var(--shadow-focus);
}
```

---

### 2.7 Progress Bars

#### Standard Progress Bar
```css
.progress-track {
    width: 100%; 
    height: 6px; 
    background: var(--bg-subtle); 
    border-radius: 3px;
}

.progress-fill {
    height: 100%; 
    background: var(--text-primary); 
    border-radius: 3px;
    transition: width 0.3s var(--ease-out-expo);
}

/* Success variant */
.progress-fill.success {
    background: var(--accent-green);
}
```

#### Thin Progress Bar (for metrics)
```css
.progress-thin {
    width: 100%; 
    height: 4px; 
    background: #EEE; 
    border-radius: 2px; 
    margin-top: 8px;
}
```

```
┌─────────────────────────────────────────┐
│ Pacing Score                   OPTIMAL  │
│ ████████████████████████████░░░░░░░░░░  │
└─────────────────────────────────────────┘
```

---

### 2.8 Timestamps & Links

#### Timestamp Link
```css
.timestamp-link {
    color: var(--accent-blue);
    text-decoration: none;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    margin-right: 8px;
    background: rgba(0, 122, 255, 0.05);
    padding: 2px 6px;
    border-radius: 3px;
    transition: background 0.2s;
}

.timestamp-link:hover {
    background: rgba(0, 122, 255, 0.1);
}
```

```
04:12  Discussing the transition from skeuomorphism...
└────┘
 timestamp-link
```

---

### 2.9 Content Areas

#### Show Notes Area
```css
.notes-area { 
    line-height: 1.6; 
    color: #333; 
}

.notes-area h3 { 
    margin: 24px 0 12px 0; 
    font-size: 1.1rem; 
}

.notes-area p { 
    margin-bottom: 16px; 
    font-size: 0.95rem; 
}

.notes-area ul {
    padding-left: 20px;
    font-size: 0.95rem;
}

.notes-area li {
    margin-bottom: 12px;
}
```

---

### 2.10 Freshness Score Meter

For expert discovery feature:

```css
.freshness-meter {
    display: flex;
    align-items: center;
    gap: 8px;
}

.freshness-bar {
    width: 100px;
    height: 6px;
    background: var(--bg-subtle);
    border-radius: 3px;
    overflow: hidden;
}

.freshness-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
}

/* Color based on freshness level */
.freshness-fill.fresh { background: var(--accent-green); }
.freshness-fill.moderate { background: var(--accent-amber); }
.freshness-fill.stale { background: var(--accent-red); }

.freshness-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
    font-weight: 600;
}
```

```
FRESHNESS: 94%
████████████████░░░░
```

---

### 2.11 Health Score Gauges

For dashboard health scores:

```css
.health-score {
    text-align: center;
    padding: 16px;
}

.health-score-value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
}

.health-score-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
}

.health-score-trend {
    font-size: 0.75rem;
    margin-top: 8px;
}

.health-score-trend.up { color: var(--accent-green); }
.health-score-trend.down { color: var(--accent-red); }
.health-score-trend.warning { color: var(--accent-amber); }
```

```
┌─────────────┐
│     78      │
│   TOPIC     │
│  COVERAGE   │
│   ▲ +3      │
└─────────────┘
```

---

## Part 3: Page Templates

### 3.1 Page Header Pattern

```html
<header>
    <div class="header-meta">
        <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge">EPISODE #142</span>
            <span class="mono">Processed 2m ago</span>
        </div>
        <h1 style="font-size: 2rem;">Episode Title Goes Here</h1>
    </div>
    <div style="display: flex; gap: 12px;">
        <button class="btn-secondary">Export PDF</button>
        <button class="btn-primary">Publish to Notion</button>
    </div>
</header>
```

```css
header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 48px;
}

.header-meta { 
    display: flex; 
    flex-direction: column; 
    gap: 8px; 
}
```

---

### 3.2 Card Header Pattern

```html
<div class="card-header">
    <h3 class="mono">Generated Show Notes</h3>
    <span class="badge">AI Assisted</span>
</div>
```

```css
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}
```

---

### 3.3 Section Divider

```css
.section-divider {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border-soft);
}
```

---

## Part 4: Screen Specifications

### 4.1 Episode Detail Page

**Layout:** Two-column canvas grid

**Left Column (1.6fr):**
- Generated Show Notes card (editable)
  - Summary paragraph
  - Executive Summary with timestamps
  - Key Discussion Points (bullet list)
  - Action Items for Listeners
  - Resources Mentioned
  - Guest Bio

**Right Column (1fr):**
- Guest Intelligence card
  - Avatar + name + title
  - Topics they discuss
  - Social links (badges)
- Content Health card
  - Pacing Score (progress bar)
  - Clarity Metric (progress bar)
  - Recommendation text

**Top Section:**
- Metric cards row (3 columns)
  - Retention Score with trend
  - Key Takeaways count
  - Sentiment Analysis

---

### 4.2 Episode Detail — Intelligence Tab

**Layout:** Single column with collapsible sections

**Attention Needed Section:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 ATTENTION NEEDED                               3 items   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ BALANCE ALERT                                        │ │
│ │ Topic "Creatine" has 100% positive framing across       │ │
│ │ 8 episodes. Consider addressing concerns for credibility│ │
│ │                                         [Learn more →]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ POTENTIAL CONTRADICTION                              │ │
│ │ Your statement at 34:12 conflicts with Episode 45       │ │
│ │                                    [View comparison →]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ TALK RATIO                                           │ │
│ │ You spoke 68% vs guest 32%. Benchmark: Host 30-40%     │ │
│ │                                    [See breakdown →]    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Insights Section:**
- Topic Coverage (expandable)
- Accessibility Score
- Question Originality (for interview episodes)
- Source Attribution
- CTA Analysis

Each insight uses alert-card styling with appropriate status colors.

---

### 4.3 Content Health Dashboard

**Layout:** Full width with grid sections

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONTENT HEALTH DASHBOARD                                                │
│ The Fitness Podcast • 147 episodes analyzed • Updated 2 hours ago       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ HEALTH SCORES (5-column grid of metric cards)                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │   78     │ │   65     │ │   82     │ │   71     │ │   43     │       │
│ │  TOPIC   │ │ BALANCE  │ │CONSISTENCY│ │  DEPTH   │ │ PROMISES │       │
│ │  ▲ +3    │ │   ⚠️     │ │  ▲ +7    │ │   ─      │ │   ❌     │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                                         │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ 🚨 ATTENTION NEEDED             │ │ 💡 OPPORTUNITIES                │ │
│ │ • 3 balance alerts              │ │ • 3 trending topics match you   │ │
│ │ • 4 promises overdue            │ │ • 12 fresh experts identified   │ │
│ │ • 2 stories told 5+ times       │ │ • 2 competitor gaps             │ │
│ │              [View All →]       │ │              [View All →]       │ │
│ └─────────────────────────────────┘ └─────────────────────────────────┘ │
│                                                                         │
│ ┌───────────────────────────────────────────────────────────────────┐   │
│ │ 📈 TRENDS (Last 90 Days)                                          │   │
│ │ [Line chart: episode length, sentiment, jargon over time]         │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐ │
│ │ 📋 OPEN PROMISES                │ │ 🔄 REPEATED CONTENT             │ │
│ │ ❌ "Full episode on Methylation"│ │ • "Running out of money" (8x)   │ │
│ │ ❌ "Have Dr. Smith back"        │ │ • "Steve Jobs quote" (6x)       │ │
│ │ ⏳ "Share protocol next week"   │ │                                 │ │
│ └─────────────────────────────────┘ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Pre-Interview Brief

**Layout:** Single column, scannable sections

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Back to Guests                                        [Export PDF]    │
│                                                                         │
│ PRE-INTERVIEW BRIEF                                                     │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  ┌────┐                                                             │ │
│ │  │ 👤 │  Dr. Jane Smith                                             │ │
│ │  └────┘  CEO, GutHealth Inc • PhD Microbiology, Stanford            │ │
│ │                                                                     │ │
│ │  📊 8 podcast appearances in last 18 months                         │ │
│ │  📚 Author: "The Gut Solution" (2023)                               │ │
│ │                                                                     │ │
│ │  [LinkedIn]  [Twitter]  [Website]                                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ❌ QUESTIONS TO SKIP (asked 5+ times)                          [Mono]  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  • "How did you get into gut health?" — asked 8 times               │ │
│ │  • "What's the microbiome?" — asked 7 times                         │ │
│ │  • "Best foods for gut health?" — asked 6 times                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ✨ UNIQUE ANGLES (never or rarely asked)                       [Mono]  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  💡 Her time at [Previous Company] before founding GutHealth Inc    │ │
│ │  💡 The failed first version of her product                         │ │
│ │  💡 Her stance on personalized microbiome testing                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ 🔄 STORIES SHE REPEATS                                         [Mono]  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  • "The patient who changed everything" — told 6 times              │ │
│ │  • "Almost gave up on the PhD" — told 4 times                       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ 📌 POSITIONS SHE'S STATED                                      [Mono]  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  ✓ PRO: Personalized nutrition based on microbiome                  │ │
│ │  ✗ SKEPTICAL: Generic probiotic supplements                         │ │
│ │  ⚡ CONTROVERSIAL: Most gut tests are "useless"                      │ │
│ │  🔄 EVOLVED: Changed stance on fasting                               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ 🎯 SUGGESTED HOOKS                                             [Mono]  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  "You said on [Podcast X] that most gut tests are useless—          │ │
│ │   what makes yours different?"                                       │ │
│ │                                                                     │ │
│ │  "Your view on fasting seems to have changed—what happened?"        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Expert Discovery

**Layout:** Search + results list

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DISCOVER EXPERTS                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────┐ [Search]   │
│ │ 🔍 gut health                                           │             │
│ └─────────────────────────────────────────────────────────┘             │
│                                                                         │
│ Quick picks: [Nutrition] [Sleep] [Exercise] [Supplements]               │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────── │
│                                                                         │
│ ✅ FRESH VOICES                                                 [Mono]  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  ┌────┐  Dr. Sarah Chen                        FRESHNESS: 94%       │ │
│ │  │ 👤 │  MIT Research Lab                      ████████████████░░░░ │ │
│ │  └────┘  Expertise: Microbiome, gut-brain axis                      │ │
│ │          📊 2 appearances (both 2024)                               │ │
│ │          📧 Contact available                                        │ │
│ │                                    [View Profile] [Get Contact]     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  ┌────┐  Dr. Mike Johnson                      FRESHNESS: 87%       │ │
│ │  │ 👤 │  Cleveland Clinic                      ██████████████░░░░░░ │ │
│ │  └────┘  Expertise: Digestive disorders                             │ │
│ │          📊 5 appearances (2023-2024)                               │ │
│ │          📧 Contact available                                        │ │
│ │                                    [View Profile] [Get Contact]     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ 🟡 ESTABLISHED EXPERTS                                          [Mono]  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  ┌────┐  Dr. Will Bulsiewicz                   FRESHNESS: 45%       │ │
│ │  │ 👤 │  Gastroenterologist                    ████████░░░░░░░░░░░░ │ │
│ │  └────┘  📊 34 appearances                                          │ │
│ │          ⚠️ Last appeared: 2 weeks ago                               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ⚠️ OVER-INTERVIEWED                                             [Mono]  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  • Dr. Mark Hyman — 89 appearances                                  │ │
│ │  • Dr. Steven Gundry — 67 appearances                               │ │
│ │  • Dr. Rhonda Patrick — 156 appearances                             │ │
│ │                                                                     │ │
│ │  These experts are great but your audience has likely heard them.   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.6 Trending Topics

**Layout:** Vertical card stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔥 TRENDING IN YOUR NICHE                                               │
│ Health & Fitness • Updated 2 hours ago                          [Mono]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ #1  GLP-1 MEDICATIONS                              +340% search ↗   │ │
│ │ ─────────────────────────────────────────────────────────────────── │ │
│ │ Why trending: Ozempic, Wegovy mainstream adoption; FDA news         │ │
│ │                                                                     │ │
│ │ YOUR COVERAGE: ❌ Never discussed                                    │ │
│ │                                                                     │ │
│ │ FRESH EXPERTS:                                                      │ │
│ │ • Dr. Caroline Apovian (3 appearances)                              │ │
│ │ • Dr. Fatima Stanford (5 appearances)                               │ │
│ │ • Dr. Spencer Nadolsky (7 appearances)                              │ │
│ │                                                                     │ │
│ │ ⚠️ Over-interviewed: Dr. Peter Attia (12+ episodes)                  │ │
│ │                                                                     │ │
│ │ [Find more experts →]              [Mark as not interested]         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ #2  CONTINUOUS GLUCOSE MONITORS                    +180% search ↗   │ │
│ │ ─────────────────────────────────────────────────────────────────── │ │
│ │ YOUR COVERAGE: ⚠️ Mentioned 3x but no deep dive                      │ │
│ │                                                                     │ │
│ │ SUGGESTION: You reference this often—audience may want full episode │ │
│ │                                                                     │ │
│ │ [Find experts →]                         [Mark as covered]          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.7 Upload Flow

**Step 1: Upload**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ NEW TRANSFORMATION                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│     ┌─────────────────────────────────────────────────────────────┐     │
│     │                                                             │     │
│     │                     📁 Drop audio file                      │     │
│     │                     or click to browse                      │     │
│     │                                                             │     │
│     │              MP3, WAV, M4A, MP4 • Max 4 hours               │     │
│     │                                                             │     │
│     └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
│     ─────────────────────── OR ───────────────────────────              │
│                                                                         │
│     🔗 Import from RSS                                                  │
│     ┌─────────────────────────────────────────────────────────────┐     │
│     │ https://                                                    │     │
│     └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 2: Context (Optional)**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Help us nail the details                                        [Mono]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Episode Title                                                           │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ Guest Name(s)                                                           │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ 💡 We'll pre-load their vocabulary and past appearances                 │
│                                                                         │
│ Target Keywords (optional)                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ 💡 Help us optimize for SEO                                             │
│                                                                         │
│                              [Skip for now]  [Start Processing →]       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 3: Processing**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Processing: "Episode 82 - Dr. Jane Smith"                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│     ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  60%                      │
│                                                                         │
│     ✓ Audio uploaded                                                    │
│     ✓ Transcription complete                                            │
│     ● Running intelligence analysis...                                  │
│     ○ Generating show notes                                             │
│     ○ Creating social posts                                             │
│                                                                         │
│     Estimated time remaining: 2 minutes                                 │
│                                                                         │
│     💡 We'll email you when ready, or wait here                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.8 Episodes List

**Layout:** Table with filters

```
┌─────────────────────────────────────────────────────────────────────────┐
│ EPISODES                                           [+ New Transformation]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────────────────────────────────────────┐             │
│ │ 🔍 Search episodes...                                   │             │
│ └─────────────────────────────────────────────────────────┘             │
│                                                                         │
│ [All] [Last 30 days] [Has alerts] [Processing]                          │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Episode                           │ Date     │ Health │ Status      │ │
│ ├───────────────────────────────────┼──────────┼────────┼─────────────┤ │
│ │ #142 Future of Alabaster UI       │ Jan 30   │ 84/100 │ ✓ Complete  │ │
│ │ #141 Sleep Science Deep Dive      │ Jan 23   │ 76/100 │ ⚠️ 2 alerts │ │
│ │ #140 Gut Health Fundamentals      │ Jan 16   │ 91/100 │ ✓ Complete  │ │
│ │ #139 Interview with Dr. Smith     │ Jan 9    │ 68/100 │ ⚠️ 3 alerts │ │
│ │ #138 New Year Goals Episode       │ Jan 2    │ —      │ ● Processing│ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Iconography

### Icon Style
- Line icons with 1.5px stroke weight
- 16x16px standard size
- Use `currentColor` for flexibility
- Rounded line caps and joins

### Required Icons
| Icon | Usage |
|------|-------|
| Grid/squares | Episodes |
| Plus | New/Add |
| Person | Guest, Profile |
| Fire/flame | Trending |
| Search/magnifier | Search, Discover |
| Chart/graph | Analytics, Dashboard |
| Settings/gear | Settings |
| Export/share | Export actions |
| Check | Success, complete |
| Warning triangle | Alerts |
| X/close | Errors, dismiss |
| Clock | Timestamps, processing |
| Arrow up/down | Trends |
| Link | External links |
| Copy | Copy to clipboard |

### Example Icon SVG
```html
<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4.5A2.5 2.5 0 014.5 2h7A2.5 2.5 0 0114 4.5v7a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 012 11.5v-7z" 
          stroke="currentColor" 
          stroke-width="1.5"/>
</svg>
```

---

## Part 6: Responsive Behavior

### Breakpoints
| Name | Width | Layout Changes |
|------|-------|----------------|
| Desktop | 1280px+ | Full two-column layout, sidebar visible |
| Tablet | 768px–1279px | Collapsed sidebar, single-column canvas grid |
| Mobile | <768px | Hidden sidebar (hamburger), stacked cards |

### Tablet Adjustments
- Sidebar becomes collapsible icon-only rail
- Canvas grid becomes single column
- Insight grid becomes 2 columns then 1

### Mobile Priorities
1. Episode processing status
2. Show notes viewing and copying
3. Dashboard health scores
4. Navigation to key sections

---

## Part 7: Accessibility

### Requirements
- WCAG 2.1 AA compliance
- Minimum contrast ratio 4.5:1 for text
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader labels for icons
- Alt text for charts (data tables as fallback)

### Focus Styles
```css
:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
}
```

### Color Independence
- Never use color alone to convey meaning
- Include icons/text labels with status colors
- Progress bars include numeric values

---

## Part 8: Logo

### Primary Logo Mark
Audio waveform in a rounded square container.

```html
<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="white"/>
    <path d="M16 8V24M11 13V19M21 13V19M6 15V17M26 15V17" 
          stroke="black" 
          stroke-width="2" 
          stroke-linecap="round"/>
    <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#EDEDEC"/>
</svg>
```

### Logo Specifications
- Square format: 32x32px standard
- Border radius: 8px (matches `--radius-lg`)
- Stroke: 2px black lines
- Background: White with soft border

---

## Part 9: Implementation Notes

### CSS Custom Properties (Complete)
```css
:root {
    /* Backgrounds */
    --bg-base: #FDFDFD;
    --bg-subtle: #F7F7F6;
    --bg-elevated: #FFFFFF;
    
    /* Borders */
    --border-soft: #EDEDEC;
    
    /* Text */
    --text-primary: #121212;
    --text-secondary: #6A6A69;
    
    /* Accents */
    --accent-blue: #007AFF;
    --accent-green: #34C759;
    --accent-amber: #F59E0B;
    --accent-red: #EF4444;
    
    /* Shadows */
    --shadow-topo: 0 1px 2px rgba(0,0,0,0.02), 
                   0 4px 12px rgba(0,0,0,0.03), 
                   0 12px 32px rgba(0,0,0,0.04);
    --shadow-topo-hover: 0 4px 6px rgba(0,0,0,0.02), 
                         0 15px 45px rgba(0,0,0,0.06);
    
    /* Animation */
    --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
}
```

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Base Styles
```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
}

body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: var(--text-primary);
    background-color: var(--bg-base);
    background-image: radial-gradient(circle at 2px 2px, var(--border-soft) 1px, transparent 0);
    background-size: 40px 40px;
}

h1, h2, h3 { 
    font-weight: 600; 
    letter-spacing: -0.02em; 
}
```

---

## Appendix: Component Checklist

### Core Components
- [ ] App shell (sidebar + main)
- [ ] Navigation items (default, hover, active)
- [ ] Topo card (with hover effect)
- [ ] Metric card (with progress bar)
- [ ] Guest item card
- [ ] Alert card (all status variants)
- [ ] Buttons (primary, secondary)
- [ ] Badges (default, status variants)
- [ ] Search bar
- [ ] Text input
- [ ] Progress bars (standard, thin)
- [ ] Timestamp links
- [ ] Health score displays
- [ ] Freshness meter
- [ ] Section headers (mono labels)
- [ ] Page headers
- [ ] Card headers
- [ ] Dividers

### Page Templates
- [ ] Episode detail (Show Notes tab)
- [ ] Episode detail (Intelligence tab)
- [ ] Content Health Dashboard
- [ ] Pre-Interview Brief
- [ ] Expert Discovery
- [ ] Trending Topics
- [ ] Upload flow (3 steps)
- [ ] Episodes list
- [ ] Empty states

---

*End of Design System*
