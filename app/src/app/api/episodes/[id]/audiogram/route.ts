import { NextRequest } from 'next/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, handleApiError } from '@/lib/api/helpers';

/**
 * POST /api/episodes/[id]/audiogram
 *
 * Scaffold endpoint for audiogram generation.
 * Returns 501 Not Implemented — actual implementation requires Remotion.
 *
 * See: app/src/lib/audiogram/README.md for implementation plan.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    return errorResponse(
      'Audiogram generation is not yet implemented. ' +
        'This feature requires the Remotion video rendering library (@remotion/renderer). ' +
        'See app/src/lib/audiogram/README.md for the implementation plan and architecture.',
      501
    );
  } catch (error) {
    return handleApiError(error, 'audiogram generation');
  }
}
