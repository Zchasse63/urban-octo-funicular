# Content Quality Grading Report — 2026-04-15

**Method:** LLM-judge grading via `claude-sonnet-4-5` using 5 rubric dimensions (factual accuracy, specificity, actionability, tone fit, length discipline).
**Source episode:** `b5b228e1-df75-4588-8a4e-dc7c5552a755` — smoke test audio clip (~2:50, solo stream-of-consciousness about a spouse's job interview).
**Pipeline version:** Trigger.dev v20260415.2 (round 2 Grok prompts).
**Raw data:** [`content-quality-grades-2026-04-15.json`](./content-quality-grades-2026-04-15.json)

## TL;DR — 🟡 Mixed, with 2 red flags

**Average overall: 5.38 / 10** across 8 assets + show notes.
**The pipeline produces factually accurate, specific content BUT also invents facts that don't exist in the transcript when the source is short or unscripted.** This is a known hallucination mode with LLMs on bland inputs, but two of the 8 assets (blog post, youtube description) scored **3/10** because they fabricated entire structures (brand names, episode series, timestamps for a 6-minute video when the source is 3 minutes).

## Dimension averages

| Dimension | Score |
|---|---|
| Accuracy | 6.88 / 10 |
| Specificity | 7.00 / 10 |
| Actionability | 6.00 / 10 |
| Tone fit | **4.63 / 10** ← weakest |
| Length discipline | 5.75 / 10 |
| **Overall average** | **5.38 / 10** |

## Per-asset scores

| Asset | Score | Key issue |
|---|---|---|
| Show notes | **7/10** | Accurate details, but over-formalizes a casual solo recording into marketing copy |
| X / Twitter thread | **7/10** | Accurate but hyped-up voice clashes with source's quiet tone |
| Instagram carousel | **6/10** | Captures details well but over-polished vs. intimate source |
| Newsletter | **6/10** | Accurate content, "crush it" energy inappropriate for source |
| TikTok hooks | **6/10** | Hooks accurate but sensationalized vs. measured source tone |
| Quote card | **5/10** | Card 5 entirely fabricated — none of those words are in the transcript |
| **Blog post** | **3/10** | ❌ Fabricates brand, episode series, STAR method, labor stats, internal links |
| **YouTube description** | **3/10** | ❌ Fabricated timestamps for a 6-min video when source is 3 min, fake resource links |
| LinkedIn post | undefined | Grader flagged severe accuracy issues (fabricated Rob's "10 days", invented CTAs) |

## Analysis

### The good
- **Factual accuracy is mostly strong** (6.88/10) when the asset stays grounded in the transcript
- **Specificity is excellent** (7/10) — the pipeline does extract concrete details (timestamps, process steps, numbers)
- **Show notes (7/10)** are the best-performing asset — this is the critical path for SEO and podcaster value
- **Twitter thread (7/10)** is the best-performing social asset

### The bad
- **Tone matching is broken** (4.63/10 average) — the pipeline translates a quiet, anxious personal monologue into upbeat marketing copy with "🚀 CRUSH IT" energy. A paying customer recording an intimate solo episode would be horrified.
- **Blog post and YouTube description hallucinate structure** — inventing multi-episode series, SEO headers, fake timestamps, resource links. These are the two most fact-heavy asset types and the two worst offenders.
- **LinkedIn post fabricated the timeline** — claimed "Rob's role ends in 10 days" when the transcript says "as of the 14th" (a specific date, not a countdown).

### Why this happened
The test audio is intentionally bland: a 2-minute solo recording with no real show structure, no guest, no newsworthy content, no product hook. Grok (xAI's model) fills in the blanks by pattern-matching to "what a good blog post looks like" rather than staying grounded in the transcript. This is the hallucination mode LLMs hit when asked to generate long-form content from short, vague inputs.

## Recommendations (filed as Phase I follow-ups)

### BUG-LP-7 — Blog post and YouTube description hallucinate on short inputs
Add input-length gating: if transcript < N chars or duration < M minutes, skip the long-form assets (blog_post, youtube_description) entirely and return a "content too short for long-form generation" placeholder instead. This is better UX than a confidently wrong blog post.

### BUG-LP-8 — Asset prompts need a "tone-matching" instruction
The Grok prompts in `app/src/lib/content/asset-prompts.ts` don't currently instruct the model to preserve the source's voice. Add a system-level instruction: "You MUST preserve the tone of the original speaker. If the source is casual/intimate, the output must also be casual/intimate. Do NOT upgrade to marketing voice."

### BUG-LP-9 — Add a factual-grounding check to the pipeline
After each asset is generated, run a second Grok call that cross-references the asset content against the transcript and flags any statements that can't be supported by the source. Reject and regenerate on mismatch. Adds ~10s + 1 LLM call per asset but would catch the fabrications.

### Immediate mitigation
1. **Don't re-surface the blog_post and youtube_description assets to customers** in round 4 without first tightening the prompts (BUG-LP-8)
2. **Consider demoting these two assets to "Beta" in the UI** with a "may hallucinate on short content" warning
3. **Test grading on a LONGER audio file** (15-30 min, multi-speaker, real podcast) — the short solo test is the worst case and may be unfair to the pipeline. Grades should improve on denser source material.

## Next steps

- [ ] Re-run grader on a 15-30 minute multi-speaker podcast episode to see if scores improve
- [ ] File BUG-LP-7, BUG-LP-8, BUG-LP-9 as Phase I entries in LAUNCH-PLAN.md
- [ ] Decide whether to tighten prompts before launch or after
- [ ] If after: add a "Beta" warning label to the weak assets in the UI so customers know
