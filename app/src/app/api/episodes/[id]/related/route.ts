import { NextRequest, NextResponse } from 'next/server';
import { findSimilarSections, groupByEpisode } from '@/lib/cross-episode/similarity';
import { requireAuth, verifyEpisodeOwnership, isValidUUID } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResult = await checkRateLimit(`related:${userId}`);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return NextResponse.json({ error: 'Invalid episode ID format' }, { status: 400 });
    }

    const hasAccess = await verifyEpisodeOwnership(episodeId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const threshold = 0.75;

    const similarSections = await findSimilarSections(episodeId, threshold);
    const relatedEpisodes = await groupByEpisode(similarSections);

    return NextResponse.json({
      relatedEpisodes,
      count: relatedEpisodes.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Related episodes API error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    );
  }
}
