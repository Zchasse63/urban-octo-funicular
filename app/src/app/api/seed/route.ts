import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { devGuard } from '@/lib/api/dev-guard'
import { isTaddyAvailable, getTaddyClient } from '@/lib/taddy/client'

// ─── Demo Credentials ───
//
// Pulled from environment so credentials are not committed to source. The
// route is dev-only (gated by NODE_ENV !== 'production' AND devGuard()), but
// keeping secrets out of git is best practice regardless. Set these in your
// `.env.local` to enable seeding:
//
//   SEED_DEMO_EMAIL=demo@example.test
//   SEED_DEMO_PASSWORD=<any strong password>
//   SEED_DEMO_NAME="Alex Morgan"

const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL || ''
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || ''
const DEMO_NAME = process.env.SEED_DEMO_NAME || 'Demo User'
const OLD_PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000001'

// ─── Admin Client (bypasses RLS) ───

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Helpers ───

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function hoursAgo(n: number): Date {
  const d = new Date()
  d.setHours(d.getHours() - n)
  return d
}

// ─── Show Notes ───

const showNotesContent: Record<string, string> = {
  'scaling-laws': `## Scaling Laws and the Bitter Lesson: What GPT-5 Teaches Us About Intelligence

In this episode, Dr. Amara Osei joins us to unpack the implications of scaling laws — the empirical finding that model performance improves predictably with more compute, data, and parameters. We explore why Richard Sutton's "Bitter Lesson" keeps proving true, and what GPT-5's architecture reveals about the path to artificial general intelligence.

### Key Topics
- Why scaling laws have held across six orders of magnitude of compute
- The difference between System 1 and System 2 reasoning in large language models
- How GPT-5's chain-of-thought training differs from previous approaches
- The role of synthetic data in pushing past the data wall
- Whether current architectures can achieve genuine understanding or remain sophisticated pattern matching
- Implications for AI safety as capabilities outpace alignment research

### Timestamps
- 00:00 — Introduction and Dr. Osei's work at Stanford HAI
- 04:30 — The Bitter Lesson: why general methods always win
- 12:15 — Chinchilla scaling laws and compute-optimal training
- 21:40 — What GPT-5 actually changed architecturally
- 33:00 — The synthetic data debate
- 42:20 — Emergent capabilities and phase transitions
- 51:45 — AI safety implications of rapid capability gains
- 58:30 — Predictions: where we'll be in 2028

### Resources Mentioned
- Richard Sutton, "The Bitter Lesson" (2019)
- Kaplan et al., "Scaling Laws for Neural Language Models" (2020)
- Anthropic's Scaling Monosemanticity research (2024)
- Stanford HAI 2026 Annual Report
- Dr. Osei's lab: stanford.edu/~aosei`,

  'ai-agents': `## Building AI Agents That Don't Hallucinate: Lessons from Production

Rafael Dominguez, CTO of AgentOps, has deployed autonomous AI agents across 40+ enterprise customers. In this episode, he shares hard-won lessons about what makes agents reliable enough for production — and why most agent frameworks are solving the wrong problem.

### Key Topics
- The three categories of agent failure: hallucination, tool misuse, and scope creep
- Why RAG alone doesn't solve hallucination in agentic workflows
- The "trust budget" framework for managing agent autonomy
- Building guardrails that don't kill performance
- Monitoring and observability for agents running 24/7
- Cost management: how they reduced API spend by 60% without quality loss

### Timestamps
- 00:00 — Introduction
- 05:20 — Rafael's path from Stripe to founding AgentOps
- 15:00 — Defining "production-ready" for AI agents
- 22:30 — The three failure modes nobody warns you about
- 32:45 — The trust budget framework
- 41:10 — Real monitoring dashboards from production agents
- 50:00 — Cost optimization without quality regression
- 58:30 — The future of autonomous agents in enterprise
- 63:00 — Rapid-fire: tools, books, and predictions

### Resources Mentioned
- "Building Effective Agents" — Anthropic Blog (2025)
- AgentOps observability platform: agentops.ai
- LangSmith for agent tracing
- Stripe's internal agent deployment playbook (referenced with permission)`,

  'open-weight': `## The Open Weight Revolution: Why Meta Gave Away Llama

A solo deep-dive into the most consequential strategic move in AI history: Meta's decision to release Llama as open-weight models. We trace the history from GPT-2's controversial release to today's landscape where open models routinely match closed-source performance, and examine who really benefits.

### Key Topics
- The difference between "open source," "open weight," and "open-ish" AI models
- Meta's strategic calculus: why giving away Llama makes business sense
- Llama 3.1 vs. Mistral Large vs. Qwen 2.5 vs. DeepSeek — the current landscape
- How a 3-person startup fine-tuned a model that beats GPT-4 on domain tasks
- The licensing debate and what "truly open" means for AI
- Why governments and regulated industries are betting on open models

### Timestamps
- 00:00 — Introduction
- 04:00 — A brief history of open AI: from GPT-2 to Llama
- 14:30 — Meta's $35 billion open-source bet
- 24:00 — The model landscape: who's building what
- 33:20 — Fine-tuning revolution: small teams, big results
- 42:00 — The licensing minefield: Apache 2.0, Llama License, and more
- 49:15 — Government adoption and sovereign AI
- 53:40 — My predictions for the open model ecosystem in 2027

### Resources Mentioned
- Meta AI blog: "Open Innovation in AI" (2025)
- Mistral AI technical reports
- Hugging Face Open LLM Leaderboard
- "The Economics of Open Source AI" — a]16z report`,

  'contentkit': `## From Ramen Profitability to $12M ARR: The ContentKit Story

Nadia Kovac built ContentKit as a weekend project to scratch her own itch — a tool to repurpose podcast episodes into social media content. Three years later, it's a $12M ARR platform serving 4,000 content teams. In this raw conversation, she shares the pivots, the near-death experiences, and the decisions that separated ContentKit from the 99% of startups that fail.

### Key Topics
- The accidental product-market fit that changed everything
- Why she turned down a $3M seed round to stay bootstrapped
- The Reddit post that brought 600 signups overnight
- Scaling from 0 to 4,000 customers with a 4-person team
- The pricing disaster that nearly killed the company (and how she fixed it)
- Building company culture as a fully remote, bootstrapped startup

### Timestamps
- 00:00 — Introduction
- 06:30 — The weekend project that started it all
- 14:00 — First paying customer: a $9/month plan
- 22:45 — The Reddit post that changed everything
- 31:20 — Turning down VC money
- 39:00 — The pricing pivot: from $9 to $49/month
- 47:30 — Scaling the team without scaling the burn
- 55:10 — The partnership that unlocked enterprise
- 62:00 — Advice for first-time founders
- 65:30 — Lightning round

### Resources Mentioned
- "The Mom Test" by Rob Fitzpatrick
- "Obviously Awesome" by April Dunford
- Indie Hackers community
- Stripe Atlas for company formation`,

  'pricing-page': `## The Pricing Page Nobody Sees: How We A/B Tested Our Way to 3x Revenue

James Whitfield, Head of Growth at PriceLab, has run 200+ pricing experiments for SaaS companies. In this data-heavy episode, he reveals the psychological principles behind high-converting pricing pages, the most common mistakes founders make, and the exact framework his team uses to optimize pricing without alienating existing customers.

### Key Topics
- Why most SaaS companies underprice by 2-4x
- The "anchoring ladder" technique that increased conversions by 34%
- How to run pricing experiments without destroying customer trust
- The decoy effect: why three tiers always outperform two
- Enterprise pricing: when to show prices and when to hide them
- Grandfathering strategies that retain customers through price increases

### Timestamps
- 00:00 — Introduction
- 04:45 — James's background: from behavioral economics to SaaS pricing
- 12:30 — The underpricing epidemic in SaaS
- 20:00 — Pricing psychology: anchoring, framing, and the decoy effect
- 29:15 — The PriceLab A/B testing framework
- 38:40 — Case study: 3x revenue with one pricing page change
- 46:00 — Enterprise pricing strategies
- 52:30 — Grandfathering and managing price increases
- 56:00 — Tools and resources for pricing optimization

### Resources Mentioned
- "Monetizing Innovation" by Madhavan Ramanujam
- ProfitWell (now Paddle) pricing benchmarks
- Van Westendorp Price Sensitivity Meter
- Patrick Campbell's pricing research archive`,
}

// ─── Transcript Generators ───

function makeTranscriptSegments(
  durationSeconds: number,
  hostName: string,
  guestName: string | null,
): Array<{ text: string; start: number; end: number; speaker: string; confidence: number }> {
  const segments: Array<{ text: string; start: number; end: number; speaker: string; confidence: number }> = []
  const speakers = guestName ? [hostName, guestName] : [hostName]

  const dialogues: Array<{ speaker: string; text: string }> = guestName
    ? [
        { speaker: hostName, text: "Welcome to the show. I've been really looking forward to this conversation." },
        { speaker: guestName, text: "Thanks for having me. I've been listening to the podcast for a while, so it's great to finally be on the other side." },
        { speaker: hostName, text: "Let's dive right in. I want to start with the thing everyone's been talking about." },
        { speaker: guestName, text: "Sure. So the way I think about it is — and this might be controversial — the conventional wisdom is almost entirely wrong on this topic." },
        { speaker: hostName, text: "That's a bold claim. Can you unpack that a bit?" },
        { speaker: guestName, text: "Absolutely. So when you look at the data, and I mean really look at it, not just the headline numbers, you start to see a completely different picture." },
        { speaker: hostName, text: "And what does that picture look like in practice? Like, for teams that are actually building this stuff?" },
        { speaker: guestName, text: "In practice, it means you have to throw out about half of what you learned in the last five years. The landscape has shifted that dramatically." },
        { speaker: hostName, text: "That resonates with what I've been hearing from other guests. There's this sense that the old playbook is broken." },
        { speaker: guestName, text: "Completely broken. And the companies that are winning right now are the ones who figured that out early." },
        { speaker: hostName, text: "So what does the new playbook look like? If someone's listening to this and wants to get started, where do they begin?" },
        { speaker: guestName, text: "Step one is always the same: start small, measure everything, and iterate fast. Don't try to boil the ocean." },
        { speaker: hostName, text: "I love that. Start small, measure, iterate. Simple but powerful." },
        { speaker: guestName, text: "The simplicity is what makes it work. The companies that overcomplicate this are the ones that fail." },
        { speaker: hostName, text: "Before we wrap up — any predictions? Where do you see this heading in the next couple of years?" },
        { speaker: guestName, text: "I think we're about 18 months away from a major inflection point. The technology will be mature enough that it becomes table stakes." },
        { speaker: hostName, text: "That's a powerful note to end on. Thank you so much for coming on the show." },
        { speaker: guestName, text: "Thank you. This was a great conversation." },
      ]
    : [
        { speaker: hostName, text: "Hey everyone, welcome back to the show. Today I'm doing a solo deep-dive on a topic I've been wanting to cover for a while." },
        { speaker: hostName, text: "Before we get into it, I want to set some context. This is one of those topics where the nuance really matters." },
        { speaker: hostName, text: "So let's start with the basics. What are we actually talking about when we use this term?" },
        { speaker: hostName, text: "The history here is fascinating. If you go back just five years, none of this existed. The pace of change has been staggering." },
        { speaker: hostName, text: "Now here's where it gets interesting. The data tells a story that most people in the industry don't want to hear." },
        { speaker: hostName, text: "I'm going to share some numbers that I think will surprise you. I was certainly surprised when I first saw them." },
        { speaker: hostName, text: "So what does this mean for practitioners? I think there are three key takeaways." },
        { speaker: hostName, text: "First, the landscape is shifting faster than most organizations can adapt. That's both a risk and an opportunity." },
        { speaker: hostName, text: "Second, early movers have a significant advantage. We're talking about a 12 to 18 month head start that compounds over time." },
        { speaker: hostName, text: "And third — and I think this is the most important one — the most successful approach is iterative, not waterfall." },
        { speaker: hostName, text: "Let me give you a concrete example of what I mean by that." },
        { speaker: hostName, text: "Alright, that's going to do it for today. I hope this was helpful. As always, I'd love to hear your thoughts." },
      ]

  const segmentDuration = durationSeconds / dialogues.length
  dialogues.forEach((d, i) => {
    segments.push({
      text: d.text,
      start: Math.round(i * segmentDuration),
      end: Math.round((i + 1) * segmentDuration),
      speaker: d.speaker,
      confidence: 0.92 + Math.random() * 0.07, // 0.92 - 0.99
    })
  })

  return segments
}

// ─── Viral Moments ───

const viralMoments: Record<string, Array<{ start_time: number; end_time: number; text: string; score: number; reason: string; type: string }>> = {
  'scaling-laws': [
    { start_time: 1335, end_time: 1380, text: "The thing nobody's saying out loud is that scaling laws haven't just held — they've actually gotten more favorable. Each generation of models is more sample-efficient than the last.", score: 92, reason: 'Insider knowledge that reframes the scaling debate', type: 'revelation' },
    { start_time: 2520, end_time: 2565, text: "If alignment research doesn't keep pace with capabilities, we're essentially building a rocket with no steering mechanism. And we're already past the point where this is just academic.", score: 87, reason: 'Urgent framing of AI safety with visceral metaphor', type: 'emotional' },
    { start_time: 3105, end_time: 3150, text: "Every company asking 'should we wait for the next model?' is asking the wrong question. The model is never the bottleneck. Your data pipeline is.", score: 81, reason: 'Actionable reframing that challenges common excuse', type: 'quotable' },
  ],
  'ai-agents': [
    { start_time: 1965, end_time: 2010, text: "Ninety percent of agent demos work perfectly. Ninety percent of agent deployments fail. The gap between those two numbers is where all the actual engineering happens.", score: 95, reason: 'Striking contrast that crystallizes the agent reliability problem', type: 'counter_intuitive' },
    { start_time: 3000, end_time: 3045, text: "We cut our API costs by sixty percent with one architectural change: we stopped letting agents decide when to call expensive models. We added a router with a cost budget.", score: 84, reason: 'Specific, actionable cost-saving technique with concrete results', type: 'quotable' },
    { start_time: 3600, end_time: 3645, text: "The companies deploying agents successfully aren't the ones with the best models. They're the ones with the best eval frameworks. Evals are the new unit tests.", score: 79, reason: 'Memorable one-liner that reframes agent development priorities', type: 'quotable' },
  ],
  'open-weight': [
    { start_time: 870, end_time: 915, text: "Meta has spent north of thirty-five billion dollars releasing models for free. That's not philanthropy — it's the most aggressive platform strategy since Google gave away Android.", score: 91, reason: 'Bold reframing of a major corporate strategy with a powerful analogy', type: 'controversial' },
    { start_time: 2520, end_time: 2565, text: "I watched a three-person team fine-tune Llama on medical data and beat GPT-4 on clinical reasoning benchmarks. That's the real story of open models — they make specialization accessible.", score: 86, reason: 'Compelling David-vs-Goliath narrative with specific evidence', type: 'revelation' },
  ],
  'contentkit': [
    { start_time: 1365, end_time: 1410, text: "I posted about my tool on Reddit at two AM on a Tuesday. I woke up to six hundred signups and a crashed Heroku dyno. That was the moment I knew this wasn't a side project anymore.", score: 93, reason: 'Vivid origin story with specific, relatable details', type: 'emotional' },
    { start_time: 1860, end_time: 1905, text: "A VC offered me three million dollars and I said no. Everyone thought I'd lost my mind. Two years later, I owned a hundred percent of a company doing twelve million in revenue.", score: 97, reason: 'Contrarian bet with dramatic payoff — the ultimate bootstrap story', type: 'counter_intuitive' },
    { start_time: 2340, end_time: 2385, text: "The pricing mistake that nearly killed us? We charged nine dollars a month. The day we raised it to forty-nine, churn dropped by half and revenue tripled. Underpricing is a disease.", score: 89, reason: 'Counterintuitive pricing lesson backed by shocking numbers', type: 'revelation' },
    { start_time: 3720, end_time: 3765, text: "The best advice I ever got was from a founder who told me: your first ten customers will teach you more than any accelerator. Just ship and listen.", score: 76, reason: 'Simple, memorable wisdom from a successful founder', type: 'quotable' },
  ],
  'pricing-page': [
    { start_time: 720, end_time: 765, text: "The average SaaS company underprices by two to four X. I've seen it hundreds of times. Founders are terrified of charging what their product is worth.", score: 88, reason: 'Quantified insight that challenges widespread founder behavior', type: 'revelation' },
    { start_time: 1740, end_time: 1785, text: "We added a third pricing tier — purely as a decoy — and conversions on the middle tier jumped thirty-four percent overnight. No product changes. Just psychology.", score: 92, reason: 'Specific tactic with measurable results and minimal effort', type: 'counter_intuitive' },
    { start_time: 3120, end_time: 3165, text: "Stop asking customers what they'd pay. They'll always lowball you. Instead, ask them what problem this solves and what that problem costs them. Then price accordingly.", score: 83, reason: 'Actionable pricing framework that flips conventional approach', type: 'quotable' },
  ],
}

// ─── SEO Analysis ───

const seoAnalyses: Record<string, { score: number; analysis: Record<string, unknown> }> = {
  'scaling-laws': {
    score: 85,
    analysis: {
      keyword_density: { 'scaling laws': 0.04, 'gpt-5': 0.03, 'AI safety': 0.02, 'compute': 0.02, 'reasoning': 0.02 },
      readability_score: 76,
      header_structure: true,
      suggestions: [
        'Add an FAQ section targeting "what are scaling laws in AI" and similar long-tail queries',
        'Include more internal links to related episodes (AI agents, open weights)',
        'Add alt text to any embedded images or diagrams',
      ],
      estimated_position: 8,
    },
  },
  'ai-agents': {
    score: 72,
    analysis: {
      keyword_density: { 'AI agents': 0.05, 'production': 0.03, 'hallucination': 0.02, 'reliability': 0.02 },
      readability_score: 81,
      header_structure: true,
      suggestions: [
        'Add structured data (PodcastEpisode schema) for rich snippet eligibility',
        'Include guest social links in the show notes for credibility signals',
        'Break up the "failure modes" section with subheadings for scannability',
        'Consider adding a comparison table of agent frameworks mentioned',
      ],
      estimated_position: 14,
    },
  },
  'open-weight': {
    score: 68,
    analysis: {
      keyword_density: { 'open source AI': 0.05, 'Llama': 0.04, 'Meta AI': 0.03, 'fine-tuning': 0.02 },
      readability_score: 74,
      header_structure: true,
      suggestions: [
        'Add a comparison table for open vs. closed model benchmarks',
        'Include more external links to referenced projects and papers',
        'Add a glossary section defining open source vs. open weight vs. source-available',
        'Target the keyword "best open source LLM 2026" more explicitly',
      ],
      estimated_position: 18,
    },
  },
  'contentkit': {
    score: 91,
    analysis: {
      keyword_density: { 'bootstrapping': 0.04, 'ARR': 0.03, 'startup': 0.03, 'side project': 0.02, 'SaaS': 0.02 },
      readability_score: 88,
      header_structure: true,
      suggestions: [
        'Add internal links to the bootstrapping vs. VC episode',
      ],
      estimated_position: 4,
    },
  },
  'pricing-page': {
    score: 77,
    analysis: {
      keyword_density: { 'SaaS pricing': 0.05, 'A/B testing': 0.03, 'pricing strategy': 0.03, 'conversion rate': 0.02 },
      readability_score: 79,
      header_structure: true,
      suggestions: [
        'Add a downloadable pricing audit checklist as a lead magnet',
        'Include more specific numbers and percentages to strengthen E-E-A-T signals',
        'Link to the referenced books with affiliate or resource links',
      ],
      estimated_position: 9,
    },
  },
}

// ─── Asset Content Generators ───

function makeAssets(
  episodeId: string,
  key: string,
  title: string,
  guestName: string | null,
  guestBio: string | null,
  showNotes: string,
): Array<{ episode_id: string; asset_type: string; content: string; metadata: Record<string, unknown> }> {
  const assets: Array<{ episode_id: string; asset_type: string; content: string; metadata: Record<string, unknown> }> = []

  // show_notes
  assets.push({ episode_id: episodeId, asset_type: 'show_notes', content: showNotes, metadata: { word_count: showNotes.split(/\s+/).length } })

  // episode_titles
  const titleAlts = key === 'scaling-laws'
    ? '1. "Why Scaling Laws Are the Most Important Discovery in AI"\n2. "GPT-5 and the Bitter Lesson: A Deep Dive with Dr. Amara Osei"\n3. "The Math Behind AI Progress: Scaling Laws Explained"'
    : key === 'ai-agents'
    ? '1. "Why 90% of AI Agent Deployments Fail (And How to Fix It)"\n2. "Production AI Agents: Hard Lessons from 40 Enterprise Deployments"\n3. "The Trust Budget: A New Framework for Reliable AI Agents"'
    : key === 'open-weight'
    ? '1. "Meta\'s $35 Billion Gamble: The Story Behind Llama"\n2. "Open Source AI: Who\'s Winning and Why It Matters"\n3. "The Open Weight Revolution: How Small Teams Are Beating Big Labs"'
    : key === 'contentkit'
    ? '1. "How a Reddit Post Turned Into a $12M Business"\n2. "Bootstrapped to $12M ARR: Nadia Kovac\'s ContentKit Journey"\n3. "From Side Project to Scale: The ContentKit Playbook"'
    : '1. "The Science of SaaS Pricing: Data from 200+ Experiments"\n2. "Why Your Pricing Page Is Leaving Money on the Table"\n3. "A/B Testing Your Way to 3x Revenue: The PriceLab Method"'
  assets.push({ episode_id: episodeId, asset_type: 'episode_titles', content: titleAlts, metadata: { count: 3 } })

  // key_takeaways
  const takeaways = key === 'scaling-laws'
    ? '• Scaling laws have held across six orders of magnitude — there is no sign of plateau\n• System 2 reasoning in LLMs is an architectural choice, not an emergent property\n• Synthetic data is closing the data gap faster than expected\n• Alignment research is not keeping pace with capability research\n• The best time to start building with current models is now — waiting for the next model is a losing strategy\n• Compute-optimal training (Chinchilla-style) is already obsolete for frontier labs\n• Multimodal understanding is the next frontier for scaling improvements'
    : key === 'ai-agents'
    ? '• The demo-to-production gap is the #1 killer of agent projects\n• Hallucination, tool misuse, and scope creep are the three failure categories\n• The "trust budget" framework limits agent autonomy based on task risk\n• Eval frameworks are more important than model selection for agent reliability\n• Cost routers with budget limits reduced API spend by 60%\n• Monitoring agents requires different observability than traditional software\n• Start with deterministic workflows, then gradually introduce agent autonomy'
    : key === 'open-weight'
    ? '• "Open source" and "open weight" are fundamentally different things in AI\n• Meta\'s Llama strategy is platform economics, not philanthropy\n• Fine-tuned open models can beat larger closed models on domain-specific tasks\n• The licensing landscape is fragmented and confusing — read the fine print\n• Governments are increasingly mandating open models for sovereign AI initiatives\n• Small teams can now compete with well-resourced labs through specialization\n• The open model ecosystem will likely consolidate around 2-3 major foundations'
    : key === 'contentkit'
    ? '• Product-market fit is often discovered accidentally, not designed\n• A single viral moment (Reddit, HN, Twitter) can change a company\'s trajectory overnight\n• Underpricing is one of the most common and dangerous mistakes for bootstrapped founders\n• Raising prices can actually reduce churn by attracting more serious customers\n• Staying bootstrapped preserves optionality and forces discipline\n• Remote-first culture requires deliberate investment in async communication\n• Your first 10 customers will teach you more than any accelerator program'
    : '• Most SaaS companies underprice by 2-4x\n• The decoy effect (adding a third tier) can increase mid-tier conversions by 30%+\n• Never ask customers what they\'d pay — ask what the problem costs them\n• A/B testing pricing requires careful cohort management to avoid bias\n• Grandfathering existing customers through price increases preserves trust\n• Enterprise pricing should almost never be displayed publicly\n• Annual billing discounts above 20% leave significant money on the table'
  assets.push({ episode_id: episodeId, asset_type: 'key_takeaways', content: takeaways, metadata: { takeaway_count: takeaways.split('\n').length } })

  // chapter_markers
  const chapters = showNotes.split('\n').filter(l => l.match(/^- \d{2}:\d{2}/)).map(l => l.replace(/^- /, '')).join('\n')
  assets.push({ episode_id: episodeId, asset_type: 'chapter_markers', content: chapters || 'No chapters detected', metadata: { source: 'show_notes' } })

  // transcript_summary
  const summary = guestName
    ? `In this episode, ${guestName} joins the show to share insights on "${title}". The conversation covers both high-level trends and actionable tactical advice, drawing from ${guestName}'s direct experience in the field.\n\nKey themes include the gap between theoretical knowledge and real-world application, the importance of starting small and iterating, and specific frameworks that listeners can apply immediately. ${guestName} provides a candid look at both successes and failures, making this episode particularly valuable for practitioners.\n\nThe discussion concludes with predictions for the next 18-24 months and recommended resources for listeners who want to go deeper on the topics covered.`
    : `This solo episode is a deep-dive into "${title}". Drawing from recent research, industry data, and conversations with practitioners, the host breaks down a complex topic into actionable insights.\n\nThe episode covers the historical context, current state, and future trajectory of the subject matter. Specific data points and real-world examples ground the analysis in practical reality rather than speculation.\n\nListeners will come away with a clear mental framework for thinking about this topic and three concrete next steps they can take immediately.`
  assets.push({ episode_id: episodeId, asset_type: 'transcript_summary', content: summary, metadata: { word_count: summary.split(/\s+/).length } })

  // seo_description
  const seoDesc = `Listen to "${title}" — ${guestName ? `a conversation with ${guestName} covering` : 'a deep-dive into'} the latest insights, actionable strategies, and expert analysis. New episodes weekly.`
  assets.push({ episode_id: episodeId, asset_type: 'seo_description', content: seoDesc, metadata: { char_count: seoDesc.length } })

  // linkedin_post
  const linkedin = guestName
    ? `Had an incredible conversation with ${guestName} on the latest episode of the podcast.\n\nWe went deep on "${title}" and honestly, some of these insights fundamentally changed how I think about this space.\n\nThree things that stuck with me:\n\n→ The gap between what people think works and what actually works is wider than ever\n→ The companies winning right now all share one counterintuitive trait\n→ There's a massive opportunity that most people are completely overlooking\n\nThis might be our best episode yet. Link in comments.\n\n#podcast #technology #leadership #innovation`
    : `Just dropped a new solo episode that I've been wanting to record for months.\n\n"${title}" — I broke down the data, the trends, and what it all means for practitioners.\n\nThree surprising findings:\n\n→ The conventional wisdom is wrong (and I have the data to prove it)\n→ Small players are winning in ways that shouldn't be possible\n→ The window of opportunity is smaller than most people realize\n\nFull episode available now. Link in comments.\n\n#podcast #technology #deepdive #analysis`
  assets.push({ episode_id: episodeId, asset_type: 'linkedin_post', content: linkedin, metadata: { platform: 'linkedin', char_count: linkedin.length } })

  // twitter_thread
  const thread = `🧵 Thread: Key takeaways from "${title}"\n\n1/ The biggest misconception in this space right now is that you need massive scale to compete. The data shows the opposite.\n\n2/ ${guestName ? `${guestName} dropped a stat that blew my mind` : 'Here\'s the stat that blew my mind'}: the most successful teams aren't the biggest — they're the most focused.\n\n3/ The framework that changed my thinking: start with the smallest possible experiment, measure obsessively, then scale what works.\n\n4/ The prediction that gave me chills: we're about 18 months from a fundamental shift in how this industry operates.\n\n5/ Full episode is live now. Lots more depth and nuance in the full conversation. Link in bio 🎙️`
  assets.push({ episode_id: episodeId, asset_type: 'twitter_thread', content: thread, metadata: { platform: 'twitter', tweet_count: 5 } })

  // instagram_carousel
  const carousel = `Slide 1: "${title}" — New Episode Out Now\n\nSlide 2: The #1 Misconception\nMost people think you need massive resources to compete. The data says otherwise.\n\nSlide 3: The Framework\nStart small → Measure everything → Scale what works → Repeat\n\nSlide 4: By The Numbers\n• 2-4x — how much most companies undershoot\n• 18 months — the window of opportunity\n• 60% — potential cost savings with the right architecture\n\nSlide 5: The Prediction\n"We're 18 months from an inflection point that changes everything."\n\nSlide 6: Listen Now\nFull episode available on all podcast platforms 🎙️`
  assets.push({ episode_id: episodeId, asset_type: 'instagram_carousel', content: carousel, metadata: { platform: 'instagram', slide_count: 6 } })

  // tiktok_hooks
  const hooks = `Hook 1: "The stat nobody wants you to know about ${title.split(':')[0].toLowerCase()}..."\n\nHook 2: "I just interviewed ${guestName || 'an expert'} and what they said about this industry will shock you."\n\nHook 3: "Stop scrolling if you care about ${key.includes('agent') ? 'AI' : key.includes('price') ? 'making money' : 'technology'}."\n\nHook 4: "This one insight changed how I think about everything."\n\nHook 5: "The biggest lie in ${key.includes('contentkit') || key.includes('price') ? 'startups' : 'tech'} right now is..."`
  assets.push({ episode_id: episodeId, asset_type: 'tiktok_hooks', content: hooks, metadata: { platform: 'tiktok', hook_count: 5 } })

  // blog_post
  const blog = `# ${title}\n\n${guestName ? `In a recent episode, ${guestName} shared perspectives that challenge how we think about this space.` : 'In the latest episode, we explored a topic reshaping the industry.'}\n\nThe conversation covered everything from foundational principles to cutting-edge applications, and several key themes emerged that are worth examining in detail.\n\n## The State of Play\n\nWhat became clear throughout the discussion is that we're at an inflection point. The technology is mature enough to deliver real value, but most organizations are still figuring out where to start. The gap between early adopters and everyone else is widening.\n\n## What the Data Shows\n\nThe numbers paint a compelling picture. Organizations that moved early are seeing compounding advantages, while those still evaluating are falling further behind. The window of opportunity, while still open, is narrowing.\n\n## Practical Takeaways\n\nFor practitioners, the message is clear: start small, measure rigorously, and iterate based on data. The most successful teams aren't the ones with the biggest budgets — they're the ones with the clearest frameworks for experimentation.\n\n## Looking Ahead\n\nThe next 18 months will be decisive. The technology is approaching a maturity threshold that will make adoption the default rather than the exception.\n\n*Listen to the full episode for the complete discussion, including specific frameworks and resources.*`
  assets.push({ episode_id: episodeId, asset_type: 'blog_post', content: blog, metadata: { word_count: blog.split(/\s+/).length } })

  // newsletter_email
  const newsletter = `Subject: This changes everything about ${title.split(':')[0].toLowerCase()}\n\nHey there,\n\nThis week's episode is one I've been planning for months.\n\n${guestName ? `I finally got to sit down with ${guestName}` : 'I finally got to do a deep-dive on a topic'} that I think will fundamentally shift how you think about this space.\n\nHere's what you'll learn:\n→ Why the conventional wisdom is dead wrong (with data)\n→ The framework top performers are using right now\n→ A specific prediction for the next 18 months\n\nThis isn't theoretical — it's backed by real numbers from real deployments.\n\nListen now on your favorite podcast app.\n\nUntil next time,\nAlex`
  assets.push({ episode_id: episodeId, asset_type: 'newsletter_email', content: newsletter, metadata: { type: 'newsletter' } })

  // youtube_description
  const ytDesc = `${title}${guestName ? ` | ${guestName}` : ''}\n\nIn this episode, ${guestName ? `${guestName} joins us to break down` : 'we break down'} the most important trends, share actionable frameworks, and discuss what's coming next.\n\n⏰ Timestamps in the chapters below\n\n📧 Newsletter: getpodbrain.ai/newsletter\n🐦 Twitter/X: @thegradientpod\n💼 LinkedIn: /company/thegradient\n\n🎙️ Subscribe for new episodes every week\n\n#podcast #technology #ai #startups`
  assets.push({ episode_id: episodeId, asset_type: 'youtube_description', content: ytDesc, metadata: { platform: 'youtube' } })

  // discussion_questions
  const questions = key === 'scaling-laws'
    ? '1. Do you believe scaling laws will continue to hold, or are we approaching fundamental limits?\n2. How should organizations balance investing in current models vs. waiting for next-gen capabilities?\n3. Is the AI safety community right to sound the alarm, or is it premature?\n4. What role should governments play in regulating scaling of AI systems?\n5. How do you think about the trade-off between capability and alignment research?'
    : key === 'ai-agents'
    ? '1. Have you deployed AI agents in production? What was your biggest surprise?\n2. Is the "trust budget" framework practical, or does it add too much complexity?\n3. How do you balance agent autonomy with the need for reliability?\n4. What evaluation frameworks have worked best for your agent systems?\n5. At what point do you think agents will be reliable enough for mission-critical tasks?'
    : key === 'open-weight'
    ? '1. Is Meta\'s open weight strategy genuinely good for the ecosystem, or is it a corporate power play?\n2. Should AI models have standardized, OSI-approved open source licenses?\n3. How does the open model movement affect AI safety efforts?\n4. Would you bet your company on an open model for a production use case? Why or why not?\n5. What role should governments play in the open vs. closed model debate?'
    : key === 'contentkit'
    ? '1. Would you have turned down $3M in seed funding in Nadia\'s position? Why or why not?\n2. What\'s the most underrated advantage of bootstrapping vs. raising venture capital?\n3. How do you know when a side project has crossed the line into a real business?\n4. Is underpricing really a "disease," or is it a rational strategy for early-stage products?\n5. What\'s your biggest takeaway from ContentKit\'s growth story?'
    : '1. Do you agree that most SaaS companies underprice by 2-4x? What\'s holding them back?\n2. Have you ever used the decoy effect in your own pricing? What happened?\n3. What\'s the right way to communicate a price increase to existing customers?\n4. Should enterprise pricing always be hidden behind "Contact Sales"?\n5. How do you balance pricing for growth vs. pricing for profitability?'
  assets.push({ episode_id: episodeId, asset_type: 'discussion_questions', content: questions, metadata: { count: 5 } })

  // quote_cards
  const quotes = viralMoments[key]
    ? viralMoments[key].slice(0, 4).map(v => `"${v.text}"\n— ${guestName || 'Host'}`).join('\n\n')
    : `"The conventional wisdom is almost entirely wrong on this topic."\n— ${guestName || 'Host'}`
  assets.push({ episode_id: episodeId, asset_type: 'quote_cards', content: quotes, metadata: { quote_count: viralMoments[key]?.length || 1 } })

  // guest-specific assets
  if (guestName && guestBio) {
    const bio = `${guestName}\n${guestBio}\n\nConnect with ${guestName.split(' ')[0]}:\n• LinkedIn: linkedin.com/in/${guestName.toLowerCase().replace(/[^a-z]/g, '')}\n• Twitter: @${guestName.split(' ')[0].toLowerCase()}`
    assets.push({ episode_id: episodeId, asset_type: 'guest_bio_short', content: bio, metadata: { guest_name: guestName } })

    const promoKit = `## Guest Promotion Kit for ${guestName}\n\n### Suggested LinkedIn Post\nExcited to share my conversation on The Gradient about "${title}." We covered ${key.includes('agent') ? 'what it takes to make AI agents production-ready' : key.includes('scaling') ? 'how scaling laws are reshaping AI' : key.includes('contentkit') ? 'the journey from side project to $12M ARR' : key.includes('pricing') ? 'the science behind SaaS pricing' : 'the open model ecosystem'}. Give it a listen!\n\n### Suggested Tweet\nJust dropped a great conversation about ${title.split(':')[0].toLowerCase()} with @thegradientpod. We got into the weeds on what actually works vs. what people think works. Link in thread 👇\n\n### Episode Link\nhttps://getpodbrain.ai/episodes/[episode-id]\n\n### Suggested Hashtags\n#podcast #interview #${key.includes('agent') || key.includes('scaling') || key.includes('open') ? 'AI' : 'startups'}`
    assets.push({ episode_id: episodeId, asset_type: 'guest_promo_kit', content: promoKit, metadata: { guest_name: guestName } })
  }

  return assets
}

// ─── Main Seed Logic ───

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const guard = devGuard()
  if (guard) return guard

  if (!DEMO_EMAIL || !DEMO_PASSWORD) {
    return NextResponse.json(
      {
        error:
          'Seed credentials not configured. Set SEED_DEMO_EMAIL and SEED_DEMO_PASSWORD in .env.local before running this endpoint.',
      },
      { status: 500 }
    )
  }

  try {
    const admin = getAdminClient()

    // ── Step 1: Create or reset demo user ──
    console.log('[seed] Step 1: Creating demo user...')

    // Find and delete existing demo user
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === DEMO_EMAIL)
    if (existing) {
      // Clean up data tied to this user before deleting auth record
      await admin.from('webhooks').delete().eq('user_id', existing.id)
      await admin.from('hosting_connections').delete().eq('user_id', existing.id)
      // Vocabulary + shows cascade
      const { data: userShows } = await admin.from('shows').select('id').eq('user_id', existing.id)
      if (userShows && userShows.length > 0) {
        const showIds = userShows.map((s: { id: string }) => s.id)
        await admin.from('vocabulary_terms').delete().in('show_id', showIds)
      }
      await admin.from('shows').delete().eq('user_id', existing.id) // cascades to episodes → assets
      await admin.auth.admin.deleteUser(existing.id)
    }

    // Clean up old placeholder user data
    const { data: oldShows } = await admin.from('shows').select('id').eq('user_id', OLD_PLACEHOLDER_ID)
    if (oldShows && oldShows.length > 0) {
      const oldShowIds = oldShows.map((s: { id: string }) => s.id)
      await admin.from('vocabulary_terms').delete().in('show_id', oldShowIds)
    }
    await admin.from('shows').delete().eq('user_id', OLD_PLACEHOLDER_ID)

    // Create fresh auth user
    const { data: newUser, error: authError } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    })
    if (authError || !newUser.user) {
      return NextResponse.json({ success: false, error: `Auth user creation failed: ${authError?.message}` }, { status: 500 })
    }
    const userId = newUser.user.id
    console.log(`[seed] Demo user created: ${userId}`)

    // Ensure public.users row with Pro tier (trigger creates it, upsert sets tier)
    await admin.from('users').upsert(
      { id: userId, email: DEMO_EMAIL, name: DEMO_NAME, subscription_tier: 'pro' },
      { onConflict: 'id' },
    )

    // ── Step 2: Create shows ──
    console.log('[seed] Step 2: Creating shows...')

    const { data: shows, error: showError } = await admin
      .from('shows')
      .insert([
        {
          user_id: userId,
          name: 'The Gradient',
          description: 'Weekly deep-dives into AI, machine learning, and the future of computing. Conversations with researchers, builders, and thinkers shaping the next generation of technology.',
          default_language: 'en',
          style_preferences: { tone: 'analytical yet accessible', format_preferences: { show_notes_style: 'detailed', include_timestamps: true } },
        },
        {
          user_id: userId,
          name: 'Zero to One Hundred',
          description: 'Raw conversations with founders about building companies from scratch. The wins, the failures, the pivots, and the lessons nobody teaches you in business school.',
          default_language: 'en',
          style_preferences: { tone: 'conversational and candid', format_preferences: { show_notes_style: 'narrative', include_resources: true } },
        },
        {
          user_id: userId,
          name: 'Sound & Story',
          description: 'Exploring the art and craft of audio storytelling. Interviews with podcast producers, sound designers, and narrative journalists about how they bring stories to life through sound.',
          default_language: 'en',
          style_preferences: { tone: 'warm and thoughtful', format_preferences: { show_notes_style: 'narrative' } },
        },
      ])
      .select()

    if (showError || !shows) {
      return NextResponse.json({ success: false, error: `Show creation failed: ${showError?.message}` }, { status: 500 })
    }
    const [gradientShow, zeroShow, soundShow] = shows

    // ── Step 3: Create episodes ──
    console.log('[seed] Step 3: Creating episodes...')

    const episodeInserts = [
      // The Gradient — 4 episodes
      {
        show_id: gradientShow.id,
        title: 'Scaling Laws and the Bitter Lesson: What GPT-5 Teaches Us About Intelligence',
        description: 'Dr. Amara Osei unpacks the implications of scaling laws, System 2 reasoning in LLMs, and why the Bitter Lesson keeps proving right.',
        audio_url: 'https://storage.getpodbrain.ai/demo/scaling-laws.mp3',
        audio_duration_seconds: 3720,
        status: 'completed' as const,
        guest_name: 'Dr. Amara Osei',
        guest_bio: 'AI researcher at Stanford HAI. Previously at DeepMind. Author of "Emergent Reasoning in Large-Scale Systems." Advisor to the White House OSTP on AI governance.',
        guest_email: 'amara.osei@stanford.edu',
        show_notes: showNotesContent['scaling-laws'],
        show_notes_html: `<div>${showNotesContent['scaling-laws'].replace(/\n/g, '<br>').replace(/## /g, '<h2>').replace(/### /g, '<h3>')}</div>`,
        seo_score: seoAnalyses['scaling-laws'].score,
        seo_analysis: seoAnalyses['scaling-laws'].analysis,
        viral_moments: viralMoments['scaling-laws'],
        language: 'en',
        metadata: {},
      },
      {
        show_id: gradientShow.id,
        title: 'Building AI Agents That Don\'t Hallucinate: Lessons from Production',
        description: 'Rafael Dominguez shares hard-won lessons from deploying autonomous AI agents across 40+ enterprise customers at AgentOps.',
        audio_url: 'https://storage.getpodbrain.ai/demo/ai-agents.mp3',
        audio_duration_seconds: 3960,
        status: 'completed' as const,
        guest_name: 'Rafael Dominguez',
        guest_bio: 'CTO and co-founder of AgentOps. Former principal engineer at Stripe. Built autonomous agent infrastructure serving 40+ enterprise customers. Y Combinator W24.',
        guest_email: 'rafael@agentops.ai',
        show_notes: showNotesContent['ai-agents'],
        show_notes_html: `<div>${showNotesContent['ai-agents'].replace(/\n/g, '<br>').replace(/## /g, '<h2>').replace(/### /g, '<h3>')}</div>`,
        seo_score: seoAnalyses['ai-agents'].score,
        seo_analysis: seoAnalyses['ai-agents'].analysis,
        viral_moments: viralMoments['ai-agents'],
        language: 'en',
        metadata: {},
      },
      {
        show_id: gradientShow.id,
        title: 'The Open Weight Revolution: Why Meta Gave Away Llama',
        description: 'A solo deep-dive into the most consequential strategic move in AI history: Meta releasing Llama as open-weight models.',
        audio_url: 'https://storage.getpodbrain.ai/demo/open-weight.mp3',
        audio_duration_seconds: 3360,
        status: 'completed' as const,
        guest_name: null,
        guest_bio: null,
        guest_email: null,
        show_notes: showNotesContent['open-weight'],
        show_notes_html: `<div>${showNotesContent['open-weight'].replace(/\n/g, '<br>').replace(/## /g, '<h2>').replace(/### /g, '<h3>')}</div>`,
        seo_score: seoAnalyses['open-weight'].score,
        seo_analysis: seoAnalyses['open-weight'].analysis,
        viral_moments: viralMoments['open-weight'],
        language: 'en',
        metadata: {},
      },
      {
        show_id: gradientShow.id,
        title: 'Multimodal AI and the Future of Human-Computer Interaction',
        description: 'Dr. Yuki Tanaka from CMU discusses how multimodal models are reshaping how humans interact with computers — from voice to gesture to spatial computing.',
        audio_url: 'https://storage.getpodbrain.ai/demo/multimodal-hci.mp3',
        audio_duration_seconds: null,
        status: 'pending' as const,
        guest_name: 'Dr. Yuki Tanaka',
        guest_bio: 'Professor of Human-Computer Interaction at Carnegie Mellon. Previously led the UX Research team at Google DeepMind.',
        guest_email: 'ytanaka@cmu.edu',
        show_notes: null,
        show_notes_html: null,
        seo_score: null,
        seo_analysis: null,
        viral_moments: [],
        language: 'en',
        metadata: {},
      },

      // Zero to One Hundred — 3 episodes
      {
        show_id: zeroShow.id,
        title: 'From Ramen Profitability to $12M ARR: The ContentKit Story',
        description: 'Nadia Kovac shares the unfiltered story of turning a weekend project into a $12M ARR content platform — the pivots, the near-death moments, and the pricing disaster that almost killed the company.',
        audio_url: 'https://storage.getpodbrain.ai/demo/contentkit.mp3',
        audio_duration_seconds: 4020,
        status: 'completed' as const,
        guest_name: 'Nadia Kovac',
        guest_bio: 'CEO and founder of ContentKit. Bootstrapped from $0 to $12M ARR with a 4-person team. Previously product manager at Shopify. Forbes 30 Under 30 (2025).',
        guest_email: 'nadia@contentkit.io',
        show_notes: showNotesContent['contentkit'],
        show_notes_html: `<div>${showNotesContent['contentkit'].replace(/\n/g, '<br>').replace(/## /g, '<h2>').replace(/### /g, '<h3>')}</div>`,
        seo_score: seoAnalyses['contentkit'].score,
        seo_analysis: seoAnalyses['contentkit'].analysis,
        viral_moments: viralMoments['contentkit'],
        language: 'en',
        metadata: {},
      },
      {
        show_id: zeroShow.id,
        title: 'The Pricing Page Nobody Sees: How We A/B Tested Our Way to 3x Revenue',
        description: 'James Whitfield reveals the psychological principles behind high-converting pricing pages, drawn from 200+ SaaS pricing experiments.',
        audio_url: 'https://storage.getpodbrain.ai/demo/pricing-page.mp3',
        audio_duration_seconds: 3480,
        status: 'completed' as const,
        guest_name: 'James Whitfield',
        guest_bio: 'Head of Growth at PriceLab. Former behavioral economist at the London School of Economics. Has run 200+ pricing experiments for SaaS companies from seed to Series C.',
        guest_email: 'james@pricelab.io',
        show_notes: showNotesContent['pricing-page'],
        show_notes_html: `<div>${showNotesContent['pricing-page'].replace(/\n/g, '<br>').replace(/## /g, '<h2>').replace(/### /g, '<h3>')}</div>`,
        seo_score: seoAnalyses['pricing-page'].score,
        seo_analysis: seoAnalyses['pricing-page'].analysis,
        viral_moments: viralMoments['pricing-page'],
        language: 'en',
        metadata: {},
      },
      {
        show_id: zeroShow.id,
        title: 'Why I Turned Down YC and Bootstrapped Instead',
        description: 'Kira Okoye, founder of StreamForge, explains why she rejected Y Combinator to stay bootstrapped — and whether she\'d make the same choice again.',
        audio_url: 'https://storage.getpodbrain.ai/demo/turned-down-yc.mp3',
        audio_duration_seconds: 2700,
        status: 'processing' as const,
        guest_name: 'Kira Okoye',
        guest_bio: 'Founder and CEO of StreamForge. Bootstrapped to $2M ARR. Previously senior engineer at Figma.',
        guest_email: 'kira@streamforge.io',
        show_notes: null,
        show_notes_html: null,
        seo_score: null,
        seo_analysis: null,
        viral_moments: [],
        language: 'en',
        transcript: 'Partial transcript available — processing in progress...',
        metadata: {
          processing_started_at: hoursAgo(2).toISOString(),
          current_step: 'generating_show_notes',
          transcript_completed: true,
        },
      },

      // Sound & Story — 1 episode
      {
        show_id: soundShow.id,
        title: 'Recording in War Zones: The Ethics and Craft of Conflict Audio',
        description: 'Mateo Reyes, an independent audio journalist, discusses the ethical dilemmas and technical challenges of recording in active conflict zones.',
        audio_url: 'https://storage.getpodbrain.ai/demo/war-zones.mp3',
        audio_duration_seconds: 4200,
        status: 'failed' as const,
        guest_name: 'Mateo Reyes',
        guest_bio: 'Independent audio journalist and producer. Peabody Award winner. Has reported from Syria, Ukraine, and Colombia for NPR and the BBC World Service.',
        guest_email: 'mateo.reyes@protonmail.com',
        show_notes: null,
        show_notes_html: null,
        seo_score: null,
        seo_analysis: null,
        viral_moments: [],
        language: 'en',
        metadata: {
          error: "Transcription failed: AssemblyAI returned error 'audio_too_noisy' — excessive background noise detected in 73% of audio segments. Consider re-recording with noise reduction or submitting a cleaned version.",
          failed_at: daysAgo(4).toISOString(),
          processing_step: 'transcription',
          retry_count: 3,
        },
      },
    ]

    const { data: episodes, error: epError } = await admin
      .from('episodes')
      .insert(episodeInserts)
      .select()

    if (epError || !episodes) {
      return NextResponse.json({ success: false, error: `Episode creation failed: ${epError?.message}` }, { status: 500 })
    }

    // Add transcript segments to completed episodes
    const completedEps = episodes.filter(ep => ep.status === 'completed')
    for (const ep of completedEps) {
      const segments = makeTranscriptSegments(
        ep.audio_duration_seconds || 3600,
        'Alex',
        ep.guest_name,
      )
      const fullTranscript = segments.map(s => `[${s.speaker}]: ${s.text}`).join('\n\n')
      await admin.from('episodes').update({
        transcript: fullTranscript,
        transcript_segments: segments,
      }).eq('id', ep.id)
    }

    // ── Step 4: Backdate timestamps ──
    console.log('[seed] Step 4: Backdating timestamps...')

    const backdates: Array<{ id: string; created_at: string; published_at: string | null }> = [
      { id: episodes[0].id, created_at: daysAgo(35).toISOString(), published_at: daysAgo(34).toISOString() },
      { id: episodes[1].id, created_at: daysAgo(28).toISOString(), published_at: daysAgo(27).toISOString() },
      { id: episodes[2].id, created_at: daysAgo(21).toISOString(), published_at: daysAgo(20).toISOString() },
      { id: episodes[3].id, created_at: daysAgo(1).toISOString(), published_at: null }, // pending
      { id: episodes[4].id, created_at: daysAgo(18).toISOString(), published_at: daysAgo(17).toISOString() },
      { id: episodes[5].id, created_at: daysAgo(10).toISOString(), published_at: daysAgo(9).toISOString() },
      { id: episodes[6].id, created_at: daysAgo(3).toISOString(), published_at: null }, // processing
      { id: episodes[7].id, created_at: daysAgo(5).toISOString(), published_at: null }, // failed
    ]

    for (const bd of backdates) {
      await admin.from('episodes').update({
        created_at: bd.created_at,
        ...(bd.published_at ? { published_at: bd.published_at } : {}),
        updated_at: bd.created_at,
      }).eq('id', bd.id)
    }

    // ── Step 5: Create assets ──
    console.log('[seed] Step 5: Creating generated assets...')

    const episodeKeys = ['scaling-laws', 'ai-agents', 'open-weight', null, 'contentkit', 'pricing-page', null, null]
    const allAssets: Array<{ episode_id: string; asset_type: string; content: string; metadata: Record<string, unknown> }> = []

    for (let i = 0; i < completedEps.length; i++) {
      const ep = completedEps[i]
      // Match the episode to its key by finding its index in the full episodes array
      const fullIdx = episodes.findIndex(e => e.id === ep.id)
      const key = episodeKeys[fullIdx]
      if (!key) continue

      const assets = makeAssets(
        ep.id,
        key,
        ep.title,
        ep.guest_name,
        ep.guest_bio,
        showNotesContent[key] || '',
      )
      allAssets.push(...assets)
    }

    const { error: assetError } = await admin.from('generated_assets').insert(allAssets)
    if (assetError) {
      console.error('[seed] Asset creation error:', assetError.message)
      return NextResponse.json({ success: false, error: `Asset creation failed: ${assetError.message}` }, { status: 500 })
    }

    // ── Step 6: Vocabulary terms ──
    console.log('[seed] Step 6: Creating vocabulary terms...')

    const vocabTerms = [
      // The Gradient (AI)
      { show_id: gradientShow.id, term: 'GPT-5', alternatives: ['GPT5', 'GPT 5'] },
      { show_id: gradientShow.id, term: 'transformer architecture', alternatives: ['transformer model', 'attention mechanism'] },
      { show_id: gradientShow.id, term: 'retrieval-augmented generation', alternatives: ['RAG', 'retrieval augmented generation'] },
      { show_id: gradientShow.id, term: 'fine-tuning', alternatives: ['finetuning', 'fine tuning'] },
      { show_id: gradientShow.id, term: 'RLHF', alternatives: ['reinforcement learning from human feedback'] },
      { show_id: gradientShow.id, term: 'chain-of-thought', alternatives: ['CoT', 'chain of thought reasoning'] },
      { show_id: gradientShow.id, term: 'multimodal', alternatives: ['multi-modal', 'multi modal'] },
      { show_id: gradientShow.id, term: 'hallucination', alternatives: ['model hallucination', 'AI hallucination'] },
      { show_id: gradientShow.id, term: 'LLM', alternatives: ['large language model', 'foundation model'] },
      { show_id: gradientShow.id, term: 'scaling laws', alternatives: ['neural scaling', 'compute scaling'] },
      // Zero to One Hundred (startup)
      { show_id: zeroShow.id, term: 'ARR', alternatives: ['annual recurring revenue', 'annualized recurring revenue'] },
      { show_id: zeroShow.id, term: 'bootstrapping', alternatives: ['bootstrap', 'self-funded'] },
      { show_id: zeroShow.id, term: 'product-market fit', alternatives: ['PMF', 'product market fit'] },
      { show_id: zeroShow.id, term: 'MRR', alternatives: ['monthly recurring revenue'] },
      { show_id: zeroShow.id, term: 'churn rate', alternatives: ['churn', 'customer churn'] },
      { show_id: zeroShow.id, term: 'SaaS', alternatives: ['software as a service', 'SAAS'] },
      // Sound & Story (creative)
      { show_id: soundShow.id, term: 'diegetic sound', alternatives: ['diegetic audio'] },
      { show_id: soundShow.id, term: 'binaural recording', alternatives: ['binaural audio', '3D audio'] },
      { show_id: soundShow.id, term: 'foley', alternatives: ['foley art', 'foley effects'] },
    ]

    const { error: vocabError } = await admin.from('vocabulary_terms').insert(vocabTerms)
    if (vocabError) {
      console.error('[seed] Vocabulary creation error:', vocabError.message)
    }

    // ── Step 7: Optional Taddy enrichment ──
    let taddyEnriched = false
    if (isTaddyAvailable()) {
      console.log('[seed] Step 7: Enriching with Taddy data...')
      try {
        const client = getTaddyClient()
        // Search for real podcast data to populate the Taddy cache (for expert discovery)
        const searchResult = await client.searchPodcasts('artificial intelligence technology', { limitPerPage: 5 })
        if (searchResult) {
          taddyEnriched = true
          console.log('[seed] Taddy enrichment successful')
        }
      } catch (taddyError) {
        console.warn('[seed] Taddy enrichment skipped:', taddyError instanceof Error ? taddyError.message : String(taddyError))
      }
    } else {
      console.log('[seed] Step 7: Taddy not configured — skipping enrichment')
    }

    // ── Done ──
    console.log('[seed] Seeding complete!')

    return NextResponse.json({
      success: true,
      message: 'Demo account seeded successfully',
      credentials: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
      counts: {
        shows: shows.length,
        episodes: episodes.length,
        completedEpisodes: completedEps.length,
        assets: allAssets.length,
        vocabularyTerms: vocabTerms.length,
      },
      userId,
      taddyEnriched,
    })
  } catch (error) {
    console.error('[seed] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
