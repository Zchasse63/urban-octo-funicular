/**
 * AI Location Extraction for Podcasting 2.0 <podcast:location> tags
 *
 * Uses xAI Grok to extract geographic locations mentioned in episode
 * transcripts, then formats them as Podcasting 2.0 location tags with
 * optional geo coordinates.
 *
 * Spec: https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#location
 */

import { z } from 'zod';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PodcastLocation {
  /** Human-readable location name, e.g. "Austin, Texas" */
  name: string;
  /** Geo URI in "geo:lat,lon" format, e.g. "geo:30.2672,-97.7431" */
  geo?: string;
  /** OpenStreetMap ID if available, e.g. "R113314" */
  osm?: string;
}

// ─── Zod Schema for AI Response ─────────────────────────────────────────────

const LocationResponseSchema = z.object({
  locations: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
    )
    .max(10),
});

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_TRANSCRIPT_CHARS = 50_000;
const DEFAULT_MAX_LOCATIONS = 5;
const SYSTEM_PROMPT = `You are a geographic location extraction assistant for podcast transcripts.

Your task is to identify specific, real-world geographic locations mentioned in the transcript. Focus on:
- Cities, states, countries that are substantively discussed or referenced
- Specific venues, neighborhoods, or landmarks
- Locations where events described took place

Do NOT include:
- Generic or vague references ("somewhere in Europe")
- Metaphorical uses ("we're in a good place")
- Brand names that happen to contain location words

Return a JSON object with a "locations" array. Each location should have:
- "name": A clean, human-readable location string (e.g. "Austin, Texas", "London, United Kingdom")
- "latitude": Optional decimal latitude (-90 to 90)
- "longitude": Optional decimal longitude (-180 to 180)

Only include coordinates if you are confident in them. Order locations by relevance/prominence in the transcript (most discussed first). Return at most 10 locations.

Respond ONLY with valid JSON, no markdown fences.`;

// ─── Main Function ──────────────────────────────────────────────────────────

/**
 * Extract geographic locations from an episode transcript using AI.
 *
 * @param transcript - The full episode transcript text
 * @param maxLocations - Maximum number of locations to return (default 5, max 10)
 * @returns Array of PodcastLocation objects suitable for <podcast:location> tags
 */
export async function extractLocations(
  transcript: string,
  maxLocations: number = DEFAULT_MAX_LOCATIONS
): Promise<PodcastLocation[]> {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY environment variable is not set');
  }

  // Truncate transcript to avoid token limits
  const truncated =
    transcript.length > MAX_TRANSCRIPT_CHARS
      ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) + '\n\n[transcript truncated]'
      : transcript;

  const clampedMax = Math.min(Math.max(1, maxLocations), 10);

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || 'grok-4-1-fast',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extract up to ${clampedMax} geographic locations from this podcast transcript:\n\n${truncated}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `xAI API error during location extraction: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return [];
  }

  // Parse and validate the AI response
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error('Failed to parse location extraction response as JSON');
    return [];
  }

  const result = LocationResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error('Location extraction response failed validation:', result.error);
    return [];
  }

  // Convert to PodcastLocation format
  return result.data.locations.slice(0, clampedMax).map((loc) => {
    const location: PodcastLocation = { name: loc.name };

    if (loc.latitude != null && loc.longitude != null) {
      // Format geo URI per RFC 5870: geo:lat,lon
      location.geo = `geo:${loc.latitude},${loc.longitude}`;
    }

    return location;
  });
}

/**
 * Format a PodcastLocation as a <podcast:location> XML tag.
 */
export function formatLocationTag(location: PodcastLocation): string {
  const attrs: string[] = [];
  if (location.geo) attrs.push(`geo="${escapeXml(location.geo)}"`);
  if (location.osm) attrs.push(`osm="${escapeXml(location.osm)}"`);

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  return `<podcast:location${attrStr}>${escapeXml(location.name)}</podcast:location>`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
