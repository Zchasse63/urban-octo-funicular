# MagicPath Prompts — PodBrain UI

Use these sequentially. Mark each output as a Design Reference before moving to the next.
Set up the theme first with the color tokens below.

---

## Theme Setup (paste into MagicPath theme settings)

**Colors:**
- Background: #EDEAE5 (warm stone)
- Surface/Cards: #FAFAF8 (warm white)
- Sidebar: #E4E0DA
- Primary accent: #2563EB (electric blue)
- Warm accent: #C2693D (terracotta)
- Text primary: #1A1A1A
- Text secondary: #71717A
- Text muted: #A1A1AA
- Border: #D0CDC7
- Success: #16A34A
- Error: #DC2626

**Fonts:**
- Display/Headlines: Space Grotesk (geometric sans)
- Body text: Source Serif 4 (editorial serif)
- Mono/metadata: JetBrains Mono

---

## Prompt 1: Sidebar Navigation
**Mark output as: `@Sidebar`**

```
Act as a Senior UX/UI Engineer specializing in editorial media tools and broadcast interfaces.

This is a sidebar navigation for PodBrain — an AI-powered podcast production studio. The users are independent podcasters and podcast agencies who process audio into AI-generated content (show notes, social posts, SEO analysis, guest packages).

The emotional tone is "pilot's cockpit meets Swiss editorial design" — precise, information-dense, warm but professional. Think Zed editor meets a high-end recording studio control panel. NOT enterprise SaaS gray. NOT generic AI purple gradients.

Build a fixed 240px sidebar with:
- Brand area at top: "PodBrain" with an icon and "AI Studio" subtitle
- A show selector dropdown (podcasters manage multiple shows)
- Two nav sections: "Workspace" (Episodes, Upload) and "Tools" (Vocabulary, Experts)
- A usage/plan indicator card near the bottom showing plan limits
- Footer with Settings, Support, theme toggle, and collapse toggle

Key design DNA:
- Warm stone/paper palette — not cold gray
- Typography: Space Grotesk for nav labels, JetBrains Mono for metadata/counts
- Active nav items should feel like physical cards that lift off the surface
- The brand icon should feel premium — gradient, depth, subtle glow
- Status dots and colored indicators are a signature pattern
- 8px border-radius on cards, 6px on interactive elements
- Borders and subtle inset shadows define surfaces rather than heavy drop shadows

Let the design breathe. Surprise me with the details.
```

---

## Prompt 2: Episodes List
**Mark output as: `@Episodes_List`**

```
Act as a Senior UX/UI Engineer specializing in content management interfaces for creative professionals.

This is the main episodes list for PodBrain — the primary screen where podcasters scan and select their episodes. It sits to the right of @Sidebar against a warm stone background (#EDEAE5).

The vibe is a well-organized music library or editorial content feed — scannable, information-rich but not cluttered. Each episode should feel like a tangible card you could pick up.

Build an episodes list page with:
- Page header: "Episodes" title with a brief description
- Search bar and status filter pills (All, Completed, Processing, Draft)
- A vertical list of episode cards, each showing: status indicator, episode number, title, date, duration, and an SEO score
- Empty state for when no episodes exist yet

Design considerations:
- Episode cards should have satisfying hover states — maybe a subtle lift, color shift, or accent reveal
- Status should be immediately scannable — use color-coded dots or indicators
- The SEO score should be glanceable as a small badge or pill
- Typography mix: Space Grotesk for titles/labels, JetBrains Mono for metadata (dates, durations, episode numbers), Source Serif 4 for descriptions
- A subtle dot-grid or line-grid pattern on the background adds texture without competing
- Search input should feel integrated, not floating — give it presence with border treatment and subtle depth
- Cards use warm white (#FAFAF8) with visible but not harsh borders

Make the empty state feel inviting, not sad. Encourage the user to upload their first episode.
```

---

## Prompt 3: Episode Workspace (Detail View)
**Mark output as: `@Episode_Workspace`**

```
Act as a Senior UX/UI Engineer building a multi-tab content workspace for creative professionals.

This is the episode detail page for PodBrain — the mission-critical screen where podcasters review AI-generated content for a single episode. It needs to handle dense information across 5 tabs while still feeling calm and organized. Sits to the right of @Sidebar.

Think of it like a recording engineer's mixing console — many channels, clear routing, everything accessible but not overwhelming.

Build an episode workspace with:
- Header: Back link to episodes, episode title, status badge (Completed/Processing/Draft), and a signal chain showing processing steps (Upload → Transcribe → Generate → Ready) as connected status dots
- Tab bar with 5 tabs: Show Notes, Assets, Transcript, Guest Package, Intelligence
- Show Notes tab (default): Two-column layout — left side has the rendered show notes content with rich editorial typography (headings, paragraphs, bullet lists), right side has an SEO analysis panel with a circular score gauge and breakdown cards
- Assets tab: Categories of AI-generated content types (Core, Social, Long-form, Guest, Visual, AI Summary) with Generate buttons per asset and a Generate All option
- Transcript tab: Timestamped, speaker-labeled transcript segments

Design considerations:
- The tab system is the backbone — active tab should be unmistakable
- Show notes should read like a beautifully typeset document — Source Serif 4 body text with generous line height, Space Grotesk headings
- The SEO sidebar should feel like a dashboard widget — data-dense but clear
- Asset categories should have visual differentiation (colored dots, icons, or accent lines)
- Generate buttons should show loading → complete states
- Transcript segments should have clear speaker attribution and be easy to scan
- The signal chain is a signature UI element — make it feel like a real hardware status display

Give me your best interpretation of "Swiss broadcast meets recording studio."
```

---

## Prompt 4: Upload Flow
**Mark output as: `@Upload_Flow`**

```
Act as a Senior UX/UI Engineer building a multi-step file upload wizard for a creative tool.

This is the upload flow for PodBrain — a 3-step process where podcasters upload audio, add details, and kick off AI processing. It should feel focused and calming — this is a "hand off your work to the AI" moment. Centered layout (max-width ~640px) to the right of @Sidebar.

Build a 3-step upload wizard:
1. Select File — A large, inviting dropzone for audio files (MP3, WAV, M4A). Should feel like a landing pad. Show file info after selection.
2. Details — Form with episode title, number, description, show selector. Clean form design.
3. Process — Progress visualization as AI processes the episode. Show processing stages.

Step indicator at top connecting the three steps.

Design considerations:
- The dropzone is the hero moment — make it feel special. A dashed border alone is boring. Think about texture, icon presence, or subtle animation that says "drop it here"
- Step indicator should clearly show progress — completed steps feel resolved, current step feels active, future steps feel waiting
- Terracotta (#C2693D) is our warm accent — great for progress indicators and completion states
- The form step should be clean and simple — don't over-design inputs, but give them subtle depth (inset shadows, border treatment)
- The processing step should feel like watching a machine work — status stages with animated indicators
- Centered narrow layout creates focus — the user shouldn't feel overwhelmed
- Use the warm stone background to your advantage — the card content floats above it
```

---

## Prompt 5: Settings & Pricing
**Mark output as: `@Settings`**

```
Act as a Senior UX/UI Engineer building a subscription settings page for a SaaS product.

This is the settings page for PodBrain — showing the user's current plan, pricing tiers, and integrations. Centered layout (max-width ~896px) to the right of @Sidebar.

Three tiers: Free ($0, 3 eps/mo, 1 show), Pro ($19/mo, unlimited eps, 3 shows), Agency ($49/mo, unlimited, 20 shows, 5 seats). Pro is the recommended tier.

Build a settings page with:
- Current plan summary card
- 3-column pricing grid where the Pro card POPS — it should be the obvious choice visually
- Integrations section (Buzzsprout, Stripe) with connection status

Design considerations:
- The Pro card needs to be the undeniable focal point — border accent, subtle glow, badge, whatever makes it magnetically draw the eye without being gaudy
- Free and Agency cards should be clean and understated by comparison
- Feature lists with checkmarks — give the checks some personality (tinted backgrounds, not just bare icons)
- Pricing numbers should be bold and large — the price is the anchor
- Integration rows should feel like connected/disconnected hardware modules
- "Upgrade" CTAs should use the primary blue with the tactile button style (inset highlights, depth shadows)
- Warm, editorial feel throughout — Space Grotesk for headings, Source Serif 4 for descriptions
```

---

## After generating all 5:

1. Use `/variants 3` on any screen you want to explore alternatives for
2. Compose them together: "Create a full app layout. Place @Sidebar on the left (240px fixed). Place @Episodes_List in the main content area. Background #EDEAE5."
3. Export as React + Tailwind when satisfied
