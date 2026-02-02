import { NextRequest, NextResponse } from 'next/server';
import { getBuzzsproutClient } from '@/lib/buzzsprout/helpers';
import { DEFAULT_USER_ID } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const podcastId = searchParams.get('podcast_id');

    if (!podcastId) {
      return NextResponse.json(
        { error: 'podcast_id parameter is required' },
        { status: 400 }
      );
    }

    const client = await getBuzzsproutClient(DEFAULT_USER_ID);
    const episodes = await client.getEpisodes(podcastId);

    return NextResponse.json(episodes);
  } catch (error) {
    console.error('Episodes fetch error:', error);

    if (error instanceof Error && error.message === 'No Buzzsprout connection found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}
