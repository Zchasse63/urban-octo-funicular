/**
 * Guest Appearance Search Orchestrator
 *
 * Searches for a guest's previous podcast appearances using a cache-first
 * strategy backed by the Taddy podcast search API.
 *
 * Flow:
 *   1. Check cached appearances in Supabase
 *   2. If insufficient results and Taddy is available, search the API
 *   3. Extract and cache new guest appearances
 *   4. Return merged, deduplicated results sorted by date
 */

import { searchEpisodesWithCache, cacheGuestAppearances, getCachedAppearances } from './cache';
import { isTaddyAvailable } from './client';
import type { GuestAppearance, TaddyEpisode } from './types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GuestSearchResult {
  appearances: GuestAppearance[];
  totalFound: number;
  source: 'taddy' | 'cache' | 'unavailable';
}

// ---------------------------------------------------------------------------
// Main search function
// ---------------------------------------------------------------------------

/**
 * Search for a guest's previous podcast appearances.
 *
 * 1. Check cached appearances first
 * 2. If fewer than `minCachedThreshold` cached results AND Taddy is available,
 *    search Taddy by guest name
 * 3. Cache new findings
 * 4. Return merged, deduplicated results sorted by most recent first
 */
export async function searchGuestAppearances(
  guestName: string,
  userId: string,
  options?: { maxResults?: number; includeTranscripts?: boolean }
): Promise<GuestSearchResult> {
  const maxResults = options?.maxResults ?? 25;
  const minCachedThreshold = 5;

  // Bail out early on empty names
  if (!guestName.trim()) {
    return { appearances: [], totalFound: 0, source: 'unavailable' };
  }

  // ── Step 1: Check cache ──────────────────────────────────────────────────
  const cached = await getCachedAppearances(guestName);

  // ── Step 2: Search Taddy if cache is thin ────────────────────────────────
  let freshAppearances: GuestAppearance[] = [];
  let source: GuestSearchResult['source'] = 'cache';

  if (cached.length < minCachedThreshold && isTaddyAvailable()) {
    try {
      const episodes: TaddyEpisode[] = await searchEpisodesWithCache(
        guestName,
        1,          // first page
        maxResults
      );

      // Cache new guest appearances in the background
      if (episodes.length > 0) {
        await cacheGuestAppearances(episodes, userId);

        // Pull the newly-cached appearances (they are now normalized)
        freshAppearances = await getCachedAppearances(guestName);
      }

      source = 'taddy';
    } catch {
      // If Taddy fails, fall back to whatever the cache has
      source = cached.length > 0 ? 'cache' : 'unavailable';
    }
  }

  // ── Step 3: Merge & deduplicate ──────────────────────────────────────────
  const merged = mergeAppearances(cached, freshAppearances);

  // ── Step 4: Sort by date (most recent first) ────────────────────────────
  merged.sort((a, b) => {
    if (!a.datePublished) return 1;
    if (!b.datePublished) return -1;
    return new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime();
  });

  const limited = merged.slice(0, maxResults);

  return {
    appearances: limited,
    totalFound: merged.length,
    source,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Merge two appearance lists, deduplicating by normalized name + episode UUID.
 */
function mergeAppearances(
  listA: GuestAppearance[],
  listB: GuestAppearance[]
): GuestAppearance[] {
  const seen = new Set<string>();
  const result: GuestAppearance[] = [];

  for (const appearance of [...listA, ...listB]) {
    const key = `${appearance.guestNameNormalized}::${appearance.episodeTaddyUuid ?? appearance.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(appearance);
    }
  }

  return result;
}
