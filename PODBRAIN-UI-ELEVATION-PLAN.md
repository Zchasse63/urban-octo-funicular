# PodBrain UI/UX Elevation Plan

**Version:** 1.0
**Date:** February 3, 2026
**Status:** Ready for Implementation
**Estimated Scope:** 15-20 component files + 1 CSS file

---

## Executive Summary

This document provides a comprehensive, step-by-step implementation plan to elevate PodBrain's UI from its current "flat PDF-like" appearance to a professional, polished SaaS tool. The plan focuses on adding visual depth, micro-interactions, improved typography hierarchy, and overall polish while maintaining the existing "Alabaster Topography" design language.

**Key Objectives:**
1. Add visual depth through enhanced shadows and layering
2. Implement subtle micro-interactions and animations
3. Improve typography hierarchy and spacing consistency
4. Polish individual components (cards, badges, buttons, navigation)
5. Create a more cohesive, professional feel across all pages

---

## Table of Contents

1. [Design Tokens Enhancement](#1-design-tokens-enhancement)
2. [Sidebar Redesign](#2-sidebar-redesign)
3. [Card System Upgrade](#3-card-system-upgrade)
4. [Button System Enhancement](#4-button-system-enhancement)
5. [Badge & Status Indicator System](#5-badge--status-indicator-system)
6. [Typography & Spacing System](#6-typography--spacing-system)
7. [Guest Page Improvements](#7-guest-page-improvements)
8. [Episode List Improvements](#8-episode-list-improvements)
9. [Episode Detail Page Improvements](#9-episode-detail-page-improvements)
10. [Upload Wizard Polish](#10-upload-wizard-polish)
11. [Global Animation System](#11-global-animation-system)
12. [Empty States & Loading](#12-empty-states--loading)

---

## 1. Design Tokens Enhancement

**File:** `app/src/app/globals.css`

### 1.1 Add New Shadow System

Add these new CSS custom properties after line 39 (after existing shadow definitions):

```css
/* Enhanced Shadow System - 4 Elevation Levels */
--shadow-elevation-1:
  0 1px 2px rgba(0, 0, 0, 0.04),
  0 1px 3px rgba(0, 0, 0, 0.02);

--shadow-elevation-2:
  0 2px 4px rgba(0, 0, 0, 0.04),
  0 4px 8px rgba(0, 0, 0, 0.04),
  0 8px 16px rgba(0, 0, 0, 0.02);

--shadow-elevation-3:
  0 4px 8px rgba(0, 0, 0, 0.04),
  0 8px 16px rgba(0, 0, 0, 0.06),
  0 16px 32px rgba(0, 0, 0, 0.04);

--shadow-elevation-4:
  0 8px 16px rgba(0, 0, 0, 0.06),
  0 16px 32px rgba(0, 0, 0, 0.08),
  0 32px 64px rgba(0, 0, 0, 0.04);

/* Colored Accent Shadows */
--shadow-accent-blue: 0 4px 14px rgba(0, 122, 255, 0.15);
--shadow-accent-green: 0 4px 14px rgba(52, 199, 89, 0.15);
--shadow-accent-amber: 0 4px 14px rgba(245, 158, 11, 0.15);
--shadow-accent-red: 0 4px 14px rgba(239, 68, 68, 0.15);

/* Inner Highlight (for glass-like depth) */
--shadow-inner-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.06);

/* Focus Ring with Offset */
--shadow-focus-ring:
  0 0 0 2px var(--bg-base),
  0 0 0 4px var(--accent-blue);
```

### 1.2 Add New Color Tokens

Add after line 26 (after existing accent colors):

```css
/* Extended Palette for Depth */
--bg-surface: #FAFAFA;
--bg-overlay: rgba(255, 255, 255, 0.95);

/* Gradient Tokens */
--gradient-subtle: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%);
--gradient-card-shine: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%);
--gradient-accent: linear-gradient(135deg, var(--accent-blue) 0%, #5856D6 100%);

/* Interactive State Colors */
--hover-overlay: rgba(0, 0, 0, 0.02);
--active-overlay: rgba(0, 0, 0, 0.04);
--selected-bg: rgba(0, 122, 255, 0.06);
--selected-border: rgba(0, 122, 255, 0.2);
```

### 1.3 Add Animation Timing Tokens

Add after line 64 (after existing animation tokens):

```css
/* Spring-like Easing */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* Duration Scale */
--duration-instant: 0.1s;
--duration-quick: 0.15s;
--duration-moderate: 0.25s;
--duration-slow: 0.35s;
--duration-deliberate: 0.5s;

/* Stagger Delays (for list animations) */
--stagger-1: 0.03s;
--stagger-2: 0.06s;
--stagger-3: 0.09s;
```

### 1.4 Update Body Background

Replace the body background (lines 101-108) with:

```css
body {
  font-family: var(--font-sans);
  color: var(--text-primary);
  background-color: var(--bg-base);
  /* Refined dot pattern - smaller, more subtle */
  background-image:
    radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.03) 1px, transparent 0);
  background-size: 24px 24px;
  line-height: 1.5;
  /* Smooth text rendering */
  text-rendering: optimizeLegibility;
}
```

---

## 2. Sidebar Redesign

**File:** `app/src/components/layout/sidebar.tsx`

### 2.1 Enhanced Logo Section

Replace the `PodBrainLogo` function (lines 54-83) with:

```tsx
function PodBrainLogo() {
  return (
    <div className="flex items-center gap-3 px-3 mb-8">
      {/* Logo container with gradient background and subtle glow */}
      <div
        className="relative w-9 h-9 rounded-[10px] flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Shine overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
          }}
        />
        {/* Audio waveform icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white relative z-10"
        >
          <rect x="2" y="8" width="2" height="4" rx="1" fill="currentColor" />
          <rect x="6" y="5" width="2" height="10" rx="1" fill="currentColor" />
          <rect x="10" y="3" width="2" height="14" rx="1" fill="currentColor" />
          <rect x="14" y="6" width="2" height="8" rx="1" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-[var(--text-primary)] font-semibold text-[15px] tracking-tight leading-tight">
          PodBrain
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)] font-medium tracking-wide uppercase">
          Intelligence
        </span>
      </div>
    </div>
  );
}
```

### 2.2 Enhanced NavItem Component

Replace the `NavItem` function (lines 25-37) with:

```tsx
function NavItem({ href, icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        // Base styles
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
        "transition-all duration-200 ease-out",
        // Default state
        !isActive && "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]",
        // Active state with accent indicator
        isActive && [
          "text-[var(--text-primary)] bg-white",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
        ]
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[var(--accent-blue)]"
          style={{
            boxShadow: "0 0 8px rgba(0, 122, 255, 0.4)",
          }}
        />
      )}

      {/* Icon with color transition */}
      <Icon
        className={cn(
          "w-[18px] h-[18px] transition-colors duration-200",
          isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
        )}
        strokeWidth={1.75}
      />

      {/* Label */}
      <span className="flex-1">{label}</span>

      {/* Hover highlight (subtle) */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200",
          !isActive && "group-hover:opacity-100"
        )}
        style={{ background: "var(--hover-overlay)" }}
      />
    </Link>
  );
}
```

### 2.3 Enhanced NavSection Component

Replace the `NavSection` function (lines 39-52) with:

```tsx
function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2 ml-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          {title}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--border-soft)] to-transparent" />
      </div>
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}
```

### 2.4 Update Desktop Sidebar Styles

In `globals.css`, replace the `.sidebar-desktop` class (lines 144-151) with:

```css
/* Desktop Sidebar - Static within grid */
.sidebar-desktop {
  background: linear-gradient(180deg, var(--bg-base) 0%, var(--bg-surface) 100%);
  border-right: 1px solid var(--border-soft);
  padding: 24px 12px;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

/* Sidebar inner shadow for depth */
.sidebar-desktop::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.02) 50%, transparent 100%);
}
```

---

## 3. Card System Upgrade

**File:** `app/src/components/ui/card.tsx`

### 3.1 Enhanced TopoCard Component

Replace the entire `TopoCard` component (lines 5-22) with:

```tsx
// Topo Card - Primary elevated card with enhanced depth
const TopoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    glow?: boolean;
    accentColor?: 'blue' | 'green' | 'amber' | 'none';
  }
>(({ className, hover = true, glow = false, accentColor = 'none', ...props }, ref) => {
  const glowColors = {
    blue: 'hover:shadow-[0_4px_20px_rgba(0,122,255,0.08)]',
    green: 'hover:shadow-[0_4px_20px_rgba(52,199,89,0.08)]',
    amber: 'hover:shadow-[0_4px_20px_rgba(245,158,11,0.08)]',
    none: '',
  };

  return (
    <div
      ref={ref}
      className={cn(
        // Base structure
        "relative overflow-hidden rounded-xl border border-[var(--border-soft)]",
        "bg-[var(--bg-elevated)] p-6",

        // Multi-layer shadow for depth
        "shadow-[0_1px_2px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.02)]",

        // Hover effects
        hover && [
          "transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]",
          "hover:-translate-y-1",
          "hover:shadow-[0_4px_8px_rgba(0,0,0,0.03),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.04)]",
          "hover:border-[rgba(0,0,0,0.08)]",
        ],

        // Glow effect on hover
        glow && glowColors[accentColor],

        // Top edge highlight for "raised" appearance
        "before:absolute before:inset-x-0 before:top-0 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-white/90 before:to-transparent",

        // Inner top shine
        "after:absolute after:inset-x-4 after:top-0 after:h-24",
        "after:bg-gradient-to-b after:from-white/[0.03] after:to-transparent",
        "after:pointer-events-none",

        className
      )}
      {...props}
    />
  );
});
TopoCard.displayName = "TopoCard";
```

### 3.2 Enhanced MetricCard Component

Replace the `MetricCard` component (lines 63-78) with:

```tsx
// Metric Card - For displaying scores and KPIs
interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  trend?: 'up' | 'down' | 'neutral';
  interactive?: boolean;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, trend = 'neutral', interactive = true, ...props }, ref) => {
    const trendColors = {
      up: 'hover:border-[rgba(52,199,89,0.3)] hover:shadow-[0_4px_12px_rgba(52,199,89,0.08)]',
      down: 'hover:border-[rgba(239,68,68,0.3)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.08)]',
      neutral: 'hover:border-[rgba(0,122,255,0.3)] hover:shadow-[0_4px_12px_rgba(0,122,255,0.08)]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base
          "relative overflow-hidden rounded-xl border border-[var(--border-soft)]",
          "bg-[var(--bg-elevated)] p-5",

          // Subtle shadow
          "shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.02)]",

          // Interactive states
          interactive && [
            "transition-all duration-200 ease-out cursor-pointer",
            "hover:-translate-y-0.5",
            trendColors[trend],
          ],

          // Top highlight
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent",

          className
        )}
        {...props}
      />
    );
  }
);
MetricCard.displayName = "MetricCard";
```

### 3.3 Add New CardFooter Component

Add after the `CardContent` component (after line 60):

```tsx
// Card Footer with border separator
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-5 pt-4 border-t border-[var(--border-soft)]",
      "flex items-center justify-between",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
```

Add `CardFooter` to the exports at the bottom of the file.

---

## 4. Button System Enhancement

**File:** `app/src/components/ui/button.tsx`

### 4.1 Complete Button Variants Replacement

Replace the entire `buttonVariants` const (lines 6-34) with:

```tsx
const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg text-sm font-medium",
    "transition-all duration-200 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Focus ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
  ],
  {
    variants: {
      variant: {
        // Primary - Bold, confident action
        default: [
          "bg-[var(--text-primary)] text-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1)]",
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1)]",
          "hover:-translate-y-px",
          "active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
        ],

        // Secondary - Subtle, supporting action
        secondary: [
          "bg-white text-[var(--text-primary)]",
          "border border-[var(--border-soft)]",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "hover:bg-[var(--bg-subtle)] hover:border-[rgba(0,0,0,0.1)]",
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)]",
          "active:bg-[var(--bg-surface)]",
        ],

        // Ghost - Minimal footprint
        ghost: [
          "text-[var(--text-secondary)]",
          "hover:bg-[var(--hover-overlay)] hover:text-[var(--text-primary)]",
          "active:bg-[var(--active-overlay)]",
        ],

        // Link - Text-like button
        link: [
          "text-[var(--accent-blue)] underline-offset-4",
          "hover:underline hover:text-[#0066DD]",
        ],

        // Destructive - Danger action
        destructive: [
          "bg-[var(--accent-red)] text-white",
          "shadow-[0_1px_2px_rgba(239,68,68,0.2),0_2px_4px_rgba(239,68,68,0.1)]",
          "hover:bg-[#DC2626] hover:shadow-[0_2px_4px_rgba(239,68,68,0.25),0_4px_8px_rgba(239,68,68,0.15)]",
          "hover:-translate-y-px",
        ],

        // Accent - Highlighted action (new)
        accent: [
          "bg-gradient-to-r from-[var(--accent-blue)] to-[#5856D6] text-white",
          "shadow-[0_1px_2px_rgba(0,122,255,0.2),0_4px_12px_rgba(0,122,255,0.15)]",
          "hover:shadow-[0_2px_4px_rgba(0,122,255,0.25),0_8px_20px_rgba(0,122,255,0.2)]",
          "hover:-translate-y-px",
          "active:translate-y-0",
        ],
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        // New: Extra large for hero actions
        xl: "h-14 px-10 text-base font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

---

## 5. Badge & Status Indicator System

**File:** `app/src/components/ui/badge.tsx`

### 5.1 Complete Badge System Replacement

Replace the entire file content with:

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base styles
  [
    "inline-flex items-center gap-1.5",
    "px-2.5 py-1 text-[11px] font-semibold",
    "rounded-md border",
    "transition-colors duration-150",
  ],
  {
    variants: {
      variant: {
        // Default - Neutral gray
        default: [
          "bg-[var(--bg-subtle)] border-[var(--border-soft)]",
          "text-[var(--text-secondary)]",
        ],

        // New/Info - Blue accent
        new: [
          "bg-[rgba(0,122,255,0.08)] border-[rgba(0,122,255,0.15)]",
          "text-[var(--accent-blue)]",
        ],

        // Success - Green
        success: [
          "bg-[rgba(52,199,89,0.08)] border-[rgba(52,199,89,0.15)]",
          "text-[var(--accent-green)]",
        ],

        // Warning - Amber
        warning: [
          "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.15)]",
          "text-[var(--accent-amber)]",
        ],

        // Error - Red
        error: [
          "bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.15)]",
          "text-[var(--accent-red)]",
        ],

        // Outline - Subtle outline only
        outline: [
          "bg-transparent border-[var(--border-soft)]",
          "text-[var(--text-secondary)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a colored dot indicator before the text */
  dot?: boolean;
  /** Pulsing animation for live/active states */
  pulse?: boolean;
}

function Badge({
  className,
  variant,
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  // Dot colors mapped to variants
  const dotColors: Record<string, string> = {
    default: "bg-[var(--text-tertiary)]",
    new: "bg-[var(--accent-blue)]",
    success: "bg-[var(--accent-green)]",
    warning: "bg-[var(--accent-amber)]",
    error: "bg-[var(--accent-red)]",
    outline: "bg-[var(--text-tertiary)]",
  };

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                dotColors[variant || "default"]
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              dotColors[variant || "default"]
            )}
          />
        </span>
      )}
      {children}
    </div>
  );
}

// Status Badge - Specifically for processing/status states
interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'pending' | 'processing' | 'completed' | 'error';
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      variant: 'default' as const,
      label: 'Pending',
      dot: true,
      pulse: false,
    },
    processing: {
      variant: 'new' as const,
      label: 'Processing',
      dot: true,
      pulse: true,
    },
    completed: {
      variant: 'success' as const,
      label: 'Completed',
      dot: true,
      pulse: false,
    },
    error: {
      variant: 'error' as const,
      label: 'Error',
      dot: true,
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      pulse={config.pulse}
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
}

// Count Badge - For notifications/alerts count
interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  max?: number;
}

function CountBadge({ count, max = 99, className, ...props }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[18px] h-[18px] px-1",
        "text-[10px] font-bold text-white",
        "bg-[var(--accent-red)] rounded-full",
        className
      )}
      {...props}
    >
      {displayCount}
    </span>
  );
}

export { Badge, StatusBadge, CountBadge, badgeVariants }
```

---

## 6. Typography & Spacing System

**File:** `app/src/app/globals.css`

### 6.1 Add Typography Classes

Add after line 209 (after the `.mono` class):

```css
/* Typography Scale */
.text-display {
  font-size: 2.25rem;
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.text-display-sm {
  font-size: 1.875rem;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.text-heading-lg {
  font-size: 1.25rem;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.text-heading {
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.text-heading-sm {
  font-size: 0.875rem;
  line-height: 1.5;
  font-weight: 600;
}

.text-body-lg {
  font-size: 1rem;
  line-height: 1.6;
}

.text-body {
  font-size: 0.875rem;
  line-height: 1.6;
}

.text-body-sm {
  font-size: 0.8125rem;
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.text-label {
  font-size: 0.6875rem;
  line-height: 1.3;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Tabular Numbers for Data */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* Section Label (used for page headers) */
.section-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
}
```

### 6.2 Add Consistent Spacing Utilities

Add after the typography classes:

```css
/* Page Layout Spacing */
.page-header {
  margin-bottom: var(--space-8);
}

.page-section {
  margin-bottom: var(--space-10);
}

.page-section-sm {
  margin-bottom: var(--space-6);
}

/* Card Grid Layouts */
.card-grid {
  display: grid;
  gap: var(--space-5);
}

.card-grid-2 {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-5);
}

@media (min-width: 768px) {
  .card-grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

.card-grid-3 {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--space-5);
}

@media (min-width: 640px) {
  .card-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

.card-grid-4 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .card-grid-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 7. Guest Page Improvements

**File:** `app/src/app/guests/page.tsx`

### 7.1 Enhanced GuestCard Component

Replace the entire `GuestCard` function (lines 73-145) with:

```tsx
function GuestCard({ guest }: { guest: Guest }) {
  return (
    <div className="topo-card group">
      <div className="flex items-start gap-4">
        {/* Avatar with gradient ring */}
        <div className="relative flex-shrink-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-[var(--text-secondary)]"
            style={{
              background: "linear-gradient(135deg, #F5F5F4 0%, #E5E5E4 100%)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {guest.name.charAt(0)}
          </div>
          {/* Online indicator (if applicable) */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-green)]" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-heading text-[var(--text-primary)] truncate">
              {guest.name}
            </h3>
            {/* Episode count badge */}
            <span
              className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "var(--bg-subtle)",
                color: "var(--text-secondary)"
              }}
            >
              {guest.episodeCount} ep{guest.episodeCount !== 1 ? 's' : ''}
            </span>
          </div>

          <p className="text-body-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
            {guest.bio}
          </p>

          {/* Topics with improved styling */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {guest.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 text-[10px] font-medium rounded-md"
                style={{
                  background: "var(--bg-subtle)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-soft)",
                }}
              >
                {topic}
              </span>
            ))}
            {guest.topics.length > 3 && (
              <span
                className="px-2 py-0.5 text-[10px] font-medium rounded-md text-[var(--text-tertiary)]"
              >
                +{guest.topics.length - 3} more
              </span>
            )}
          </div>

          {/* Last appearance with icon */}
          <div className="flex items-center gap-1.5 text-caption text-[var(--text-tertiary)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Last: {new Date(guest.lastAppearance).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Actions - Enhanced hover state */}
      {guest.social && (
        <div className="mt-4 pt-4 border-t border-[var(--border-soft)] flex gap-2">
          {guest.social.website && (
            <a
              href={guest.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                         bg-white border border-[var(--border-soft)] text-[var(--text-secondary)]
                         hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]
                         hover:shadow-[0_2px_8px_rgba(0,122,255,0.1)]
                         transition-all duration-200"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </a>
          )}
          {guest.social.twitter && (
            <a
              href={`https://twitter.com/${guest.social.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                         bg-white border border-[var(--border-soft)] text-[var(--text-secondary)]
                         hover:border-[#1DA1F2] hover:text-[#1DA1F2]
                         hover:shadow-[0_2px_8px_rgba(29,161,242,0.1)]
                         transition-all duration-200"
            >
              Twitter
            </a>
          )}
          {guest.social.linkedin && (
            <a
              href={guest.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                         bg-white border border-[var(--border-soft)] text-[var(--text-secondary)]
                         hover:border-[#0A66C2] hover:text-[#0A66C2]
                         hover:shadow-[0_2px_8px_rgba(10,102,194,0.1)]
                         transition-all duration-200"
            >
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

### 7.2 Enhanced Page Header

Replace the header section (lines 170-184) with:

```tsx
{/* Header */}
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 page-header">
  <div>
    <span className="section-label mb-2 block">Guest Directory</span>
    <h1 className="text-heading-lg text-[var(--text-primary)] mb-1">
      Your Podcast Guests
    </h1>
    <p className="text-body text-[var(--text-secondary)]">
      Manage and discover insights about your podcast guests
    </p>
  </div>
  <Button className="min-h-[44px] shadow-sm" aria-label="Add new guest">
    <Plus className="h-4 w-4" aria-hidden="true" />
    Add Guest
  </Button>
</div>
```

### 7.3 Enhanced Search Bar

Replace the search section (lines 186-199) with:

```tsx
{/* Search */}
<div className="relative mb-6">
  <div
    className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none"
    style={{ color: 'var(--text-tertiary)' }}
  >
    <Search className="w-4 h-4" />
  </div>
  <input
    type="text"
    placeholder="Search guests by name, bio, or topic..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm
               bg-white border border-[var(--border-soft)]
               text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
               focus:outline-none focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(0,122,255,0.1)]
               transition-all duration-200"
  />
</div>
```

### 7.4 Enhanced Empty State

Replace the empty state section (lines 214-236) with:

```tsx
<div className="topo-card text-center py-16 px-8">
  <div
    className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
    style={{
      background: "linear-gradient(135deg, var(--bg-subtle) 0%, var(--bg-surface) 100%)",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
    }}
  >
    <Users className="w-10 h-10 text-[var(--text-tertiary)]" />
  </div>
  <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
    {searchQuery ? 'No guests found' : 'No guests yet'}
  </h3>
  <p className="text-body text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
    {searchQuery
      ? 'Try adjusting your search terms or clear the filter'
      : 'Add your first guest to start building your network'}
  </p>
  {!searchQuery && (
    <Button size="lg">
      <Plus className="h-4 w-4" />
      Add Your First Guest
    </Button>
  )}
</div>
```

---

## 8. Episode List Improvements

**File:** `app/src/components/episodes/episode-row.tsx`

### 8.1 Enhanced Episode Row

Locate the episode row component and update it with these improvements. If the file structure differs, apply similar patterns:

```tsx
// Add to the row container classes:
className={cn(
  // Base
  "group relative flex items-center gap-4 p-4 rounded-xl",
  "bg-white border border-[var(--border-soft)]",
  "transition-all duration-200 ease-out cursor-pointer",

  // Hover state
  "hover:border-[rgba(0,0,0,0.08)]",
  "hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]",
  "hover:-translate-y-px",

  // Active/selected state (if applicable)
  isSelected && [
    "border-[var(--selected-border)]",
    "bg-[var(--selected-bg)]",
    "shadow-[0_0_0_1px_rgba(0,122,255,0.1)]",
  ],
)}
```

### 8.2 Enhanced Health Score Display

For health score indicators in episode rows:

```tsx
// Health score circle with gradient
<div
  className={cn(
    "relative w-10 h-10 rounded-full flex items-center justify-center",
    "text-xs font-bold tabular-nums",
    healthScore >= 80 && "text-[var(--accent-green)]",
    healthScore >= 50 && healthScore < 80 && "text-[var(--accent-amber)]",
    healthScore < 50 && "text-[var(--accent-red)]",
  )}
  style={{
    background: healthScore >= 80
      ? "linear-gradient(135deg, rgba(52,199,89,0.1) 0%, rgba(52,199,89,0.05) 100%)"
      : healthScore >= 50
        ? "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)"
        : "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)",
    border: healthScore >= 80
      ? "1px solid rgba(52,199,89,0.2)"
      : healthScore >= 50
        ? "1px solid rgba(245,158,11,0.2)"
        : "1px solid rgba(239,68,68,0.2)",
  }}
>
  {healthScore}
</div>
```

---

## 9. Episode Detail Page Improvements

**File:** `app/src/app/episodes/[id]/page.tsx`

### 9.1 Add Consistent Page Layout

Ensure the page uses consistent spacing and typography:

```tsx
// Page container should have these classes:
<div className="animate-in space-y-8">
  {/* Breadcrumb / Back navigation */}
  <nav className="flex items-center gap-2 text-body-sm">
    <Link
      href="/episodes"
      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
    >
      Episodes
    </Link>
    <span className="text-[var(--text-tertiary)]">/</span>
    <span className="text-[var(--text-primary)]">Episode Title</span>
  </nav>

  {/* Episode Header */}
  {/* ... */}

  {/* Main Content Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main content - 2 columns */}
    <div className="lg:col-span-2 space-y-6">
      {/* Cards here */}
    </div>

    {/* Sidebar - 1 column */}
    <div className="space-y-6">
      {/* Sidebar cards here */}
    </div>
  </div>
</div>
```

### 9.2 Canvas Card Enhancement

For the main content canvas cards, add visual hierarchy:

```tsx
// Main canvas card with subtle accent
<TopoCard className="relative overflow-visible">
  {/* Accent line at top */}
  <div
    className="absolute -top-px left-6 right-6 h-[2px] rounded-full"
    style={{
      background: "linear-gradient(90deg, var(--accent-blue), transparent)",
      opacity: 0.5,
    }}
  />

  <CardHeader>
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: "rgba(0, 122, 255, 0.1)",
          color: "var(--accent-blue)",
        }}
      >
        <IconComponent className="w-4 h-4" />
      </div>
      <CardTitle>Card Title</CardTitle>
    </div>
  </CardHeader>

  <CardContent>
    {/* Content */}
  </CardContent>
</TopoCard>
```

---

## 10. Upload Wizard Polish

**File:** `app/src/components/upload/upload-wizard.tsx`

### 10.1 Enhanced Step Indicator

Replace the step indicator section (lines 140-189) with:

```tsx
{/* Step Indicator */}
<div className="mb-10">
  <div className="flex items-center justify-between relative">
    {/* Progress line background */}
    <div
      className="absolute top-5 left-0 right-0 h-[2px] bg-[var(--border-soft)]"
      style={{ marginLeft: '40px', marginRight: '40px' }}
    />

    {/* Progress line filled */}
    <div
      className="absolute top-5 left-0 h-[2px] bg-[var(--accent-green)] transition-all duration-500 ease-out"
      style={{
        marginLeft: '40px',
        width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - 80px)`,
      }}
    />

    {steps.map((step, index) => (
      <div key={step.id} className="flex flex-col items-center relative z-10">
        {/* Step circle */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "font-semibold text-sm transition-all duration-300",
            "border-2",
            currentStep > step.id && [
              "bg-[var(--accent-green)] border-[var(--accent-green)] text-white",
              "shadow-[0_2px_8px_rgba(52,199,89,0.3)]",
            ],
            currentStep === step.id && [
              "bg-[var(--text-primary)] border-[var(--text-primary)] text-white",
              "shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
            ],
            currentStep < step.id && [
              "bg-white border-[var(--border-soft)] text-[var(--text-tertiary)]",
            ],
          )}
        >
          {currentStep > step.id ? (
            <Check className="w-5 h-5" />
          ) : (
            step.id
          )}
        </div>

        {/* Step label */}
        <span
          className={cn(
            "mt-3 text-xs font-medium transition-colors duration-200",
            currentStep >= step.id
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-tertiary)]"
          )}
        >
          {step.label}
        </span>
      </div>
    ))}
  </div>
</div>
```

### 10.2 Enhanced Upload Zone

In `app/src/components/upload/step-upload.tsx`, enhance the dropzone:

```tsx
// Upload dropzone with better visual feedback
<div
  className={cn(
    "relative rounded-xl border-2 border-dashed p-12 text-center",
    "transition-all duration-200 ease-out",
    "cursor-pointer",

    // Default state
    !isDragging && !hasFile && [
      "border-[var(--border-soft)] bg-[var(--bg-subtle)]",
      "hover:border-[var(--accent-blue)] hover:bg-[rgba(0,122,255,0.02)]",
    ],

    // Dragging state
    isDragging && [
      "border-[var(--accent-blue)] bg-[rgba(0,122,255,0.05)]",
      "shadow-[0_0_0_4px_rgba(0,122,255,0.1)]",
    ],

    // Has file state
    hasFile && [
      "border-[var(--accent-green)] bg-[rgba(52,199,89,0.05)]",
    ],
  )}
>
  {/* Upload icon with animation */}
  <div
    className={cn(
      "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center",
      "transition-transform duration-200",
      isDragging && "scale-110",
    )}
    style={{
      background: isDragging
        ? "rgba(0, 122, 255, 0.1)"
        : hasFile
          ? "rgba(52, 199, 89, 0.1)"
          : "var(--bg-elevated)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}
  >
    <Upload
      className={cn(
        "w-8 h-8",
        isDragging && "text-[var(--accent-blue)]",
        hasFile && "text-[var(--accent-green)]",
        !isDragging && !hasFile && "text-[var(--text-tertiary)]",
      )}
    />
  </div>

  {/* Text content */}
  <p className="text-heading text-[var(--text-primary)] mb-2">
    {hasFile ? file.name : 'Drop your audio file here'}
  </p>
  <p className="text-body-sm text-[var(--text-secondary)]">
    {hasFile
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : 'or click to browse (MP3, WAV, M4A up to 500MB)'
    }
  </p>
</div>
```

### 10.3 Processing Step Enhancement

In `app/src/components/upload/step-processing.tsx`, improve the processing feedback:

```tsx
// Processing step item
<div
  className={cn(
    "flex items-center gap-4 p-4 rounded-xl",
    "transition-all duration-300",
    status === 'complete' && "bg-[rgba(52,199,89,0.05)]",
    status === 'active' && "bg-[rgba(0,122,255,0.05)]",
    status === 'pending' && "bg-transparent",
  )}
>
  {/* Status indicator */}
  <div
    className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center",
      "transition-all duration-300",
      status === 'complete' && "bg-[var(--accent-green)] text-white",
      status === 'active' && "bg-[var(--accent-blue)] text-white",
      status === 'pending' && "bg-[var(--bg-subtle)] text-[var(--text-tertiary)]",
    )}
    style={{
      boxShadow: status === 'active'
        ? "0 0 0 4px rgba(0, 122, 255, 0.2)"
        : status === 'complete'
          ? "0 2px 8px rgba(52, 199, 89, 0.3)"
          : "none",
    }}
  >
    {status === 'complete' ? (
      <Check className="w-5 h-5" />
    ) : status === 'active' ? (
      <Loader2 className="w-5 h-5 animate-spin" />
    ) : (
      <span className="text-sm font-medium">{stepNumber}</span>
    )}
  </div>

  {/* Label and description */}
  <div className="flex-1">
    <p
      className={cn(
        "font-medium transition-colors duration-200",
        status === 'pending' && "text-[var(--text-tertiary)]",
        status !== 'pending' && "text-[var(--text-primary)]",
      )}
    >
      {label}
    </p>
    {status === 'active' && description && (
      <p className="text-body-sm text-[var(--text-secondary)] mt-0.5">
        {description}
      </p>
    )}
  </div>
</div>
```

---

## 11. Global Animation System

**File:** `app/src/app/globals.css`

### 11.1 Add Animation Keyframes

Add before the `@media (prefers-reduced-motion: reduce)` section (before line 584):

```css
/* Enhanced Animations */

/* Fade in with slight lift */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade in from scale */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Subtle pulse for active elements */
@keyframes subtlePulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Shimmer for loading states */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Spin with easing */
@keyframes spinSmooth {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Animation utility classes */
.animate-in {
  animation: fadeInUp 0.5s var(--ease-out-expo);
}

.animate-in-scale {
  animation: fadeInScale 0.3s var(--ease-out-expo);
}

.animate-pulse-subtle {
  animation: subtlePulse 2s ease-in-out infinite;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-subtle) 0%,
    var(--bg-elevated) 50%,
    var(--bg-subtle) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.animate-spin-smooth {
  animation: spinSmooth 1s linear infinite;
}

/* Staggered list animation */
.stagger-1 { animation-delay: var(--stagger-1); }
.stagger-2 { animation-delay: var(--stagger-2); }
.stagger-3 { animation-delay: var(--stagger-3); }
.stagger-4 { animation-delay: calc(var(--stagger-3) + var(--stagger-1)); }
.stagger-5 { animation-delay: calc(var(--stagger-3) + var(--stagger-2)); }
```

---

## 12. Empty States & Loading

### 12.1 Enhanced Loading States

**File:** `app/src/components/LoadingStates.tsx`

Update skeleton components with shimmer animation:

```tsx
// Base skeleton with shimmer
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--bg-subtle)]",
        "animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-white p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-soft)] bg-white">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="w-16 h-8 rounded-lg" />
    </div>
  );
}

// Metric card skeleton
export function MetricSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-white p-5">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}
```

### 12.2 Empty State Component

Create or update `app/src/components/ui/empty-state.tsx`:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-8",
        className
      )}
      {...props}
    >
      {/* Icon container */}
      <div
        className="w-20 h-20 rounded-2xl mb-6 flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, var(--bg-subtle) 0%, var(--bg-surface) 100%)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div className="text-[var(--text-tertiary)]">
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-body text-[var(--text-secondary)] mb-6 max-w-sm">
        {description}
      </p>

      {/* Action button */}
      {action && (
        <Button size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

---

## Implementation Checklist

Use this checklist to track implementation progress:

### Phase 1: Foundation (Do First)
- [ ] Update `globals.css` with new design tokens (Section 1)
- [ ] Add new shadow system (Section 1.1)
- [ ] Add new color tokens (Section 1.2)
- [ ] Add animation timing tokens (Section 1.3)
- [ ] Add typography classes (Section 6.1)
- [ ] Add spacing utilities (Section 6.2)
- [ ] Add animation keyframes (Section 11.1)

### Phase 2: Core Components
- [ ] Update `button.tsx` with enhanced variants (Section 4)
- [ ] Update `badge.tsx` with new badge system (Section 5)
- [ ] Update `card.tsx` with enhanced cards (Section 3)
- [ ] Create/update `empty-state.tsx` (Section 12.2)
- [ ] Update `LoadingStates.tsx` with shimmer (Section 12.1)

### Phase 3: Navigation
- [ ] Update `sidebar.tsx` with enhanced logo (Section 2.1)
- [ ] Update `sidebar.tsx` with enhanced NavItem (Section 2.2)
- [ ] Update `sidebar.tsx` with enhanced NavSection (Section 2.3)
- [ ] Update sidebar CSS styles (Section 2.4)

### Phase 4: Pages
- [ ] Update Guests page (Section 7)
  - [ ] Enhanced GuestCard component (Section 7.1)
  - [ ] Enhanced page header (Section 7.2)
  - [ ] Enhanced search bar (Section 7.3)
  - [ ] Enhanced empty state (Section 7.4)
- [ ] Update Episodes list (Section 8)
- [ ] Update Episode detail page (Section 9)
- [ ] Update Upload wizard (Section 10)
  - [ ] Enhanced step indicator (Section 10.1)
  - [ ] Enhanced upload zone (Section 10.2)
  - [ ] Processing step enhancement (Section 10.3)

### Phase 5: Polish & Testing
- [ ] Test all hover states and transitions
- [ ] Verify consistent spacing across pages
- [ ] Test responsive behavior on mobile
- [ ] Test with `prefers-reduced-motion`
- [ ] Visual QA pass on all pages

---

## Visual Reference: Before & After Expectations

### Cards
**Before:** Flat, single shadow, minimal depth
**After:** Multi-layer shadows, top highlight, subtle lift on hover, accent glow options

### Buttons
**Before:** Simple background color, basic hover
**After:** Shadow depth, lift on hover, press feedback, focus rings

### Navigation
**Before:** Basic highlight on active item
**After:** Accent indicator bar, icon color change, section dividers, refined spacing

### Badges
**Before:** Simple colored background
**After:** Dot indicators, pulse animation for active states, refined borders

### Typography
**Before:** Inconsistent sizing, basic hierarchy
**After:** Clear type scale, consistent weight usage, proper tracking

### Animations
**Before:** Basic CSS transitions
**After:** Spring-like easing, staggered lists, shimmer loading, reduced motion support

---

## Notes for Implementers

1. **Test incrementally** - After each section, verify the changes work before moving on
2. **Preserve functionality** - These are purely visual changes; existing functionality should remain intact
3. **Use CSS variables** - All colors should reference the design tokens, not hard-coded values
4. **Mobile-first** - Ensure all changes work well on smaller screens
5. **Accessibility** - Maintain proper focus states and color contrast
6. **Performance** - Animations should use GPU-accelerated properties (transform, opacity)

---

*Document prepared for PodBrain UI Elevation Project*
*All code examples are ready for direct implementation*
