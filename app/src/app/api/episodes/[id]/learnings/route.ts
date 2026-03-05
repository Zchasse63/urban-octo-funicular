import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { getEpisodeLearnings } from '@/lib/learning/tracker';
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
      return errorResponse('Invalid ID format', 400);
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
      return errorResponse('Episode not found', 404);
    }

    const learnings = await getEpisodeLearnings(episodeId, episode.show_id);

    return successResponse<EpisodeLearnings>(learnings);
  } catch (error) {
    return handleApiError(error, 'fetching episode learnings');
  }
}
