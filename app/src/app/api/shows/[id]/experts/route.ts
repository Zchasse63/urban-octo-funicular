import { NextRequest, NextResponse } from 'next/server';
import { discoverExperts } from '@/lib/experts/discovery';
import { requireAuth, verifyShowOwnership } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateUUID } from '@/lib/validation';
import type { ExpertSource } from '@/lib/experts/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResult = await checkRateLimit(`experts:${userId}`);
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

    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get('topic');

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic query parameter required' },
        { status: 400 }
      );
    }

    // Optional source override: ?source=taddy|grok
    const sourceParam = searchParams.get('source') as ExpertSource | null;
    const forceSource =
      sourceParam === 'taddy' || sourceParam === 'grok'
        ? sourceParam
        : undefined;

    const { experts, source } = await discoverExperts(topic, showId, forceSource);

    return NextResponse.json({
      experts,
      topic,
      count: experts.length,
      source,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Expert discovery API error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 500 }
    );
  }
}
