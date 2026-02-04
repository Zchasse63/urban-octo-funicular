# Kokonut UI Pro — Setup Guide for PodBrain

This guide walks through setting up Kokonut UI Pro for the PodBrain project.

---

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ or Bun installed
- A Next.js 14+ project (or React project with Tailwind CSS)
- Tailwind CSS v4 configured

---

## Step 1: Configure Namespace

The `components.json` file holds configuration for your project and allows easy installation of any components.

### Option A: Initialize with CLI (Recommended)

If you don't have a `components.json` file yet, create one:

```bash
# Using bun (recommended)
bunx --bun shadcn@latest init

# Using npx
npx shadcn@latest add init

# Using pnpm
pnpm dlx shadcn@latest init
```

### Option B: Manual Creation

Create `components.json` in your project root manually.

---

## Step 2: Add Kokonut UI Registry

Add the Kokonut UI Pro registry to your `components.json` file:

```json
{
  "registries": {
    "@kokonutui-pro": {
      "url": "https://kokonutui.pro/api/r/{name}",
      "headers": {
        "X-API-Key": "${KOKO_PRO_TOKEN}"
      }
    }
  }
}
```

**Note:** The `${KOKO_PRO_TOKEN}` will be read from your environment variables.

### Full components.json Example

Here's a complete `components.json` with both free and Pro registries:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@kokonutui": "https://kokonutui.com/r/{name}.json",
    "@kokonutui-pro": {
      "url": "https://kokonutui.pro/api/r/{name}",
      "headers": {
        "X-API-Key": "${KOKO_PRO_TOKEN}"
      }
    }
  }
}
```

---

## Step 3: Set Your Pro Token

### Your Kokonut UI Pro Token

```
b9ba6b98-cf81-434c-b656-a460ed04eee7
```

### Add to Environment Variables

**Option A: Export in Terminal (Temporary)**

```bash
export KOKO_PRO_TOKEN="b9ba6b98-cf81-434c-b656-a460ed04eee7"
```

**Option B: Add to `.env.local` (Recommended for Development)**

Create or edit `.env.local` in your project root:

```bash
# .env.local
KOKO_PRO_TOKEN="b9ba6b98-cf81-434c-b656-a460ed04eee7"
```

**Option C: Add to Shell Profile (Persistent)**

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Kokonut UI Pro
export KOKO_PRO_TOKEN="b9ba6b98-cf81-434c-b656-a460ed04eee7"
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

---

## Step 4: Install Utilities

All components use Tailwind CSS. Many components also use the `cn` utility function for class merging.

Install utilities:

```bash
# Using bun (recommended)
bunx shadcn@latest add https://kokonutui.com/r/utils.json

# Using npx
npx shadcn@latest add https://kokonutui.com/r/utils.json

# Using pnpm
pnpm dlx shadcn@latest add https://kokonutui.com/r/utils.json
```

This creates a `lib/utils.ts` file with the `cn()` function:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 5: Install Lucide Icons

Kokonut UI uses [lucide-react](https://lucide.dev) for icons:

```bash
# Using bun
bun add lucide-react

# Using npm
npm install lucide-react

# Using pnpm
pnpm add lucide-react
```

---

## Step 6: Install Motion (Optional but Recommended)

Many components use **Motion** (formerly Framer Motion) for animations. Components requiring motion are categorized under "Motion" in the docs.

```bash
# Using bun
bun add motion

# Using npm
npm install motion

# Using pnpm
pnpm add motion
```

---

## Step 7: Install Components

Now you can install any component!

### Free Components (kokonutui.com)

```bash
# Syntax
bunx --bun shadcn@latest add @kokonutui/[component-name]

# Examples
bunx --bun shadcn@latest add @kokonutui/liquid-glass-card
bunx --bun shadcn@latest add @kokonutui/mouse-effect-card
bunx --bun shadcn@latest add @kokonutui/gradient-button
```

### Pro Components (kokonutui.pro)

```bash
# Syntax
bunx --bun shadcn@latest add @kokonutui-pro/[component-name]

# Examples
bunx --bun shadcn@latest add @kokonutui-pro/card-02
bunx --bun shadcn@latest add @kokonutui-pro/animated-list
bunx --bun shadcn@latest add @kokonutui-pro/modal-01
```

---

## Quick Install: All PodBrain Components

### Free Components (Run this first)

```bash
bunx --bun shadcn@latest add @kokonutui/morphic-navbar @kokonutui/smooth-tab @kokonutui/smooth-drawer @kokonutui/profile-dropdown @kokonutui/liquid-glass-card @kokonutui/mouse-effect-card @kokonutui/apple-activity-card @kokonutui/card-stack @kokonutui/bento-grid @kokonutui/gradient-button @kokonutui/slide-text-button @kokonutui/hold-button @kokonutui/command-button @kokonutui/v0-button @kokonutui/action-search-bar @kokonutui/file-upload @kokonutui/ai-text-loading @kokonutui/ai-loading @kokonutui/shimmer-text @kokonutui/typewriter @kokonutui/loader @kokonutui/dynamic-text @kokonutui/swoosh-text @kokonutui/scroll-text @kokonutui/background-paths @kokonutui/beams-background
```

### Pro Components (Run after setting token)

```bash
bunx --bun shadcn@latest add @kokonutui-pro/card-02 @kokonutui-pro/animated-list @kokonutui-pro/modal-01
```

---

## Troubleshooting

### "Unauthorized" or "403" Error

Your token isn't being read. Check:

1. Token is exported in your current terminal session:
   ```bash
   echo $KOKO_PRO_TOKEN
   # Should output: b9ba6b98-cf81-434c-b656-a460ed04eee7
   ```

2. If empty, export it:
   ```bash
   export KOKO_PRO_TOKEN="b9ba6b98-cf81-434c-b656-a460ed04eee7"
   ```

3. Try the install command again

### "Registry not found" Error

Ensure your `components.json` has the correct registry configuration (see Step 2).

### Components Not Installing

1. Make sure you have `shadcn` CLI available
2. Check your Node.js version (18+ required)
3. Verify Tailwind CSS is properly configured

---

## File Structure After Setup

```
your-project/
├── components/
│   ├── kokonutui/           # Free components install here
│   │   ├── liquid-glass-card.tsx
│   │   ├── mouse-effect-card.tsx
│   │   └── ...
│   └── ui/                  # shadcn/ui base components
├── lib/
│   └── utils.ts             # cn() utility
├── components.json          # Registry configuration
├── .env.local               # Your KOKO_PRO_TOKEN
└── tailwind.config.ts
```

---

## Available Pro Components

With your Pro license, you have access to:

### Templates
- Agenta (NEW) — AI Agents/SaaS
- Lume (NEW) — Modern Landing
- Sonae (NEW) — Modern Template
- AI — AI Startup/SaaS
- Futur — E-commerce/Product
- Postly — SaaS/Online Products
- Startup — Business Landing

### Blocks & Sections
- Login pages
- Features sections
- FAQs
- Footers
- Heroes
- Pricing sections
- Pages
- Testimonials

### Components
- Cards (card-01 through card-09)
- Animated lists
- Modals
- Buttons
- Inputs
- Headlines
- Banners

---

## Next Steps

1. ✅ Set your Pro token in environment
2. ✅ Configure `components.json`
3. ✅ Install utilities
4. ✅ Install lucide-react and motion
5. 🚀 Start installing components!

Refer to the **PodBrain Kokonut UI Design System** document for which components to use where.

---

## Quick Reference Card

```bash
# Set token (run once per terminal session)
export KOKO_PRO_TOKEN="b9ba6b98-cf81-434c-b656-a460ed04eee7"

# Install free component
bunx --bun shadcn@latest add @kokonutui/[name]

# Install pro component
bunx --bun shadcn@latest add @kokonutui-pro/[name]

# Verify token is set
echo $KOKO_PRO_TOKEN
```

---

*Keep your Pro token private. Do not commit it to public repositories.*
