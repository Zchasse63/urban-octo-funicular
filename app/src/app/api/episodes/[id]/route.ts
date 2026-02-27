import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import type { ApiResponse, Episode } from '@/types/database';

/**
 * GET /api/episodes/[id]
 * Fetch a single episode by ID
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
      .select(`
        *,
        shows!inner(user_id)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Episode>>({
      data: episode as unknown as Episode,
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching episode:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Fields that are safe to update via the PUT endpoint
const ALLOWED_UPDATE_FIELDS = [
  'title',
  'description',
  'show_notes',
  'show_notes_html',
  'guest_name',
  'guest_bio',
  'guest_links',
] as const;

type AllowedField = typeof ALLOWED_UPDATE_FIELDS[number];

/**
 * PUT /api/episodes/[id]
 * Update an episode's editable fields (title, show_notes, etc.)
 */
export async function PUT(
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
    const supabase = await createClient();

    // Verify episode exists and user has access
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        id,
        shows!inner(user_id)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    // Filter to only allowed fields
    const updates: Partial<Record<AllowedField, unknown>> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform the update
    const { data: updated, error: updateError } = await supabase
      .from('episodes')
      .update(updates)
      .eq('id', episodeId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Episode>>({
      data: updated as unknown as Episode,
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error updating episode:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
