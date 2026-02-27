/**
 * Podcasting 2.0 Tag Generators
 *
 * Transforms PodBrain's existing data (transcripts, viral moments, chapters,
 * guest/host metadata) into standard Podcasting 2.0 XML tag structures.
 *
 * Spec reference: https://github.com/Podcastindex-org/podcast-namespace
 */

// ─── Tag Interfaces ──────────────────────────────────────────────────────────

export interface PersonTag {
  name: string;
  role: 'host' | 'guest' | 'editor' | 'producer';
  group?: string;
  img?: string;
  href?: string;
}

export interface TranscriptTag {
  url: string;
  type: 'text/vtt' | 'text/plain' | 'application/json';
  language: string;
  rel?: 'captions' | 'transcript';
}

export interface SoundbiteTag {
  startTime: number; // seconds
  duration: number; // seconds
  title?: string; // max 128 chars
}

export interface ChaptersTag {
  url: string;
  type: 'application/json+chapters';
}

export interface FundingTag {
  url: string;
  message: string; // max 128 chars
}

export interface PodrollItem {
  feedGuid?: string;
  feedUrl?: string;
  title: string;
}

export interface MediumTag {
  value: 'podcast' | 'music' | 'video' | 'audiobook';
}

export interface TxtTag {
  purpose?: string;
  value: string;
}

export interface LocationTag {
  name: string;
  geo?: string; // "geo:lat,lon"
  osm?: string; // OpenStreetMap ID
}

// ─── Generator Functions ─────────────────────────────────────────────────────

/**
 * Generate <podcast:person> tags from episode and show metadata.
 * Produces host and guest person entries for the RSS item.
 */
export function generatePersonTags(params: {
  guestName?: string | null;
  guestImageUrl?: string | null;
  guestProfileUrl?: string | null;
  hostName?: string | null;
}): PersonTag[] {
  const tags: PersonTag[] = [];

  if (params.hostName) {
    tags.push({
      name: params.hostName,
      role: 'host',
      group: 'cast',
    });
  }

  if (params.guestName) {
    tags.push({
      name: params.guestName,
      role: 'guest',
      group: 'cast',
      img: params.guestImageUrl || undefined,
      href: params.guestProfileUrl || undefined,
    });
  }

  return tags;
}

/**
 * Generate <podcast:podroll> items from guest's other podcast appearances.
 * Recommends podcasts the guest has appeared on, creating a cross-promotion network.
 */
export function generatePodrollItems(
  appearances: Array<{
    podcastName: string;
    podcastRssUrl?: string;
    podcastGuid?: string;
  }>
): PodrollItem[] {
  // Deduplicate by podcast name, take top 5
  const seen = new Set<string>();
  const items: PodrollItem[] = [];

  for (const app of appearances) {
    const key = app.podcastName.toLowerCase();
    if (seen.has(key) || !app.podcastName) continue;
    seen.add(key);

    items.push({
      title: app.podcastName,
      feedUrl: app.podcastRssUrl || undefined,
      feedGuid: app.podcastGuid || undefined,
    });

    if (items.length >= 5) break;
  }

  return items;
}

/**
 * Generate <podcast:soundbite> tags from viral moments detected by PodBrain.
 *
 * Filters to moments between 15-120 seconds (per Podcasting 2.0 spec),
 * sorts by score descending, and caps at 5 soundbites per episode.
 */
export function generateSoundbiteTags(
  viralMoments: Array<{
    startTime: number;
    endTime: number;
    quote?: string;
    score?: number;
  }>
): SoundbiteTag[] {
  return viralMoments
    .filter((m) => {
      const duration = m.endTime - m.startTime;
      return duration >= 15 && duration <= 120;
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)
    .map((m) => ({
      startTime: m.startTime,
      duration: Math.round((m.endTime - m.startTime) * 10) / 10,
      title: m.quote ? m.quote.slice(0, 128) : undefined,
    }));
}

/**
 * Generate a Podcasting 2.0 chapters JSON object from episode sections.
 *
 * Follows the JSON Chapters spec:
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/chapters/jsonChapters.md
 */
export function generateChaptersJson(
  sections: Array<{
    title: string;
    startTime?: number | null;
    content?: string;
  }>
): { version: string; chapters: Array<{ startTime: number; title: string }> } {
  return {
    version: '1.2.0',
    chapters: sections
      .filter((s) => s.startTime != null)
      .map((s) => ({
        startTime: Math.floor(s.startTime!),
        title: s.title.slice(0, 128),
      })),
  };
}
