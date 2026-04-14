import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, handleApiError } from '@/lib/api/helpers';
import {
  generatePersonTags,
  generateSoundbiteTags,
  generateChaptersJson,
  generatePodrollItems,
} from '@/lib/podcasting2/tag-generators';
import type {
  PersonTag,
  TranscriptTag,
  SoundbiteTag,
  ChaptersTag,
  PodrollItem,
} from '@/lib/podcasting2/tag-generators';
import { generateRSSSnippet } from '@/lib/podcasting2/rss-snippet';
import type { LocationTag } from '@/lib/podcasting2/tag-generators';
import { extractLocations } from '@/lib/podcasting2/location-extractor';
import type { Episode, ViralMoment } from '@/types/database';

// ─── Response Types ──────────────────────────────────────────────────────────

interface RSSTagsResponse {
  /** Full RSS XML snippet ready for copy-paste */
  snippet: string;
  /** Tags for the <channel> level */
  channelTags: string;
  /** Tags for the <item> level */
  itemTags: string;
  /** Structured tag data for individual display */
  tags: {
    persons: PersonTag[];
    transcript: TranscriptTag | null;
    soundbites: SoundbiteTag[];
    chapters: ChaptersTag | null;
    chaptersJson: {
      version: string;
      chapters: Array<{ startTime: number; title: string }>;
    } | null;
    podroll: PodrollItem[];
    locations: LocationTag[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract metadata field safely from the untyped metadata record.
 */
function getMetaString(
  metadata: Record<string, unknown>,
  key: string
): string | null {
  const val = metadata[key];
  return typeof val === 'string' && val.length > 0 ? val : null;
}

/**
 * Normalize viral moments from either the database ViralMoment format
 * (snake_case) or the viral-moments detector format (camelCase).
 */
function normalizeViralMoments(
  raw: ViralMoment[] | null
): Array<{
  startTime: number;
  endTime: number;
  quote?: string;
  score?: number;
}> {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((m) => {
    // Access fields via type assertion to handle both snake_case (DB) and
    // camelCase (detector) formats stored in the JSON column.
    const rec = m as unknown as Record<string, unknown>;
    return {
      startTime:
        typeof m.start_time === 'number'
          ? m.start_time
          : typeof rec.startTime === 'number'
            ? rec.startTime
            : 0,
      endTime:
        typeof m.end_time === 'number'
          ? m.end_time
          : typeof rec.endTime === 'number'
            ? rec.endTime
            : 0,
      quote:
        typeof m.text === 'string'
          ? m.text
          : typeof rec.quote === 'string'
            ? rec.quote
            : undefined,
      score: typeof m.score === 'number' ? m.score : undefined,
    };
  });
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

/**
 * GET /api/episodes/[id]/rss-tags
 *
 * Generates Podcasting 2.0 RSS tags from the episode's existing data:
 * - <podcast:person> from host/guest info
 * - <podcast:soundbite> from detected viral moments
 * - <podcast:chapters> from episode sections
 * - <podcast:transcript> placeholder (URL TBD by host platform)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();

    // ── Fetch episode with show data ──
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(
        `
        *,
        shows!inner(id, user_id, name, description, artwork_url, style_preferences)
      `
      )
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    const ep = episode as unknown as Episode & {
      shows:
        | {
            id: string;
            name: string;
            description: string | null;
            artwork_url: string | null;
            style_preferences: Record<string, unknown>;
          }
        | Array<{
            id: string;
            name: string;
            description: string | null;
            artwork_url: string | null;
            style_preferences: Record<string, unknown>;
          }>;
    };

    const showData = Array.isArray(ep.shows) ? ep.shows[0] : ep.shows;
    const metadata = (ep.metadata || {}) as Record<string, unknown>;

    // ── Fetch episode sections for chapters ──
    const { data: sections } = await supabase
      .from('episode_sections')
      .select('id, content, start_time, end_time, speaker, metadata')
      .eq('episode_id', episodeId)
      .order('start_time', { ascending: true });

    // ── Generate person tags ──
    // Prefer:
    //   1. episode metadata.host_name (set explicitly per episode)
    //   2. shows.style_preferences.host_name (set per show)
    //   3. null — DO NOT fall back to the show name. A show named "The
    //      Founder's Notebook" is not the host's name, and emitting it as a
    //      <podcast:person role="host"> tag would be incorrect podcast
    //      metadata that podcast directories would index as the host's name.
    const stylePreferences = (showData?.style_preferences || {}) as Record<string, unknown>;
    const showLevelHost =
      typeof stylePreferences.host_name === 'string' && stylePreferences.host_name.length > 0
        ? stylePreferences.host_name
        : null;
    const hostName =
      getMetaString(metadata, 'host_name') || showLevelHost || null;
    let guestImageUrl = getMetaString(metadata, 'guest_image_url');
    let guestProfileUrl = getMetaString(metadata, 'guest_url');

    // Enrich with Taddy cached guest appearance data for person tags and podroll
    let cachedAppearances: Array<{
      guestImageUrl: string | null;
      guestProfileUrl: string | null;
      podcastTaddyUuid: string | null;
      podcastName: string | null;
    }> = [];

    if (ep.guest_name) {
      try {
        const { getCachedAppearances } = await import('@/lib/taddy/cache');
        cachedAppearances = await getCachedAppearances(ep.guest_name);
        if (cachedAppearances.length > 0) {
          const latest = cachedAppearances[0]; // Already sorted by date DESC
          if (!guestImageUrl && latest.guestImageUrl) guestImageUrl = latest.guestImageUrl;
          if (!guestProfileUrl && latest.guestProfileUrl) guestProfileUrl = latest.guestProfileUrl;
        }
      } catch {
        // Silently fall back to metadata-only person tags
      }
    }

    const persons = generatePersonTags({
      guestName: ep.guest_name,
      guestImageUrl,
      guestProfileUrl,
      hostName,
    });

    // ── Generate podroll from guest's other podcast appearances ──
    let podrollItems: PodrollItem[] = [];
    if (cachedAppearances.length > 0) {
      try {
        // Collect unique podcast UUIDs from appearances to look up RSS URLs
        const podcastUuids = [
          ...new Set(
            cachedAppearances
              .map((a) => a.podcastTaddyUuid)
              .filter((uuid): uuid is string => !!uuid)
          ),
        ];

        // Look up podcast RSS URLs from taddy_podcast_cache
        let podcastRssMap = new Map<string, string>();
        if (podcastUuids.length > 0) {
          const { data: podcasts } = await supabase
            .from('taddy_podcast_cache')
            .select('taddy_uuid, rss_url')
            .in('taddy_uuid', podcastUuids);

          if (podcasts) {
            podcastRssMap = new Map(
              podcasts
                .filter((p) => p.rss_url)
                .map((p) => [p.taddy_uuid, p.rss_url as string])
            );
          }
        }

        // Build podroll items with RSS URLs where available
        const podrollInput = cachedAppearances
          .filter((a) => a.podcastName)
          .map((a) => ({
            podcastName: a.podcastName!,
            podcastRssUrl: a.podcastTaddyUuid
              ? podcastRssMap.get(a.podcastTaddyUuid)
              : undefined,
          }));

        podrollItems = generatePodrollItems(podrollInput);
      } catch {
        // Silently skip podroll on error
      }
    }

    // ── Generate soundbite tags from viral moments ──
    const normalizedMoments = normalizeViralMoments(
      ep.viral_moments as ViralMoment[] | null
    );
    const soundbites = generateSoundbiteTags(normalizedMoments);

    // ── Generate chapters ──
    const sectionData = (sections || []).map((s) => {
      const sectionMeta = (s.metadata || {}) as Record<string, unknown>;
      const title =
        typeof sectionMeta.title === 'string' && sectionMeta.title.length > 0
          ? sectionMeta.title
          : s.speaker
            ? `${s.speaker} segment`
            : `Section`;
      return {
        title,
        startTime: s.start_time,
        content: s.content,
      };
    });

    const chaptersJsonData = generateChaptersJson(sectionData);
    const hasChapters = chaptersJsonData.chapters.length > 0;

    // Chapters tag points to where the JSON would be hosted. We expose it via
    // a public proxy on the user's app domain so the URL is real and stable.
    // The user can override it with their own host URL when copying the snippet.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      request.nextUrl.origin ||
      'https://podbrain.app';

    const chaptersTag: ChaptersTag | null = hasChapters
      ? {
          url: `${baseUrl}/api/episodes/${episodeId}/chapters.json`,
          type: 'application/json+chapters',
        }
      : null;

    // ── Transcript tag placeholder ──
    // The VTT can be generated client-side or served from storage.
    const transcriptTag: TranscriptTag | null = ep.transcript
      ? {
          url: `${baseUrl}/api/episodes/${episodeId}/transcript.vtt`,
          type: 'text/vtt',
          language: ep.language || 'en',
          rel: 'captions',
        }
      : null;

    // ── Extract locations (opt-in via query param) ──
    let locationTags: LocationTag[] = [];
    const includeLocations =
      request.nextUrl.searchParams.get('includeLocations') === 'true';

    if (includeLocations && ep.transcript) {
      try {
        const locations = await extractLocations(ep.transcript, 5);
        locationTags = locations.map((loc) => ({
          name: loc.name,
          geo: loc.geo,
          osm: loc.osm,
        }));
      } catch (locError) {
        // Log but don't fail the entire request if location extraction fails
        console.error('Location extraction failed:', locError);
      }
    }

    // ── Compile RSS snippet ──
    const rss = generateRSSSnippet({
      persons,
      transcript: transcriptTag || undefined,
      soundbites,
      chapters: chaptersTag || undefined,
      podroll: podrollItems.length > 0 ? podrollItems : undefined,
      medium: { value: 'podcast' },
      locations: locationTags.length > 0 ? locationTags : undefined,
    });

    const response: RSSTagsResponse = {
      snippet: rss.fullSnippet,
      channelTags: rss.channelTags,
      itemTags: rss.itemTags,
      tags: {
        persons,
        transcript: transcriptTag,
        soundbites,
        chapters: chaptersTag,
        chaptersJson: hasChapters ? chaptersJsonData : null,
        podroll: podrollItems,
        locations: locationTags,
      },
    };

    return NextResponse.json(
      {
        data: response,
        error: null,
      },
      {
        headers: {
          'Cache-Control':
            'private, max-age=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    return handleApiError(error, 'generating RSS tags');
  }
}
