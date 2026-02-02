import { NextRequest, NextResponse } from 'next/server';
import { detectViralMoments } from '@/lib/viral-moments/detector';
import type { TranscriptSegment } from '@/lib/viral-moments/types';
import { getSupabaseClient } from '@/lib/supabase-client';
import { validateAuth, verifyEpisodeOwnership } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateUUID } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await validateAuth();

    const rateLimitResult = await checkRateLimit(`viral-moments:${userId}`);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { id: episodeId } = await params;

    if (!validateUUID(episodeId)) {
      return NextResponse.json({ error: 'Invalid episode ID format' }, { status: 400 });
    }

    const hasAccess = await verifyEpisodeOwnership(episodeId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const supabase = await getSupabaseClient();

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

    await supabase
      .from('episodes')
      .update({ viral_moments: detectionResult })
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
