import { NextResponse } from 'next/server';
import { getTransistorClient } from '@/lib/transistor/helpers';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transistor/shows
 * List all shows from the user's Transistor account.
 */
export async function GET() {
  try {
    const { userId } = await requireAuth();
    const client = await getTransistorClient(userId);
    const shows = await client.getShows();

    return NextResponse.json(shows);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Transistor shows fetch error:', error);

    if (error instanceof Error && error.message === 'No Transistor connection found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch Transistor shows' },
      { status: 500 }
    );
  }
}
