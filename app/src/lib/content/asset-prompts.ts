/**
 * Asset Generation Prompts for PodBrain Content Multiplication Engine
 * 30+ asset types generated from podcast transcripts
 */

import type { AssetType } from '@/types/database';

export interface AssetContext {
  transcript: string;
  episodeTitle: string;
  showName: string;
  guestName?: string;
  guestBio?: string;
  keyTopics?: string[];
  summary?: string;
  targetKeywords?: string[];
  tone?: string;
  viralMoments?: Array<{
    text: string;
    score: number;
    type: string;
  }>;
}

export interface AssetPromptConfig {
  systemPrompt: string;
  userPrompt: (context: AssetContext) => string;
  maxTokens?: number;
  temperature?: number;
}

const COMMON_SYSTEM_PROMPT = `You are an expert content creator specializing in podcast repurposing. Create engaging, platform-optimized content that maintains the original message while adapting to each format's best practices. Always respond with valid JSON.`;

export const ASSET_PROMPTS: Record<AssetType, AssetPromptConfig> = {
  // ============================================
  // CORE CONTENT
  // ============================================
  show_notes: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Generate comprehensive podcast show notes.

Episode: ${ctx.episodeTitle}
Show: ${ctx.showName}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 8000)}

Return JSON:
{
  "markdown": "Complete formatted show notes in markdown",
  "summary": "2-3 paragraph summary",
  "keyTopics": ["array", "of", "topics"],
  "timestamps": [{"time": "MM:SS", "topic": "description"}]
}`,
    maxTokens: 4000,
  },

  episode_titles: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Generate 10 compelling episode title options for SEO and engagement.

Current Title: ${ctx.episodeTitle}
Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

Summary: ${ctx.summary || ctx.transcript.slice(0, 1000)}

Return JSON:
{
  "titles": [
    {"title": "...", "type": "curiosity_hook"},
    {"title": "...", "type": "benefit_driven"},
    {"title": "...", "type": "controversy"},
    {"title": "...", "type": "how_to"},
    {"title": "...", "type": "numbered_list"},
    {"title": "...", "type": "question"},
    {"title": "...", "type": "statement"},
    {"title": "...", "type": "guest_focused"},
    {"title": "...", "type": "seo_optimized"},
    {"title": "...", "type": "emotional"}
  ]
}`,
    maxTokens: 1000,
  },

  key_takeaways: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Extract 10-15 key takeaways from this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 8000)}

Return JSON:
{
  "takeaways": [
    {
      "point": "The main insight",
      "context": "Brief context or quote",
      "actionable": true/false
    }
  ]
}`,
    maxTokens: 2000,
  },

  chapter_markers: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Generate chapter markers for podcast players.

Episode: ${ctx.episodeTitle}

TRANSCRIPT:
${ctx.transcript.slice(0, 10000)}

Return JSON:
{
  "chapters": [
    {
      "title": "Chapter title (under 40 chars)",
      "startTime": "MM:SS",
      "description": "Brief description"
    }
  ]
}

Create 8-15 logical chapters that help listeners navigate.`,
    maxTokens: 1500,
  },

  // ============================================
  // LONG-FORM CONTENT
  // ============================================
  blog_post: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write in a conversational, engaging tone suitable for blog readers.`,
    userPrompt: (ctx) => `Write a comprehensive blog post based on this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
${ctx.targetKeywords ? `Target Keywords: ${ctx.targetKeywords.join(', ')}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 10000)}

Return JSON:
{
  "title": "SEO-optimized blog title",
  "metaDescription": "150-160 character meta description",
  "content": "Full blog post in markdown with H2/H3 headers, ~1500-2000 words",
  "excerpt": "2-3 sentence excerpt for previews"
}`,
    maxTokens: 4000,
    temperature: 0.7,
  },

  newsletter_email: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write engaging email copy that drives opens and clicks.`,
    userPrompt: (ctx) => `Write a newsletter email promoting this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}

Summary: ${ctx.summary || ctx.transcript.slice(0, 2000)}

Return JSON:
{
  "subjectLines": ["Option 1", "Option 2", "Option 3"],
  "preheader": "Preview text under 100 chars",
  "body": "Email body in markdown",
  "cta": "Call to action text"
}`,
    maxTokens: 1500,
  },

  press_release: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write in formal press release style with newsworthiness.`,
    userPrompt: (ctx) => `Write a press release for this podcast episode.

Episode: ${ctx.episodeTitle}
Show: ${ctx.showName}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

Summary: ${ctx.summary || ctx.transcript.slice(0, 2000)}

Return JSON:
{
  "headline": "Attention-grabbing headline",
  "subheadline": "Supporting headline",
  "body": "Press release body with quotes and key points",
  "boilerplate": "About the show paragraph"
}`,
    maxTokens: 1500,
  },

  transcript_summary: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Create a detailed summary of this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 12000)}

Return JSON:
{
  "executiveSummary": "2-3 sentence overview",
  "detailedSummary": "5-7 paragraph detailed summary",
  "keyInsights": ["insight1", "insight2"],
  "notableQuotes": ["quote1", "quote2"]
}`,
    maxTokens: 3000,
  },

  seo_description: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Generate SEO-optimized descriptions for this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.targetKeywords ? `Target Keywords: ${ctx.targetKeywords.join(', ')}` : ''}

Summary: ${ctx.summary || ctx.transcript.slice(0, 2000)}

Return JSON:
{
  "metaDescription": "150-160 character SEO meta description",
  "shortDescription": "50-100 word description",
  "longDescription": "200-300 word detailed description",
  "keywords": ["relevant", "keywords"]
}`,
    maxTokens: 1000,
  },

  // ============================================
  // LINKEDIN
  // ============================================
  linkedin_post: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write in professional but engaging LinkedIn style with hooks and formatting.`,
    userPrompt: (ctx) => `Create a LinkedIn post promoting this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}

Summary: ${ctx.summary || ctx.transcript.slice(0, 2000)}

Return JSON:
{
  "hook": "Attention-grabbing first line",
  "body": "Full post with line breaks, emojis, and bullet points",
  "hashtags": ["#Podcast", "#relevanthashtag"],
  "characterCount": number
}`,
    maxTokens: 800,
  },

  linkedin_post_host: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write as if you're the podcast host sharing personal insights.`,
    userPrompt: (ctx) => `Create a LinkedIn post from the host's perspective.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
Tone: ${ctx.tone || 'Professional but personable'}

Summary: ${ctx.summary || ctx.transcript.slice(0, 2000)}

Return JSON:
{
  "hook": "Personal opening hook",
  "body": "Post from host perspective with personal takeaways",
  "hashtags": ["#Podcast"],
  "characterCount": number
}`,
    maxTokens: 800,
  },

  linkedin_post_guest: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write as if you're the podcast guest sharing about their appearance.`,
    userPrompt: (ctx) => `Create a LinkedIn post for the guest to share.

Episode: ${ctx.episodeTitle}
Show: ${ctx.showName}
Guest: ${ctx.guestName || 'Guest'}
Guest Bio: ${ctx.guestBio || 'Industry expert'}

Summary: ${ctx.summary || ctx.transcript.slice(0, 2000)}

Return JSON:
{
  "hook": "Guest's perspective opening",
  "body": "Post from guest perspective about their appearance",
  "hashtags": ["#PodcastGuest"],
  "characterCount": number
}`,
    maxTokens: 800,
  },

  linkedin_article: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write a thought leadership LinkedIn article.`,
    userPrompt: (ctx) => `Write a LinkedIn article based on this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 8000)}

Return JSON:
{
  "title": "Compelling article title",
  "content": "Full article in markdown, 800-1200 words",
  "keyTakeaways": ["takeaway1", "takeaway2"]
}`,
    maxTokens: 3000,
  },

  // ============================================
  // TWITTER/X
  // ============================================
  twitter_thread: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write engaging Twitter threads with hooks and value bombs.`,
    userPrompt: (ctx) => `Create a Twitter thread from this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

Key Insights: ${ctx.keyTopics?.join(', ') || 'Various topics'}
${ctx.viralMoments ? `Viral Moments: ${ctx.viralMoments.slice(0, 3).map(m => m.text).join('\n')}` : ''}

Return JSON:
{
  "tweets": [
    {"number": 1, "text": "Hook tweet under 280 chars"},
    {"number": 2, "text": "Value tweet 1"},
    {"number": 3, "text": "Value tweet 2"},
    ...
    {"number": "final", "text": "CTA tweet with link placeholder"}
  ]
}

Create 8-12 tweets. Each under 280 characters.`,
    maxTokens: 2000,
  },

  twitter_single: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Create 5 standalone tweet options for this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
${ctx.viralMoments ? `Quotable moments: ${ctx.viralMoments.slice(0, 2).map(m => m.text).join('\n')}` : ''}

Return JSON:
{
  "tweets": [
    {"text": "Tweet option 1 under 280 chars", "type": "quote"},
    {"text": "Tweet option 2", "type": "insight"},
    {"text": "Tweet option 3", "type": "question"},
    {"text": "Tweet option 4", "type": "teaser"},
    {"text": "Tweet option 5", "type": "announcement"}
  ]
}`,
    maxTokens: 800,
  },

  // ============================================
  // INSTAGRAM
  // ============================================
  instagram_carousel: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Create content for Instagram carousel slides.`,
    userPrompt: (ctx) => `Create Instagram carousel content from this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}

Return JSON:
{
  "slides": [
    {"slideNumber": 1, "heading": "Hook title", "body": "Brief engaging text"},
    {"slideNumber": 2, "heading": "Key Point 1", "body": "Explanation"},
    ...
    {"slideNumber": "last", "heading": "CTA", "body": "Listen now!"}
  ],
  "caption": "Instagram caption with emojis and hashtags"
}

Create 8-10 slides. Keep text brief for visual format.`,
    maxTokens: 2000,
  },

  instagram_caption: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Write Instagram captions for this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

Summary: ${ctx.summary || ctx.transcript.slice(0, 1500)}

Return JSON:
{
  "captions": [
    {"type": "storytelling", "text": "Caption option 1 with emojis"},
    {"type": "educational", "text": "Caption option 2"},
    {"type": "engaging_question", "text": "Caption option 3"}
  ],
  "hashtags": ["#podcast", "#relevant"]
}`,
    maxTokens: 1200,
  },

  instagram_reel_script: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write short, punchy scripts for Instagram Reels.`,
    userPrompt: (ctx) => `Create Instagram Reel scripts from this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.viralMoments ? `Viral Moments: ${ctx.viralMoments.slice(0, 3).map(m => m.text).join('\n')}` : ''}

Return JSON:
{
  "reels": [
    {
      "hook": "First 3 second hook",
      "script": "Full 30-60 second script",
      "cta": "Call to action",
      "estimatedDuration": "45s"
    }
  ]
}

Create 3 reel script options. Keep each under 60 seconds spoken.`,
    maxTokens: 1500,
  },

  // ============================================
  // TIKTOK
  // ============================================
  tiktok_hooks: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write viral TikTok hooks that stop the scroll.`,
    userPrompt: (ctx) => `Generate TikTok hook ideas from this podcast episode.

Episode: ${ctx.episodeTitle}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}
${ctx.viralMoments ? `Quotable moments: ${ctx.viralMoments.slice(0, 3).map(m => m.text).join('\n')}` : ''}

Return JSON:
{
  "hooks": [
    {"text": "Hook line 1", "style": "controversial"},
    {"text": "Hook line 2", "style": "curiosity"},
    {"text": "Hook line 3", "style": "relatable"},
    {"text": "Hook line 4", "style": "shocking"},
    {"text": "Hook line 5", "style": "educational"}
  ]
}

Create 10 hooks. Each should be under 10 words and attention-grabbing.`,
    maxTokens: 800,
  },

  tiktok_script: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write TikTok scripts that are engaging and fast-paced.`,
    userPrompt: (ctx) => `Create TikTok video scripts from this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.viralMoments ? `Best moments: ${ctx.viralMoments.slice(0, 2).map(m => m.text).join('\n')}` : ''}

Return JSON:
{
  "scripts": [
    {
      "hook": "Scroll-stopping hook",
      "body": "Main content (speak fast, 100-150 words)",
      "cta": "Call to action",
      "textOverlays": ["Text 1", "Text 2"],
      "estimatedDuration": "30s"
    }
  ]
}

Create 3 scripts. Keep them punchy and under 60 seconds.`,
    maxTokens: 1500,
  },

  // ============================================
  // YOUTUBE
  // ============================================
  youtube_description: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Write a YouTube description for this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}

Return JSON:
{
  "description": "Full YouTube description with timestamps, links sections, and SEO keywords",
  "timestamps": [{"time": "0:00", "topic": "Introduction"}],
  "tags": ["tag1", "tag2"]
}

Include: Hook paragraph, timestamps, about section, links, and hashtags.`,
    maxTokens: 1500,
  },

  youtube_shorts_script: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write YouTube Shorts scripts that are engaging and value-packed.`,
    userPrompt: (ctx) => `Create YouTube Shorts scripts from this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.viralMoments ? `Best moments: ${ctx.viralMoments.slice(0, 3).map(m => m.text).join('\n')}` : ''}

Return JSON:
{
  "shorts": [
    {
      "title": "Shorts title",
      "hook": "First 2 seconds",
      "script": "Full script under 60 seconds",
      "hashtags": ["#shorts"]
    }
  ]
}

Create 3 Shorts scripts. Each under 60 seconds.`,
    maxTokens: 1500,
  },

  youtube_title_tags: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Generate YouTube title and tag options.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
${ctx.targetKeywords ? `Keywords: ${ctx.targetKeywords.join(', ')}` : ''}

Return JSON:
{
  "titles": [
    {"title": "Option 1", "type": "curiosity"},
    {"title": "Option 2", "type": "how_to"},
    {"title": "Option 3", "type": "numbered"}
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "category": "Education"
}

Titles should be under 70 characters and SEO-optimized.`,
    maxTokens: 800,
  },

  // ============================================
  // VISUAL CONTENT
  // ============================================
  quote_cards: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Extract quotable moments for quote card graphics.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Speaker: ${ctx.guestName}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 6000)}

Return JSON:
{
  "quotes": [
    {
      "text": "The quote text (under 150 chars)",
      "speaker": "Speaker name",
      "context": "Brief context"
    }
  ]
}

Extract 5-8 impactful, shareable quotes.`,
    maxTokens: 1500,
  },

  audiogram_clips: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Identify the best clips for audiogram videos.

Episode: ${ctx.episodeTitle}
${ctx.viralMoments ? `Viral moments: ${ctx.viralMoments.map(m => `${m.text} (score: ${m.score})`).join('\n')}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 8000)}

Return JSON:
{
  "clips": [
    {
      "title": "Clip title",
      "startTime": "MM:SS",
      "endTime": "MM:SS",
      "transcript": "The clip transcript",
      "reason": "Why this clip works"
    }
  ]
}

Identify 5-8 clips between 30-90 seconds each.`,
    maxTokens: 2000,
  },

  infographic_outline: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Create an infographic outline from this podcast episode.

Episode: ${ctx.episodeTitle}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}

Summary: ${ctx.summary || ctx.transcript.slice(0, 3000)}

Return JSON:
{
  "title": "Infographic title",
  "sections": [
    {"heading": "Section 1", "points": ["point1", "point2"]},
    {"heading": "Section 2", "points": ["point1", "point2"]}
  ],
  "statistics": ["stat1", "stat2"],
  "callToAction": "CTA text"
}`,
    maxTokens: 1500,
  },

  // ============================================
  // ENGAGEMENT
  // ============================================
  discussion_questions: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Generate discussion questions for community engagement.

Episode: ${ctx.episodeTitle}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}

Summary: ${ctx.summary || ctx.transcript.slice(0, 2000)}

Return JSON:
{
  "questions": [
    {"question": "Discussion question 1", "type": "opinion"},
    {"question": "Discussion question 2", "type": "experience"},
    {"question": "Discussion question 3", "type": "action"}
  ]
}

Create 10 thoughtful questions that spark conversation.`,
    maxTokens: 1000,
  },

  poll_ideas: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Generate poll ideas for social media engagement.

Episode: ${ctx.episodeTitle}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}

Return JSON:
{
  "polls": [
    {
      "question": "Poll question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "platform": "twitter"
    }
  ]
}

Create 5 engaging polls related to episode topics.`,
    maxTokens: 800,
  },

  call_to_action: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Generate call-to-action variations for this episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

Return JSON:
{
  "ctas": [
    {"text": "CTA text", "type": "subscribe", "platform": "general"},
    {"text": "CTA text", "type": "share", "platform": "social"},
    {"text": "CTA text", "type": "review", "platform": "podcast_apps"}
  ]
}

Create 10 CTAs for different platforms and goals.`,
    maxTokens: 800,
  },

  // ============================================
  // GUEST CONTENT
  // ============================================
  guest_bio_short: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Write guest bio variations from the podcast content.

Guest: ${ctx.guestName || 'Guest'}
Existing Bio: ${ctx.guestBio || 'No bio provided'}

TRANSCRIPT:
${ctx.transcript.slice(0, 4000)}

Return JSON:
{
  "bios": [
    {"length": "short", "text": "1-2 sentence bio"},
    {"length": "medium", "text": "3-4 sentence bio"},
    {"length": "full", "text": "Full paragraph bio"}
  ]
}`,
    maxTokens: 800,
  },

  guest_promo_kit: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Create a promotional kit for the guest to share.

Episode: ${ctx.episodeTitle}
Show: ${ctx.showName}
Guest: ${ctx.guestName || 'Guest'}

Summary: ${ctx.summary || ctx.transcript.slice(0, 2000)}

Return JSON:
{
  "emailTemplate": "Email the guest can send to their list",
  "socialPosts": {
    "linkedin": "LinkedIn post for guest",
    "twitter": "Tweet for guest"
  },
  "talkingPoints": ["Point 1", "Point 2", "Point 3"]
}`,
    maxTokens: 2000,
  },

  // ============================================
  // DISTRIBUTION
  // ============================================
  podcast_teaser: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Write teaser copy to promote this upcoming episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}
Key Topics: ${ctx.keyTopics?.join(', ') || 'Various topics'}

Return JSON:
{
  "teasers": [
    {"platform": "email", "text": "Email teaser"},
    {"platform": "social", "text": "Social media teaser"},
    {"platform": "website", "text": "Website banner text"}
  ]
}`,
    maxTokens: 1000,
  },

  cross_promo_script: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Write cross-promotion scripts for other podcasts.

Episode: ${ctx.episodeTitle}
Show: ${ctx.showName}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

Summary: ${ctx.summary || ctx.transcript.slice(0, 1500)}

Return JSON:
{
  "scripts": [
    {"length": "15s", "script": "15 second promo script"},
    {"length": "30s", "script": "30 second promo script"},
    {"length": "60s", "script": "60 second promo script"}
  ]
}`,
    maxTokens: 1000,
  },

  // ============================================
  // REPURPOSING
  // ============================================
  medium_article: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write in Medium's conversational, story-driven style.`,
    userPrompt: (ctx) => `Write a Medium article based on this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 10000)}

Return JSON:
{
  "title": "Engaging Medium title",
  "subtitle": "Subtitle/deck",
  "content": "Full article in markdown, 1500-2500 words",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`,
    maxTokens: 4000,
  },

  substack_post: {
    systemPrompt: `${COMMON_SYSTEM_PROMPT} Write in Substack's newsletter style with personality.`,
    userPrompt: (ctx) => `Write a Substack post based on this podcast episode.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 8000)}

Return JSON:
{
  "title": "Substack headline",
  "subtitle": "Preview text",
  "content": "Full post in markdown with personal voice",
  "discussionPrompt": "Question to spark comments"
}`,
    maxTokens: 3500,
  },

  // ============================================
  // AI SUMMARIES
  // ============================================
  ai_summary_short: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Create a concise AI-generated summary.

Episode: ${ctx.episodeTitle}

TRANSCRIPT:
${ctx.transcript.slice(0, 6000)}

Return JSON:
{
  "summary": "2-3 sentence summary",
  "bulletPoints": ["Key point 1", "Key point 2", "Key point 3"]
}`,
    maxTokens: 500,
  },

  ai_summary_detailed: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Create a comprehensive AI-generated summary.

Episode: ${ctx.episodeTitle}
${ctx.guestName ? `Guest: ${ctx.guestName}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 12000)}

Return JSON:
{
  "overview": "3-4 sentence overview",
  "sections": [
    {"title": "Section title", "content": "Detailed section summary"}
  ],
  "keyInsights": ["Insight 1", "Insight 2"],
  "actionItems": ["Action 1", "Action 2"]
}`,
    maxTokens: 2500,
  },

  highlight_reel: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => `Identify highlight moments for a highlight reel.

Episode: ${ctx.episodeTitle}
${ctx.viralMoments ? `Viral moments: ${ctx.viralMoments.map(m => m.text).join('\n')}` : ''}

TRANSCRIPT:
${ctx.transcript.slice(0, 10000)}

Return JSON:
{
  "highlights": [
    {
      "title": "Highlight title",
      "startTime": "MM:SS",
      "endTime": "MM:SS",
      "type": "insight|story|quote|revelation",
      "impactScore": 1-100
    }
  ]
}

Identify 8-12 highlights ranked by impact.`,
    maxTokens: 2000,
  },

  // ============================================
  // LEGACY TYPES (for backwards compatibility)
  // ============================================
  newsletter: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => ASSET_PROMPTS.newsletter_email.userPrompt(ctx),
    maxTokens: 1500,
  },

  tiktok_hook: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => ASSET_PROMPTS.tiktok_hooks.userPrompt(ctx),
    maxTokens: 800,
  },

  quote_card: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => ASSET_PROMPTS.quote_cards.userPrompt(ctx),
    maxTokens: 1500,
  },

  audiogram: {
    systemPrompt: COMMON_SYSTEM_PROMPT,
    userPrompt: (ctx) => ASSET_PROMPTS.audiogram_clips.userPrompt(ctx),
    maxTokens: 2000,
  },
};

export function getAssetPrompt(assetType: AssetType): AssetPromptConfig | null {
  return ASSET_PROMPTS[assetType] || null;
}

export function getAllAssetTypes(): AssetType[] {
  return Object.keys(ASSET_PROMPTS) as AssetType[];
}

export function getAssetCategories(): Record<string, AssetType[]> {
  return {
    'Core Content': ['show_notes', 'episode_titles', 'key_takeaways', 'chapter_markers'],
    'Long-form': ['blog_post', 'newsletter_email', 'press_release', 'transcript_summary', 'seo_description'],
    'LinkedIn': ['linkedin_post', 'linkedin_post_host', 'linkedin_post_guest', 'linkedin_article'],
    'Twitter/X': ['twitter_thread', 'twitter_single'],
    'Instagram': ['instagram_carousel', 'instagram_caption', 'instagram_reel_script'],
    'TikTok': ['tiktok_hooks', 'tiktok_script'],
    'YouTube': ['youtube_description', 'youtube_shorts_script', 'youtube_title_tags'],
    'Visual': ['quote_cards', 'audiogram_clips', 'infographic_outline'],
    'Engagement': ['discussion_questions', 'poll_ideas', 'call_to_action'],
    'Guest': ['guest_bio_short', 'guest_promo_kit'],
    'Distribution': ['podcast_teaser', 'cross_promo_script'],
    'Repurposing': ['medium_article', 'substack_post'],
    'AI Summaries': ['ai_summary_short', 'ai_summary_detailed', 'highlight_reel'],
  };
}
