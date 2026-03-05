import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, handleApiError } from '@/lib/api/helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { getTransistorClient } from '@/lib/transistor/helpers';
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

    const rl = await checkRateLimit(`transistor-inject:${userId}`, 10);
    if (!rl.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Rate limit exceeded. Please try again shortly.' },
        { status: 429 }
      );
    }
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const body = await request.json();
    const { transistorEpisodeId } = body;

    if (!transistorEpisodeId || typeof transistorEpisodeId !== 'string' || transistorEpisodeId.length > 100) {
      return errorResponse('Invalid or missing transistorEpisodeId', 400);
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
      return errorResponse('Episode not found', 404);
    }

    const showNotes = episode.show_notes_html || episode.show_notes;
    if (!showNotes) {
      return errorResponse('No show notes available for this episode', 400);
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
    if (error instanceof Error && error.message === 'No Transistor connection found') {
      return errorResponse(error.message, 404);
    }
return errorResponse('Internal server error', 500)
  }
}
