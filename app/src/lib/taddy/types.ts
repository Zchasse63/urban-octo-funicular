/**
 * Taddy API TypeScript types
 * Based on the Taddy GraphQL schema for podcast search
 * Docs: https://taddy.org/developers/podcast-api
 */

// -- Entity types supported by Taddy --

export type TaddyType = 'PODCASTSERIES' | 'PODCASTEPISODE' | 'CREATOR';

// -- Core entity interfaces --

export interface TaddyPodcast {
  uuid: string;
  name: string;
  description: string;
  imageUrl: string;
  rssUrl: string;
  itunesId: number | null;
  genres: string[];
  language: string;
  /**
   * @deprecated Taddy removed this field in its 2026-04-15 schema.
   * Kept as optional for backward-compat with rows already cached in
   * `taddy_podcast_cache.country` (a DB column that still exists but
   * is no longer populated by new API responses). New code should not
   * rely on this being present.
   */
  country?: string;
  websiteUrl: string | null;
  authorName: string | null;
  totalEpisodesCount: number;
  /**
   * Taddy renamed `popularity` → `popularityRank` in the 2026-04-15
   * schema. `popularity` is kept for backward-compat with cached rows.
   */
  popularity: number | null;
  popularityRank?: number | null;
  datePublished: number | null; // Unix timestamp
}

export interface TaddyEpisode {
  uuid: string;
  name: string;
  description: string;
  audioUrl: string;
  duration: number; // seconds
  datePublished: number; // Unix timestamp
  episodeNumber: number | null;
  seasonNumber: number | null;
  podcastSeries: {
    uuid: string;
    name: string;
    imageUrl: string;
  } | null;
  persons: TaddyPerson[];
}

export interface TaddyPerson {
  uuid: string;
  name: string;
  role: string; // HOST, GUEST, PRODUCER, etc.
  imageUrl: string | null;
  url: string | null;
  /**
   * @deprecated Taddy renamed these to imageUrl/url in their 2025 schema.
   * Left as optional aliases for the cache-row mapper which reads existing
   * jsonb blobs from `taddy_episode_cache.persons` that may still contain
   * the old field names from pre-fix rows. New rows use imageUrl/url.
   */
  img?: string | null;
  href?: string | null;
}

export interface TaddyCreator {
  uuid: string;
  name: string;
  description: string;
  imageUrl: string;
  websiteUrl: string | null;
  socialLinks: { platform: string; url: string }[];
}

// -- API response wrappers --

export interface TaddySearchResult {
  searchId: string;
  podcastSeries: TaddyPodcast[] | null;
  podcastEpisodes: TaddyEpisode[] | null;
}

export interface TaddySearchResponse {
  search: TaddySearchResult;
}

export interface TaddyPodcastResponse {
  getPodcastSeries: TaddyPodcast | null;
}

export interface TaddyEpisodeResponse {
  getPodcastEpisode: TaddyEpisode | null;
}

// -- Query option types --

// Taddy enum values as of 2026-04-15 schema introspection.
// SearchSortOrder allows: POPULARITY, EXACTNESS  (previously included RELEVANCE/DATE — removed)
// SearchMatchType allows: EXACT_PHRASE, ALL_TERMS, MOST_TERMS  (previously TERM — renamed)
export type TaddySortBy = 'POPULARITY' | 'EXACTNESS';
export type TaddyMatchBy = 'EXACT_PHRASE' | 'ALL_TERMS' | 'MOST_TERMS';

export interface TaddySearchOptions {
  page?: number;
  limitPerPage?: number;
  sortBy?: TaddySortBy;
  matchBy?: TaddyMatchBy;
  filterForTypes?: TaddyType[];
}

// -- Guest appearance (for cache layer) --

export interface GuestAppearance {
  id: string;
  guestName: string;
  guestNameNormalized: string;
  guestImageUrl: string | null;
  guestProfileUrl: string | null;
  role: string;
  episodeTaddyUuid: string | null;
  podcastTaddyUuid: string | null;
  podcastName: string | null;
  episodeName: string | null;
  datePublished: string | null;
  durationSeconds: number | null;
  audioUrl: string | null;
  source: string;
  cachedAt: string;
}
