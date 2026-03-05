import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers';
import { rateLimitByIP } from '@/lib/rate-limit';
import { getUserTier, canGenerateAssetType } from '@/lib/tier-limits';
import {
  generateAsset,
  buildAssetContext,
  formatAssetForStorage,
} from '@/lib/content';
import type { GeneratedAsset, AssetType, Episode } from '@/types/database';

interface GenerateAssetRequest {
  assetType: AssetType;
  regenerate?: boolean;
}

interface AssetsResponse {
  assets: GeneratedAsset[];
  episodeId: string;
}

/**
 * GET /api/episodes/[id]/assets
 * Get all generated assets for an episode
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const assetType = searchParams.get('type') as AssetType | null;

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
      return errorResponse('Episode not found', 404);
    }

    // Build query for assets
    let query = supabase
      .from('generated_assets')
      .select('*')
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: false });

    if (assetType) {
      query = query.eq('asset_type', assetType);
    }

    const { data: assets, error: assetsError } = await query;

    if (assetsError) {
console.error('Error fetching assets:', assetsError);
return errorResponse('Internal server error', 500)
    );
  } catch (error) {
    return handleApiError(error, 'fetching assets');
  }
}

/**
 * POST /api/episodes/[id]/assets
 * Generate a new asset for an episode
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit: 20 asset generation requests per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await rateLimitByIP(ip, 20);
    if (!rateLimit.success) {
      return NextResponse.json(
        { data: null, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const body: GenerateAssetRequest = await request.json();

    // ── Tier gate: check if user can generate this asset type ──
    const tier = await getUserTier(userId);
    if (!canGenerateAssetType(tier, body.assetType)) {
      return errorResponse(
        `The "${body.assetType}" asset type requires a Pro or Agency plan. Upgrade to unlock advanced content generation.`,
        403
      );
    }

    const supabase = await createClient();

    // Verify episode exists and has transcript
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        *,
        shows!inner(user_id, name, style_preferences)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404);
    }

    if (!episode.transcript) {
      return errorResponse('Episode must be transcribed before generating assets', 400);
    }

    // Check if asset already exists (unless regenerate is requested)
    if (!body.regenerate) {
      const { data: existingAsset } = await supabase
        .from('generated_assets')
        .select('id')
        .eq('episode_id', episodeId)
        .eq('asset_type', body.assetType)
        .single();

      if (existingAsset) {
        return errorResponse('Asset already exists. Use regenerate: true to replace it.', 409);
      }
    }

    // Build context for content generation
    const showData = Array.isArray(episode.shows) ? episode.shows[0] : episode.shows;
    const context = buildAssetContext(
      episode as unknown as Episode,
      showData?.name || 'Unknown Show',
      {
        keyTopics: episode.seo_analysis?.suggestions,
        tone: showData?.style_preferences?.tone,
      }
    );

    // Generate asset using xAI Grok BEFORE deleting old one
    // This prevents data loss if the AI call fails
    const result = await generateAsset(body.assetType, context);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to generate asset', 500);
    }

    // Only delete old asset AFTER new one generated successfully
    if (body.regenerate) {
      await supabase
        .from('generated_assets')
        .delete()
        .eq('episode_id', episodeId)
        .eq('asset_type', body.assetType);
    }

    // Format for storage
    const assetData = formatAssetForStorage(episodeId, result);

    // Insert new asset
    const { data: newAsset, error: insertError } = await supabase
      .from('generated_assets')
      .insert({
        ...assetData,
        metadata: {
          ...(assetData.metadata as Record<string, unknown>),
          regenerated: body.regenerate || false,
        },
      })
      .select()
      .single();

    if (insertError) {
console.error('Error inserting asset:', insertError);
return errorResponse('Internal server error', 500)
    }

    return successResponse(newAsset);
  } catch (error) {
    console.error('Error generating asset:', error);
return errorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/episodes/[id]/assets?type=asset_type
 * Delete a specific asset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400);
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const assetType = searchParams.get('type') as AssetType | null;
    const assetId = searchParams.get('id');

    if (!assetType && !assetId) {
      return errorResponse('Must provide either type or id parameter', 400);
    }

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
      return errorResponse('Episode not found', 404);
    }

    // Build delete query
    let query = supabase
      .from('generated_assets')
      .delete()
      .eq('episode_id', episodeId);

    if (assetId) {
      query = query.eq('id', assetId);
    } else if (assetType) {
      query = query.eq('asset_type', assetType);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
console.error('Error deleting asset:', deleteError);
return errorResponse('Internal server error', 500)
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
return errorResponse('Internal server error', 500)
  }
}
