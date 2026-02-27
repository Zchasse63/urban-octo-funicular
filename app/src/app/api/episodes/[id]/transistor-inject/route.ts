import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { getTransistorClient } from '@/lib/transistor/helpers';
import type { ApiResponse } from '@/types/database';
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * POST /api/episodes/[id]/transistor-inject
 * Push show notes to a Transistor episode description.
 * Body: { transistorEpisodeId: string }
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
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { transistorEpisodeId } = body;

    if (!transistorEpisodeId || typeof transistorEpisodeId !== 'string' || transistorEpisodeId.length > 100) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid or missing transistorEpisodeId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify episode exists and user owns it
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, show_notes_html, show_notes, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    const showNotes = episode.show_notes_html || episode.show_notes;
    if (!showNotes) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No show notes available for this episode' },
        { status: 400 }
      );
    }

    const sanitizedNotes = sanitizeHtml(showNotes);

    const client = await getTransistorClient(userId);
    const updatedEpisode = await client.updateEpisode(transistorEpisodeId, {
      description: sanitizedNotes,
    });

    return NextResponse.json({
      data: {
        success: true,
        episode: updatedEpisode,
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
    console.error('Transistor inject error:', error);

    if (error instanceof Error && error.message === 'No Transistor connection found') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to push show notes to Transistor',
      },
      { status: 500 }
    );
  }
}
