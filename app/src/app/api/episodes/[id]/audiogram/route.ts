import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import type { ApiResponse } from '@/types/database';

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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error:
          'Audiogram generation is not yet implemented. ' +
          'This feature requires the Remotion video rendering library (@remotion/renderer). ' +
          'See app/src/lib/audiogram/README.md for the implementation plan and architecture.',
      },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
