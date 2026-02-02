import { task, logger } from "@trigger.dev/sdk";
import type { TranscriptSegment, ViralMoment, SEOAnalysis } from "@/types/database";

/**
 * Input payload for the generate-show-notes job
 */
export interface GenerateShowNotesPayload {
  episodeId: string;
  transcript: string;
  segments: TranscriptSegment[];
  guestName?: string;
  guestBio?: string;
  showStylePreferences?: {
    tone?: string;
    format_preferences?: Record<string, unknown>;
  };
}

/**
 * Result of the show notes generation job
 */
export interface ShowNotesResult {
  showNotes: string;
  showNotesHtml: string;
  schemaMarkup: Record<string, unknown>;
  summary: string;
  keyTopics: string[];
  timestamps: Array<{
    time: string;
    timeSeconds: number;
    topic: string;
  }>;
  viralMoments: ViralMoment[];
  suggestedTitle: string;
  suggestedDescription: string;
}

/**
 * xAI Grok response structure for show notes generation
 */
interface GrokShowNotesResponse {
  show_notes_markdown: string;
  summary: string;
  key_topics: string[];
  timestamps: Array<{
    time: string;
    time_seconds: number;
    topic: string;
  }>;
  viral_moments: Array<{
    start_time: number;
    end_time: number;
    text: string;
    score: number;
    reason: string;
    type: string;
  }>;
  suggested_title: string;
  suggested_description: string;
}

/**
 * Generate show notes using xAI Grok
 */
export const generateShowNotesTask = task({
  id: "generate-show-notes",
  // Show notes generation should complete within 60 seconds
  maxDuration: 120,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: GenerateShowNotesPayload): Promise<ShowNotesResult> => {
    const { episodeId, transcript, segments, guestName, guestBio, showStylePreferences } = payload;

    logger.info("Starting show notes generation", {
      episodeId,
      transcriptLength: transcript.length,
      segmentCount: segments.length,
      hasGuest: !!guestName,
    });

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("XAI_API_KEY environment variable is not set");
    }

    // Generate show notes with xAI Grok
    const grokResponse = await generateShowNotesWithGrok(
      apiKey,
      transcript,
      segments,
      guestName,
      guestBio,
      showStylePreferences
    );

    // Convert markdown to HTML
    const showNotesHtml = markdownToHtml(grokResponse.show_notes_markdown);

    // Generate schema markup for SEO
    const schemaMarkup = generateSchemaMarkup(grokResponse, guestName);

    // Transform viral moments to our format
    const viralMoments: ViralMoment[] = grokResponse.viral_moments.map((moment) => ({
      start_time: moment.start_time,
      end_time: moment.end_time,
      text: moment.text,
      score: moment.score,
      reason: moment.reason,
      type: moment.type as ViralMoment["type"],
    }));

    const result: ShowNotesResult = {
      showNotes: grokResponse.show_notes_markdown,
      showNotesHtml,
      schemaMarkup,
      summary: grokResponse.summary,
      keyTopics: grokResponse.key_topics,
      timestamps: grokResponse.timestamps.map((t) => ({
        time: t.time,
        timeSeconds: t.time_seconds,
        topic: t.topic,
      })),
      viralMoments,
      suggestedTitle: grokResponse.suggested_title,
      suggestedDescription: grokResponse.suggested_description,
    };

    logger.info("Show notes generation completed", {
      episodeId,
      showNotesLength: result.showNotes.length,
      topicsCount: result.keyTopics.length,
      timestampsCount: result.timestamps.length,
      viralMomentsCount: result.viralMoments.length,
    });

    return result;
  },
});

/**
 * Generate show notes using xAI Grok API
 */
async function generateShowNotesWithGrok(
  apiKey: string,
  transcript: string,
  segments: TranscriptSegment[],
  guestName?: string,
  guestBio?: string,
  stylePreferences?: { tone?: string; format_preferences?: Record<string, unknown> }
): Promise<GrokShowNotesResponse> {
  logger.info("xAI Grok API request for show notes", {
    transcriptLength: transcript.length,
    hasGuest: !!guestName,
    tone: stylePreferences?.tone,
  });

  const systemPrompt = buildSystemPrompt(stylePreferences);
  const userPrompt = buildUserPrompt(transcript, segments, guestName, guestBio);

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in xAI response");
  }

  return JSON.parse(content);
}

/**
 * Build the system prompt for show notes generation
 */
function buildSystemPrompt(
  stylePreferences?: { tone?: string; format_preferences?: Record<string, unknown> }
): string {
  const tone = stylePreferences?.tone || "professional yet approachable";

  return `You are an expert podcast show notes writer. Your task is to create comprehensive, SEO-optimized show notes from podcast transcripts.

Your writing style should be ${tone}.

You must respond with a JSON object containing:
- show_notes_markdown: Complete show notes in Markdown format with headers, bullet points, and timestamps
- summary: A 2-3 sentence summary of the episode
- key_topics: Array of main topics discussed (5-10 items)
- timestamps: Array of notable moments with time codes and descriptions
- viral_moments: Array of quotable or shareable moments that could go viral
- suggested_title: An engaging, SEO-friendly episode title
- suggested_description: A compelling episode description (150-200 words)

For viral moments, identify:
- Controversial statements
- Emotional revelations
- Highly quotable insights
- Surprising revelations
- Counter-intuitive ideas

Rate each viral moment 1-100 based on shareability.`;
}

/**
 * Build the user prompt with transcript and context
 */
function buildUserPrompt(
  transcript: string,
  segments: TranscriptSegment[],
  guestName?: string,
  guestBio?: string
): string {
  let prompt = "Generate comprehensive show notes for the following podcast transcript.\n\n";

  if (guestName) {
    prompt += `Guest: ${guestName}\n`;
    if (guestBio) {
      prompt += `Guest Bio: ${guestBio}\n`;
    }
    prompt += "\n";
  }

  // Add speaker-labeled segments if available
  const hasMultipleSpeakers = new Set(segments.map((s) => s.speaker)).size > 1;

  if (hasMultipleSpeakers && segments.length > 0) {
    prompt += "TRANSCRIPT WITH SPEAKERS:\n\n";
    for (const segment of segments) {
      const timeCode = formatTimeCode(segment.start);
      prompt += `[${timeCode}] ${segment.speaker || "Speaker"}: ${segment.text}\n\n`;
    }
  } else {
    prompt += "TRANSCRIPT:\n\n";
    prompt += transcript;
  }

  return prompt;
}

/**
 * Format milliseconds to HH:MM:SS time code
 */
function formatTimeCode(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Convert markdown to HTML (simple implementation)
 */
function markdownToHtml(markdown: string): string {
  // TODO: Use a proper markdown library like 'marked' or 'remark'
  // Simple placeholder implementation

  let html = markdown;

  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Paragraphs
  html = html
    .split("\n\n")
    .map((p) => (p.startsWith("<") ? p : `<p>${p}</p>`))
    .join("\n");

  return html;
}

/**
 * Generate schema.org markup for the episode
 */
function generateSchemaMarkup(
  response: GrokShowNotesResponse,
  guestName?: string
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: response.suggested_title,
    description: response.suggested_description,
    abstract: response.summary,
    keywords: response.key_topics.join(", "),
    timeRequired: `PT${Math.ceil(response.timestamps[response.timestamps.length - 1]?.time_seconds / 60 || 0)}M`,
  };

  if (guestName) {
    schema.actor = {
      "@type": "Person",
      name: guestName,
    };
  }

  // Add table of contents
  if (response.timestamps.length > 0) {
    schema.hasPart = response.timestamps.map((ts) => ({
      "@type": "Clip",
      name: ts.topic,
      startOffset: ts.time_seconds,
    }));
  }

  return schema;
}

/**
 * Create mock show notes response for development/testing
 */
function createMockShowNotesResponse(guestName?: string): GrokShowNotesResponse {
  return {
    show_notes_markdown: `# Episode Show Notes

## Summary
In this episode, we explore the fascinating world of AI-powered podcasting tools and how they're revolutionizing content creation.

## Key Topics
- The rise of AI in podcasting
- Transcription technology advances
- Content repurposing strategies
- SEO optimization for podcasts

## Timestamps
- **[0:00]** Introduction and welcome
- **[2:30]** Discussion on AI transcription
- **[8:15]** Content multiplication strategies
- **[15:00]** SEO best practices
- **[22:45]** Final thoughts and wrap-up

## Notable Quotes
> "AI isn't replacing podcasters, it's empowering them to reach wider audiences."

## Resources Mentioned
- PodBrain AI platform
- AssemblyAI transcription
- SEO tools for podcasters

## Connect With ${guestName || "the Host"}
- Twitter: @example
- LinkedIn: /in/example
`,
    summary:
      "This episode dives deep into how AI is transforming the podcasting landscape, from automated transcription to content multiplication. We discuss practical strategies for leveraging these tools while maintaining authentic connections with your audience.",
    key_topics: [
      "AI transcription",
      "Content repurposing",
      "Podcast SEO",
      "Show notes automation",
      "Audience growth",
    ],
    timestamps: [
      { time: "0:00", time_seconds: 0, topic: "Introduction and welcome" },
      { time: "2:30", time_seconds: 150, topic: "Discussion on AI transcription" },
      { time: "8:15", time_seconds: 495, topic: "Content multiplication strategies" },
      { time: "15:00", time_seconds: 900, topic: "SEO best practices for podcasts" },
      { time: "22:45", time_seconds: 1365, topic: "Final thoughts and wrap-up" },
    ],
    viral_moments: [
      {
        start_time: 495000,
        end_time: 510000,
        text: "AI isn't replacing podcasters, it's empowering them to reach wider audiences while spending less time on repetitive tasks.",
        score: 85,
        reason: "Addresses common fear about AI with positive reframing",
        type: "quotable",
      },
      {
        start_time: 720000,
        end_time: 735000,
        text: "The podcasters who are winning right now aren't just making great audio - they're multiplying every episode into 30+ pieces of content.",
        score: 78,
        reason: "Provides actionable insight with specific number",
        type: "revelation",
      },
    ],
    suggested_title: "How AI is Revolutionizing Podcast Content Creation",
    suggested_description: `Discover how artificial intelligence is transforming the podcasting industry in this eye-opening episode. ${guestName ? `Join us with ${guestName} as we` : "We"} explore the latest advancements in AI-powered transcription, content repurposing, and SEO optimization that are helping podcasters reach wider audiences with less effort. Learn practical strategies you can implement today to multiply your content output and grow your show.`,
  };
}

export default generateShowNotesTask;
