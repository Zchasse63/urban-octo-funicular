import { NextResponse } from 'next/server';
import { getBuzzsproutClient } from '@/lib/buzzsprout/helpers';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const client = await getBuzzsproutClient(userId);
    const podcasts = await client.getPodcasts();

    return NextResponse.json(podcasts);
  } catch (error) {
    if (error instanceof Error && error.message === 'No Buzzsprout connection found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    return handleApiError(error, 'Podcasts fetch');
  }
}
