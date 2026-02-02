import { task, logger } from "@trigger.dev/sdk";
import type { AssetType, GeneratedAsset, ViralMoment } from "@/types/database";

/**
 * Input payload for the generate-assets job
 */
export interface GenerateAssetsPayload {
  episodeId: string;
  transcript: string;
  showNotes: string;
  guestName?: string;
  viralMoments?: ViralMoment[];
  assetTypes?: AssetType[];
}

/**
 * Individual generated asset
 */
export interface GeneratedAssetOutput {
  assetType: AssetType;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Result of the asset generation job
 */
export interface AssetsResult {
  assets: GeneratedAssetOutput[];
  generatedCount: number;
  failedTypes: AssetType[];
}

/**
 * Default asset types to generate
 */
const DEFAULT_ASSET_TYPES: AssetType[] = [
  "linkedin_post",
  "twitter_thread",
  "instagram_carousel",
  "newsletter",
  "blog_post",
  "youtube_description",
  "tiktok_hook",
  "quote_card",
];

/**
 * Generate all content assets for an episode
 */
export const generateAssetsTask = task({
  id: "generate-assets",
  // Asset generation should complete within 5 minutes
  maxDuration: 300,
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: GenerateAssetsPayload): Promise<AssetsResult> => {
    const {
      episodeId,
      transcript,
      showNotes,
      guestName,
      viralMoments = [],
      assetTypes = DEFAULT_ASSET_TYPES,
    } = payload;

    logger.info("Starting asset generation", {
      episodeId,
      assetTypes,
      viralMomentsCount: viralMoments.length,
    });

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("XAI_API_KEY environment variable is not set");
    }

    const assets: GeneratedAssetOutput[] = [];
    const failedTypes: AssetType[] = [];

    // Generate each asset type
    for (const assetType of assetTypes) {
      try {
        logger.info("Generating asset", { episodeId, assetType });

        const asset = await generateAsset(
          apiKey,
          assetType,
          transcript,
          showNotes,
          guestName,
          viralMoments
        );

        assets.push(asset);

        logger.info("Asset generated successfully", {
          episodeId,
          assetType,
          contentLength: asset.content.length,
        });
      } catch (error) {
        logger.error("Failed to generate asset", {
          episodeId,
          assetType,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failedTypes.push(assetType);
      }
    }

    const result: AssetsResult = {
      assets,
      generatedCount: assets.length,
      failedTypes,
    };

    logger.info("Asset generation completed", {
      episodeId,
      generatedCount: result.generatedCount,
      failedCount: result.failedTypes.length,
    });

    return result;
  },
});

/**
 * Generate a specific individual asset
 */
export const generateSingleAssetTask = task({
  id: "generate-single-asset",
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 15000,
    factor: 2,
  },
  run: async (payload: {
    episodeId: string;
    assetType: AssetType;
    transcript: string;
    showNotes: string;
    guestName?: string;
    viralMoments?: ViralMoment[];
  }): Promise<GeneratedAssetOutput> => {
    const { episodeId, assetType, transcript, showNotes, guestName, viralMoments = [] } = payload;

    logger.info("Generating single asset", { episodeId, assetType });

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("XAI_API_KEY environment variable is not set");
    }

    const asset = await generateAsset(
      apiKey,
      assetType,
      transcript,
      showNotes,
      guestName,
      viralMoments
    );

    logger.info("Single asset generated", {
      episodeId,
      assetType,
      contentLength: asset.content.length,
    });

    return asset;
  },
});

/**
 * Generate a specific asset type using xAI Grok
 */
async function generateAsset(
  apiKey: string,
  assetType: AssetType,
  transcript: string,
  showNotes: string,
  guestName?: string,
  viralMoments?: ViralMoment[]
): Promise<GeneratedAssetOutput> {
  const prompt = buildAssetPrompt(assetType, transcript, showNotes, guestName, viralMoments);

  // TODO: Implement actual xAI Grok API call
  // Placeholder implementation for development

  logger.info("xAI Grok API request for asset", {
    assetType,
    promptLength: prompt.length,
  });

  // Actual implementation:
  // const response = await fetch("https://api.x.ai/v1/chat/completions", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${apiKey}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     model: "grok-beta",
  //     messages: [
  //       { role: "system", content: getAssetSystemPrompt(assetType) },
  //       { role: "user", content: prompt },
  //     ],
  //     temperature: 0.8,
  //   }),
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`xAI API error: ${response.status}`);
  // }
  //
  // const data = await response.json();
  // const content = data.choices[0].message.content;

  // Placeholder: Return mock content
  const content = getMockAssetContent(assetType, guestName);

  return {
    assetType,
    content,
    metadata: {
      generatedAt: new Date().toISOString(),
      model: "grok-beta",
      promptTokens: Math.ceil(prompt.length / 4),
    },
  };
}

/**
 * Get the system prompt for each asset type
 */
function getAssetSystemPrompt(assetType: AssetType): string {
  const prompts: Partial<Record<AssetType, string>> = {
    show_notes: "You are an expert podcast show notes writer.",
    linkedin_post:
      "You are a LinkedIn content strategist. Create professional, engaging posts that drive engagement and establish thought leadership. Include relevant hashtags.",
    linkedin_post_host:
      "You are a LinkedIn content strategist. Create professional posts from the host's perspective highlighting key insights from the episode.",
    linkedin_post_guest:
      "You are a LinkedIn content strategist. Create a post template for the guest to share about their podcast appearance.",
    linkedin_article:
      "You are a LinkedIn article writer. Create long-form thought leadership content based on the podcast discussion.",
    twitter_thread:
      "You are a Twitter/X content expert. Create engaging tweet threads that capture attention and encourage retweets. Each tweet should be under 280 characters. Number them clearly.",
    twitter_single:
      "You are a Twitter/X content expert. Create a single engaging tweet that promotes the episode.",
    instagram_carousel:
      "You are an Instagram content creator. Create carousel slide content with catchy headlines and brief, impactful text for each slide. Suggest visual ideas.",
    instagram_caption:
      "You are an Instagram content creator. Create engaging captions with relevant hashtags and calls to action.",
    instagram_reel_script:
      "You are a short-form video content creator. Create scripts for Instagram Reels that capture attention quickly.",
    newsletter:
      "You are a newsletter writer. Create engaging email content with a compelling subject line, preview text, and well-structured body content.",
    newsletter_email:
      "You are a newsletter writer. Create engaging email content with a compelling subject line, preview text, and well-structured body content.",
    blog_post:
      "You are a blog post writer. Create an SEO-optimized, comprehensive blog post with proper headers, engaging introduction, and clear conclusion.",
    youtube_description:
      "You are a YouTube SEO expert. Create an optimized video description with timestamps, relevant keywords, and clear calls to action.",
    youtube_shorts_script:
      "You are a YouTube Shorts content creator. Create short, punchy scripts optimized for vertical video.",
    youtube_title_tags:
      "You are a YouTube SEO expert. Create optimized titles and tags for maximum discoverability.",
    tiktok_hook:
      "You are a TikTok content strategist. Create attention-grabbing hooks that stop the scroll in the first 3 seconds. Include trending sounds suggestions.",
    tiktok_hooks:
      "You are a TikTok content strategist. Create multiple attention-grabbing hooks that stop the scroll.",
    tiktok_script:
      "You are a TikTok content creator. Create full scripts optimized for the TikTok format.",
    quote_card:
      "You are a social media designer. Extract the most powerful quotes and format them for visual quote cards. Include attribution and context.",
    quote_cards:
      "You are a social media designer. Extract the most powerful quotes and format them for visual quote cards.",
    audiogram:
      "You are an audiogram content specialist. Identify the most engaging audio clips with timestamps and suggest visual treatments.",
    audiogram_clips:
      "You are an audiogram content specialist. Identify the most engaging audio clips with timestamps.",
    key_takeaways:
      "You are a content summarization expert. Extract the most valuable and actionable insights from the podcast.",
    episode_titles:
      "You are a podcast marketing expert. Create compelling, SEO-optimized episode title variations.",
    chapter_markers:
      "You are a podcast editor. Create meaningful chapter markers with timestamps for podcast players.",
    press_release:
      "You are a PR specialist. Write professional press releases in AP style.",
    transcript_summary:
      "You are a content summarization expert. Create condensed summaries that preserve key moments.",
    seo_description:
      "You are an SEO specialist. Write optimized meta descriptions for search engines.",
    discussion_questions:
      "You are a community engagement specialist. Create thought-provoking discussion questions.",
    poll_ideas:
      "You are a social media strategist. Create engaging poll questions for audience interaction.",
    call_to_action:
      "You are a marketing copywriter. Create compelling calls to action tied to episode content.",
    guest_bio_short:
      "You are a professional bio writer. Create concise, impactful guest bios.",
    guest_promo_kit:
      "You are a podcast marketing specialist. Create promotional content packages for guests.",
    podcast_teaser:
      "You are a podcast marketing specialist. Create compelling teasers that hook potential listeners.",
    cross_promo_script:
      "You are a podcast advertising specialist. Create conversational ad reads for cross-promotion.",
    medium_article:
      "You are a Medium writer. Create engaging long-form articles optimized for the platform.",
    substack_post:
      "You are a Substack writer. Create personal, newsletter-style content that builds subscriber relationships.",
    ai_summary_short:
      "You are a content summarization expert. Create concise TL;DR summaries.",
    ai_summary_detailed:
      "You are a content summarization expert. Create comprehensive episode summaries.",
    highlight_reel:
      "You are a podcast editor. Identify the most engaging moments for highlight clips.",
    infographic_outline:
      "You are a visual content strategist. Create outlines for informative infographics.",
  };

  return prompts[assetType] || "You are a content creation expert.";
}

/**
 * Build the prompt for generating a specific asset
 */
function buildAssetPrompt(
  assetType: AssetType,
  transcript: string,
  showNotes: string,
  guestName?: string,
  viralMoments?: ViralMoment[]
): string {
  let prompt = `Create a ${formatAssetType(assetType)} based on the following podcast content.\n\n`;

  if (guestName) {
    prompt += `Guest: ${guestName}\n\n`;
  }

  prompt += `SHOW NOTES SUMMARY:\n${showNotes.substring(0, 2000)}\n\n`;

  // Include viral moments for social content
  if (
    viralMoments &&
    viralMoments.length > 0 &&
    ["twitter_thread", "linkedin_post", "quote_card", "tiktok_hook"].includes(assetType)
  ) {
    prompt += "MOST SHAREABLE MOMENTS:\n";
    for (const moment of viralMoments.slice(0, 5)) {
      prompt += `- "${moment.text}" (Score: ${moment.score}/100 - ${moment.reason})\n`;
    }
    prompt += "\n";
  }

  // Add specific instructions per asset type
  prompt += getAssetSpecificInstructions(assetType);

  return prompt;
}

/**
 * Get specific instructions for each asset type
 */
function getAssetSpecificInstructions(assetType: AssetType): string {
  const instructions: Partial<Record<AssetType, string>> = {
    show_notes: "Create comprehensive show notes with timestamps and key takeaways.",
    linkedin_post: `
Create a LinkedIn post that:
- Hooks readers in the first line
- Provides value and insights
- Ends with a question or call to action
- Includes 3-5 relevant hashtags
- Is 1300 characters or less`,
    linkedin_post_host: `
Create a LinkedIn post from the host's perspective that:
- Shares personal insights from the conversation
- Highlights key learnings
- Tags the guest (use placeholder)
- Includes 3-5 relevant hashtags`,
    linkedin_post_guest: `
Create a LinkedIn post template for the guest that:
- Thanks the host
- Highlights their key points
- Promotes the episode
- Includes relevant hashtags`,
    twitter_thread: `
Create a Twitter thread with:
- 5-8 tweets maximum
- First tweet hooks the reader
- Each tweet under 280 characters
- Number each tweet (1/, 2/, etc.)
- Final tweet has call to action
- Include relevant hashtags in last tweet`,
    twitter_single: `
Create a single tweet that:
- Is under 280 characters
- Hooks the reader
- Includes relevant hashtags`,
    instagram_carousel: `
Create an Instagram carousel with:
- 7-10 slides
- Slide 1: Attention-grabbing headline
- Slides 2-9: Key points with brief text
- Final slide: Call to action
- Keep text minimal and impactful
- Suggest visual concepts for each slide`,
    newsletter: `
Create newsletter content with:
- Subject line (50 chars max)
- Preview text (100 chars max)
- Engaging opening paragraph
- 3-4 key takeaways with bullet points
- Call to action
- PS line with bonus tip`,
    newsletter_email: `
Create newsletter content with:
- Subject line (50 chars max)
- Preview text (100 chars max)
- Engaging opening paragraph
- 3-4 key takeaways with bullet points
- Call to action
- PS line with bonus tip`,
    blog_post: `
Create a blog post with:
- SEO-optimized title (60 chars)
- Meta description (160 chars)
- H2 and H3 headers
- 800-1200 words
- Internal linking suggestions
- Call to action at the end`,
    youtube_description: `
Create a YouTube description with:
- First 2 lines hook (shows in preview)
- Timestamps for key moments
- Links section (placeholder URLs)
- Keywords naturally integrated
- Subscribe CTA
- 1000 characters minimum`,
    tiktok_hook: `
Create 5 TikTok hook options:
- Each under 10 words
- Stop-the-scroll opening
- Creates curiosity gap
- Suggest trending sound/format
- Include on-screen text suggestion`,
    tiktok_hooks: `
Create 3 TikTok hook options:
- Each under 10 words
- Stop-the-scroll opening
- Creates curiosity gap`,
    quote_card: `
Extract 5 powerful quotes:
- Each quote 20-40 words
- Standalone impact
- Include speaker attribution
- Suggest visual style (minimal, bold, etc.)
- Include context if needed`,
    quote_cards: `
Extract 3-5 powerful quotes:
- Each quote 20-40 words
- Standalone impact
- Include speaker attribution`,
    audiogram: `
Identify 3-5 audiogram clips:
- Start and end timestamps
- 30-60 seconds each
- Standalone impact
- Suggest visual treatment
- Include hook line for caption`,
    audiogram_clips: `
Identify 3-5 audiogram clips:
- Start and end timestamps
- 30-60 seconds each
- Standalone impact`,
    key_takeaways: `
Extract 5-7 key takeaways:
- Clear, actionable insights
- Written as bullet points
- Include brief context`,
    episode_titles: `
Create 3-5 episode title options:
- SEO-optimized
- Under 60 characters each
- Include hooks and keywords`,
  };

  return instructions[assetType] || "Generate engaging content based on the podcast.";
}

/**
 * Format asset type for display
 */
function formatAssetType(assetType: AssetType): string {
  const formats: Partial<Record<AssetType, string>> = {
    show_notes: "show notes",
    linkedin_post: "LinkedIn post",
    linkedin_post_host: "LinkedIn post (host)",
    linkedin_post_guest: "LinkedIn post (guest)",
    linkedin_article: "LinkedIn article",
    twitter_thread: "Twitter/X thread",
    twitter_single: "Twitter/X post",
    instagram_carousel: "Instagram carousel",
    instagram_caption: "Instagram caption",
    instagram_reel_script: "Instagram Reel script",
    newsletter: "newsletter email",
    newsletter_email: "newsletter email",
    blog_post: "blog post",
    youtube_description: "YouTube description",
    youtube_shorts_script: "YouTube Shorts script",
    youtube_title_tags: "YouTube title & tags",
    tiktok_hook: "TikTok hooks",
    tiktok_hooks: "TikTok hooks",
    tiktok_script: "TikTok script",
    quote_card: "quote cards",
    quote_cards: "quote cards",
    audiogram: "audiogram clips",
    audiogram_clips: "audiogram clips",
    key_takeaways: "key takeaways",
    episode_titles: "episode titles",
    chapter_markers: "chapter markers",
    press_release: "press release",
    transcript_summary: "transcript summary",
    seo_description: "SEO description",
    discussion_questions: "discussion questions",
    poll_ideas: "poll ideas",
    call_to_action: "call to action",
    guest_bio_short: "guest bio",
    guest_promo_kit: "guest promo kit",
    podcast_teaser: "podcast teaser",
    cross_promo_script: "cross-promo script",
    medium_article: "Medium article",
    substack_post: "Substack post",
    ai_summary_short: "AI summary (short)",
    ai_summary_detailed: "AI summary (detailed)",
    highlight_reel: "highlight reel",
    infographic_outline: "infographic outline",
  };
  return formats[assetType] || assetType.replace(/_/g, ' ');
}

/**
 * Get mock content for each asset type (for development)
 */
function getMockAssetContent(assetType: AssetType, guestName?: string): string {
  const mockContent: Partial<Record<AssetType, string>> = {
    show_notes: "See generate-show-notes.ts for show notes generation.",
    linkedin_post: `🎙️ Just dropped a game-changing podcast episode!

The future of content creation is here, and it's powered by AI.

Key takeaways:
→ AI transcription is 98% accurate (and getting better)
→ One podcast episode = 30+ content pieces
→ Time saved: 10+ hours per episode

${guestName ? `Huge thanks to ${guestName} for sharing these insights!` : ""}

What's your biggest podcasting challenge? Drop it in the comments 👇

#Podcasting #ContentCreation #AI #PodcastTips #ContentStrategy`,
    twitter_thread: `1/ Just finished recording and WOW - this episode is packed with value.

Here are 5 insights that blew my mind about AI in podcasting 🧵

2/ AI transcription accuracy has reached 98%+

That means near-perfect transcripts in minutes, not hours. Game changer for show notes.

3/ The "content multiplication" strategy:

One 30-min podcast =
- Blog post
- Newsletter
- 10+ social posts
- Quote cards
- Video clips

4/ SEO tip: Podcast transcripts are goldmines for keywords.

Google can't listen to audio, but it CAN read your transcript.

5/ The future isn't about replacing creators - it's about amplifying them.

AI handles the repetitive stuff. You focus on the creative stuff.

6/ Want to dive deeper?

🎧 Full episode link in bio

Drop a 🎙️ if you're excited about the future of podcasting!`,
    instagram_carousel: `SLIDE 1:
"5 AI Tools That Will Transform Your Podcast"
(Bold text, gradient background)

SLIDE 2:
"1. AI Transcription"
Get 98% accurate transcripts in minutes
(Icon: microphone → text)

SLIDE 3:
"2. Content Multiplication"
Turn 1 episode into 30+ pieces of content
(Icon: 1 → many)

SLIDE 4:
"3. SEO Optimization"
Automatic keyword extraction & analysis
(Icon: search + chart)

SLIDE 5:
"4. Show Notes Generation"
Professional notes in seconds
(Icon: document + magic wand)

SLIDE 6:
"5. Social Media Assets"
Auto-generated posts, threads, carousels
(Icon: social media logos)

SLIDE 7:
"The Result?"
10+ hours saved per episode
(Icon: clock + checkmark)

SLIDE 8:
"Ready to level up your podcast?"
Link in bio 🎙️
(CTA button visual)`,
    newsletter: `SUBJECT: The AI podcasting revolution is here (and you're invited)

PREVIEW: 5 ways AI is transforming content creation for podcasters

---

Hey there,

Something exciting is happening in the podcasting world, and I couldn't wait to share it with you.

${guestName ? `I just finished recording with ${guestName}, and` : `I just recorded an episode that`} completely changed how I think about content creation.

Here's the TL;DR:

**The 5 Game-Changers:**

1. ⚡ AI transcription that's 98% accurate
2. 📱 One episode = 30+ content pieces (automatically)
3. 🔍 SEO optimization built right in
4. ⏰ 10+ hours saved per episode
5. 🎯 Better audience reach with less effort

**The biggest insight?**

AI isn't replacing podcasters. It's giving us superpowers.

While everyone else spends hours on show notes and social posts, early adopters are focusing on what matters: creating great content.

🎧 [Listen to the full episode here]

Talk soon,
[Your Name]

P.S. - The quote about "content multiplication" from the episode is pure gold. Check out timestamp 8:15 if you only have 2 minutes.`,
    blog_post: `# How AI is Revolutionizing Podcast Content Creation in 2024

**Meta Description:** Discover how AI-powered tools are transforming podcast production, from automated transcription to content multiplication. Learn the strategies top podcasters use to save 10+ hours per episode.

## Introduction

The podcasting landscape is undergoing a seismic shift. What once required hours of manual work—transcription, show notes, social media content—can now be accomplished in minutes with AI-powered tools.

In this comprehensive guide, we'll explore how artificial intelligence is transforming podcast content creation and how you can leverage these tools to grow your show.

## The Rise of AI in Podcasting

### Automated Transcription

Modern AI transcription services achieve 98%+ accuracy, rivaling human transcribers at a fraction of the cost and time.

### Content Multiplication

The concept is simple but powerful: one podcast episode becomes 30+ pieces of content automatically.

## 5 Ways AI is Changing Podcasting

### 1. Instant Transcription
### 2. Automated Show Notes
### 3. SEO Optimization
### 4. Social Media Content Generation
### 5. Audience Analytics

## Implementation Strategy

Here's how to get started...

## Conclusion

The future of podcasting isn't about working harder—it's about working smarter. AI tools are leveling the playing field, giving independent creators access to capabilities that were once reserved for major networks.

**Ready to transform your podcast workflow? [Start your free trial today.]**`,
    youtube_description: `🎙️ AI is changing podcasting forever - here's how!

In this episode, we dive deep into the world of AI-powered content creation for podcasters. ${guestName ? `Joined by ${guestName}, we` : "We"} explore how artificial intelligence is revolutionizing everything from transcription to social media content.

📌 TIMESTAMPS:
0:00 - Introduction
2:30 - What is AI transcription?
8:15 - The content multiplication strategy
15:00 - SEO optimization tips
22:45 - Tools and recommendations
28:00 - Final thoughts

🔗 LINKS MENTIONED:
• [Tool 1] - link
• [Tool 2] - link
• [Resource] - link

📱 CONNECT WITH US:
• Twitter: @handle
• Instagram: @handle
• Website: url

💬 JOIN THE CONVERSATION:
What's your biggest podcasting challenge? Let us know in the comments!

🔔 Don't forget to SUBSCRIBE and hit the bell for more podcasting tips!

#Podcasting #AI #ContentCreation #PodcastTips`,
    tiktok_hook: `HOOK 1:
"Stop spending 10 hours on podcast editing..."
(Sound: trending "wait for it" audio)
On-screen: "What I learned after 100 episodes 🎙️"

HOOK 2:
"POV: You discover AI can do your show notes"
(Sound: mind-blown audio)
On-screen: Text revealing in sync

HOOK 3:
"This ONE tool saved my podcast..."
(Sound: suspenseful buildup)
On-screen: Reveal at drop

HOOK 4:
"Podcasters in 2020 vs 2024"
(Sound: glow up trend audio)
On-screen: Split screen comparison

HOOK 5:
"If you're still writing show notes manually..."
(Sound: "oh no" audio)
On-screen: Shocked face + solution reveal`,
    quote_card: `QUOTE 1:
"AI isn't replacing podcasters, it's empowering them to reach wider audiences."
${guestName ? `- ${guestName}` : ""}
Style: Minimal, white background, bold text
Context: On the future of AI in content creation

QUOTE 2:
"One podcast episode should become 30 pieces of content. Anything less is leaving value on the table."
Style: Gradient background, modern sans-serif
Context: Content multiplication strategy

QUOTE 3:
"The podcasters who win aren't just making great audio - they're building content empires."
Style: Dark mode, neon accents
Context: Scaling your podcast business

QUOTE 4:
"Time is your most valuable asset. AI gives it back to you."
Style: Clean, professional, brand colors
Context: ROI of AI tools

QUOTE 5:
"Your transcript is an SEO goldmine waiting to be discovered."
Style: Bold, eye-catching, yellow/black
Context: SEO optimization tip`,
    audiogram: `CLIP 1:
Timestamp: 8:15 - 8:45
Quote: "The content multiplication strategy changed everything for me..."
Visual: Waveform + key quote highlight
Caption hook: "This strategy = 30 content pieces from 1 episode 🎙️"

CLIP 2:
Timestamp: 15:30 - 16:00
Quote: "Most podcasters are sitting on SEO goldmines and don't even know it..."
Visual: Waveform + animated text
Caption hook: "Your podcast transcript is worth more than you think 📈"

CLIP 3:
Timestamp: 22:00 - 22:30
Quote: "AI isn't the future anymore. It's the present..."
Visual: Waveform + speaker photo
Caption hook: "Are you still doing this manually? 👀"

CLIP 4:
Timestamp: 5:45 - 6:15
${guestName ? `Quote: "${guestName} drops truth bombs about..."\n` : ""}Visual: Split waveform + reaction
Caption hook: "This advice is worth the entire episode 🔥"`,
  };

  return mockContent[assetType] || `Generated ${assetType} content placeholder.`;
}

export default generateAssetsTask;
