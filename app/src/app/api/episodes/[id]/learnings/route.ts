import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { getEpisodeLearnings } from '@/lib/learning/tracker';
import type { ApiResponse } from '@/types/database';
import type { EpisodeLearnings } from '@/lib/learning/tracker';

/**
 * GET /api/episodes/[id]/learnings
 * Returns the AI learning insights for a specific episode.
 */
export async function GET(
  _request: NextRequest,
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

    const supabase = await createClient();

    // Verify episode exists and user owns it via the show
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, show_id, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    const learnings = await getEpisodeLearnings(episodeId, episode.show_id);

    return NextResponse.json<ApiResponse<EpisodeLearnings>>({
      data: learnings,
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching episode learnings:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
