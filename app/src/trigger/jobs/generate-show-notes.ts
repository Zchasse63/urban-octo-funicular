import { task, logger } from "@trigger.dev/sdk";
import { z } from "zod";
import type { TranscriptSegment, ViralMoment, SEOAnalysis } from "@/types/database";

// ─── Grok response schemas (runtime-validated) ─────────────────────────────
//
// Grok MUST return JSON matching these schemas. Without runtime validation,
// any field-name drift silently produces empty objects in `viral_moments`
// and `schema_markup.hasPart`. Validation failure here triggers a Trigger.dev
// retry, which is the desired behavior — a retry is always better than a
// malformed but "successful" database write.

const ViralMomentSchema = z.object({
  start_time: z.number(),
  end_time: z.number(),
  text: z.string().min(1),
  score: z.number().min(1).max(100),
  reason: z.string().min(1),
  type: z.enum([
    "controversial",
    "emotional",
    "quotable",
    "revelation",
    "counter_intuitive",
  ]),
});

const TimestampSchema = z.object({
  time: z.string().min(1),
  time_seconds: z.number().nonnegative(),
  topic: z.string().min(1),
});

const GrokShowNotesResponseSchema = z.object({
  show_notes_markdown: z.string().min(1),
  summary: z.string().min(1),
  key_topics: z.array(z.string()),
  timestamps: z.array(TimestampSchema),
  viral_moments: z.array(ViralMomentSchema),
  suggested_title: z.string().min(1),
  suggested_description: z.string().min(1),
});

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
 * xAI Grok response structure for show notes generation.
 *
 * Derived from the Zod schema above so the type and the runtime validator
 * can never drift apart.
 */
type GrokShowNotesResponse = z.infer<typeof GrokShowNotesResponseSchema>;

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

    // BUG #11 fix: Grok was rendering timestamps as broken markdown link
    // syntax (`[0:53](53)`) inside `show_notes_markdown`. We now strip any
    // timestamps section Grok may have self-rendered and replace it with
    // a clean, deterministic block built from the structured `timestamps`
    // array (which is correct because it's Zod-validated upstream).
    const strippedMarkdown = _stripTimestampsSection(grokResponse.show_notes_markdown);
    const timestampsBlock = _renderTimestampsMarkdown(grokResponse.timestamps);
    const cleanMarkdown = timestampsBlock
      ? `${strippedMarkdown}\n\n${timestampsBlock}`
      : strippedMarkdown;

    // Convert markdown to HTML
    const showNotesHtml = markdownToHtml(cleanMarkdown);

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
      showNotes: cleanMarkdown,
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
      model: process.env.XAI_MODEL || "grok-4-1-fast",
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

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch (error) {
    logger.error("Failed to parse xAI response as JSON", { content: content.slice(0, 500) });
    throw new Error("xAI returned malformed JSON response");
  }

  // Runtime shape validation. Any failure here means Grok returned a
  // differently-named field (e.g. camelCase or a renamed property) and the
  // caller's code would otherwise silently produce empty objects. A thrown
  // ZodError here triggers Trigger.dev's built-in retry.
  const parseResult = GrokShowNotesResponseSchema.safeParse(raw);
  if (!parseResult.success) {
    logger.error("xAI response failed schema validation", {
      issues: parseResult.error.issues.slice(0, 8),
      rawKeys: typeof raw === "object" && raw !== null ? Object.keys(raw) : typeof raw,
      firstViralMoment:
        typeof raw === "object" && raw !== null && "viral_moments" in raw
          ? (raw as { viral_moments?: unknown[] }).viral_moments?.[0]
          : undefined,
      firstTimestamp:
        typeof raw === "object" && raw !== null && "timestamps" in raw
          ? (raw as { timestamps?: unknown[] }).timestamps?.[0]
          : undefined,
    });
    throw new Error(
      `xAI response failed schema validation: ${parseResult.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
  }
  return parseResult.data;
}

/**
 * Build the system prompt for show notes generation.
 *
 * CRITICAL: This prompt names every field explicitly because Grok's JSON
 * output is downstream-validated by a Zod schema. Any field-name drift
 * (camelCase, renamed keys, omitted fields) causes validation failure and
 * a Trigger.dev retry. Do NOT loosen the contract here without updating the
 * Zod schema in lockstep.
 */
function buildSystemPrompt(
  stylePreferences?: { tone?: string; format_preferences?: Record<string, unknown> }
): string {
  const tone = stylePreferences?.tone || "professional yet approachable";

  return `You are an expert podcast show notes writer. Your task is to create comprehensive, SEO-optimized show notes from podcast transcripts.

Your writing style should be ${tone}.

You MUST respond with a JSON object matching this exact schema. Every field is required. Do NOT add extra fields. Do NOT rename fields. Do NOT omit any fields.

{
  "show_notes_markdown": "string — complete show notes in Markdown format with headers, bullet points, and timestamps",
  "summary": "string — a 2-3 sentence summary of the episode",
  "key_topics": ["string — main topic discussed", "..."],
  "timestamps": [
    {
      "time": "string — formatted as MM:SS or H:MM:SS (for example '12:34' or '1:05:30')",
      "time_seconds": "number — the same moment expressed as total seconds (for example 754)",
      "topic": "string — brief description of what happens at this timestamp"
    }
  ],
  "viral_moments": [
    {
      "start_time": "number — start of the clip expressed in seconds (for example 312.0)",
      "end_time": "number — end of the clip expressed in seconds (for example 328.5)",
      "text": "string — verbatim or near-verbatim quote from the transcript",
      "score": "number — shareability rating from 1 (low) to 100 (viral)",
      "reason": "string — one sentence explaining why this moment is shareable",
      "type": "string — exactly one of: controversial | emotional | quotable | revelation | counter_intuitive"
    }
  ],
  "suggested_title": "string — an engaging, SEO-friendly episode title",
  "suggested_description": "string — a compelling episode description between 150 and 200 words"
}

IMPORTANT: Do NOT include a "Timestamps" or "Chapter Markers" section inside show_notes_markdown. The timestamps array will be rendered into a clean Timestamps section programmatically after we receive your response. Any timestamp lines you put inside show_notes_markdown will be stripped and replaced.

Provide 5-10 items in key_topics. Provide 5-15 timestamps that cover the main beats of the episode. Provide 3-8 viral_moments that represent the most shareable moments.

For viral_moments, look for:
- Controversial statements
- Emotional revelations
- Highly quotable insights
- Surprising revelations
- Counter-intuitive ideas

Example of a correctly-formed viral_moment:
{
  "start_time": 312.0,
  "end_time": 328.5,
  "text": "Most people think they need a team before they can start. That's exactly backwards.",
  "score": 87,
  "reason": "Counter-intuitive claim that directly challenges common founder advice, highly quotable.",
  "type": "counter_intuitive"
}

Example of a correctly-formed timestamp:
{
  "time": "5:12",
  "time_seconds": 312,
  "topic": "Why solo founders outperform teams in the early stage"
}

Rate each viral moment 1-100 based on shareability. Do NOT omit start_time, end_time, text, score, reason, or type for any viral moment. Do NOT omit time, time_seconds, or topic for any timestamp.`;
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
  // Markdown parsing handles headers, lists, bold, and italic formatting
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
 * BUG #11 helpers: Grok was rendering timestamps as broken markdown link
 * syntax inside `show_notes_markdown` (e.g. `[0:53](53)` and `[2:10](130)`).
 * These three helpers pull the timestamps section out of Grok's markdown
 * and replace it with a server-rendered version built from the structured
 * `timestamps` array (which is Zod-validated upstream and therefore safe).
 */

/**
 * Strip any timestamps section Grok may have injected into show_notes_markdown.
 * Handles every heading variant we've observed in the wild plus a backstop
 * regex that catches stray broken `[MM:SS](N)` link-syntax lines outside any
 * heading.
 *
 * Exported as `_stripTimestampsSection` for unit tests only.
 */
export function _stripTimestampsSection(markdown: string): string {
  // Remove full sections starting with a timestamps/chapters heading. Stops at
  // the next ##-level heading, the next bold-text "header" line, or end of
  // string — whichever comes first.
  //
  // CRITICAL: JavaScript regex does NOT support `\z` (Perl/Ruby end-of-string
  // anchor). The previous version used `\z` which silently matched the literal
  // character `z`, so a Timestamps section at the very end of the markdown
  // (with no following heading and no trailing `z` in the content) would not
  // be stripped. We use a negative-lookahead-of-anything `(?![\s\S])` instead,
  // which is the canonical JavaScript "absolute end of string" anchor and
  // works regardless of multiline mode.
  let result = markdown.replace(
    /^(#{1,3}\s*time\s*stamps?|#{1,3}\s*chapters?|#{1,3}\s*chapter\s+markers?|\*\*time\s*stamps?\*\*|\*\*TIMESTAMPS\*\*)[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s|\n\*\*[A-Z]|(?![\s\S]))/gim,
    ''
  );

  // Backstop: remove individual lines that are broken timestamp link syntax
  // sitting outside any explicit Timestamps section. Matches:
  //   [0:53](53) Description
  //   - [2:10](130) Description
  //   * [12:34:56](45296) Description
  result = result.replace(
    /^[-*]?\s*\[\d{1,2}:\d{2}(?::\d{2})?\]\(\d+(?::\d{2}(?::\d{2})?)?\)[^\n]*\n?/gm,
    ''
  );

  // Collapse 3+ consecutive blank lines left by the removals.
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * Render a clean ## Timestamps section from the validated structured array.
 * Returns an empty string if there are no timestamps so callers can skip
 * appending the section header.
 *
 * Exported as `_renderTimestampsMarkdown` for unit tests only.
 */
export function _renderTimestampsMarkdown(
  timestamps: Array<{ time: string; time_seconds: number; topic: string }>
): string {
  if (timestamps.length === 0) return '';

  const lines = timestamps
    .filter((t) => t.time && t.topic) // guard against malformed entries
    .map((t) => {
      // Use Grok's `time` field if it parses as MM:SS or H:MM:SS; otherwise
      // fall back to formatting `time_seconds` ourselves so we never render
      // a malformed time string to the user.
      const timeDisplay = /^\d{1,2}:\d{2}(:\d{2})?$/.test(t.time)
        ? t.time
        : _formatSecondsToTime(t.time_seconds);
      return `- **${timeDisplay}** — ${t.topic}`;
    });

  if (lines.length === 0) return '';
  return `## Timestamps\n\n${lines.join('\n')}`;
}

/**
 * Format a non-negative integer count of seconds into MM:SS or H:MM:SS.
 *
 * Exported as `_formatSecondsToTime` for unit tests only.
 */
export function _formatSecondsToTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
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

export default generateShowNotesTask;
