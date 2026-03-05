import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';

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
      return errorResponse('Invalid ID format', 400);
    }

    const body = await request.json();
    const { scheduledAt } = body;

    if (!scheduledAt || typeof scheduledAt !== 'string') {
      return errorResponse('Missing or invalid scheduledAt parameter', 400);
    }

    // Validate the date
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return errorResponse('Invalid date format. Use ISO 8601 datetime.', 400);
    }

    const now = new Date();
    if (scheduledDate <= now) {
      return errorResponse('Scheduled time must be in the future', 400);
    }

    const maxDate = new Date(now.getTime() + MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000);
    if (scheduledDate > maxDate) {
      return errorResponse(`Scheduled time must be within ${MAX_SCHEDULE_DAYS} days`, 400);
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
      return errorResponse('Episode not found', 404);
    }

    // Only allow scheduling for pending episodes
    if (episode.status !== 'pending' && episode.status !== 'scheduled') {
      return errorResponse(`Cannot schedule an episode with status: ${episode.status}`, 400);
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
      return errorResponse(updateError.message, 500);
    }

    const scheduleInfo: ScheduleInfo = {
      episodeId,
      scheduledAt: scheduledDate.toISOString(),
      scheduledBy: userId,
      status: 'scheduled',
    };

    return successResponse<ScheduleInfo>(scheduleInfo);
  } catch (error) {
    return handleApiError(error, 'scheduling episode');
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
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();

    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, status, metadata, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    const metadata = (episode.metadata as Record<string, unknown>) || {};
    const scheduledAt = metadata.scheduled_at as string | undefined;
    const scheduledBy = metadata.scheduled_by as string | undefined;

    if (!scheduledAt || episode.status !== 'scheduled') {
      return successResponse(null); // No schedule set — this is not an error
    }

    const scheduleInfo: ScheduleInfo = {
      episodeId,
      scheduledAt,
      scheduledBy: scheduledBy || '',
      status: episode.status,
    };

    return successResponse<ScheduleInfo>(scheduleInfo);
  } catch (error) {
    return handleApiError(error, 'fetching schedule');
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
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();

    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, status, metadata, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    if (episode.status !== 'scheduled') {
      return errorResponse('Episode is not currently scheduled', 400);
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
      return errorResponse(updateError.message, 500);
    }

    return successResponse({ cancelled: true });
  } catch (error) {
    return handleApiError(error, 'cancelling schedule');
  }
}
