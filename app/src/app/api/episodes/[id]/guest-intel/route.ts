import { NextRequest, NextResponse } from 'next/server';
import { aggregateGuestIntel } from '@/lib/guest-intel/service';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, verifyEpisodeOwnership, isValidUUID } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResult = await checkRateLimit(`guest-intel:${userId}`);
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
      .select('guest_name, metadata')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const guestName = episode.guest_name;
    const guestUrl = (episode.metadata as { guest_url?: string })?.guest_url;

    if (!guestName) {
      return NextResponse.json({
        guestName: '',
        questionsAskedBefore: [],
        uniqueAngles: [],
        repeatedStories: [],
        publicPositions: [],
        trendingTopics: [],
      });
    }

    const intelligence = await aggregateGuestIntel(guestName, guestUrl);

    return NextResponse.json(intelligence);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Guest intelligence API error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    );
  }
}
