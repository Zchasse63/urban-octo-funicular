import { NextRequest, NextResponse } from 'next/server';
import { detectViralMoments } from '@/lib/viral-moments/detector';
import type { TranscriptSegment } from '@/lib/viral-moments/types';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, verifyEpisodeOwnership, isValidUUID } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResult = await checkRateLimit(`viral-moments:${userId}`);
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

    const supabase = await createClient();

    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('id, transcript, transcript_segments, viral_moments')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    if (episode.viral_moments) {
      try {
        const { DetectionResponseSchema } = await import('@/lib/viral-moments/detector');
        const validated = DetectionResponseSchema.parse(episode.viral_moments);
        return NextResponse.json(validated);
      } catch {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid cached viral moments, regenerating:', { episodeId });
        }
      }
    }

    if (!episode.transcript) {
      return NextResponse.json(
        { error: 'Transcript required for analysis' },
        { status: 422 }
      );
    }

    const segments: TranscriptSegment[] = episode.transcript_segments || [];

    let detectionResult;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        detectionResult = await detectViralMoments(episode.transcript, segments);
        break;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Viral moment detection failed:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              episodeId,
            });
          }
          return NextResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 500 }
          );
        }
        const jitter = Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries + jitter));
      }
    }

    if (!detectionResult) {
      return NextResponse.json(
        { error: 'Detection failed' },
        { status: 500 }
      );
    }

    // Persist in canonical snake_case shape so downstream readers
    // (rss-tags soundbites, future consumers) get a single on-disk format
    // matching the Trigger.dev pipeline write in generate-show-notes.ts.
    await supabase
      .from('episodes')
      .update({
        viral_moments: detectionResult.viralMoments.map((m) => ({
          id: m.id,
          text: m.quote,
          start_time: m.startTime,
          end_time: m.endTime,
          score: m.score,
          category: m.category,
          platform_suitability: m.suggestedPlatforms,
        })),
      })
      .eq('id', episodeId);

    return NextResponse.json(detectionResult);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Viral moments API error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    );
  }
}
