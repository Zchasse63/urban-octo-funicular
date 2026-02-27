import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isValidUUID } from '@/lib/auth';
import { rateLimitByIP } from '@/lib/rate-limit';
import { getUserTier, canGenerateAssetType } from '@/lib/tier-limits';
import {
  generateAsset,
  buildAssetContext,
  formatAssetForStorage,
} from '@/lib/content';
import type { ApiResponse, GeneratedAsset, AssetType, Episode } from '@/types/database';

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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: assetsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<AssetsResponse>>({
      data: {
        assets: assets || [],
        episodeId,
      },
      error: null,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching assets:', error);
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body: GenerateAssetRequest = await request.json();

    // ── Tier gate: check if user can generate this asset type ──
    const tier = await getUserTier(userId);
    if (!canGenerateAssetType(tier, body.assetType)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: `The "${body.assetType}" asset type requires a Pro or Agency plan. Upgrade to unlock advanced content generation.`,
        },
        { status: 403 }
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
    }

    if (!episode.transcript) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode must be transcribed before generating assets' },
        { status: 400 }
      );
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
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            error: 'Asset already exists. Use regenerate: true to replace it.',
          },
          { status: 409 }
        );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: result.error || 'Failed to generate asset' },
        { status: 500 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<GeneratedAsset>>({
      data: newAsset,
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error generating asset:', error);
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const assetType = searchParams.get('type') as AssetType | null;
    const assetId = searchParams.get('id');

    if (!assetType && !assetId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Must provide either type or id parameter' },
        { status: 400 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      data: { deleted: true },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error deleting asset:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
