import { NextRequest, NextResponse } from 'next/server';
import { findSimilarSections, groupByEpisode } from '@/lib/cross-episode/similarity';
import { getSupabaseClient } from '@/lib/supabase-client';
import { requireAuth, verifyShowOwnership } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateUUID } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResult = await checkRateLimit(`show-related:${userId}`);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id: showId } = await params;

    if (!validateUUID(showId)) {
      return NextResponse.json({ error: 'Invalid show ID format' }, { status: 400 });
    }

    const hasAccess = await verifyShowOwnership(showId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }

    const supabase = await getSupabaseClient();

    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('id')
      .eq('show_id', showId)
      .limit(10);

    if (episodesError || !episodes || episodes.length === 0) {
      return NextResponse.json({ relatedEpisodes: [], graph: [] });
    }

    const allRelated = await Promise.all(
      episodes.map(async (ep) => {
        const similarSections = await findSimilarSections(ep.id, 0.75);
        return groupByEpisode(similarSections);
      })
    );

    const flatRelated = allRelated.flat();
    const uniqueRelated = Array.from(
      new Map(flatRelated.map((rel) => [rel.episodeId, rel])).values()
    );

    return NextResponse.json({
      relatedEpisodes: uniqueRelated.slice(0, 20),
      count: uniqueRelated.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Show related episodes API error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    );
  }
}
