import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { canCreateEpisode, getTierLimits, getUserTier, getEpisodeCount } from '@/lib/tier-limits';
import { parseRSSFeed } from '@/lib/rss/parser';
import type { ApiResponse } from '@/types/database';

const MAX_IMPORT_EPISODES = 500;

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  feedTitle: string;
}

/**
 * POST /api/shows/[id]/import
 *
 * Import episodes from an RSS feed into a show.
 * Body: { feedUrl: string }
 *
 * - Parses the RSS feed
 * - Creates episode records for new items (skips duplicates by guid or audio_url)
 * - Limits to 500 episodes per request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: showId } = await params;

    // Validate show ID format
    if (!isValidUUID(showId)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid show ID format' },
        { status: 400 }
      );
    }

    // Rate limit: 5 imports per minute per user
    const rateLimitResult = await checkRateLimit(`rss-import:${userId}`, 5);
    if (!rateLimitResult.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Rate limit exceeded. Try again in a minute.' },
        { status: 429 }
      );
    }

    // Verify show ownership
    const supabase = await createClient();
    const { data: show } = await supabase
      .from('shows')
      .select('id')
      .eq('id', showId)
      .eq('user_id', userId)
      .single();

    if (!show) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const feedUrl = body?.feedUrl;

    if (!feedUrl || typeof feedUrl !== 'string') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'feedUrl is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      const url = new URL(feedUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'feedUrl must be a valid http or https URL' },
        { status: 400 }
      );
    }

    // Check episode tier limits before importing
    const tier = await getUserTier(userId);
    const limits = getTierLimits(tier);
    const currentCount = await getEpisodeCount(userId);
    const remainingQuota = Math.max(0, limits.episodesPerMonth - currentCount);

    if (remainingQuota === 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: `You've reached your ${limits.episodesPerMonth} episodes/month limit on the ${tier} plan. Upgrade to import more episodes.`,
        },
        { status: 403 }
      );
    }

    // Parse the RSS feed
    let feed;
    try {
      feed = await parseRSSFeed(feedUrl);
    } catch (error) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: `Failed to parse RSS feed: ${error instanceof Error ? error.message : 'unknown error'}`,
        },
        { status: 422 }
      );
    }

    if (feed.episodes.length === 0) {
      return NextResponse.json<ApiResponse<ImportResult>>({
        data: { imported: 0, skipped: 0, total: 0, feedTitle: feed.title },
        error: null,
      });
    }

    // Limit episodes to both the max import limit AND remaining tier quota
    const maxEpisodes = Math.min(MAX_IMPORT_EPISODES, remainingQuota);
    const episodesToProcess = feed.episodes.slice(0, maxEpisodes);

    // Fetch existing episodes for this show to detect duplicates
    // We check by audio_url since guid may differ across feeds
    const audioUrls = episodesToProcess.map((ep) => ep.audioUrl);
    const guids = episodesToProcess.map((ep) => ep.guid);

    const { data: existingEpisodes } = await supabase
      .from('episodes')
      .select('audio_url, metadata')
      .eq('show_id', showId);

    const existingAudioUrls = new Set(
      (existingEpisodes || []).map((ep) => ep.audio_url)
    );
    const existingGuids = new Set(
      (existingEpisodes || [])
        .map((ep) => {
          const meta = ep.metadata as Record<string, unknown> | null;
          return meta?.rss_guid as string | undefined;
        })
        .filter(Boolean)
    );

    // Filter out duplicates
    const newEpisodes = episodesToProcess.filter(
      (ep) => !existingAudioUrls.has(ep.audioUrl) && !existingGuids.has(ep.guid)
    );

    const skipped = episodesToProcess.length - newEpisodes.length;

    if (newEpisodes.length === 0) {
      return NextResponse.json<ApiResponse<ImportResult>>({
        data: {
          imported: 0,
          skipped,
          total: feed.episodes.length,
          feedTitle: feed.title,
        },
        error: null,
      });
    }

    // Build insert records
    const insertRecords = newEpisodes.map((ep) => ({
      show_id: showId,
      title: ep.title,
      description: ep.description || null,
      audio_url: ep.audioUrl,
      audio_duration_seconds: ep.duration,
      status: 'pending' as const,
      published_at: ep.pubDate ? new Date(ep.pubDate).toISOString() : null,
      metadata: {
        rss_guid: ep.guid,
        rss_image_url: ep.imageUrl,
        episode_number: ep.episodeNumber,
        season_number: ep.seasonNumber,
        import_source: 'rss',
        import_feed_url: feedUrl,
      },
    }));

    // Batch insert (Supabase handles up to 1000 rows per insert)
    const { error: insertError } = await supabase
      .from('episodes')
      .insert(insertRecords);

    if (insertError) {
      console.error('RSS import insert error:', insertError);
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `Failed to import episodes: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<ImportResult>>({
      data: {
        imported: newEpisodes.length,
        skipped,
        total: feed.episodes.length,
        feedTitle: feed.title,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('RSS import error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
