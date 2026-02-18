# PodBrain Design System — Kokonut UI Edition
## Visual Language: "Kinetic Alabaster"

**Built with:** Kokonut UI (free) + Kokonut UI Pro (licensed)
**Stack:** React 19 · Next.js 16 · Tailwind CSS v4 · Motion 12+
**Last verified:** 2026-02-18

---

## Executive Summary

"Kinetic Alabaster" is a motion-rich, content-first visual language built on Kokonut UI. It pairs a calm, high-contrast aesthetic with purposeful animation, cursor-aware interactivity, and AI-native feedback patterns.

### Design Principles

| Alabaster Topography | Kinetic Alabaster |
|---------------------|-------------------|
| Static shadows suggest depth | Motion reveals depth through interaction |
| CSS transitions on hover | Physics-based spring animations |
| Content breathes in whitespace | Content responds to attention |
| Color signals status | Motion + color tell stories |
| Cards are containers | Cards are living surfaces |

### The "Wow" Factors We're Adding

1. **Cursor-aware cards** — Cards subtly respond to mouse position with dot pattern animations
2. **Liquid glass surfaces** — Apple-inspired glassmorphism for elevated content
3. **AI thinking states** — Shimmer text, pulsing orbs, and streaming reveals
4. **Animated health rings** — Apple Watch-style circular progress for metrics
5. **Morphing navigation** — Active states flow between items instead of snapping
6. **Staggered reveals** — Content enters in choreographed sequences
7. **Magnetic interactions** — Buttons and elements respond to cursor proximity
8. **Hold-to-confirm** — Destructive actions require intentional press-hold

---

## Part 1: Technical Foundation

### 1.1 Required Dependencies

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "next": "^16.0.0",
    "tailwindcss": "^4.1.14",
    "motion": "^12.23.24",
    "lucide-react": "^0.545.0",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^3.3.1",
    "clsx": "^2.1.1"
  }
}
```

### 1.2 Kokonut UI Setup

**Step 1: Configure shadcn registry**

Add to `components.json`:
```json
{
  "registries": {
    "@kokonutui": "https://kokonutui.com/r/{name}.json",
    "@kokonutui-pro": {
      "url": "https://kokonutui.pro/api/r/{name}",
      "headers": { "X-API-Key": "${KOKO_PRO_TOKEN}" }
    }
  }
}
```

**Step 2: Install utilities**
```bash
bunx --bun shadcn@latest add https://kokonutui.com/r/utils.json
```

**Step 3: Install components as needed**
```bash
# Free components
bunx --bun shadcn@latest add @kokonutui/[component-name]

# Pro components
bunx --bun shadcn@latest add @kokonutui-pro/[component-name]
```

### 1.3 File Structure

```
components/
├── kokonutui/           # Kokonut UI components (auto-installed)
│   ├── liquid-glass-card.tsx
│   ├── mouse-effect-card.tsx
│   ├── apple-activity-card.tsx
│   └── ...
├── ui/                  # shadcn/ui base components
└── podbrain/            # Custom PodBrain compositions
    ├── episode-card.tsx
    ├── health-gauge.tsx
    ├── freshness-meter.tsx
    └── ...
```

---

## Part 2: Design Tokens (Tailwind v4)

### 2.1 Color System

We preserve the Alabaster color palette but define it in Tailwind v4's CSS variable format:

```css
/* globals.css */
@import "tailwindcss";

@theme {
  /* === BACKGROUNDS === */
  --color-bg-base: #FDFDFD;
  --color-bg-subtle: #F7F7F6;
  --color-bg-elevated: #FFFFFF;
  --color-bg-glass: rgba(255, 255, 255, 0.72);
  --color-bg-glass-border: rgba(255, 255, 255, 0.18);
  
  /* === BORDERS === */
  --color-border-soft: #EDEDEC;
  --color-border-focus: #007AFF;
  
  /* === TEXT === */
  --color-text-primary: #121212;
  --color-text-secondary: #6A6A69;
  --color-text-tertiary: #9A9A99;
  
  /* === ACCENTS (Use Sparingly) === */
  --color-accent-blue: #007AFF;
  --color-accent-green: #34C759;
  --color-accent-amber: #F59E0B;
  --color-accent-red: #EF4444;
  
  /* === SEMANTIC STATUS === */
  --color-status-success-bg: rgba(52, 199, 89, 0.08);
  --color-status-success-text: #34C759;
  --color-status-warning-bg: rgba(245, 158, 11, 0.08);
  --color-status-warning-text: #F59E0B;
  --color-status-error-bg: rgba(239, 68, 68, 0.08);
  --color-status-error-text: #EF4444;
  --color-status-info-bg: rgba(0, 122, 255, 0.05);
  --color-status-info-text: #007AFF;
  
  /* === SHADOWS === */
  --shadow-topo: 
    0 1px 2px rgba(0,0,0,0.02), 
    0 4px 12px rgba(0,0,0,0.03), 
    0 12px 32px rgba(0,0,0,0.04);
  --shadow-topo-hover: 
    0 4px 6px rgba(0,0,0,0.02), 
    0 15px 45px rgba(0,0,0,0.06);
  --shadow-glass: 
    0 8px 32px rgba(0,0,0,0.08),
    inset 0 0 0 1px rgba(255,255,255,0.1);
  --shadow-focus: 0 0 0 3px rgba(0, 122, 255, 0.15);
  
  /* === GLASSMORPHISM === */
  --glass-blur: 20px;
  --glass-saturation: 180%;
}
```

### 2.2 Typography

```css
@theme {
  /* === FONT FAMILIES === */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  
  /* === TYPE SCALE === */
  --text-display: 2rem;      /* 32px - Page titles */
  --text-h1: 1.5rem;         /* 24px - Section headers */
  --text-h2: 1.25rem;        /* 20px - Card titles */
  --text-h3: 1.1rem;         /* 17.6px - Subsections */
  --text-body: 0.95rem;      /* 15.2px - Main content */
  --text-body-sm: 0.875rem;  /* 14px - Secondary content */
  --text-caption: 0.8rem;    /* 12.8px - Metadata */
  --text-mono-label: 0.75rem; /* 12px - Section labels */
}
```

**Tailwind utility classes:**

```tsx
// Display title
<h1 className="text-[2rem] font-semibold tracking-tight">

// Mono label (section headers)
<span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary">
  WORKSPACE
</span>

// Body text
<p className="text-[0.95rem] leading-relaxed text-text-primary">
```

### 2.3 Spacing Scale

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| space-1 | `gap-1` | 4px | Tight gaps |
| space-2 | `gap-2` | 8px | Related elements |
| space-3 | `gap-3` | 12px | Component padding |
| space-4 | `gap-4` | 16px | Card padding |
| space-5 | `gap-5` | 20px | Section gaps |
| space-6 | `gap-6` | 24px | Standard card padding |
| space-8 | `gap-8` | 32px | Section separation |
| space-10 | `gap-10` | 40px | Major breaks |
| space-12 | `gap-12` | 48px | Page header margin |
| space-16 | `gap-16` | 64px | Main content padding |

### 2.4 Border Radius

| Token | Tailwind | Value | Usage |
|-------|----------|-------|-------|
| radius-sm | `rounded-sm` | 3px | Timestamp badges |
| radius-md | `rounded-md` | 6px | Buttons, inputs |
| radius-lg | `rounded-lg` | 8px | Small cards |
| radius-xl | `rounded-xl` | 12px | Primary cards |
| radius-2xl | `rounded-2xl` | 16px | Glass cards |

### 2.5 Motion Tokens

```tsx
// Spring configurations for Motion
export const springs = {
  // Snappy interactions
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  
  // Smooth entrances
  smooth: { type: "spring", stiffness: 200, damping: 25 },
  
  // Gentle, content-aware
  gentle: { type: "spring", stiffness: 120, damping: 20 },
  
  // Bouncy feedback
  bouncy: { type: "spring", stiffness: 300, damping: 15 },
};

// Duration tokens (for non-spring animations)
export const durations = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  enter: 0.5,
  exit: 0.2,
};

// Easing curves
export const easings = {
  outExpo: [0.19, 1, 0.22, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
};
```

---

## Part 3: Component Library

### 3.1 Layout Components

#### App Shell
```tsx
// components/podbrain/app-shell.tsx
"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-bg-base">
      {/* Subtle dot grid background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, var(--color-border-soft) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}
      />
      
      <Sidebar />
      
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
        className="px-16 py-10 max-w-[1400px] mx-auto w-full"
      >
        {children}
      </motion.main>
    </div>
  );
}
```

#### Canvas Grid (Two-Column)
```tsx
export function CanvasGrid({ 
  left, 
  right 
}: { 
  left: ReactNode; 
  right: ReactNode; 
}) {
  return (
    <div className="grid grid-cols-[1.6fr_1fr] gap-8">
      <div className="space-y-6">{left}</div>
      <div className="space-y-6">{right}</div>
    </div>
  );
}
```

#### Insight Grid (Metrics Row)
```tsx
export function InsightGrid({ children }: { children: ReactNode }) {
  return (
    <motion.div 
      className="grid grid-cols-3 gap-4 mb-8"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      {children}
    </motion.div>
  );
}
```

---

### 3.2 Navigation

#### Sidebar → Morphic Navbar + Smooth Tab

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/morphic-navbar
bunx --bun shadcn@latest add @kokonutui/smooth-tab
bunx --bun shadcn@latest add @kokonutui/smooth-drawer
bunx --bun shadcn@latest add @kokonutui/profile-dropdown
```

```tsx
// components/podbrain/sidebar.tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { 
  LayoutGrid, 
  Plus, 
  Users, 
  Flame, 
  Search, 
  BarChart3,
  Settings,
  HelpCircle
} from "lucide-react";
import { ProfileDropdown } from "@/components/kokonutui/profile-dropdown";

const workspaceItems = [
  { id: "episodes", label: "Episodes", icon: LayoutGrid },
  { id: "new", label: "New Transformation", icon: Plus },
  { id: "guests", label: "Guest Library", icon: Users },
];

const discoverItems = [
  { id: "trending", label: "Trending Topics", icon: Flame },
  { id: "experts", label: "Expert Finder", icon: Search },
  { id: "competitors", label: "Competitors", icon: BarChart3 },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("episodes");

  return (
    <aside className="border-r border-border-soft p-6 flex flex-col gap-8 bg-bg-base">
      {/* Logo */}
      <motion.div 
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PodBrainLogo />
        <span className="font-semibold text-text-primary">PodBrain</span>
      </motion.div>

      {/* Workspace Section */}
      <NavSection title="WORKSPACE">
        {workspaceItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeItem === item.id}
            onClick={() => setActiveItem(item.id)}
          />
        ))}
      </NavSection>

      {/* Discover Section */}
      <NavSection title="DISCOVER">
        {discoverItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeItem === item.id}
            onClick={() => setActiveItem(item.id)}
          />
        ))}
      </NavSection>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Items */}
      <div className="space-y-1">
        <NavItem icon={Settings} label="Settings" />
        <NavItem icon={HelpCircle} label="Support" />
      </div>

      {/* Profile */}
      <ProfileDropdown />
    </aside>
  );
}

function NavSection({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary ml-3 mb-2 block">
        {title}
      </span>
      {children}
    </div>
  );
}

function NavItem({ 
  icon: Icon, 
  label, 
  isActive = false,
  onClick 
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative w-full flex items-center gap-2.5 px-3 py-2 rounded-md
        text-sm transition-colors
        ${isActive 
          ? "text-text-primary" 
          : "text-text-secondary hover:text-text-primary hover:bg-bg-subtle"
        }
      `}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active indicator with morphing animation */}
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 bg-white rounded-md shadow-topo"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      
      <span className="relative z-10 flex items-center gap-2.5">
        <Icon className="w-4 h-4" />
        {label}
      </span>
    </motion.button>
  );
}
```

#### Mobile Navigation → Smooth Drawer

```tsx
// components/podbrain/mobile-nav.tsx
"use client";

import { SmoothDrawer } from "@/components/kokonutui/smooth-drawer";
import { Menu } from "lucide-react";

export function MobileNav() {
  return (
    <SmoothDrawer
      trigger={
        <button className="lg:hidden p-2 rounded-md hover:bg-bg-subtle">
          <Menu className="w-5 h-5" />
        </button>
      }
    >
      {/* Sidebar content rendered inside drawer */}
      <MobileSidebarContent />
    </SmoothDrawer>
  );
}
```

---

### 3.3 Cards

#### Primary Card → Liquid Glass Card + Mouse Effect Card

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/liquid-glass-card
bunx --bun shadcn@latest add @kokonutui/mouse-effect-card
```

**Use Case Decision:**
- **Liquid Glass Card** — For elevated, important content (show notes, guest intelligence)
- **Mouse Effect Card** — For interactive items (episode cards, expert cards, dashboard sections)

```tsx
// components/podbrain/content-card.tsx
"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import { LiquidGlassCard } from "@/components/kokonutui/liquid-glass-card";

interface ContentCardProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  interactive?: boolean;
}

export function ContentCard({ 
  children, 
  header, 
  className = "",
  interactive = true
}: ContentCardProps) {
  const CardWrapper = interactive ? motion.div : "div";
  
  return (
    <LiquidGlassCard className={className}>
      {/* Card header with mono label style */}
      {header && (
        <div className="flex justify-between items-center mb-6">
          {header}
        </div>
      )}
      
      {children}
    </LiquidGlassCard>
  );
}

// Alternative: Mouse-reactive card for dashboards
import { MouseEffectCard } from "@/components/kokonutui/mouse-effect-card";

export function InteractiveCard({ 
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <MouseEffectCard className={`p-6 rounded-xl ${className}`}>
      {children}
    </MouseEffectCard>
  );
}
```

#### Metric Card → Apple Activity Card

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/apple-activity-card
```

**The "Wow" Factor:** Health scores display as animated circular rings that fill on load, creating an Apple Watch-like experience.

```tsx
// components/podbrain/health-gauge.tsx
"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface HealthGaugeProps {
  value: number;        // 0-100
  label: string;        // "TOPIC COVERAGE"
  trend?: number;       // +3, -2, etc.
  status?: "good" | "warning" | "error" | "neutral";
}

export function HealthGauge({ 
  value, 
  label, 
  trend, 
  status = "neutral" 
}: HealthGaugeProps) {
  const progress = useMotionValue(0);
  const displayValue = useTransform(progress, (v) => Math.round(v));
  
  // Animate the value on mount
  useEffect(() => {
    const controls = animate(progress, value, {
      duration: 1.2,
      ease: [0.19, 1, 0.22, 1],
    });
    return controls.stop;
  }, [value, progress]);

  const getStatusColor = () => {
    switch (status) {
      case "good": return "var(--color-accent-green)";
      case "warning": return "var(--color-accent-amber)";
      case "error": return "var(--color-accent-red)";
      default: return "var(--color-text-primary)";
    }
  };

  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-3 h-3" />;
    if (trend > 0) return <TrendingUp className="w-3 h-3" />;
    return <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "text-text-tertiary";
    if (trend > 0) return "text-accent-green";
    return "text-accent-red";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-subtle rounded-lg p-4 text-center"
    >
      {/* Circular progress ring */}
      <div className="relative w-20 h-20 mx-auto mb-3">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="var(--color-border-soft)"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <motion.circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={getStatusColor()}
            strokeWidth="6"
            strokeLinecap="round"
            style={{
              pathLength: useTransform(progress, [0, 100], [0, 1])
            }}
          />
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className="text-2xl font-bold"
            style={{ color: getStatusColor() }}
          >
            {displayValue}
          </motion.span>
        </div>
      </div>
      
      {/* Label */}
      <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary block">
        {label}
      </span>
      
      {/* Trend indicator */}
      {trend !== undefined && (
        <div className={`flex items-center justify-center gap-1 mt-2 text-xs ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{trend > 0 ? `+${trend}` : trend}</span>
        </div>
      )}
      
      {/* Warning icon for error status */}
      {status === "error" && (
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-accent-red">
          <AlertTriangle className="w-3 h-3" />
        </div>
      )}
    </motion.div>
  );
}
```

#### Guest Item Card → Card-02 (Pro)

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui-pro/card-02
```

```tsx
// components/podbrain/guest-card.tsx
"use client";

import { motion } from "motion/react";
import { Linkedin, Twitter, Globe } from "lucide-react";

interface GuestCardProps {
  name: string;
  title: string;
  company: string;
  avatar?: string;
  appearances?: number;
  socials?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export function GuestCard({ 
  name, 
  title, 
  company, 
  avatar,
  appearances,
  socials 
}: GuestCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className="flex items-center gap-3 p-3 rounded-lg border border-border-soft hover:border-accent-blue/20 hover:bg-bg-subtle/50 transition-colors cursor-pointer"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-border-soft to-bg-subtle flex-shrink-0 overflow-hidden">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary text-lg font-medium">
            {name.charAt(0)}
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-text-primary truncate">{name}</h4>
        <p className="text-xs text-text-secondary truncate">
          {title} at {company}
        </p>
        {appearances && (
          <p className="text-xs text-text-tertiary mt-1">
            {appearances} podcast appearances
          </p>
        )}
      </div>
      
      {/* Social links */}
      {socials && (
        <div className="flex items-center gap-1">
          {socials.linkedin && (
            <a href={socials.linkedin} className="p-1.5 rounded hover:bg-bg-subtle">
              <Linkedin className="w-4 h-4 text-text-secondary" />
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} className="p-1.5 rounded hover:bg-bg-subtle">
              <Twitter className="w-4 h-4 text-text-secondary" />
            </a>
          )}
          {socials.website && (
            <a href={socials.website} className="p-1.5 rounded hover:bg-bg-subtle">
              <Globe className="w-4 h-4 text-text-secondary" />
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
```

#### Alert Card → Motion-Enhanced Custom

```tsx
// components/podbrain/alert-card.tsx
"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Info, CheckCircle, XCircle, ChevronRight } from "lucide-react";

type AlertStatus = "warning" | "error" | "success" | "info";

interface AlertCardProps {
  status: AlertStatus;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

const statusConfig = {
  warning: {
    icon: AlertTriangle,
    borderColor: "border-l-accent-amber",
    bgColor: "bg-status-warning-bg",
    iconColor: "text-accent-amber",
  },
  error: {
    icon: XCircle,
    borderColor: "border-l-accent-red",
    bgColor: "bg-status-error-bg",
    iconColor: "text-accent-red",
  },
  success: {
    icon: CheckCircle,
    borderColor: "border-l-accent-green",
    bgColor: "bg-status-success-bg",
    iconColor: "text-accent-green",
  },
  info: {
    icon: Info,
    borderColor: "border-l-accent-blue",
    bgColor: "bg-status-info-bg",
    iconColor: "text-accent-blue",
  },
};

export function AlertCard({ 
  status, 
  title, 
  description, 
  action,
  onDismiss 
}: AlertCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`
        p-4 rounded-lg border-l-[3px] ${config.borderColor} ${config.bgColor}
        relative overflow-hidden
      `}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text-primary text-sm">{title}</h4>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
          
          {/* Action link */}
          {action && (
            <motion.button
              onClick={action.onClick}
              className="flex items-center gap-1 text-sm text-accent-blue mt-2 hover:underline"
              whileHover={{ x: 2 }}
            >
              {action.label}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        
        {/* Dismiss button */}
        {onDismiss && (
          <motion.button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-black/5"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XCircle className="w-4 h-4 text-text-tertiary" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
```

---

### 3.4 Buttons

#### Primary → Gradient Button

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/gradient-button
bunx --bun shadcn@latest add @kokonutui/slide-text-button
bunx --bun shadcn@latest add @kokonutui/hold-button
bunx --bun shadcn@latest add @kokonutui/command-button
bunx --bun shadcn@latest add @kokonutui/v0-button
```

**Button Strategy:**

| Action Type | Kokonut Component | Why |
|-------------|-------------------|-----|
| Primary CTA | Gradient Button | Animated border draws attention |
| Secondary | V0 Button | Subtle, professional press animation |
| Dangerous/Confirm | Hold Button | Requires intentional press-hold |
| With Shortcut | Command Button | Shows CMD+K style hint |
| Text Reveal | Slide Text Button | Hover reveals secondary text |

```tsx
// components/podbrain/buttons.tsx
"use client";

import { GradientButton } from "@/components/kokonutui/gradient-button";
import { SlideTextButton } from "@/components/kokonutui/slide-text-button";
import { HoldButton } from "@/components/kokonutui/hold-button";
import { CommandButton } from "@/components/kokonutui/command-button";
import { V0Button } from "@/components/kokonutui/v0-button";

// Primary action button with animated gradient border
export function PrimaryButton({ 
  children, 
  onClick,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <GradientButton onClick={onClick} {...props}>
      {children}
    </GradientButton>
  );
}

// Secondary button with subtle press animation
export function SecondaryButton({ 
  children, 
  onClick,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <V0Button onClick={onClick} {...props}>
      {children}
    </V0Button>
  );
}

// Slide text button for publish actions
// Hover reveals "to Notion" text
export function PublishButton({ onClick }: { onClick: () => void }) {
  return (
    <SlideTextButton
      primaryText="Publish"
      secondaryText="to Notion"
      onClick={onClick}
    />
  );
}

// Hold-to-confirm for dangerous actions (delete, reset)
export function DangerButton({ 
  children, 
  onConfirm,
  holdDuration = 1000
}: {
  children: React.ReactNode;
  onConfirm: () => void;
  holdDuration?: number;
}) {
  return (
    <HoldButton
      onComplete={onConfirm}
      holdDuration={holdDuration}
      className="bg-accent-red hover:bg-accent-red/90"
    >
      {children}
    </HoldButton>
  );
}

// Export button with keyboard shortcut hint
export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <CommandButton
      onClick={onClick}
      shortcut="⌘E"
    >
      Export PDF
    </CommandButton>
  );
}
```

#### Button Group
```tsx
export function ButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {children}
    </div>
  );
}

// Usage
<ButtonGroup>
  <ExportButton onClick={handleExport} />
  <PublishButton onClick={handlePublish} />
</ButtonGroup>
```

---

### 3.5 Badges

```tsx
// components/podbrain/badge.tsx
"use client";

import { motion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold",
  {
    variants: {
      variant: {
        default: "bg-bg-subtle border border-border-soft text-text-secondary",
        new: "bg-status-info-bg border border-accent-blue/20 text-accent-blue",
        warning: "bg-status-warning-bg border border-accent-amber/20 text-accent-amber",
        success: "bg-status-success-bg border border-accent-green/20 text-accent-green",
        error: "bg-status-error-bg border border-accent-red/20 text-accent-red",
        ai: "bg-gradient-to-r from-accent-blue/10 to-purple-500/10 border border-accent-blue/20 text-accent-blue",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  animated?: boolean;
}

export function Badge({ children, variant, animated = false }: BadgeProps) {
  if (animated) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={badgeVariants({ variant })}
      >
        {children}
      </motion.span>
    );
  }

  return <span className={badgeVariants({ variant })}>{children}</span>;
}

// Specific badge components
export function EpisodeBadge({ number }: { number: number }) {
  return <Badge>EPISODE #{number}</Badge>;
}

export function AIBadge() {
  return <Badge variant="ai">✨ AI Assisted</Badge>;
}

export function NewBadge() {
  return <Badge variant="new" animated>🆕 NEW</Badge>;
}
```

---

### 3.6 Form Elements

#### Search Bar → Action Search Bar

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/action-search-bar
```

**The "Wow" Factor:** Command palette-style search with keyboard shortcuts and smooth dropdown.

```tsx
// components/podbrain/search.tsx
"use client";

import { ActionSearchBar } from "@/components/kokonutui/action-search-bar";
import { Search, Mic, Filter } from "lucide-react";

interface EpisodeSearchProps {
  onSearch: (query: string) => void;
  onFilter?: () => void;
}

export function EpisodeSearch({ onSearch, onFilter }: EpisodeSearchProps) {
  return (
    <ActionSearchBar
      placeholder="Search episodes... (⌘K)"
      onSearch={onSearch}
      actions={[
        {
          icon: <Filter className="w-4 h-4" />,
          label: "Filter",
          onClick: onFilter,
        },
      ]}
      shortcuts={[
        { key: "⌘K", action: "Open search" },
        { key: "↵", action: "Search" },
        { key: "Esc", action: "Close" },
      ]}
    />
  );
}
```

#### File Upload → Kokonut File Upload

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/file-upload
```

```tsx
// components/podbrain/audio-upload.tsx
"use client";

import { FileUpload } from "@/components/kokonutui/file-upload";

interface AudioUploadProps {
  onUpload: (file: File) => void;
  onError: (error: string) => void;
}

export function AudioUpload({ onUpload, onError }: AudioUploadProps) {
  const handleFileSelect = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    
    // Validate audio file
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'video/mp4'];
    if (!validTypes.includes(file.type)) {
      onError('Please upload MP3, WAV, M4A, or MP4 files');
      return;
    }
    
    // Max 4 hours (rough estimate based on file size)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      onError('File too large. Maximum 4 hours of audio.');
      return;
    }
    
    onUpload(file);
  };

  return (
    <FileUpload
      onFilesSelected={handleFileSelect}
      accept={{
        'audio/*': ['.mp3', '.wav', '.m4a'],
        'video/mp4': ['.mp4'],
      }}
      maxSize={500 * 1024 * 1024}
      description="MP3, WAV, M4A, MP4 • Max 4 hours"
      icon="audio"
    />
  );
}
```

---

### 3.7 Progress & Metrics

#### Freshness Meter (Custom with Motion)

```tsx
// components/podbrain/freshness-meter.tsx
"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";

interface FreshnessMeterProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
}

export function FreshnessMeter({ value, size = "md" }: FreshnessMeterProps) {
  const progress = useMotionValue(0);
  
  useEffect(() => {
    const controls = animate(progress, value, {
      duration: 0.8,
      ease: [0.19, 1, 0.22, 1],
    });
    return controls.stop;
  }, [value, progress]);

  const width = useTransform(progress, [0, 100], ["0%", "100%"]);
  
  const getFreshnessColor = () => {
    if (value >= 80) return "bg-accent-green";
    if (value >= 50) return "bg-accent-amber";
    return "bg-accent-red";
  };

  const getFreshnessLabel = () => {
    if (value >= 80) return "Fresh";
    if (value >= 50) return "Moderate";
    return "Stale";
  };

  const sizeClasses = {
    sm: "w-16 h-1",
    md: "w-24 h-1.5",
    lg: "w-32 h-2",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary">
        FRESHNESS:
      </span>
      <div className={`${sizeClasses[size]} bg-bg-subtle rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${getFreshnessColor()}`}
          style={{ width }}
        />
      </div>
      <span className="font-mono text-xs font-semibold">
        {Math.round(value)}%
      </span>
    </div>
  );
}
```

---

### 3.8 AI & Loading States

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/ai-text-loading
bunx --bun shadcn@latest add @kokonutui/ai-loading
bunx --bun shadcn@latest add @kokonutui/shimmer-text
bunx --bun shadcn@latest add @kokonutui/typewriter
```

**The "Wow" Factor:** AI processing states feel alive with shimmer effects and streaming text.

```tsx
// components/podbrain/processing-states.tsx
"use client";

import { AITextLoading } from "@/components/kokonutui/ai-text-loading";
import { AILoading } from "@/components/kokonutui/ai-loading";
import { ShimmerText } from "@/components/kokonutui/shimmer-text";
import { Typewriter } from "@/components/kokonutui/typewriter";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";

interface ProcessingStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
}

interface ProcessingStateProps {
  episodeTitle: string;
  progress: number;
  steps: ProcessingStep[];
  estimatedTime?: string;
}

export function ProcessingState({ 
  episodeTitle, 
  progress, 
  steps,
  estimatedTime 
}: ProcessingStateProps) {
  return (
    <div className="max-w-md mx-auto text-center space-y-8">
      {/* AI Loading orb */}
      <AILoading />
      
      {/* Episode title with shimmer */}
      <div>
        <ShimmerText className="text-lg font-semibold">
          Processing: "{episodeTitle}"
        </ShimmerText>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-text-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          />
        </div>
        <span className="text-sm text-text-secondary">{progress}%</span>
      </div>
      
      {/* Processing steps */}
      <div className="space-y-3 text-left">
        <AnimatePresence mode="popLayout">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              {/* Status indicator */}
              <div className="w-5 h-5 flex items-center justify-center">
                {step.status === "complete" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 rounded-full bg-accent-green flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
                {step.status === "active" && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-3 h-3 rounded-full bg-accent-blue"
                  />
                )}
                {step.status === "pending" && (
                  <div className="w-3 h-3 rounded-full border-2 border-border-soft" />
                )}
              </div>
              
              {/* Step label */}
              <span className={`text-sm ${
                step.status === "complete" 
                  ? "text-text-primary" 
                  : step.status === "active"
                  ? "text-text-primary"
                  : "text-text-tertiary"
              }`}>
                {step.status === "active" ? (
                  <AITextLoading>{step.label}</AITextLoading>
                ) : (
                  step.label
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Estimated time */}
      {estimatedTime && (
        <p className="text-sm text-text-secondary">
          Estimated time remaining: {estimatedTime}
        </p>
      )}
      
      <p className="text-sm text-text-tertiary">
        💡 We'll email you when ready, or wait here
      </p>
    </div>
  );
}

// Typewriter for AI-generated content reveal
export function AIContentReveal({ content }: { content: string }) {
  return (
    <Typewriter
      text={content}
      speed={20}
      className="text-text-primary leading-relaxed"
    />
  );
}
```

---

### 3.9 Text Effects

```tsx
// components/podbrain/text-effects.tsx
"use client";

import { DynamicText } from "@/components/kokonutui/dynamic-text";
import { SwooshText } from "@/components/kokonutui/swoosh-text";
import { ScrollText } from "@/components/kokonutui/scroll-text";

// Animated counter for metrics that change
export function AnimatedMetric({ 
  value, 
  suffix = "" 
}: { 
  value: number; 
  suffix?: string;
}) {
  return (
    <DynamicText>
      {value}{suffix}
    </DynamicText>
  );
}

// Page title with entrance animation
export function PageTitle({ children }: { children: string }) {
  return (
    <SwooshText className="text-[2rem] font-semibold tracking-tight">
      {children}
    </SwooshText>
  );
}

// Long-form content that reveals on scroll
export function ScrollRevealContent({ children }: { children: React.ReactNode }) {
  return (
    <ScrollText>
      {children}
    </ScrollText>
  );
}
```

---

### 3.10 Backgrounds & Atmosphere

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/background-paths
bunx --bun shadcn@latest add @kokonutui/beams-background
```

```tsx
// components/podbrain/backgrounds.tsx
"use client";

import { BackgroundPaths } from "@/components/kokonutui/background-paths";
import { BeamsBackground } from "@/components/kokonutui/beams-background";

// Upload page hero with animated SVG paths
export function UploadHero({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundPaths title="">
      <div className="relative z-10">
        {children}
      </div>
    </BackgroundPaths>
  );
}

// Subtle atmospheric beams for dashboard sections
export function DashboardBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <BeamsBackground 
        className="absolute inset-0 opacity-30" 
        beamCount={3}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
```

---

### 3.11 Lists & Collections

#### Episode List → Card Stack + Animated Lists

**Install:**
```bash
bunx --bun shadcn@latest add @kokonutui/card-stack
bunx --bun shadcn@latest add @kokonutui-pro/animated-list
```

```tsx
// components/podbrain/episode-list.tsx
"use client";

import { motion, AnimatePresence } from "motion/react";
import { CardStack } from "@/components/kokonutui/card-stack";
import { MouseEffectCard } from "@/components/kokonutui/mouse-effect-card";
import { Badge } from "./badge";
import { Check, AlertTriangle, Loader2 } from "lucide-react";

interface Episode {
  id: string;
  number: number;
  title: string;
  date: string;
  healthScore?: number;
  status: "complete" | "alerts" | "processing";
  alertCount?: number;
}

interface EpisodeListProps {
  episodes: Episode[];
  onSelect: (id: string) => void;
}

export function EpisodeList({ episodes, onSelect }: EpisodeListProps) {
  return (
    <motion.div 
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.05 }
        }
      }}
    >
      <AnimatePresence mode="popLayout">
        {episodes.map((episode) => (
          <EpisodeRow 
            key={episode.id} 
            episode={episode} 
            onClick={() => onSelect(episode.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

function EpisodeRow({ 
  episode, 
  onClick 
}: { 
  episode: Episode; 
  onClick: () => void;
}) {
  const getStatusIcon = () => {
    switch (episode.status) {
      case "complete":
        return <Check className="w-4 h-4 text-accent-green" />;
      case "alerts":
        return <AlertTriangle className="w-4 h-4 text-accent-amber" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-text-tertiary animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (episode.status) {
      case "complete":
        return "Complete";
      case "alerts":
        return `${episode.alertCount} alerts`;
      case "processing":
        return "Processing";
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      exit={{ opacity: 0, x: -20 }}
      layout
    >
      <MouseEffectCard>
        <button
          onClick={onClick}
          className="w-full p-4 rounded-lg border border-border-soft hover:border-accent-blue/30 transition-colors text-left grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center"
        >
          {/* Episode info */}
          <div>
            <span className="font-medium text-text-primary">
              #{episode.number} {episode.title}
            </span>
          </div>
          
          {/* Date */}
          <span className="text-sm text-text-secondary">
            {episode.date}
          </span>
          
          {/* Health score */}
          <span className={`font-mono text-sm ${
            episode.healthScore 
              ? episode.healthScore >= 80 
                ? "text-accent-green" 
                : episode.healthScore >= 60 
                ? "text-accent-amber"
                : "text-accent-red"
              : "text-text-tertiary"
          }`}>
            {episode.healthScore ? `${episode.healthScore}/100` : "—"}
          </span>
          
          {/* Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm text-text-secondary">
              {getStatusText()}
            </span>
          </div>
        </button>
      </MouseEffectCard>
    </motion.div>
  );
}
```

---

## Part 4: Page Templates

### 4.1 Episode Detail Page

```tsx
// app/episodes/[id]/page.tsx
"use client";

import { ContentCard } from "@/components/podbrain/content-card";
import { CanvasGrid } from "@/components/podbrain/layout";
import { InsightGrid } from "@/components/podbrain/layout";
import { HealthGauge } from "@/components/podbrain/health-gauge";
import { GuestCard } from "@/components/podbrain/guest-card";
import { Badge, EpisodeBadge, AIBadge } from "@/components/podbrain/badge";
import { ButtonGroup, ExportButton, PublishButton } from "@/components/podbrain/buttons";
import { SmoothTab } from "@/components/kokonutui/smooth-tab";

export default function EpisodeDetailPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <EpisodeBadge number={142} />
            <span className="font-mono text-xs text-text-secondary">
              Processed 2m ago
            </span>
          </div>
          <h1 className="text-[2rem] font-semibold tracking-tight">
            The Future of Podcast Intelligence
          </h1>
        </div>
        
        <ButtonGroup>
          <ExportButton onClick={() => {}} />
          <PublishButton onClick={() => {}} />
        </ButtonGroup>
      </header>

      {/* Metrics Row */}
      <InsightGrid>
        <HealthGauge value={84} label="RETENTION SCORE" trend={12} status="good" />
        <HealthGauge value={7} label="KEY TAKEAWAYS" status="neutral" />
        <HealthGauge value={92} label="SENTIMENT" trend={5} status="good" />
      </InsightGrid>

      {/* Tab Navigation */}
      <SmoothTab
        tabs={[
          { id: "notes", label: "Show Notes" },
          { id: "intelligence", label: "Intelligence" },
          { id: "social", label: "Social Assets" },
        ]}
        defaultTab="notes"
      />

      {/* Two-Column Content */}
      <CanvasGrid
        left={
          <ContentCard
            header={
              <>
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Generated Show Notes
                </span>
                <AIBadge />
              </>
            }
          >
            {/* Show notes content */}
            <div className="prose prose-sm max-w-none">
              <p>Episode summary goes here...</p>
            </div>
          </ContentCard>
        }
        right={
          <div className="space-y-6">
            <ContentCard
              header={
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Guest Intelligence
                </span>
              }
            >
              <GuestCard
                name="Dr. Aris Thorne"
                title="Spatial Design Lead"
                company="Ocular"
                appearances={8}
                socials={{
                  linkedin: "#",
                  twitter: "#",
                }}
              />
            </ContentCard>
            
            <ContentCard
              header={
                <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Content Health
                </span>
              }
            >
              {/* Pacing, clarity metrics */}
            </ContentCard>
          </div>
        }
      />
    </div>
  );
}
```

### 4.2 Upload Flow

```tsx
// app/upload/page.tsx
"use client";

import { useState } from "react";
import { UploadHero } from "@/components/podbrain/backgrounds";
import { AudioUpload } from "@/components/podbrain/audio-upload";
import { ProcessingState } from "@/components/podbrain/processing-states";
import { ContentCard } from "@/components/podbrain/content-card";
import { PrimaryButton, SecondaryButton } from "@/components/podbrain/buttons";
import { AnimatePresence, motion } from "motion/react";

type Step = "upload" | "context" | "processing";

export default function UploadPage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl"
          >
            <UploadHero>
              <ContentCard>
                <h1 className="text-2xl font-semibold text-center mb-8">
                  New Transformation
                </h1>
                
                <AudioUpload
                  onUpload={(f) => {
                    setFile(f);
                    setStep("context");
                  }}
                  onError={console.error}
                />
                
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px bg-border-soft" />
                  <span className="text-text-secondary text-sm">OR</span>
                  <div className="flex-1 h-px bg-border-soft" />
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">🔗 Import from RSS</label>
                  <input
                    type="url"
                    placeholder="https://"
                    className="w-full px-3 py-2 rounded-md border border-border-soft bg-bg-elevated focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/10 outline-none"
                  />
                </div>
              </ContentCard>
            </UploadHero>
          </motion.div>
        )}

        {step === "context" && (
          <motion.div
            key="context"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl"
          >
            <ContentCard>
              <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary mb-6">
                Help us nail the details
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Episode Title</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-border-soft bg-bg-elevated focus:border-accent-blue outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Guest Name(s)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-border-soft bg-bg-elevated focus:border-accent-blue outline-none"
                  />
                  <p className="text-xs text-text-tertiary">
                    💡 We'll pre-load their vocabulary and past appearances
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Keywords (optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 rounded-md border border-border-soft bg-bg-elevated focus:border-accent-blue outline-none"
                  />
                  <p className="text-xs text-text-tertiary">
                    💡 Help us optimize for SEO
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <SecondaryButton onClick={() => setStep("processing")}>
                  Skip for now
                </SecondaryButton>
                <PrimaryButton onClick={() => setStep("processing")}>
                  Start Processing →
                </PrimaryButton>
              </div>
            </ContentCard>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <ProcessingState
              episodeTitle="Episode 82 - Dr. Jane Smith"
              progress={60}
              steps={[
                { id: "upload", label: "Audio uploaded", status: "complete" },
                { id: "transcribe", label: "Transcription complete", status: "complete" },
                { id: "analyze", label: "Running intelligence analysis...", status: "active" },
                { id: "notes", label: "Generating show notes", status: "pending" },
                { id: "social", label: "Creating social posts", status: "pending" },
              ]}
              estimatedTime="2 minutes"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 4.3 Content Health Dashboard

```tsx
// app/dashboard/page.tsx
"use client";

import { BentoGrid } from "@/components/kokonutui/bento-grid";
import { MouseEffectCard } from "@/components/kokonutui/mouse-effect-card";
import { HealthGauge } from "@/components/podbrain/health-gauge";
import { AlertCard } from "@/components/podbrain/alert-card";
import { ContentCard } from "@/components/podbrain/content-card";
import { motion } from "motion/react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-[2rem] font-semibold tracking-tight">
          Content Health Dashboard
        </h1>
        <p className="text-text-secondary mt-1">
          The Fitness Podcast • 147 episodes analyzed • Updated 2 hours ago
        </p>
      </header>

      {/* Health Scores - 5 column grid with animated rings */}
      <motion.div 
        className="grid grid-cols-5 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } }
        }}
      >
        <HealthGauge value={78} label="TOPIC" trend={3} status="good" />
        <HealthGauge value={65} label="BALANCE" status="warning" />
        <HealthGauge value={82} label="CONSISTENCY" trend={7} status="good" />
        <HealthGauge value={71} label="DEPTH" status="neutral" />
        <HealthGauge value={43} label="PROMISES" status="error" />
      </motion.div>

      {/* Two-column alerts and opportunities */}
      <div className="grid grid-cols-2 gap-6">
        <ContentCard
          header={
            <span className="flex items-center gap-2">
              🚨 <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary">
                Attention Needed
              </span>
            </span>
          }
        >
          <div className="space-y-3">
            <AlertCard
              status="warning"
              title="3 balance alerts"
              description="Topics with one-sided coverage"
              action={{ label: "View All", onClick: () => {} }}
            />
            <AlertCard
              status="error"
              title="4 promises overdue"
              description="Commitments made to audience"
              action={{ label: "View All", onClick: () => {} }}
            />
            <AlertCard
              status="warning"
              title="2 stories told 5+ times"
              description="Consider fresh anecdotes"
              action={{ label: "View All", onClick: () => {} }}
            />
          </div>
        </ContentCard>

        <ContentCard
          header={
            <span className="flex items-center gap-2">
              💡 <span className="font-mono text-xs font-medium uppercase tracking-wider text-text-secondary">
                Opportunities
              </span>
            </span>
          }
        >
          <div className="space-y-3">
            <AlertCard
              status="info"
              title="3 trending topics match you"
              description="Hot topics in your niche"
              action={{ label: "Explore", onClick: () => {} }}
            />
            <AlertCard
              status="success"
              title="12 fresh experts identified"
              description="New voices in your field"
              action={{ label: "Browse", onClick: () => {} }}
            />
            <AlertCard
              status="info"
              title="2 competitor gaps"
              description="Topics they haven't covered"
              action={{ label: "View", onClick: () => {} }}
            />
          </div>
        </ContentCard>
      </div>
    </div>
  );
}
```

---

## Part 5: Complete Component Catalog

All components verified against kokonutui.com and kokonutui.pro as of 2026-02-18.

### Free Components (kokonutui.com)

Install syntax: `bunx --bun shadcn@latest add @kokonutui/{name}`

**Layout & Navigation:**
| Component | Package Name | Purpose |
|-----------|-------------|---------|
| Morphic Navbar | `morphic-navbar` | Dynamic navbar with morphing animation |
| Smooth Tab | `smooth-tab` | Animated tab switcher with sliding indicator |
| Smooth Drawer | `smooth-drawer` | Slide-in drawer for mobile nav |
| Profile Dropdown | `profile-dropdown` | Menu dropdown with action buttons |
| Toolbar | `toolbar` | Multi-action toolbar (Figma-inspired) |

**Cards & Surfaces:**
| Component | Package Name | Purpose |
|-----------|-------------|---------|
| Liquid Glass Card | `liquid-glass-card` | Apple-style glassmorphism card |
| Mouse Effect Card | `mouse-effect-card` | Cursor-tracking dot pattern card |
| Apple Activity Card | `apple-activity-card` | Animated circular progress rings |
| Card Stack | `card-stack` | Expandable stacked card reveal |
| Bento Grid | `bento-grid` | Grid of cards with animations |
| Card Flip | `card-flip` | Animated flip card |
| X Card | `x-card` | Gradient-on-hover card |

**Buttons:**
| Component | Package Name | Purpose |
|-----------|-------------|---------|
| Gradient Button | `gradient-button` | Animated gradient border button |
| Slide Text Button | `slide-text-button` | Vertical slide text transition |
| Hold Button | `hold-button` | Press-hold to confirm (configurable duration) |
| Command Button | `command-button` | Shows keyboard shortcut hint |
| V0 Button | `v0-button` | Subtle press animation button |
| Particle Button | `particle-button` | Particle animation on click |
| Magnet Button | `magnet-button` | Cursor-attracting particles |
| Social Button | `social-button` | Animated social media show-up |
| Switch Button | `switch-button` | Animated theme switcher |

**Forms & Inputs:**
| Component | Package Name | Purpose |
|-----------|-------------|---------|
| Action Search Bar | `action-search-bar` | Command palette with shortcuts |
| File Upload | `file-upload` | Drag-drop with upload animation |

**AI & Loading:**
| Component | Package Name | Purpose |
|-----------|-------------|---------|
| AI State Loading | `ai-loading` | Pulsing orb "processing" animation |
| AI Text Loading | `ai-text-loading` | "Thinking" shimmer effect |
| AI Input Selector | `ai-input-selector` | Chat AI input selector |
| AI Input Search | `ai-input-search` | AI input with search mode |
| AI Voice | `ai-voice` | Voice mode interface |
| Shimmer Text | `shimmer-text` | CSS gradient sweep skeleton |
| Loader | `loader` | Animated loading indicator |

**Text Effects:**
| Component | Package Name | Purpose |
|-----------|-------------|---------|
| Typing Text | `typing-text` | Typewriter with multiple options |
| Dynamic Text | `dynamic-text` | Number counting/cycling animation |
| Swoosh Text | `swoosh-text` | Flying-in entrance animation |
| Scroll Text | `scroll-text` | Reveal on scroll trigger |
| Glitch Text | `glitch-text` | Glitch distortion effect |
| Matrix Text | `matrix-text` | Binary-style animated text |
| Sliced Text | `sliced-text` | Stylized sliced text |

**Backgrounds:**
| Component | Package Name | Purpose |
|-----------|-------------|---------|
| Background Paths | `background-paths` | Animated SVG path flow |
| Beams Background | `beams-background` | Customizable light beams |
| Shapes Hero | `shapes-hero` | Falling shapes animation |

**Other:**
| Component | Package Name | Purpose |
|-----------|-------------|---------|
| Currency Transfer | `currency-transfer` | Multi-step transaction animation |
| Team Selector | `team-selector` | Group selector with distinct style |

### Pro Components (kokonutui.pro)

Install syntax: `bunx --bun shadcn@latest add @kokonutui-pro/{name}`

Requires `KOKO_PRO_TOKEN` in environment. See `kokonut-ui-pro-setup-guide.md`.

**Cards (card-01 through card-09):**
| Component | Purpose |
|-----------|---------|
| `card-01` | User profile dropdown (avatar, email, settings, logout) |
| `card-02` | Contact info card (photo, name, title, email, phone, bio) |
| `card-03` | AI image generator card (model selection, prompts) |
| `card-04` | Course/education card (instructor, pricing, enrollment) |
| `card-05` | Checkout/purchase card (product, quantity, payment) |
| `card-06` | Job listing card (company, salary, requirements, apply) |
| `card-07` | Poll/voting card (options, vote counts, discussion) |
| `card-08` | Product announcement card (status badge, tags) |
| `card-09` | Profile card (photo, name, followers, follow button) |

**Modals (modal-01 through modal-06):**
| Component | Purpose |
|-----------|---------|
| `modal-01` | Premium features modal |
| `modal-02` | Newsletter subscription modal |
| `modal-03` | User settings modal |
| `modal-04` | Pricing modal |
| `modal-05` | Multi-step wizard modal |
| `modal-06` | Form modal |

**Buttons:** `button-01` through `button-10` (10 variants with interactive states)

**Inputs (input-02 through input-09):**
| Component | Purpose |
|-----------|---------|
| `input-02` | Basic input |
| `input-03` | Input with label |
| `input-04` | Search input with icon |
| `input-05` | Input with keyboard shortcut indicator (KBD) |
| `input-07` | Password input |
| `input-08` | TouchID/biometric input |
| `input-09` | Video/audio/camera mode input |

**Forms (form-01 through form-07):**
| Component | Purpose |
|-----------|---------|
| `form-01` | Contact support form (category, priority, message) |
| `form-02` | Schedule appointment (date/time picker, service) |
| `form-03` | Create project / Request feature form |
| `form-04` | Customize product (multi-step with pricing) |
| `form-05` | Flight/travel search form |
| `form-06` | Edit profile form |

**Animated List:** `animated-list` — List items with stagger/enter animations

**Blocks & Sections:**
| Category | Variants | Description |
|----------|----------|-------------|
| Heroes | 8 variants | AI Hero, Developer Hero, Light Effects, Studio, Startup, etc. |
| Pricing | 6 variants | Cards, toggles, feature comparisons, animated |
| Features | 9 variants | Bento grid, cards+text, image+list, dropdown, articles |
| Login | 5 variants | Form+image, providers, magic link, double card |
| FAQs | 5 variants | Various accordion/list styles |
| Footers | 4 variants | Newsletter, social links, navigation |
| Testimonials | 3 variants | Various quote/avatar layouts |

**Page Templates:** `page-01` through `page-05` (complete page designs)

**Other Pro Components:**
| Component | Purpose |
|-----------|---------|
| `card-recording` | Input recording/saving card |
| `team-invitation` | Team invite with validation |
| `calendar-schedule` | Animated calendar scheduling |

**Full Templates (complete sites):**
Agenta, Lume, Sonae, AI, Futur, Postly, Startup

---

## Part 6: Build Plan

The UI layer was stripped clean on 2026-02-18. All business logic, API routes, database schema, and background jobs remain intact. This is a fresh build, not a migration.

### Current State

- **Preserved:** 27 API routes, Supabase schema, Trigger.dev jobs, lib/ utilities, environment config
- **Stripped:** All components, hooks, pages, layout, globals.css (only `@import "tailwindcss"` remains)
- **Stubs in place:** Minimal `layout.tsx` and `page.tsx` for compilation
- **Branch:** `ui-rebuild`

### Phase 1: Foundation

1. Restore `globals.css` with Kinetic Alabaster design tokens (Part 2 of this doc)
2. Install Motion, configure spring presets in `lib/motion.ts`
3. Restore `lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
4. Install core Kokonut UI free components (see Part 5)
5. Install needed Kokonut UI Pro components (see Part 5)
6. Build `AppShell` layout with `MorphicNavbar` sidebar + `SmoothDrawer` for mobile
7. Wire up Inter + JetBrains Mono fonts in layout

### Phase 2: Shared Components

1. Build PodBrain composition components in `components/podbrain/`:
   - `health-gauge.tsx` — Apple Activity Card-style animated rings
   - `freshness-meter.tsx` — Color-coded animated fill bar
   - `alert-card.tsx` — Animated entrance/exit notification cards
   - `episode-card.tsx` — Episode list item with Mouse Effect Card
   - `guest-card.tsx` — Guest info using Pro Card-02
   - `badge.tsx` — Status/category badges with variants
   - `buttons.tsx` — Composed button variants (Gradient, Hold, Command, V0)
   - `search.tsx` — ActionSearchBar wrapper with ⌘K
   - `processing-states.tsx` — AI Loading, AI Text Loading, Shimmer compositions
   - `audio-upload.tsx` — File Upload with Background Paths hero
   - `backgrounds.tsx` — Page background compositions
   - `text-effects.tsx` — Swoosh, Dynamic, Scroll, Typing Text wrappers

### Phase 3: Pages

1. **Dashboard** (`app/page.tsx`) — Bento Grid layout, health score rings, alert cards, Mouse Effect sections
2. **Episodes List** (`app/episodes/`) — ActionSearchBar, staggered episode card list, Card Stack
3. **Episode Detail** (`app/episodes/[id]/`) — Two-column with Liquid Glass show notes, tabbed sections (SmoothTab), Guest intelligence panel, export/publish buttons
4. **Upload** (`app/upload/`) — Background Paths hero, File Upload zone, AI processing states, step transitions
5. **Shows** (`app/shows/`) — Show management CRUD
6. **Expert Discovery** (`app/experts/`) — Search, Mouse Effect expert cards, Freshness Meter
7. **Settings** (`app/settings/`) — Subscription management, vocabulary, preferences
8. **Trending** (`app/trending/`) — Topic cards with metrics

### Phase 4: Polish & Optimization

1. Staggered list animations using Motion `variants` with `staggerChildren`
2. Mobile responsive pass — Smooth Drawer nav, touch targets, breakpoints
3. Reduced motion support via `useReducedMotion` (see Part 7)
4. Accessibility audit — ARIA, keyboard nav, focus indicators, contrast ratios
5. Loading states for every async boundary — Shimmer skeletons, AI loading indicators
6. Error boundaries with graceful fallback UI
7. Empty states with inviting illustrations + call-to-action

---

## Part 7: Accessibility Maintained

All Kokonut UI components include:
- ARIA attributes for screen readers
- Keyboard navigation support
- Focus-visible indicators
- Reduced motion support (`prefers-reduced-motion`)

Our custom components extend these with:
- Color contrast minimum 4.5:1
- Icons paired with text labels
- Progress values include numeric display
- Motion respects user preferences

```tsx
// Reduced motion support
import { useReducedMotion } from "motion/react";

export function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring" }}
    >
      Content
    </motion.div>
  );
}
```

---

## Part 8: Logo (Unchanged)

The PodBrain logo remains the audio waveform in rounded square:

```tsx
export function PodBrainLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="white"/>
      <path 
        d="M16 8V24M11 13V19M21 13V19M6 15V17M26 15V17" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" stroke="#EDEDEC"/>
    </svg>
  );
}
```

---

*End of Kinetic Alabaster Design System*
