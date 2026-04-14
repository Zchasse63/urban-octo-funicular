import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { getBuzzsproutClient } from '@/lib/buzzsprout/helpers';
import { logger } from '@/lib/logger';
import type { Episode } from '@/types/database';
import DOMPurify from 'isomorphic-dompurify';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BuzzsproutInjectRequest {
  buzzsproutPodcastId: string;
  buzzsproutEpisodeId: string;
}

interface BuzzsproutInjectResponse {
  success: boolean;
  buzzsproutEpisodeId: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

// ─── POST Handler ───────────────────────────────────────────────────────────

/**
 * POST /api/episodes/[id]/buzzsprout-inject
 *
 * Push the episode's show notes to Buzzsprout via their API.
 * Takes the PodBrain episode ID (in the URL) and the corresponding
 * Buzzsprout podcast + episode IDs in the request body.
 *
 * Flow:
 * 1. Validate episode ownership
 * 2. Get show notes from the episode record
 * 3. Retrieve user's Buzzsprout connection
 * 4. Push show notes via BuzzsproutClient.updateEpisode()
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rl = await checkRateLimit(`buzzsprout-inject:${userId}`, 10);
    if (!rl.success) {
      return errorResponse('Rate limit exceeded. Please try again shortly.', 429);
    }
    const { id: episodeId } = await params;

    // Buzzsprout integration is available on all tiers

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid episode ID format', 400);
    }

    // Parse and validate request body
    const body: BuzzsproutInjectRequest = await request.json();

    if (
      !body.buzzsproutPodcastId ||
      typeof body.buzzsproutPodcastId !== 'string' ||
      body.buzzsproutPodcastId.length > 100
    ) {
      return errorResponse('Invalid or missing buzzsproutPodcastId', 400);
    }

    if (
      !body.buzzsproutEpisodeId ||
      typeof body.buzzsproutEpisodeId !== 'string' ||
      body.buzzsproutEpisodeId.length > 100
    ) {
      return errorResponse('Invalid or missing buzzsproutEpisodeId', 400);
    }

    const supabase = await createClient();

    // ── Validate episode exists and user owns it ──
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(
        `
        id, title, show_notes, status, guest_name,
        shows!inner(id, user_id, name)
      `
      )
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    const ep = episode as unknown as Pick<
      Episode,
      'id' | 'title' | 'show_notes' | 'status' | 'guest_name'
    >;

    if (!ep.show_notes) {
      return errorResponse(
        'No show notes available. Process the episode first to generate show notes.',
        400
      );
    }

    // ── Sanitize show notes before pushing ──
    const sanitizedNotes = sanitizeHtml(ep.show_notes);

    // ── Get Buzzsprout client for this user ──
    let client;
    try {
      client = await getBuzzsproutClient(userId);
    } catch {
      return errorResponse(
        'No Buzzsprout connection found. Connect your Buzzsprout account in Settings first.',
        404
      );
    }

    // ── Push show notes to Buzzsprout ──
    await client.updateEpisode(
      body.buzzsproutPodcastId,
      body.buzzsproutEpisodeId,
      { description: sanitizedNotes }
    );

    logger.info('Buzzsprout inject success', {
      episode_id: episodeId,
      buzzsprout_episode_id: body.buzzsproutEpisodeId,
    });

    return successResponse<BuzzsproutInjectResponse>({
      success: true,
      buzzsproutEpisodeId: body.buzzsproutEpisodeId,
    });
  } catch (error) {
    return handleApiError(error, 'pushing show notes to Buzzsprout');
  }
}
