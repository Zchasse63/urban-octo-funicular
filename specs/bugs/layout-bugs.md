# Bugs Discovered — Layout (Sidebar, App Shell)

**Feature:** layout
**Discovered by:** live-walkthrough during product-quality audit
**Date:** 2026-04-15
**Dev server:** `next dev` (Turbopack) against Supabase project `itnzbdojxvbhuxnwqgzg`
**Test user:** `live-test@podbrain-test.local` (agency tier, active)

---

## Bug #18 — Sidebar status dots are decorative, not functional

**Severity:** MEDIUM — the sidebar displays colored status indicator dots
next to Episodes, Experts, and the brand logo that look like real status
indicators (green pulse, amber warning, orange notification), but every
single one is a hardcoded JSX prop with no connection to application
state. They never change color. Users who assume the dots mean something
will lose trust in every other indicator on the page when they realize.

**Symptom:**

Open any page → observe the sidebar:

- **Episodes** row: green pulsing dot (looks like "1+ processing" or "new")
- **Experts** row: amber dot (looks like "action needed" or "updates available")
- **Brand logo top-right**: orange pulsing dot (looks like "new feature ping")

None of these ever change regardless of application state. An episode
currently processing, an Experts page with zero items, a user with no
new features — the dots render identically.

**Evidence:**

`app/src/components/layout/sidebar.tsx:417`:

```tsx
<NavItem
  icon={LayoutDashboard}
  label="Episodes"
  isActive={isActive('/episodes')}
  count={episodesLoading ? undefined : episodeCount}
  onClick={() => navigate('/episodes')}
  status="active"                                          // ← hardcoded
  isCollapsed={collapsed}
  shortcut="⌘1"
/>
```

Line 431:

```tsx
<NavItem
  icon={Users}
  label="Experts"
  isActive={isActive('/experts')}
  onClick={() => navigate('/experts')}
  status="warning"                                         // ← hardcoded
  isCollapsed={collapsed}
/>
```

Line 385 (brand logo):

```tsx
<div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-background shadow-sm animate-pulse" />
```

The `animate-pulse` Tailwind class adds fake "something's happening here"
urgency without any corresponding behavior.

**What IS real in the sidebar (for contrast):**

| Element | Source |
|---|---|
| Episodes "9" count | Real — `useEpisodes({ showId }).total` |
| Vocabulary "0" count | Real — `useVocabulary({ showId }).terms.length` |
| "Agency Plan" label | Real — `getTierLabel(subscription.tier)` |
| Monthly Audio % | Real — `usage.audioMinutes.percentage` |
| Usage bar color (green/amber/rose at 70/90/100%) | Real — thresholds against `usage.audioMinutes.percentage` |

So the sidebar MOSTLY has real data — these three decorative dots are
the exception, not the rule.

**Blast radius:**

Users develop a conditioned response to the colored dots ("green = good,
amber = attention needed, orange = new") and expect them to reflect
state. When they discover they're fake, they question whether every OTHER
indicator (subscription status, usage meter color, episode status pills)
is also fake. This is a credibility bomb, not a security bug.

**Fix options:**

1. **Wire them to real state** (recommended):
   - Episodes dot: green if `episodes.some(e => e.status === 'completed')`,
     amber if `episodes.some(e => e.status === 'processing')`,
     red if `episodes.some(e => e.status === 'failed')`, absent otherwise.
   - Experts dot: amber if the Experts page has pending invitations or
     new guest suggestions count > 0, absent otherwise.
   - Brand orange dot: delete entirely, or repurpose as a genuine "new
     feature ping" tied to a real changelog state.

2. **Remove them entirely** — no dots is better than decorative dots that
   pretend to mean something.

My recommendation: option 1 for Episodes (high-value, tells users
"something needs your attention"), option 2 for Experts (the feature
doesn't need a constant warning tag) and brand (delete).

**Status:** ✅ **FIXED 2026-04-15** (round 2). Three-part fix:
(1) Episodes dot is now derived from real `useEpisodes()` data via a
computed `episodesStatus` with priority order: failed (red) > processing
(amber) > completed (green) > absent. Added 'failed' to NavItem status
union and StatusDot color map (red).
(2) Removed the hardcoded `status="warning"` prop from the Experts NavItem.
(3) Removed the brand orange decorative pulsing dot at line 385 entirely.
End-to-end verified: with one completed episode the dot renders emerald;
inserting a temp failed episode flips it to red; the brand orange dot is
no longer in the DOM.

---
