/**
 * Taddy cache layer
 * Checks Supabase cache tables before making Taddy API calls.
 * Taddy explicitly permits caching search results.
 *
 * Flow: check cache -> if stale/missing, call API -> store result -> return
 *
 * BUG #23 security hardening: writes to `taddy_podcast_cache` and
 * `taddy_episode_cache` now use the admin (service_role) client so the
 * RLS policies on those tables can be scoped to service_role only.
 * Previously they had `WITH CHECK (true)` which let any authenticated
 * user pollute the shared cache with arbitrary data (cache poisoning
 * vector). Reads still use the user-session client because the SELECT
 * policies are fine — reads are not a security issue.
 *
 * `guest_appearances` writes continue to use the user-session client
 * because that table is RLS-scoped per user_id (not a shared cache).
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getTaddyClient, isTaddyAvailable } from './client';
import { TADDY_CACHE_TTL_HOURS } from '@/lib/constants';
import type { TaddyPodcast, TaddyEpisode, TaddyPerson, GuestAppearance } from './types';

// -- Public API --

/**
 * Search episodes with cache-first strategy.
 * Does NOT cache search results (too variable), but caches individual episodes
 * returned from the search. Goes directly to Taddy API for search.
 */
export async function searchEpisodesWithCache(
  term: string,
  page?: number,
  limitPerPage?: number
): Promise<TaddyEpisode[]> {
  if (!isTaddyAvailable()) {
    return [];
  }

  const client = getTaddyClient();
  const response = await client.searchEpisodes(term, { page, limitPerPage });
  const episodes = response.search.podcastEpisodes || [];

  // Cache episodes in the background (don't block the response)
  if (episodes.length > 0) {
    cacheEpisodesInBackground(episodes).catch(() => {
      // Silently ignore cache write failures
    });
  }

  return episodes;
}

/**
 * Search podcasts with cache-first strategy.
 * Similar to episodes: search goes to API, results get cached.
 */
export async function searchPodcastsWithCache(
  term: string,
  page?: number,
  limitPerPage?: number
): Promise<TaddyPodcast[]> {
  if (!isTaddyAvailable()) {
    return [];
  }

  const client = getTaddyClient();
  const response = await client.searchPodcasts(term, { page, limitPerPage });
  const podcasts = response.search.podcastSeries || [];

  if (podcasts.length > 0) {
    cachePodcastsInBackground(podcasts).catch(() => {
      // Silently ignore cache write failures
    });
  }

  return podcasts;
}

/**
 * Get a single podcast by UUID. Checks cache first.
 */
export async function getPodcastWithCache(uuid: string): Promise<TaddyPodcast | null> {
  // Check cache first
  const cached = await getCachedPodcast(uuid);
  if (cached) {
    return cached;
  }

  // Cache miss: call API
  if (!isTaddyAvailable()) {
    return null;
  }

  const client = getTaddyClient();
  const response = await client.getPodcast(uuid);
  const podcast = response.getPodcastSeries;

  if (podcast) {
    await cachePodcast(podcast).catch(() => {});
  }

  return podcast;
}

/**
 * Get a single episode by UUID. Checks cache first.
 */
export async function getEpisodeWithCache(uuid: string): Promise<TaddyEpisode | null> {
  // Check cache first
  const cached = await getCachedEpisode(uuid);
  if (cached) {
    return cached;
  }

  // Cache miss: call API
  if (!isTaddyAvailable()) {
    return null;
  }

  const client = getTaddyClient();
  const response = await client.getEpisode(uuid);
  const episode = response.getPodcastEpisode;

  if (episode) {
    await cacheEpisode(episode).catch(() => {});
  }

  return episode;
}

/**
 * Cache guest appearances extracted from episode person metadata.
 * Builds the guest credits database over time.
 */
export async function cacheGuestAppearances(
  episodes: TaddyEpisode[],
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const appearances: Array<{
    user_id: string;
    guest_name: string;
    guest_name_normalized: string;
    guest_image_url: string | null;
    guest_profile_url: string | null;
    role: string;
    episode_taddy_uuid: string;
    podcast_taddy_uuid: string | null;
    podcast_name: string | null;
    episode_name: string;
    date_published: string | null;
    duration_seconds: number | null;
    audio_url: string | null;
    source: string;
  }> = [];

  for (const episode of episodes) {
    if (!episode.persons || episode.persons.length === 0) continue;

    for (const person of episode.persons) {
      if (!person.name) continue;

      appearances.push({
        user_id: userId,
        guest_name: person.name,
        guest_name_normalized: normalizeName(person.name),
        guest_image_url: person.imageUrl || person.img || null,
        guest_profile_url: person.url || person.href || null,
        role: person.role?.toLowerCase() || 'guest',
        episode_taddy_uuid: episode.uuid,
        podcast_taddy_uuid: episode.podcastSeries?.uuid || null,
        podcast_name: episode.podcastSeries?.name || null,
        episode_name: episode.name,
        date_published: episode.datePublished
          ? new Date(episode.datePublished * 1000).toISOString()
          : null,
        duration_seconds: episode.duration || null,
        audio_url: episode.audioUrl || null,
        source: 'taddy_search',
      });
    }
  }

  if (appearances.length === 0) return;

  // Upsert in batches to avoid hitting request size limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < appearances.length; i += BATCH_SIZE) {
    const batch = appearances.slice(i, i + BATCH_SIZE);
    await supabase
      .from('guest_appearances')
      .upsert(batch, {
        onConflict: 'guest_name_normalized,episode_taddy_uuid',
        ignoreDuplicates: true,
      });
  }
}

/**
 * Get cached guest appearances by name.
 * Uses normalized name for fuzzy matching.
 */
export async function getCachedAppearances(guestName: string): Promise<GuestAppearance[]> {
  const supabase = await createClient();
  const normalized = normalizeName(guestName);

  const { data, error } = await supabase
    .from('guest_appearances')
    .select('*')
    .eq('guest_name_normalized', normalized)
    .order('date_published', { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return data.map(mapGuestAppearanceRow);
}

// -- Internal cache helpers --

async function getCachedPodcast(uuid: string): Promise<TaddyPodcast | null> {
  const supabase = await createClient();
  const cutoff = getCacheCutoff();

  const { data, error } = await supabase
    .from('taddy_podcast_cache')
    .select('*')
    .eq('taddy_uuid', uuid)
    .gte('cached_at', cutoff.toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return mapPodcastCacheRow(data);
}

async function getCachedEpisode(uuid: string): Promise<TaddyEpisode | null> {
  const supabase = await createClient();
  const cutoff = getCacheCutoff();

  const { data, error } = await supabase
    .from('taddy_episode_cache')
    .select('*')
    .eq('taddy_uuid', uuid)
    .gte('cached_at', cutoff.toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return mapEpisodeCacheRow(data);
}

async function cachePodcast(podcast: TaddyPodcast): Promise<void> {
  // BUG #23: admin client for cache writes (policies are service_role only)
  const supabase = createAdminClient();

  await supabase
    .from('taddy_podcast_cache')
    .upsert(
      {
        taddy_uuid: podcast.uuid,
        name: podcast.name,
        description: podcast.description || null,
        image_url: podcast.imageUrl || null,
        rss_url: podcast.rssUrl || null,
        itunes_id: podcast.itunesId || null,
        genres: podcast.genres || [],
        language: podcast.language || null,
        country: podcast.country || null,
        total_episodes: podcast.totalEpisodesCount || null,
        author_name: podcast.authorName || null,
        website_url: podcast.websiteUrl || null,
        cached_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'taddy_uuid' }
    );
}

async function cacheEpisode(episode: TaddyEpisode): Promise<void> {
  // BUG #23: admin client for cache writes (policies are service_role only)
  const supabase = createAdminClient();

  await supabase
    .from('taddy_episode_cache')
    .upsert(
      {
        taddy_uuid: episode.uuid,
        podcast_taddy_uuid: episode.podcastSeries?.uuid || null,
        name: episode.name,
        description: episode.description || null,
        audio_url: episode.audioUrl || null,
        duration: episode.duration || null,
        date_published: episode.datePublished
          ? new Date(episode.datePublished * 1000).toISOString()
          : null,
        episode_number: episode.episodeNumber || null,
        season_number: episode.seasonNumber || null,
        persons: episode.persons || [],
        cached_at: new Date().toISOString(),
      },
      { onConflict: 'taddy_uuid' }
    );
}

async function cacheEpisodesInBackground(episodes: TaddyEpisode[]): Promise<void> {
  // BUG #23: admin client for cache writes (policies are service_role only)
  const supabase = createAdminClient();

  const rows = episodes.map((episode) => ({
    taddy_uuid: episode.uuid,
    podcast_taddy_uuid: episode.podcastSeries?.uuid || null,
    name: episode.name,
    description: episode.description || null,
    audio_url: episode.audioUrl || null,
    duration: episode.duration || null,
    date_published: episode.datePublished
      ? new Date(episode.datePublished * 1000).toISOString()
      : null,
    episode_number: episode.episodeNumber || null,
    season_number: episode.seasonNumber || null,
    persons: episode.persons || [],
    cached_at: new Date().toISOString(),
  }));

  // Also cache any referenced podcasts
  const podcastSet = new Map<string, TaddyEpisode['podcastSeries']>();
  for (const ep of episodes) {
    if (ep.podcastSeries?.uuid) {
      podcastSet.set(ep.podcastSeries.uuid, ep.podcastSeries);
    }
  }

  if (podcastSet.size > 0) {
    const podcastRows = Array.from(podcastSet.values())
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .map((p) => ({
        taddy_uuid: p.uuid,
        name: p.name,
        image_url: p.imageUrl || null,
        cached_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    await supabase
      .from('taddy_podcast_cache')
      .upsert(podcastRows, { onConflict: 'taddy_uuid', ignoreDuplicates: true });
  }

  await supabase
    .from('taddy_episode_cache')
    .upsert(rows, { onConflict: 'taddy_uuid', ignoreDuplicates: true });
}

async function cachePodcastsInBackground(podcasts: TaddyPodcast[]): Promise<void> {
  // BUG #23: admin client for cache writes (policies are service_role only)
  const supabase = createAdminClient();

  const rows = podcasts.map((podcast) => ({
    taddy_uuid: podcast.uuid,
    name: podcast.name,
    description: podcast.description || null,
    image_url: podcast.imageUrl || null,
    rss_url: podcast.rssUrl || null,
    itunes_id: podcast.itunesId || null,
    genres: podcast.genres || [],
    language: podcast.language || null,
    country: podcast.country || null,
    total_episodes: podcast.totalEpisodesCount || null,
    author_name: podcast.authorName || null,
    website_url: podcast.websiteUrl || null,
    cached_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  await supabase
    .from('taddy_podcast_cache')
    .upsert(rows, { onConflict: 'taddy_uuid', ignoreDuplicates: true });
}

// -- Row mappers --

function mapPodcastCacheRow(row: Record<string, unknown>): TaddyPodcast {
  return {
    uuid: row.taddy_uuid as string,
    name: row.name as string,
    description: (row.description as string) || '',
    imageUrl: (row.image_url as string) || '',
    rssUrl: (row.rss_url as string) || '',
    itunesId: (row.itunes_id as number) || null,
    genres: (row.genres as string[]) || [],
    language: (row.language as string) || '',
    country: (row.country as string) || '',
    websiteUrl: (row.website_url as string) || null,
    authorName: (row.author_name as string) || null,
    totalEpisodesCount: (row.total_episodes as number) || 0,
    popularity: null,
    datePublished: null,
  };
}

function mapEpisodeCacheRow(row: Record<string, unknown>): TaddyEpisode {
  const persons = (row.persons as TaddyPerson[]) || [];

  return {
    uuid: row.taddy_uuid as string,
    name: row.name as string,
    description: (row.description as string) || '',
    audioUrl: (row.audio_url as string) || '',
    duration: (row.duration as number) || 0,
    datePublished: row.date_published
      ? Math.floor(new Date(row.date_published as string).getTime() / 1000)
      : 0,
    episodeNumber: (row.episode_number as number) || null,
    seasonNumber: (row.season_number as number) || null,
    podcastSeries: row.podcast_taddy_uuid
      ? {
          uuid: row.podcast_taddy_uuid as string,
          name: '',
          imageUrl: '',
        }
      : null,
    persons,
  };
}

function mapGuestAppearanceRow(row: Record<string, unknown>): GuestAppearance {
  return {
    id: row.id as string,
    guestName: row.guest_name as string,
    guestNameNormalized: row.guest_name_normalized as string,
    guestImageUrl: (row.guest_image_url as string) || null,
    guestProfileUrl: (row.guest_profile_url as string) || null,
    role: (row.role as string) || 'guest',
    episodeTaddyUuid: (row.episode_taddy_uuid as string) || null,
    podcastTaddyUuid: (row.podcast_taddy_uuid as string) || null,
    podcastName: (row.podcast_name as string) || null,
    episodeName: (row.episode_name as string) || null,
    datePublished: (row.date_published as string) || null,
    durationSeconds: (row.duration_seconds as number) || null,
    audioUrl: (row.audio_url as string) || null,
    source: (row.source as string) || 'taddy_search',
    cachedAt: (row.cached_at as string) || new Date().toISOString(),
  };
}

// -- Utilities --

/**
 * Normalize a guest name for deduplication.
 * Lowercases, trims, collapses whitespace, strips titles/suffixes.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?|prof\.?)\s+/i, '')
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv|phd|md|esq\.?)$/i, '');
}

function getCacheCutoff(): Date {
  return new Date(Date.now() - TADDY_CACHE_TTL_HOURS * 60 * 60 * 1000);
}
