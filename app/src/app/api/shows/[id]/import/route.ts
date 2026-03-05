import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { getTierLimits, getUserTier, getAudioHoursUsed } from '@/lib/tier-limits';
import { parseRSSFeed } from '@/lib/rss/parser';

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
      return errorResponse('Invalid show ID format', 400);
    }

    // Rate limit: 5 imports per minute per user
    const rateLimitResult = await checkRateLimit(`rss-import:${userId}`, 5);
    if (!rateLimitResult.success) {
      return errorResponse('Rate limit exceeded. Try again in a minute.', 429);
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
      return errorResponse('Show not found', 404);
    }

    // Parse request body
    const body = await request.json();
    const feedUrl = body?.feedUrl;

    if (!feedUrl || typeof feedUrl !== 'string') {
      return errorResponse('feedUrl is required', 400);
    }

    // Validate URL format
    try {
      const url = new URL(feedUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return errorResponse('feedUrl must be a valid http or https URL', 400);
    }

    // Check audio hours tier limits before importing
    const tier = await getUserTier(userId);
    const limits = getTierLimits(tier);
    const hoursUsed = await getAudioHoursUsed(userId);
    const remainingHours = Math.max(0, limits.audioHoursPerMonth - hoursUsed);

    if (remainingHours <= 0) {
      return errorResponse(
        `You've used all ${limits.audioHoursPerMonth} audio hours this month on the ${tier} plan. Upgrade to import more episodes.`,
        403
      );
    }

    // Parse the RSS feed
    let feed;
    try {
      feed = await parseRSSFeed(feedUrl);
    } catch (error) {
      return errorResponse(
        `Failed to parse RSS feed: ${error instanceof Error ? error.message : 'unknown error'}`,
        422
      );
    }

    if (feed.episodes.length === 0) {
      return successResponse({ imported: 0, skipped: 0, total: 0, feedTitle: feed.title });
    }

    // Limit episodes to the max import limit
    // Note: Audio hours are checked per-episode at processing time, not at import.
    // Import just creates pending records — processing is what consumes hours.
    const maxEpisodes = MAX_IMPORT_EPISODES;
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
      return successResponse({
        imported: 0,
        skipped,
        total: feed.episodes.length,
        feedTitle: feed.title,
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
      return errorResponse(`Failed to import episodes: ${insertError.message}`, 500);
    }

    return successResponse({
      imported: newEpisodes.length,
      skipped,
      total: feed.episodes.length,
      feedTitle: feed.title,
    });
  } catch (error) {
    return handleApiError(error, 'RSS import');
  }
}
