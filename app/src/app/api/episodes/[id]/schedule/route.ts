import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import type { ApiResponse } from '@/types/database';

interface ScheduleInfo {
  episodeId: string;
  scheduledAt: string;
  scheduledBy: string;
  status: string;
}

const MAX_SCHEDULE_DAYS = 30;

/**
 * POST /api/episodes/[id]/schedule
 * Schedule episode processing for a future time.
 * Body: { scheduledAt: string (ISO datetime) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { scheduledAt } = body;

    if (!scheduledAt || typeof scheduledAt !== 'string') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Missing or invalid scheduledAt parameter' },
        { status: 400 }
      );
    }

    // Validate the date
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid date format. Use ISO 8601 datetime.' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (scheduledDate <= now) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    const maxDate = new Date(now.getTime() + MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000);
    if (scheduledDate > maxDate) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `Scheduled time must be within ${MAX_SCHEDULE_DAYS} days` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify episode exists and user owns it
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, status, metadata, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    // Only allow scheduling for pending episodes
    if (episode.status !== 'pending' && episode.status !== 'scheduled') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `Cannot schedule an episode with status: ${episode.status}` },
        { status: 400 }
      );
    }

    // Update episode metadata and status
    const currentMetadata = (episode.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      scheduled_at: scheduledDate.toISOString(),
      scheduled_by: userId,
    };

    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        status: 'scheduled',
        metadata: updatedMetadata,
      })
      .eq('id', episodeId);

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: updateError.message },
        { status: 500 }
      );
    }

    const scheduleInfo: ScheduleInfo = {
      episodeId,
      scheduledAt: scheduledDate.toISOString(),
      scheduledBy: userId,
      status: 'scheduled',
    };

    return NextResponse.json<ApiResponse<ScheduleInfo>>({
      data: scheduleInfo,
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error scheduling episode:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/episodes/[id]/schedule
 * Get the current schedule for an episode.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, status, metadata, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    const metadata = (episode.metadata as Record<string, unknown>) || {};
    const scheduledAt = metadata.scheduled_at as string | undefined;
    const scheduledBy = metadata.scheduled_by as string | undefined;

    if (!scheduledAt || episode.status !== 'scheduled') {
      return NextResponse.json<ApiResponse<null>>({
        data: null,
        error: null, // No schedule set — this is not an error
      });
    }

    const scheduleInfo: ScheduleInfo = {
      episodeId,
      scheduledAt,
      scheduledBy: scheduledBy || '',
      status: episode.status,
    };

    return NextResponse.json<ApiResponse<ScheduleInfo>>({
      data: scheduleInfo,
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching schedule:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/episodes/[id]/schedule
 * Cancel a scheduled processing.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, status, metadata, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    if (episode.status !== 'scheduled') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode is not currently scheduled' },
        { status: 400 }
      );
    }

    // Remove schedule metadata and revert status to pending
    const currentMetadata = (episode.metadata as Record<string, unknown>) || {};
    const { scheduled_at: _sa, scheduled_by: _sb, ...restMetadata } = currentMetadata;

    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        status: 'pending',
        metadata: restMetadata,
      })
      .eq('id', episodeId);

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ cancelled: boolean }>>({
      data: { cancelled: true },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error cancelling schedule:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
