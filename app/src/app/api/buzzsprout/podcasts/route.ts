import { NextResponse } from 'next/server';
import { getBuzzsproutClient } from '@/lib/buzzsprout/helpers';
import { DEFAULT_USER_ID } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await getBuzzsproutClient(DEFAULT_USER_ID);
    const podcasts = await client.getPodcasts();

    return NextResponse.json(podcasts);
  } catch (error) {
    console.error('Podcasts fetch error:', error);

    if (error instanceof Error && error.message === 'No Buzzsprout connection found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch podcasts' },
      { status: 500 }
    );
  }
}
