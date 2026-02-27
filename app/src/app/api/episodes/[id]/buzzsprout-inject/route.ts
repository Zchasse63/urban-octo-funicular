import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { getBuzzsproutClient } from '@/lib/buzzsprout/helpers';
import { logger } from '@/lib/logger';
import type { ApiResponse, Episode } from '@/types/database';
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
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid episode ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body: BuzzsproutInjectRequest = await request.json();

    if (
      !body.buzzsproutPodcastId ||
      typeof body.buzzsproutPodcastId !== 'string' ||
      body.buzzsproutPodcastId.length > 100
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid or missing buzzsproutPodcastId' },
        { status: 400 }
      );
    }

    if (
      !body.buzzsproutEpisodeId ||
      typeof body.buzzsproutEpisodeId !== 'string' ||
      body.buzzsproutEpisodeId.length > 100
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid or missing buzzsproutEpisodeId' },
        { status: 400 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    const ep = episode as unknown as Pick<
      Episode,
      'id' | 'title' | 'show_notes' | 'status' | 'guest_name'
    >;

    if (!ep.show_notes) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error:
            'No show notes available. Process the episode first to generate show notes.',
        },
        { status: 400 }
      );
    }

    // ── Sanitize show notes before pushing ──
    const sanitizedNotes = sanitizeHtml(ep.show_notes);

    // ── Get Buzzsprout client for this user ──
    let client;
    try {
      client = await getBuzzsproutClient(userId);
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error:
            'No Buzzsprout connection found. Connect your Buzzsprout account in Settings first.',
        },
        { status: 404 }
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

    return NextResponse.json<ApiResponse<BuzzsproutInjectResponse>>({
      data: {
        success: true,
        buzzsproutEpisodeId: body.buzzsproutEpisodeId,
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

    logger.error(
      'Buzzsprout inject error',
      error instanceof Error ? error : { error }
    );

    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to push show notes to Buzzsprout',
      },
      { status: 500 }
    );
  }
}
