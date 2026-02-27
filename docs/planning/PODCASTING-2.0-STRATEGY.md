# Podcasting 2.0 Integration Strategy for PodBrain

**Date:** 2026-02-26
**Status:** PLANNING — No code yet
**Priority:** DIFFERENTIATOR — Unique competitive moat

---

## Executive Summary

Podcasting 2.0 is an open-source RSS namespace extension that adds structured metadata to podcast feeds — guest credits, transcripts, chapters, soundbites, monetization, and more. Adoption is extremely low (<5% of feeds for most tags), but growing. **PodBrain already generates most of this data internally** — it just doesn't export it in the Podcasting 2.0 format.

The opportunity: PodBrain becomes a **Podcasting 2.0 publishing tool** that transforms the data it already produces into standards-compliant RSS tags. This simultaneously:

1. **Differentiates PodBrain** from every competitor (none do this)
2. **Gets podcasters' shows into 80+ Podcasting 2.0 apps** with enhanced features
3. **Feeds the Taddy `persons` ecosystem** — making PodBrain's expert discovery better over time
4. **Creates network effects** — the more PodBrain users, the richer the podcast data ecosystem becomes

PodBrain's dual role: **Consumer** (reading Podcasting 2.0 data from Taddy) AND **Producer** (generating Podcasting 2.0 tags for users' feeds).

---

## What Is Podcasting 2.0?

An RSS namespace extension (`xmlns:podcast="https://podcastindex.org/namespace/1.0"`) created by Adam Curry and Dave Jones. It adds 27+ standardized XML tags to podcast RSS feeds.

**Key facts:**
- Open standard, no licensing or fees
- Supported by 80+ podcast apps (including Apple Podcasts for transcripts)
- Indexed by Podcast Index (which Taddy queries)
- Adoption is low because **no tools generate the tags automatically**
- That last point is the opportunity

### Current Adoption Rates (from 258,607 podcasts sampled)

| Tag | Channel-level | Item-level |
|-----|--------------|------------|
| `<podcast:person>` | — | ~0.5% |
| `<podcast:transcript>` | — | ~2.5% |
| `<podcast:chapters>` | — | ~1.5% |
| `<podcast:soundbite>` | — | ~0.3% |
| `<podcast:funding>` | 2.9% | — |
| `<podcast:medium>` | 3.9% | — |
| `<podcast:txt>` | 1.9% | 0.5% |
| `<podcast:location>` | 0.9% | 0.1% |
| `<podcast:podroll>` | 0.5% | — |
| `<podcast:value>` | — | ~0.0% |

---

## The PodBrain ↔ Podcasting 2.0 Tag Map

This is the core insight: **PodBrain already generates the data these tags need.**

### Tags PodBrain Can PRODUCE (Generate for Users' Feeds)

| Podcasting 2.0 Tag | Parent | PodBrain Data Source | Effort | Value |
|---------------------|--------|---------------------|--------|-------|
| **`<podcast:person>`** | `<item>` | Guest name from episode metadata + speaker diarization | Medium | **HIGH** — feeds the Taddy persons ecosystem, enables expert discovery network effects |
| **`<podcast:transcript>`** | `<item>` | AssemblyAI transcription output (already generated) | Low | **HIGH** — Apple Podcasts shows transcripts, 25+ apps support this |
| **`<podcast:soundbite>`** | `<item>` | Viral moments detection (already in processing pipeline) | Low | **HIGH** — viral_moments with timestamps map directly to soundbites |
| **`<podcast:chapters>`** | `<item>` | AI-generated chapter markers from show notes | Medium | **HIGH** — 20+ apps display chapters, Apple Podcasts supports them |
| **`<podcast:funding>`** | `<channel>` | User's Stripe/donation links from settings | Trivial | Medium — 21 apps + 24 platforms support this |
| **`<podcast:location>`** | `<item>` or `<channel>` | AI extraction from episode content or user settings | Low | Low — nice-to-have metadata |
| **`<podcast:txt>`** | `<channel>` | Verification strings, SEO keywords | Trivial | Low — enables feed verification services |
| **`<podcast:podroll>`** | `<channel>` | Cross-show intelligence / related podcasts from Taddy | Medium | Medium — cross-promotion feature |
| **`<podcast:medium>`** | `<channel>` | Default "podcast" or user-selected type | Trivial | Low — helps apps categorize content |

### Tags PodBrain Can CONSUME (Read from Taddy/RSS)

| Podcasting 2.0 Tag | How PodBrain Uses It |
|---------------------|---------------------|
| **`<podcast:person>`** | Expert discovery — find who appears on what shows (currently 0% coverage, but grows as tools like PodBrain start producing it) |
| **`<podcast:transcript>`** | Pre-interview intelligence — read transcripts of guest's other appearances |
| **`<podcast:chapters>`** | Topic extraction from external episodes for cross-show intelligence |
| **`<podcast:soundbite>`** | Find viral moments from other shows for competitive analysis |

---

## The 4 High-Value Tags — Detailed Mapping

### 1. `<podcast:person>` — THE NETWORK EFFECT TAG

**Spec:**
- Parent: `<item>` (per episode)
- Required: Person's name (node value, max 128 chars)
- Optional: `role` (host, guest, editor, etc.), `group` (cast, writing, etc.), `img` (avatar URL), `href` (profile URL)
- Multiple tags per episode allowed

**Example XML:**
```xml
<podcast:person role="guest" img="https://example.com/jane.jpg"
  href="https://janedoe.com">Jane Doe</podcast:person>
<podcast:person role="host">Zach</podcast:person>
```

**PodBrain mapping:**
- `episode.guest_name` → person name (role="guest")
- Show host from settings → person name (role="host")
- Speaker diarization labels → additional persons
- Guest profile image from Taddy search → `img` attribute
- Guest website from contact hints → `href` attribute

**Why this is THE differentiator:**
1. PodBrain processes episodes and knows who the guest is
2. No other tool automatically generates `<podcast:person>` tags
3. Every PodBrain-processed episode that gets this tag → shows up in Taddy's `persons` field
4. More episodes with person tags → better expert discovery for ALL PodBrain users
5. **This creates a self-reinforcing flywheel**: PodBrain generates tags → Taddy indexes them → PodBrain's expert search gets better → more users adopt PodBrain → more tags generated

### 2. `<podcast:transcript>` — THE EASY WIN

**Spec:**
- Parent: `<item>` (per episode)
- Required: `url` (hosted transcript file), `type` (mime type)
- Optional: `language`, `rel` (captions vs transcript)
- Supported types: `text/plain`, `text/html`, `text/vtt`, `application/json`, `application/x-subrip`

**Example XML:**
```xml
<podcast:transcript url="https://example.com/ep1/transcript.vtt"
  type="text/vtt" language="en" />
<podcast:transcript url="https://example.com/ep1/transcript.json"
  type="application/json" language="en" />
```

**PodBrain mapping:**
- AssemblyAI already produces full transcripts with timestamps and speaker labels
- These can be exported as VTT (WebVTT) or JSON format
- Host on Supabase Storage → get a URL → add to RSS tag
- **Apple Podcasts displays transcripts** if this tag is present — massive visibility boost

**Implementation:**
1. After transcription, generate VTT file from AssemblyAI output
2. Upload VTT to Supabase Storage (public bucket)
3. Generate `<podcast:transcript>` tag with the storage URL
4. Include in RSS enhancement output

### 3. `<podcast:soundbite>` — VIRAL MOMENTS AS A STANDARD

**Spec:**
- Parent: `<item>` (per episode)
- Required: `startTime` (float, seconds), `duration` (float, seconds)
- Optional: Title (node value, max 128 chars)
- Duration recommendation: 15-120 seconds

**Example XML:**
```xml
<podcast:soundbite startTime="1234.5" duration="42.0">Why AI ethics matter</podcast:soundbite>
<podcast:soundbite startTime="3412.1" duration="25.0">The aha moment</podcast:soundbite>
```

**PodBrain mapping:**
- `episode.viral_moments` already contains exactly this data:
  - `viral_moments[].startTime` → `startTime`
  - `viral_moments[].endTime - startTime` → `duration`
  - `viral_moments[].text` (truncated to 128 chars) → node value title
- The processing pipeline ALREADY identifies viral moments
- This is literally just reformatting existing data

**Implementation:**
1. After processing, filter viral moments for soundbite-appropriate ones (15-120s)
2. Generate `<podcast:soundbite>` tags from viral_moments array
3. Include in RSS enhancement output

### 4. `<podcast:chapters>` — AI-GENERATED STRUCTURE

**Spec:**
- Parent: `<item>` (per episode)
- Required: `url` (hosted chapters file), `type` (mime type)
- Preferred type: `application/json+chapters` (Podcasting 2.0 Chapters format)

**Example XML:**
```xml
<podcast:chapters url="https://example.com/ep1/chapters.json"
  type="application/json+chapters" />
```

**Chapters JSON format:**
```json
{
  "version": "1.2.0",
  "chapters": [
    {
      "startTime": 0,
      "title": "Introduction",
      "img": "https://example.com/ch1.jpg",
      "url": "https://related-link.com"
    },
    {
      "startTime": 300,
      "title": "Main Topic: AI Ethics",
      "startTime": 300
    }
  ]
}
```

**PodBrain mapping:**
- Show notes generation already produces structured chapter-like sections
- AssemblyAI provides chapter detection
- AI can generate chapter titles + timestamps from transcript sections
- Host chapters JSON on Supabase Storage → URL for the tag

---

## Additional Tags — Lower Priority but Easy Adds

### `<podcast:funding>` — Support Links
```xml
<podcast:funding url="https://patreon.com/myshow">Support us on Patreon!</podcast:funding>
```
- User enters their support/donation links in Show Settings
- PodBrain adds the tag automatically
- 21 apps display funding links

### `<podcast:podroll>` — Show Recommendations
```xml
<podcast:podroll>
  <podcast:remoteItem feedGuid="abc-123" title="Related Show" />
</podcast:podroll>
```
- Taddy cross-show intelligence identifies related podcasts
- PodBrain can auto-generate podroll recommendations
- Nice cross-promotion feature for Agency plan users

### `<podcast:location>` — Where Content Is About/Made
```xml
<podcast:location geo="geo:30.27,-97.74" country="US">Austin, TX</podcast:location>
```
- AI can extract locations mentioned in episodes
- Or user sets their studio location in settings
- Enables location-based podcast discovery

### `<podcast:medium>` — Content Type
```xml
<podcast:medium>podcast</podcast:medium>
```
- Trivial — just declare it's a podcast
- Helps apps categorize correctly

### `<podcast:txt>` — Verification & Metadata
```xml
<podcast:txt purpose="verify">verification-code-here</podcast:txt>
```
- Enables feed verification with third-party services
- PodBrain could add SEO-related metadata here

---

## How This Becomes a Differentiator

### The Competitive Landscape

| Competitor | Generates PC2.0 Tags? | Consumes PC2.0 Data? |
|-----------|----------------------|---------------------|
| Descript | No | No |
| Riverside | No | No |
| Podium | No | No |
| Buzzsprout | Some (manual) | No |
| Captivate | Basic (manual) | No |
| Transistor | No | No |
| Castopod | Yes (open source) | Partial |
| **PodBrain** | **Yes (automated)** | **Yes (via Taddy)** |

Castopod is the closest competitor in this space, but it's a self-hosted open-source platform — different target market. No SaaS podcast platform automatically generates Podcasting 2.0 tags from AI processing.

### The Flywheel Effect

```
PodBrain processes episode
    ↓
Generates <podcast:person>, <podcast:transcript>, <podcast:soundbite>, <podcast:chapters>
    ↓
User publishes episode with enhanced RSS tags
    ↓
Podcast Index / Taddy indexes the new tags
    ↓
80+ Podcasting 2.0 apps show enhanced episode data
    ↓
PodBrain's Taddy queries return richer data (more persons, transcripts)
    ↓
Expert Discovery, Pre-Interview Intelligence get better
    ↓
More podcasters adopt PodBrain (better data = better product)
    ↓
More episodes processed with PC2.0 tags
    ↓
[Cycle repeats — each PodBrain user makes the product better for all users]
```

### Marketing Angle

**"PodBrain is the first AI podcast platform built for Podcasting 2.0"**

- "Your episodes automatically get person tags, transcripts, soundbites, and chapters in the open standard"
- "80+ podcast apps will show your enhanced episode data"
- "Apple Podcasts will display your transcripts"
- "Your guests become discoverable across the entire podcast ecosystem"
- "Join the future of open podcasting"

This positions PodBrain as forward-thinking and standards-aligned, which appeals to:
1. **Independent podcasters** (care about open standards, hate platform lock-in)
2. **Podcast agencies** (want differentiated features for their clients)
3. **Tech-savvy early adopters** (the exact audience that adopts new tools first)

---

## Implementation Architecture

### Where the Tag Generation Lives

PodBrain's processing pipeline already runs through Trigger.dev background jobs. Podcasting 2.0 tag generation is a **post-processing step** after the existing pipeline completes:

```
Audio Upload → AssemblyAI Transcription → Vocabulary Processing → Grok Generation
    ↓
[Existing pipeline ends here]
    ↓
NEW: Podcasting 2.0 Tag Generation Step
    ↓
    ├── Generate VTT transcript file → Upload to Storage → transcript tag
    ├── Convert viral_moments → soundbite tags
    ├── Generate chapters JSON → Upload to Storage → chapters tag
    ├── Extract guest name + host → person tags
    └── Compile all tags → Store as generated asset (type: 'rss_enhancement')
```

### How Tags Reach the User's RSS Feed

PodBrain does NOT host podcast RSS feeds — Buzzsprout (or other hosts) do. So we need a delivery mechanism:

**Option A: RSS Enhancement Snippet (MVP)**
- Generate the XML snippet containing all Podcasting 2.0 tags
- Display it in the episode workspace ("RSS Tags" section)
- User copies and pastes into their hosting platform's custom RSS field
- Works with ANY host that supports custom RSS tags (Buzzsprout, Captivate, Transistor, etc.)

**Option B: Buzzsprout API Integration (Phase 2)**
- PodBrain already has Buzzsprout API integration
- Use Buzzsprout's API to inject custom tags into the feed
- Automatic — no user action needed
- Limited to Buzzsprout users

**Option C: RSS Proxy Feed (Phase 3 / Post-Launch)**
- PodBrain generates an enhanced RSS feed URL
- Takes user's original feed → adds Podcasting 2.0 tags → outputs enhanced feed
- User submits enhanced feed URL to Apple Podcasts, Spotify, etc.
- Full control, works with any host
- Requires PodBrain to host/proxy the feed (infrastructure cost)

**Recommendation:** Start with Option A for MVP. It works immediately, requires no hosting infrastructure, and educates users about Podcasting 2.0. Move to Option B for Buzzsprout users. Consider Option C for post-launch if there's demand.

### File Hosting for Transcripts & Chapters

Transcripts and chapters need to be hosted at a URL. Options:

1. **Supabase Storage (recommended for MVP):** Free tier includes 1GB, Pro includes 100GB. VTT files are tiny (~50KB per hour of audio). Chapters JSON even smaller.
2. **User's own CDN:** Advanced users can host files themselves
3. **PodBrain CDN:** Long-term, host on our own CDN for reliability

---

## Implementation: Consolidated 2-Batch Approach

Since PodBrain is pre-launch, there's no reason to phase Podcasting 2.0 across 5 micro-phases. **80% of the work has zero dependencies** — it's reformatting data PodBrain already generates. The remaining 20% depends on Taddy being wired up.

### Batch 1: Build With the Processing Pipeline (No Dependencies)

Everything here uses data the existing pipeline already produces. Build alongside the core processing pipeline work.

- [ ] Add `rss_enhancement` to the `asset_type` enum
- [ ] Create `lib/podcasting2/tag-generators.ts` — functions for each PC2.0 tag
- [ ] Generate VTT transcript file from AssemblyAI output
- [ ] Generate chapters JSON from AI chapter detection / show notes sections
- [ ] Convert `viral_moments[]` → `<podcast:soundbite>` tags
- [ ] Generate basic `<podcast:person>` tags (guest name + host name from episode/show metadata)
- [ ] Generate `<podcast:medium>` tag (always "podcast")
- [ ] Generate `<podcast:txt>` tag (verification string support)
- [ ] Upload VTT + chapters files to Supabase Storage, get public URLs
- [ ] Create `lib/podcasting2/rss-snippet.ts` — compile all tags into copyable XML snippet
- [ ] Store RSS enhancement as generated asset
- [ ] Add RSS Tags section to episode workspace UI
- [ ] Add copy-to-clipboard for RSS snippet
- [ ] Add `<podcast:funding>` from show settings (user-provided support links)

### Batch 2: Enrich After Taddy Integration (Depends on Taddy)

These enhance existing tags with real ecosystem data. Build after Taddy client is working.

- [ ] Enrich `<podcast:person>` tags with `img` and `href` from Taddy search results
- [ ] Generate `<podcast:podroll>` from Taddy cross-show intelligence
- [ ] Generate `<podcast:location>` from AI content analysis
- [ ] Buzzsprout auto-injection via API
- [ ] RSS proxy feed option (post-launch consideration)

### Relationship to Taddy Integration Plan

The Podcasting 2.0 strategy and Taddy integration are **complementary and synergistic**:

| Taddy Plan | PC2.0 Strategy | Synergy |
|------------|---------------|---------|
| Expert Discovery reads `persons` from Taddy | PodBrain generates `<podcast:person>` tags | PodBrain's users make Taddy's person data richer |
| Pre-Interview reads transcripts from Taddy | PodBrain generates `<podcast:transcript>` tags | PodBrain's transcripts become available to other tools |
| Guest Package uses real episode data | `<podcast:person>` makes guests discoverable | Guests benefit from PodBrain, driving adoption |
| Cross-show intelligence from Taddy search | `<podcast:podroll>` exports related shows | Discoverability works both directions |

---

## Cost Impact

### Additional Costs
- **Supabase Storage:** Minimal — VTT files ~50KB each, chapters ~5KB each. 10,000 episodes = ~550MB. Well within free tier.
- **Processing time:** Tag generation adds ~2-5 seconds to the pipeline. Negligible.
- **No additional API costs** — all data comes from existing pipeline outputs (AssemblyAI transcript, Grok generation, viral moments).

### Revenue Impact
- This is a **value-add feature**, not a cost center
- Can be positioned as a Pro/Agency tier differentiator
- Free tier: Basic tags (transcript, soundbite)
- Pro tier: All tags including person, chapters
- Agency tier: Buzzsprout auto-injection, RSS proxy

---

## Risk Assessment

### Low Risks
1. **Tag format is standardized** — clear spec, no ambiguity
2. **No API dependency** — tags are generated from PodBrain's own data
3. **Backward compatible** — RSS readers ignore unknown tags
4. **No cost** — uses existing data and infrastructure

### Medium Risks
1. **User confusion** — podcasters may not understand Podcasting 2.0 yet. Mitigation: In-app education, "What is this?" tooltips.
2. **Host compatibility** — not all hosts support custom RSS tags. Mitigation: Start with snippet + Buzzsprout integration, expand later.
3. **Adoption uncertainty** — Podcasting 2.0 may not gain traction. Mitigation: The tags are free to generate, low downside if adoption stays niche.

### Things That Could Go Wrong
1. **Apple/Spotify ignore the tags** — Unlikely for transcripts (Apple already supports them), possible for others. No harm done either way.
2. **Tag format changes** — The spec is versioned and backward-compatible. Low risk.
3. **Users don't care** — But the data already exists; generating tags is nearly zero effort once built.

---

## The Big Picture Narrative

PodBrain's positioning:

1. **TODAY:** "AI-powered show notes and content generation for podcasters"
2. **WITH TADDY:** "AI-powered podcast intelligence — real data, not hallucinations"
3. **WITH PC2.0:** "The first AI podcast platform built for the open podcast ecosystem"

Podcasting 2.0 transforms PodBrain from a content generation tool into an **ecosystem participant**. Every episode PodBrain processes makes the entire podcast ecosystem richer. That's a story investors, podcasters, and the podcast community can get behind.

**Tagline options:**
- "PodBrain: Where AI meets Open Podcasting"
- "Make every episode Podcasting 2.0 ready — automatically"
- "Your AI podcast assistant, built for the open web"

---

## Appendix: Complete Tag Specifications Reference

### `<podcast:person>`
- **Parent:** `<item>`
- **Node value:** Person's name (max 128 chars, required)
- **Attributes:** `role` (optional, default "host"), `group` (optional, default "cast"), `img` (optional, avatar URL), `href` (optional, profile URL)
- **Cardinality:** Multiple per item
- **App support:** 11+ apps

### `<podcast:transcript>`
- **Parent:** `<item>`
- **Attributes:** `url` (required), `type` (required: text/plain, text/html, text/vtt, application/json, application/x-subrip), `language` (optional), `rel` (optional: "captions")
- **Cardinality:** Multiple per item (one per type/language)
- **App support:** 25+ apps including Apple Podcasts

### `<podcast:soundbite>`
- **Parent:** `<item>`
- **Attributes:** `startTime` (required, float seconds), `duration` (required, float seconds, recommend 15-120s)
- **Node value:** Title (optional, max 128 chars)
- **Cardinality:** Multiple per item
- **App support:** 5 apps (niche but growing)

### `<podcast:chapters>`
- **Parent:** `<item>`
- **Attributes:** `url` (required, hosted JSON file), `type` (required, prefer "application/json+chapters")
- **Cardinality:** Single per item
- **App support:** 20+ apps

### `<podcast:funding>`
- **Parent:** `<channel>`, `<item>`
- **Attributes:** `url` (required)
- **Node value:** Display text (max 128 chars)
- **App support:** 21 apps, 24 platforms

### `<podcast:podroll>`
- **Parent:** `<channel>`
- **Children:** One or more `<podcast:remoteItem>` elements
- **remoteItem attributes:** `feedGuid` (required), `feedUrl` (optional), `title` (optional)

### `<podcast:location>`
- **Parent:** `<item>`, `<channel>`
- **Attributes:** `geo` (recommended, RFC5870), `osm` (recommended, OpenStreetMap ID), `country` (recommended, ISO 3166-1 alpha-2), `rel` (recommended: "subject" or "creator")
- **Node value:** Human-readable location (max 128 chars)

### `<podcast:txt>`
- **Parent:** `<channel>`, `<item>`
- **Attributes:** `purpose` (optional, max 128 chars: "verify", "release", domain name, etc.)
- **Node value:** Free-form text (max 4000 chars recommended)

### `<podcast:medium>`
- **Parent:** `<channel>`
- **Node value:** podcast, music, video, film, audiobook, newsletter, blog, publisher, course
- **Variants:** Append "L" for list feeds (e.g., "podcastL"), "mixed" for multi-type lists

### `<podcast:value>`
- **Parent:** `<channel>`, `<item>`
- **Attributes:** `type` (required, payment protocol), `method` (required, transport), `suggested` (optional, amount)
- **Children:** One or more `<podcast:valueRecipient>` elements
- **Note:** Complex tag — requires companion spec. Future consideration for PodBrain.
