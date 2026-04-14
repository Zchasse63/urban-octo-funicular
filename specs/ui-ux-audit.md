# UI/UX Visual Audit — Full Application

**Date:** 2026-04-13
**Method:** Playwright browser screenshots across all pages at 1280x800 viewport
**User context:** Authenticated user with 1 completed episode (28-min podcast)

## Critical Issues

### 1. PRICING MISMATCH — Landing page vs Stripe vs CLAUDE.md

The landing page pricing section shows **4 tiers at completely different prices** than what exists in the codebase and Stripe:

| Source | Free | Pro | Creator | Agency |
|---|---|---|---|---|
| **Landing page** | $0 | **$29/mo** | **$59/mo** | **$149/mo** |
| **CLAUDE.md** | $0 | **$19/mo** | N/A | **$49/mo** |
| **Stripe (live)** | — | **$19/mo** | N/A | **$49/mo** |
| **tier-limits.ts** | $0 | $19/mo | N/A | $49/mo |

**Problems:**
- Pro is listed as $29 on the landing page but $19 everywhere else
- Creator tier ($59) exists on landing page but has no Stripe product, no price ID, and isn't enforced in tier-limits.ts
- Agency is listed as $149 on the landing page but $49 in Stripe/backend
- Annual prices shown on landing ($232/yr, $472/yr, $1192/yr) don't match Stripe ($190/yr, $490/yr)

**Impact:** A customer who clicks "Start Pro Trial" expecting $29/mo would be charged $19/mo. That's actually better for the customer but terrible for trust and could raise chargeback disputes for the opposite reason if prices are later corrected.

**Decision needed:** Which prices are correct? Update either the landing page or Stripe/backend to match.

### 2. Transcript speaker labels show "A", "B", "C" instead of names

AssemblyAI's speaker diarization returns generic labels (Speaker A, B, C). The transcript tab displays these raw labels instead of resolving them to actual names (Host: Adir Frelich, Guest: Yonatan Snir). This is a UX gap — users have to mentally map letters to people.

**Suggestion:** Add a speaker-rename feature in the transcript toolbar. Even a simple dropdown: "A = Host, B = Guest, C = Sponsor read" that persists to episode metadata.

## High Priority

### 3. "Export" button in Show Notes toolbar is dead

The "Export" button next to Copy/Edit/Regenerate has no onClick handler — same pattern as the original Download button bug. Needs to trigger a markdown file download.

### 4. "Regenerate" button in Show Notes toolbar is dead

No onClick handler. Should call the regenerateAsset hook.

### 5. "Export SRT" button in Transcript tab is dead

Visible in the toolbar but has no onClick. Should generate and download an SRT subtitle file from the transcript segments.

## Medium Priority

### 6. SEO Score shows "61 — Fair" but keywords include stop words

The top keywords from the SEO analysis include "from" and "with" — these are stop words that shouldn't be in a keyword density analysis. The Grok-generated SEO analysis needs better keyword filtering.

### 7. Pre-Interview Intelligence shows "No guest information yet" despite guest_name being set

On the Guest Package tab, the PreInterviewPanel shows an empty state with "Enter a guest name..." even though `guest_name` is "Yonatan Snir". The panel should auto-populate from the episode's guest_name field.

### 8. Show notes render as raw markdown in HTML mode

The amber "HTML version not yet generated" notice works, but the ideal UX would be to render the markdown AS HTML using a client-side markdown parser. Currently it shows raw `**bold**` and `## headers` as plain text in a `<pre>` block.

## Low Priority / Polish

### 9. Sidebar show name truncated with ellipsis

"[TEST] Pipeline Stres..." — the show selector truncates at ~18 characters. For real show names this is tight. Consider a wider selector or a tooltip on hover.

### 10. "Experts" has a yellow warning dot in sidebar

The yellow dot on "Experts" in the sidebar implies something needs attention, but it's a static indicator — always yellow regardless of state. Either make it meaningful or remove it.

### 11. No loading indicator when switching tabs

Tab switches are instant (data is already fetched), but if network is slow on first load, there's no skeleton or spinner inside the tab content area — just a blank space until data arrives.

### 12. Landing page hero has excessive whitespace

Below the "FREE PLAN AVAILABLE" text and above the problem cards, there's a large empty gap (~200px). Tightening this improves above-the-fold content density.

### 13. Console errors on Guest Package tab

2 errors logged when switching to the Guest Package tab. Need to check what's throwing — likely a fetch error from the pre-interview intelligence endpoint.

## What Looks Great

- **Signal Chain indicator** — clean 4-step progress, all green for completed ✅
- **Tab bar** — responsive, clear active state with underline animation ✅
- **Asset cards** — consistent color coding per category, clear Ready badges ✅
- **Share buttons** — platform-specific, well-labeled, don't clutter non-social assets ✅
- **Sidebar usage widget** — real 47% with color-coded bar ✅
- **Settings tier card** — "CRITICAL" shows badge with real usage data ✅
- **Landing page hero** — Space Grotesk + Source Serif 4 typography, warm stone palette ✅
- **Upload wizard** — clean 3-step progress, clear drop zone, disabled state visible ✅
- **Breadcrumbs** — functional navigation chain ✅
- **Empty states** — "No show notes yet" / "Transcript not yet available" are clear and not fake ✅
