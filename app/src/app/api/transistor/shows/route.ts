import { NextResponse } from 'next/server';
import { getTransistorClient } from '@/lib/transistor/helpers';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/helpers';

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
    if (error instanceof Error && error.message === 'No Transistor connection found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    return handleApiError(error, 'Transistor shows fetch');
  }
}
