import { NextRequest, NextResponse } from 'next/server';
import { getTransistorClient } from '@/lib/transistor/helpers';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transistor/episodes?showId=X
 * List episodes for a specific Transistor show.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const showId = request.nextUrl.searchParams.get('showId');
    if (!showId || typeof showId !== 'string' || showId.length > 100) {
      return NextResponse.json(
        { error: 'Missing or invalid showId parameter' },
        { status: 400 }
      );
    }

    const client = await getTransistorClient(userId);
    const episodes = await client.getEpisodes(showId);

    return NextResponse.json(episodes);
  } catch (error) {
    if (error instanceof Error && error.message === 'No Transistor connection found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    return handleApiError(error, 'Transistor episodes fetch');
  }
}
