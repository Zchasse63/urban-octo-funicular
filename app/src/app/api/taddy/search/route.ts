import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/api/helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeString } from '@/lib/validation';
import { isTaddyAvailable } from '@/lib/taddy/client';
import {
  searchEpisodesWithCache,
  searchPodcastsWithCache,
  cacheGuestAppearances,
} from '@/lib/taddy/cache';
import type { TaddyType } from '@/lib/taddy/types';

const VALID_TYPES: TaddyType[] = ['PODCASTSERIES', 'PODCASTEPISODE'];
const MAX_TERM_LENGTH = 200;

/**
 * GET /api/taddy/search
 *
 * Search podcasts and episodes via the Taddy API.
 *
 * Query params:
 *   term     (required) — search term
 *   type     (optional) — PODCASTEPISODE | PODCASTSERIES (default: PODCASTEPISODE)
 *   page     (optional) — pagination page number (default: 1)
 *   cache_guests (optional) — "true" to cache guest appearances from results
 */
export async function GET(request: NextRequest) {
  try {
    // Auth
    const { userId } = await requireAuth();

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`taddy-search:${userId}`, 30);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again shortly.' },
        { status: 429 }
      );
    }

    // Check Taddy availability
    if (!isTaddyAvailable()) {
      return NextResponse.json(
        { error: 'Podcast search is not configured. Set TADDY_API_KEY and TADDY_USER_ID.' },
        { status: 503 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const rawTerm = searchParams.get('term');
    const typeParam = searchParams.get('type') || 'PODCASTEPISODE';
    const pageParam = searchParams.get('page');
    const cacheGuests = searchParams.get('cache_guests') === 'true';

    // Validate term
    if (!rawTerm || rawTerm.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search term is required. Provide ?term=your+search' },
        { status: 400 }
      );
    }

    const term = sanitizeString(rawTerm).slice(0, MAX_TERM_LENGTH);

    // Validate type
    if (!VALID_TYPES.includes(typeParam as TaddyType)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate page
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

    // Execute search
    if (typeParam === 'PODCASTEPISODE') {
      const episodes = await searchEpisodesWithCache(term, page);

      // Optionally cache guest appearances for building the credits database
      if (cacheGuests && episodes.length > 0) {
        cacheGuestAppearances(episodes, userId).catch(() => {
          // Don't fail the request if caching fails
        });
      }

      return NextResponse.json({
        type: 'PODCASTEPISODE',
        term,
        page,
        count: episodes.length,
        episodes,
      });
    }

    // PODCASTSERIES
    const podcasts = await searchPodcastsWithCache(term, page);

    return NextResponse.json({
      type: 'PODCASTSERIES',
      term,
      page,
      count: podcasts.length,
      podcasts,
    });
  } catch (error) {
    return handleApiError(error, 'Taddy search');
  }
}
