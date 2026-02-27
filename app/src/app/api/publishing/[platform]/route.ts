import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PLATFORM_CONFIGS } from '@/lib/publishing/types';
import type { PublishingPlatform } from '@/lib/publishing/types';
import type { ApiResponse } from '@/types/database';

const VALID_PLATFORMS = new Set<string>(['youtube', 'spotify', 'apple']);

/**
 * GET /api/publishing/[platform]
 *
 * Scaffold endpoint for platform OAuth connections.
 * Returns 501 Not Implemented with setup instructions for each platform.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    await requireAuth();
    const { platform } = await params;

    if (!VALID_PLATFORMS.has(platform)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: `Invalid platform "${platform}". Supported: youtube, spotify, apple`,
        },
        { status: 400 }
      );
    }

    const config = PLATFORM_CONFIGS[platform as PublishingPlatform];

    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error:
          `${config.displayName} OAuth integration is not yet implemented. ` +
          config.setupInstructions,
      },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publishing/[platform]
 *
 * Scaffold endpoint for initiating OAuth flow or publishing content.
 * Returns 501 Not Implemented.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    await requireAuth();
    const { platform } = await params;

    if (!VALID_PLATFORMS.has(platform)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: `Invalid platform "${platform}". Supported: youtube, spotify, apple`,
        },
        { status: 400 }
      );
    }

    const config = PLATFORM_CONFIGS[platform as PublishingPlatform];

    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error:
          `${config.displayName} publishing is not yet implemented. ` +
          config.setupInstructions,
      },
      { status: 501 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
