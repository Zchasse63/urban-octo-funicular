/**
 * RSS Feed Parser for podcast back-catalog import
 *
 * Parses standard RSS 2.0 feeds with iTunes podcast extensions.
 * Uses regex-based XML extraction for the well-known, predictable
 * RSS structure -- no external XML parser dependency required.
 */

import { z } from 'zod';

// ─── Public Types ────────────────────────────────────────────────────────────

export interface ParsedEpisode {
  title: string;
  description: string;
  audioUrl: string;
  pubDate: string | null;
  duration: number | null; // seconds
  episodeNumber: number | null;
  seasonNumber: number | null;
  guid: string;
  imageUrl: string | null;
}

export interface ParsedFeed {
  title: string;
  description: string;
  imageUrl: string | null;
  language: string | null;
  author: string | null;
  websiteUrl: string | null;
  episodes: ParsedEpisode[];
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const feedUrlSchema = z.string().url().refine(
  (url) => url.startsWith('http://') || url.startsWith('https://'),
  { message: 'Feed URL must use http or https protocol' }
);

const parsedEpisodeSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  audioUrl: z.string().url(),
  pubDate: z.string().nullable(),
  duration: z.number().int().positive().nullable(),
  episodeNumber: z.number().int().min(0).nullable(),
  seasonNumber: z.number().int().positive().nullable(),
  guid: z.string().min(1),
  imageUrl: z.string().url().nullable().catch(null),
});

const parsedFeedSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  imageUrl: z.string().url().nullable().catch(null),
  language: z.string().nullable(),
  author: z.string().nullable(),
  websiteUrl: z.string().url().nullable().catch(null),
  episodes: z.array(parsedEpisodeSchema),
});

// ─── XML Helpers ─────────────────────────────────────────────────────────────

/**
 * Extract the text content of the first occurrence of a given tag.
 * Handles both `<tag>text</tag>` and `<tag><![CDATA[text]]></tag>`.
 */
function getTagContent(xml: string, tag: string): string | null {
  // Try namespace-prefixed first (e.g., itunes:duration), then plain tag
  const patterns = [
    new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match) {
      return decodeXmlEntities(match[1].trim());
    }
  }
  return null;
}

/**
 * Extract an attribute value from a self-closing or opening tag.
 * Example: getTagAttribute(xml, 'enclosure', 'url')
 */
function getTagAttribute(xml: string, tag: string, attr: string): string | null {
  const pattern = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']*)["'][^>]*/?>`, 'i');
  const match = xml.match(pattern);
  return match ? decodeXmlEntities(match[1].trim()) : null;
}

/**
 * Decode common XML entities.
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

/**
 * Strip HTML tags from a string (for descriptions that include markup).
 */
function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim();
}

/**
 * Parse an iTunes duration string into seconds.
 * Accepts formats: "HH:MM:SS", "MM:SS", "SSS" (plain seconds).
 */
function parseDuration(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.trim();

  // Plain number = seconds
  if (/^\d+$/.test(cleaned)) {
    const secs = parseInt(cleaned, 10);
    return secs > 0 ? secs : null;
  }

  // HH:MM:SS or MM:SS
  const parts = cleaned.split(':').map(Number);
  if (parts.some(isNaN)) return null;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return null;
}

/**
 * Split the XML into individual <item>...</item> blocks.
 */
function extractItems(xml: string): string[] {
  const items: string[] = [];
  const regex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    items.push(match[0]);
  }
  return items;
}

/**
 * Extract the <channel> block (everything outside <item> elements).
 */
function extractChannel(xml: string): string {
  const channelMatch = xml.match(/<channel[\s>]([\s\S]*)<\/channel>/i);
  if (!channelMatch) return xml;
  // Remove items to isolate channel-level metadata
  return channelMatch[1].replace(/<item[\s>][\s\S]*?<\/item>/gi, '');
}

// ─── Episode Parser ──────────────────────────────────────────────────────────

function parseItem(itemXml: string): ParsedEpisode | null {
  const title = getTagContent(itemXml, 'title');
  if (!title) return null;

  // Audio URL from <enclosure>
  const audioUrl = getTagAttribute(itemXml, 'enclosure', 'url');
  if (!audioUrl) return null;

  // Description: prefer itunes:summary, then description
  const description =
    getTagContent(itemXml, 'itunes:summary') ||
    getTagContent(itemXml, 'description') ||
    '';

  // GUID: prefer <guid>, fall back to audio URL
  const guid = getTagContent(itemXml, 'guid') || audioUrl;

  // Pub date
  const pubDate = getTagContent(itemXml, 'pubDate') || null;

  // Duration
  const durationRaw = getTagContent(itemXml, 'itunes:duration');
  const duration = parseDuration(durationRaw);

  // Episode & season numbers
  const episodeRaw = getTagContent(itemXml, 'itunes:episode');
  const episodeNumber = episodeRaw ? parseInt(episodeRaw, 10) || null : null;

  const seasonRaw = getTagContent(itemXml, 'itunes:season');
  const seasonNumber = seasonRaw ? parseInt(seasonRaw, 10) || null : null;

  // Episode image
  const imageUrl =
    getTagAttribute(itemXml, 'itunes:image', 'href') ||
    getTagContent(itemXml, 'itunes:image') ||
    null;

  return {
    title,
    description: stripHtml(description),
    audioUrl,
    pubDate,
    duration,
    episodeNumber,
    seasonNumber,
    guid,
    imageUrl,
  };
}

// ─── Main Parser ─────────────────────────────────────────────────────────────

export async function parseRSSFeed(feedUrl: string): Promise<ParsedFeed> {
  // 1. Validate URL
  const urlResult = feedUrlSchema.safeParse(feedUrl);
  if (!urlResult.success) {
    throw new Error(`Invalid feed URL: ${urlResult.error.issues[0]?.message || 'must be a valid http(s) URL'}`);
  }

  // 2. Fetch XML
  let xml: string;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'PodBrain/1.0 (RSS Feed Importer)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    xml = await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Feed request timed out after 30 seconds');
    }
    throw new Error(
      `Failed to fetch feed: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }

  // 3. Basic sanity check
  if (!xml.includes('<rss') && !xml.includes('<feed')) {
    throw new Error('Response does not appear to be a valid RSS feed');
  }

  // 4. Extract channel metadata
  const channel = extractChannel(xml);

  const title = getTagContent(channel, 'title');
  if (!title) {
    throw new Error('Feed is missing a <title> element');
  }

  const description =
    getTagContent(channel, 'itunes:summary') ||
    getTagContent(channel, 'description') ||
    '';

  const imageUrl =
    getTagAttribute(channel, 'itunes:image', 'href') ||
    getTagContent(channel, 'image>url') || // <image><url>...</url></image>
    null;

  const language = getTagContent(channel, 'language') || null;
  const author =
    getTagContent(channel, 'itunes:author') ||
    getTagContent(channel, 'managingEditor') ||
    null;
  const websiteUrl = getTagContent(channel, 'link') || null;

  // 5. Parse items
  const items = extractItems(xml);
  const episodes: ParsedEpisode[] = [];

  for (const itemXml of items) {
    const episode = parseItem(itemXml);
    if (episode) {
      episodes.push(episode);
    }
  }

  // 6. Validate with zod
  const feedData: ParsedFeed = {
    title,
    description: stripHtml(description),
    imageUrl,
    language,
    author,
    websiteUrl,
    episodes,
  };

  const validated = parsedFeedSchema.safeParse(feedData);
  if (!validated.success) {
    throw new Error(
      `Feed validation failed: ${validated.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  return validated.data as ParsedFeed;
}
