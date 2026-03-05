import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import type { GeneratedAsset } from '@/types/database';

/**
 * GET /api/episodes/[id]/assets/[assetId]
 * Fetch a single generated asset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId, assetId } = await params;

    if (!isValidUUID(episodeId) || !isValidUUID(assetId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();

    // Verify episode ownership
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    // Fetch the specific asset
    const { data: asset, error: assetError } = await supabase
      .from('generated_assets')
      .select('*')
      .eq('id', assetId)
      .eq('episode_id', episodeId)
      .single();

    if (assetError || !asset) {
      return errorResponse('Asset not found', 404);
    }

    return successResponse<GeneratedAsset>(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
return errorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/episodes/[id]/assets/[assetId]
 * Update asset content (inline editing before export)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId, assetId } = await params;

    if (!isValidUUID(episodeId) || !isValidUUID(assetId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const body = await request.json();
    const { content } = body as { content: string };

    if (typeof content !== 'string') {
      return errorResponse('Content is required and must be a string', 400);
    }

    const supabase = await createClient();

    // Verify episode ownership
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('id, shows!inner(user_id)')
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    // Verify the asset belongs to this episode
    const { data: existingAsset, error: assetLookupError } = await supabase
      .from('generated_assets')
      .select('id, metadata')
      .eq('id', assetId)
      .eq('episode_id', episodeId)
      .single();

    if (assetLookupError || !existingAsset) {
      return errorResponse('Asset not found for this episode', 404);
    }

    // Merge existing metadata with edit tracking
    const existingMetadata = (existingAsset.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...existingMetadata,
      edited: true,
      edited_at: new Date().toISOString(),
    };

    // Update the asset
    const { data: updatedAsset, error: updateError } = await supabase
      .from('generated_assets')
      .update({
        content,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assetId)
      .select()
      .single();

    if (updateError) {
console.error('Error updating asset:', updateError);
return errorResponse('Internal server error', 500)
    }

    return successResponse<GeneratedAsset>(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
return errorResponse('Internal server error', 500)
  }
}
