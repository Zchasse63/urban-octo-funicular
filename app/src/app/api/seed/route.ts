import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { devGuard } from '@/lib/api/dev-guard'

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'

// ─── Show Notes Content ───

const showNotes: Record<string, string> = {
  'gpt5-reasoning': `## GPT-5 and the Future of Reasoning

In this episode, we sit down with Dr. Sarah Chen to explore the next frontier of large language models — reasoning capabilities that go beyond pattern matching.

### Key Topics
- How GPT-5's chain-of-thought architecture differs from previous models
- The role of reinforcement learning from human feedback (RLHF) in improving reasoning
- Practical applications in scientific research and code generation
- Why "System 2 thinking" in AI matters for enterprise adoption

### Timestamps
- 00:00 — Introduction
- 03:15 — Dr. Chen's background in AI safety
- 12:40 — What makes GPT-5 different
- 28:00 — Real-world reasoning benchmarks
- 45:30 — The alignment problem
- 58:00 — Predictions for the next 5 years

### Resources Mentioned
- "Scaling Monosemanticity" (Anthropic, 2024)
- Stanford HAI Annual Report
- Dr. Chen's lab at MIT CSAIL`,

  'ai-agents-production': `## AI Agents in Production: What Actually Works

Marcus Rivera, CTO of AgentStack, shares hard-won lessons from deploying AI agents at scale across Fortune 500 companies.

### Key Topics
- The gap between demo agents and production-ready systems
- Why tool-use reliability is the #1 bottleneck
- Monitoring and observability for autonomous agents
- Cost management strategies that saved 60% on API spend

### Timestamps
- 00:00 — Introduction
- 05:20 — Marcus's journey from SWE to CTO
- 15:00 — What "production-ready" actually means for agents
- 32:45 — The reliability problem nobody talks about
- 48:10 — Real metrics from deployed agent systems
- 61:00 — Where agents are heading in 2026

### Resources Mentioned
- LangSmith observability platform
- "Building Effective Agents" (Anthropic blog)
- AgentStack open-source framework on GitHub`,

  'open-source-ai': `## The Open Source AI Movement

A solo deep-dive into the state of open-source artificial intelligence — who's building what, why it matters, and where the movement is headed.

### Key Topics
- Llama 3 vs. Mistral vs. Qwen — the open model landscape
- Why Meta is investing billions in open-source AI
- The licensing debate: truly open vs. "open-ish"
- How small teams are fine-tuning models that rival GPT-4

### Timestamps
- 00:00 — Introduction
- 04:00 — Defining "open source" in AI
- 18:30 — The big three: Meta, Mistral, Alibaba
- 35:00 — Fine-tuning revolution
- 49:20 — Business models around open AI
- 58:00 — My predictions for 2026`,

  'side-project-10m': `## From Side Project to $10M ARR

Priya Patel, CEO of ContentLoop, shares the unfiltered story of turning a weekend project into a $10M ARR content platform — the pivots, the near-death moments, and the decisions that made the difference.

### Key Topics
- The accidental product-market fit that changed everything
- Why she turned down a $2M seed round to bootstrap
- Scaling from 0 to 10,000 customers with a 3-person team
- The pricing mistake that almost killed the company

### Timestamps
- 00:00 — Introduction
- 06:30 — The weekend project that started it all
- 19:00 — First 100 customers from a single Reddit post
- 33:45 — The pivot that unlocked growth
- 47:20 — Building a team and culture
- 62:00 — Advice for aspiring founders

### Resources Mentioned
- "The Mom Test" by Rob Fitzpatrick
- Indie Hackers community
- Stripe Atlas for company formation`,

  'bootstrapping-vs-vc': `## Bootstrapping vs. Venture Capital

Jake Morrison, angel investor and former bootstrapped founder, breaks down the real trade-offs between bootstrapping and raising venture capital — with numbers, not platitudes.

### Key Topics
- The hidden costs of VC money that nobody warns you about
- When bootstrapping is the wrong choice
- How to evaluate term sheets as a first-time founder
- The "default alive" vs. "default dead" framework

### Timestamps
- 00:00 — Introduction
- 04:45 — Jake's background: bootstrapped to $5M, then raised Series A
- 16:20 — The real cost of dilution
- 29:00 — When you should absolutely raise money
- 41:30 — Term sheet red flags
- 55:00 — The founder's decision framework

### Resources Mentioned
- Paul Graham's "Default Alive or Default Dead?"
- "Venture Deals" by Brad Feld
- AngelList data on startup outcomes`,
}

// ─── Asset Templates ───

function makeLinkedInPost(title: string, guestName: string | null): string {
  const hook = guestName
    ? `Incredible conversation with ${guestName} on the latest episode.`
    : `Just dropped a new episode that I think you need to hear.`
  return `${hook}\n\nWe dove deep into "${title}" and honestly, some of these insights blew my mind.\n\nHere are 3 things that stuck with me:\n\n1. The landscape is shifting faster than most people realize\n2. The gap between early adopters and everyone else is widening\n3. There's a massive opportunity hiding in plain sight\n\nFull episode link in comments.\n\n#podcast #ai #startups #entrepreneurship`
}

function makeTwitterThread(title: string): string {
  return `🧵 Thread: Key takeaways from our latest episode "${title}"\n\n1/ The biggest misconception people have is that this is just hype. The data tells a completely different story.\n\n2/ What surprised me most: the companies seeing real results aren't the ones with the biggest budgets — they're the ones with the clearest use cases.\n\n3/ The one thing everyone should be doing right now: start small, measure everything, and iterate fast.\n\n4/ Full episode drops today. Link in bio.`
}

function makeKeyTakeaways(title: string): string {
  return `Key Takeaways from "${title}":\n\n• The market is moving faster than most organizations can adapt\n• Early movers have a 12-18 month advantage that compounds\n• The most successful approach is iterative, not waterfall\n• ROI metrics need to evolve beyond traditional frameworks\n• Community and ecosystem matter more than individual capability`
}

function makeBlogPost(title: string, guestName: string | null): string {
  const intro = guestName
    ? `In a recent episode of the podcast, ${guestName} shared perspectives that challenge conventional thinking about this space.`
    : `In the latest episode, we explored a topic that's reshaping how we think about the industry.`
  return `# ${title}\n\n${intro}\n\nThe conversation covered everything from foundational concepts to cutting-edge applications, and several key themes emerged that are worth examining in detail.\n\n## The Big Picture\n\nWhat became clear throughout our discussion is that we're at an inflection point. The technology has matured enough to deliver real value, but most organizations are still figuring out where to start.\n\n## What This Means for You\n\nWhether you're a practitioner, a leader, or just curious about where things are heading, the insights from this conversation provide a practical framework for thinking about the future.\n\nListen to the full episode for the complete discussion.`
}

function makeYouTubeDescription(title: string, guestName: string | null): string {
  const guest = guestName ? ` with ${guestName}` : ''
  return `${title}${guest}\n\nIn this episode, we break down the most important trends, share actionable insights, and discuss what's coming next.\n\n⏰ Timestamps in the comments\n\n📧 Newsletter: getpodbrain.ai/newsletter\n🐦 Twitter: @podbrain\n💼 LinkedIn: /company/podbrain\n\n#podcast #tech #ai`
}

function makeQuoteCards(guestName: string | null): string {
  const speaker = guestName || 'Host'
  return `Notable Quotes:\n\n"The biggest risk isn't moving too fast — it's moving too slow while the world changes around you." — ${speaker}\n\n"Everyone's talking about the technology, but the real competitive advantage is in the implementation." — ${speaker}\n\n"If you're waiting for perfect conditions to start, you've already lost." — ${speaker}`
}

function makeGuestBio(name: string, bio: string): string {
  return `${name} — ${bio}\n\nConnect with ${name.split(' ')[0]}:\n• LinkedIn: linkedin.com/in/${name.toLowerCase().replace(/[^a-z]/g, '')}\n• Twitter: @${name.split(' ')[0].toLowerCase()}`
}

function makeNewsletter(title: string): string {
  return `Subject: This week's episode will change how you think about ${title.split(':')[0].toLowerCase()}\n\nHey there,\n\nThis week's episode is one I've been wanting to record for months.\n\nWe finally got to sit down and have an honest conversation about what's really happening in the industry — no hype, no fluff, just real talk backed by real data.\n\nHere's what you'll learn:\n→ The trend that's quietly reshaping everything\n→ Why most people are approaching this wrong\n→ A simple framework you can apply today\n\nListen now on your favorite podcast app.\n\nUntil next time,\nThe PodBrain Team`
}

function makeSeoDescription(title: string): string {
  return `Listen to "${title}" — a deep-dive conversation covering the latest trends, practical strategies, and expert insights. New episodes weekly on all major podcast platforms.`
}

// ─── Main Seed Logic ───

export async function POST() {
  const guard = devGuard()
  if (guard) return guard

  try {
    const supabase = await createClient()

    // ── Step 1: Clean all existing data ──
    // Delete in order respecting foreign keys
    await supabase.from('generated_assets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('episode_sections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('corrections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('vocabulary_terms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('experts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('episodes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('shows').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // ── Step 2: Create Shows ──
    const { data: shows, error: showError } = await supabase
      .from('shows')
      .insert([
        {
          user_id: DEFAULT_USER_ID,
          name: 'The AI Breakdown',
          description: 'Weekly deep-dives into artificial intelligence, machine learning, and their impact on business and society',
          default_language: 'en',
          style_preferences: { tone: 'analytical yet accessible', format_preferences: { show_notes_style: 'detailed' } },
        },
        {
          user_id: DEFAULT_USER_ID,
          name: 'Founder Fuel',
          description: 'Conversations with startup founders about building, scaling, and surviving the entrepreneurial journey',
          default_language: 'en',
          style_preferences: { tone: 'conversational and candid', format_preferences: { show_notes_style: 'narrative' } },
        },
      ])
      .select()

    if (showError || !shows) {
      return NextResponse.json({ success: false, error: 'Failed to create shows', details: showError }, { status: 500 })
    }

    const [aiShow, founderShow] = shows

    // ── Step 3: Create Episodes ──
    const episodeData = [
      // Show 1: The AI Breakdown
      {
        show_id: aiShow.id,
        title: 'GPT-5 and the Future of Reasoning',
        description: 'Dr. Sarah Chen breaks down how next-generation language models are achieving genuine reasoning capabilities and what it means for AI safety.',
        audio_url: 'https://storage.example.com/episodes/gpt5-reasoning.mp3',
        audio_duration_seconds: 3720, // 62 min
        status: 'completed' as const,
        guest_name: 'Dr. Sarah Chen',
        guest_bio: 'AI safety researcher at MIT CSAIL, previously at DeepMind. Author of "Reasoning Machines" and advisor to three AI startups.',
        guest_email: 'sarah.chen@example.com',
        show_notes: showNotes['gpt5-reasoning'],
        show_notes_html: `<div>${showNotes['gpt5-reasoning'].replace(/\n/g, '<br>')}</div>`,
        seo_score: 82,
        seo_analysis: {
          keyword_density: { 'gpt-5': 0.04, 'reasoning': 0.03, 'ai safety': 0.02, 'language model': 0.02 },
          readability_score: 78,
          header_structure: true,
          suggestions: ['Add more internal links to related episodes', 'Include a FAQ section for common questions'],
          estimated_position: 8,
        },
        viral_moments: [
          { start_time: 847, end_time: 892, text: "The thing nobody's talking about is that GPT-5 doesn't just predict the next token — it actually builds an internal world model. That's a fundamental shift.", score: 92, reason: 'Provocative claim about AI capabilities that challenges conventional understanding', type: 'revelation' },
          { start_time: 1650, end_time: 1710, text: "If we get alignment wrong with models this capable, the consequences aren't hypothetical anymore. We're past the point of academic debate.", score: 87, reason: 'Urgent framing of AI safety that creates emotional resonance', type: 'emotional' },
          { start_time: 2890, end_time: 2940, text: "Every company I advise asks me 'should we wait for GPT-5?' and my answer is always the same: the best time to start building was yesterday.", score: 78, reason: 'Actionable advice with a memorable framing', type: 'quotable' },
        ],
        language: 'en',
      },
      {
        show_id: aiShow.id,
        title: 'AI Agents in Production: What Actually Works',
        description: 'Marcus Rivera shares battle-tested insights from deploying AI agents across Fortune 500 companies — what works, what fails, and why.',
        audio_url: 'https://storage.example.com/episodes/ai-agents-production.mp3',
        audio_duration_seconds: 3960, // 66 min
        status: 'completed' as const,
        guest_name: 'Marcus Rivera',
        guest_bio: 'CTO of AgentStack and former principal engineer at Stripe. Building the infrastructure for autonomous AI agents at enterprise scale.',
        guest_email: 'marcus@agentstack.dev',
        show_notes: showNotes['ai-agents-production'],
        show_notes_html: `<div>${showNotes['ai-agents-production'].replace(/\n/g, '<br>')}</div>`,
        seo_score: 74,
        seo_analysis: {
          keyword_density: { 'ai agents': 0.05, 'production': 0.03, 'deployment': 0.02, 'reliability': 0.02 },
          readability_score: 81,
          header_structure: true,
          suggestions: ['Add structured data for episode schema', 'Include guest social links in show notes'],
          estimated_position: 12,
        },
        viral_moments: [
          { start_time: 1920, end_time: 1980, text: "90% of agent demos work great. 90% of agent deployments fail. The gap between demo and production is where all the engineering actually happens.", score: 94, reason: 'Contrarian statistic that reframes the AI agent hype', type: 'counter_intuitive' },
          { start_time: 3100, end_time: 3150, text: "We cut our API costs by 60% with one simple change: stop letting agents decide when to use expensive models. Add a router.", score: 82, reason: 'Specific, actionable advice with concrete numbers', type: 'quotable' },
        ],
        language: 'en',
      },
      {
        show_id: aiShow.id,
        title: 'The Open Source AI Movement',
        description: 'A solo deep-dive into the state of open-source AI — from Llama to Mistral to Qwen, who is building what and why it matters.',
        audio_url: 'https://storage.example.com/episodes/open-source-ai.mp3',
        audio_duration_seconds: 3540, // 59 min
        status: 'completed' as const,
        guest_name: null,
        guest_bio: null,
        guest_email: null,
        show_notes: showNotes['open-source-ai'],
        show_notes_html: `<div>${showNotes['open-source-ai'].replace(/\n/g, '<br>')}</div>`,
        seo_score: 68,
        seo_analysis: {
          keyword_density: { 'open source': 0.06, 'llama': 0.03, 'mistral': 0.02, 'fine-tuning': 0.02 },
          readability_score: 74,
          header_structure: true,
          suggestions: ['Add comparison table for model benchmarks', 'Include more external links to referenced projects', 'Consider adding a glossary section'],
          estimated_position: 15,
        },
        viral_moments: [
          { start_time: 2200, end_time: 2260, text: "Meta has spent over $30 billion on open-source AI. That's not philanthropy — that's the most aggressive platform strategy since Android.", score: 89, reason: 'Bold reframing of a major tech company strategy', type: 'controversial' },
        ],
        language: 'en',
      },
      {
        show_id: aiShow.id,
        title: 'Ethics of Synthetic Media',
        description: 'An upcoming episode exploring the ethical implications of AI-generated content, deepfakes, and synthetic media in journalism.',
        audio_url: 'https://storage.example.com/episodes/ethics-synthetic-media.mp3',
        audio_duration_seconds: null,
        status: 'pending' as const,
        guest_name: 'Dr. Maya Washington',
        guest_bio: 'Professor of Media Ethics at Columbia Journalism School',
        guest_email: 'maya.washington@example.edu',
        show_notes: null,
        show_notes_html: null,
        seo_score: null,
        seo_analysis: null,
        viral_moments: [],
        language: 'en',
      },
      // Show 2: Founder Fuel
      {
        show_id: founderShow.id,
        title: 'From Side Project to $10M ARR',
        description: 'Priya Patel shares the unfiltered story of turning a weekend project into a $10M ARR content platform.',
        audio_url: 'https://storage.example.com/episodes/side-project-10m.mp3',
        audio_duration_seconds: 4020, // 67 min
        status: 'completed' as const,
        guest_name: 'Priya Patel',
        guest_bio: 'CEO of ContentLoop. Bootstrapped from $0 to $10M ARR. Previously product manager at Shopify. Forbes 30 Under 30.',
        guest_email: 'priya@contentloop.io',
        show_notes: showNotes['side-project-10m'],
        show_notes_html: `<div>${showNotes['side-project-10m'].replace(/\n/g, '<br>')}</div>`,
        seo_score: 88,
        seo_analysis: {
          keyword_density: { 'startup': 0.04, 'arr': 0.03, 'bootstrapping': 0.03, 'side project': 0.02 },
          readability_score: 85,
          header_structure: true,
          suggestions: ['Add internal links to bootstrapping episode'],
          estimated_position: 6,
        },
        viral_moments: [
          { start_time: 1140, end_time: 1200, text: "I posted about my side project on Reddit at 2am on a Tuesday. Woke up to 400 signups and a crashed server. That was the moment I knew this wasn't a side project anymore.", score: 91, reason: 'Relatable origin story with specific, vivid details', type: 'emotional' },
          { start_time: 2520, end_time: 2580, text: "A VC offered me $2 million and I said no. My friends thought I was insane. Two years later, I owned 100% of a company doing $10M in revenue. Best decision I ever made.", score: 96, reason: 'Contrarian decision with dramatic payoff — highly shareable', type: 'counter_intuitive' },
          { start_time: 3400, end_time: 3450, text: "The pricing mistake that almost killed us? We charged $9/month. The day we raised it to $49, churn dropped by half and revenue tripled. Underpricing is a disease.", score: 88, reason: 'Counterintuitive pricing lesson with concrete numbers', type: 'revelation' },
        ],
        language: 'en',
      },
      {
        show_id: founderShow.id,
        title: 'Bootstrapping vs. Venture Capital',
        description: 'Jake Morrison breaks down the real trade-offs between bootstrapping and VC — with numbers, not platitudes.',
        audio_url: 'https://storage.example.com/episodes/bootstrapping-vs-vc.mp3',
        audio_duration_seconds: 3480, // 58 min
        status: 'completed' as const,
        guest_name: 'Jake Morrison',
        guest_bio: 'Angel investor and former bootstrapped founder. Sold his first company for $18M after bootstrapping to profitability. Now advises 40+ startups.',
        guest_email: 'jake@morrisonventures.com',
        show_notes: showNotes['bootstrapping-vs-vc'],
        show_notes_html: `<div>${showNotes['bootstrapping-vs-vc'].replace(/\n/g, '<br>')}</div>`,
        seo_score: 71,
        seo_analysis: {
          keyword_density: { 'bootstrapping': 0.05, 'venture capital': 0.04, 'funding': 0.03, 'term sheet': 0.02 },
          readability_score: 79,
          header_structure: true,
          suggestions: ['Add a comparison chart between bootstrapping and VC', 'Include links to recommended books'],
          estimated_position: 10,
        },
        viral_moments: [
          { start_time: 980, end_time: 1040, text: "I bootstrapped my company to $5M in revenue, then raised a Series A. Looking back, the fundraise cost me more than it gave me — and I don't just mean equity.", score: 85, reason: 'Personal story that challenges startup conventional wisdom', type: 'controversial' },
          { start_time: 2700, end_time: 2750, text: "Here's the math nobody shows you: after four rounds of funding, the average founder owns 6% of their company. Six percent. Let that sink in.", score: 90, reason: 'Shocking statistic presented with emotional weight', type: 'revelation' },
        ],
        language: 'en',
      },
      {
        show_id: founderShow.id,
        title: 'Hiring Your First 10 Employees',
        description: 'A guide to the most critical hires in your startup journey — who to hire first, where to find them, and the mistakes that kill early teams.',
        audio_url: 'https://storage.example.com/episodes/hiring-first-10.mp3',
        audio_duration_seconds: 2700, // 45 min
        status: 'processing' as const,
        guest_name: 'Aisha Johnson',
        guest_bio: 'Head of People at Runway ML, previously built talent teams at Notion and Linear.',
        guest_email: 'aisha@runwayml.com',
        show_notes: null,
        show_notes_html: null,
        seo_score: null,
        seo_analysis: null,
        viral_moments: [],
        language: 'en',
      },
    ]

    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .insert(episodeData)
      .select()

    if (epError || !episodes) {
      return NextResponse.json({ success: false, error: 'Failed to create episodes', details: epError }, { status: 500 })
    }

    // ── Step 4: Create Generated Assets for completed episodes ──
    const completedEpisodes = episodes.filter(ep => ep.status === 'completed')
    const assets: Array<{ episode_id: string; asset_type: string; content: string; metadata: Record<string, unknown> }> = []

    for (const ep of completedEpisodes) {
      const title = ep.title || 'Untitled'
      const guestName = ep.guest_name

      assets.push(
        { episode_id: ep.id, asset_type: 'show_notes', content: ep.show_notes || '', metadata: { word_count: (ep.show_notes || '').split(/\s+/).length } },
        { episode_id: ep.id, asset_type: 'linkedin_post', content: makeLinkedInPost(title, guestName), metadata: { platform: 'linkedin', char_count: makeLinkedInPost(title, guestName).length } },
        { episode_id: ep.id, asset_type: 'twitter_thread', content: makeTwitterThread(title), metadata: { platform: 'twitter', tweet_count: 4 } },
        { episode_id: ep.id, asset_type: 'key_takeaways', content: makeKeyTakeaways(title), metadata: { takeaway_count: 5 } },
        { episode_id: ep.id, asset_type: 'blog_post', content: makeBlogPost(title, guestName), metadata: { word_count: makeBlogPost(title, guestName).split(/\s+/).length } },
        { episode_id: ep.id, asset_type: 'youtube_description', content: makeYouTubeDescription(title, guestName), metadata: { platform: 'youtube' } },
        { episode_id: ep.id, asset_type: 'quote_cards', content: makeQuoteCards(guestName), metadata: { quote_count: 3 } },
        { episode_id: ep.id, asset_type: 'newsletter_email', content: makeNewsletter(title), metadata: { type: 'newsletter' } },
        { episode_id: ep.id, asset_type: 'seo_description', content: makeSeoDescription(title), metadata: { char_count: makeSeoDescription(title).length } },
      )

      // Add guest bio only for episodes with guests
      if (guestName && ep.guest_bio) {
        assets.push({
          episode_id: ep.id,
          asset_type: 'guest_bio_short',
          content: makeGuestBio(guestName, ep.guest_bio),
          metadata: { guest_name: guestName },
        })
      }
    }

    const { error: assetError } = await supabase.from('generated_assets').insert(assets)
    if (assetError) {
      return NextResponse.json({ success: false, error: 'Failed to create assets', details: assetError }, { status: 500 })
    }

    // ── Step 5: Seed Vocabulary Terms (for AI show) ──
    const vocabTerms = [
      { show_id: aiShow.id, term: 'GPT-5', alternatives: ['GPT5', 'GPT 5'] },
      { show_id: aiShow.id, term: 'transformer architecture', alternatives: ['transformer model', 'attention mechanism'] },
      { show_id: aiShow.id, term: 'retrieval-augmented generation', alternatives: ['RAG', 'retrieval augmented generation'] },
      { show_id: aiShow.id, term: 'fine-tuning', alternatives: ['finetuning', 'fine tuning'] },
      { show_id: aiShow.id, term: 'RLHF', alternatives: ['reinforcement learning from human feedback'] },
      { show_id: founderShow.id, term: 'ARR', alternatives: ['annual recurring revenue'] },
      { show_id: founderShow.id, term: 'bootstrapping', alternatives: ['bootstrap', 'self-funded'] },
    ]

    const { error: vocabError } = await supabase.from('vocabulary_terms').insert(vocabTerms)
    if (vocabError) {
      return NextResponse.json({ success: false, error: 'Failed to create vocabulary', details: vocabError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      counts: {
        shows: shows.length,
        episodes: episodes.length,
        completedEpisodes: completedEpisodes.length,
        assets: assets.length,
        vocabularyTerms: vocabTerms.length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Unexpected error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
