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
  country: string;
  websiteUrl: string | null;
  authorName: string | null;
  totalEpisodesCount: number;
  popularity: number | null;
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
  name: string;
  role: string; // HOST, GUEST, PRODUCER, etc.
  img: string | null;
  href: string | null;
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

export type TaddySortBy = 'RELEVANCE' | 'DATE' | 'POPULARITY';
export type TaddyMatchBy = 'TERM' | 'EXACT_PHRASE';

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
