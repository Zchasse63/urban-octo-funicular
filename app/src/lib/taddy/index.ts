/**
 * Taddy API integration for PodBrain
 * Podcast search, guest discovery, and episode lookup via Taddy GraphQL API.
 */

// Client
export { getTaddyClient, isTaddyAvailable, TaddyConfigError, TaddyApiError, TaddyRateLimitError, TaddyGraphQLError } from './client';

// Cache
export {
  searchEpisodesWithCache,
  searchPodcastsWithCache,
  getPodcastWithCache,
  getEpisodeWithCache,
  cacheGuestAppearances,
  getCachedAppearances,
} from './cache';

// Types
export type {
  TaddyType,
  TaddyPodcast,
  TaddyEpisode,
  TaddyPerson,
  TaddyCreator,
  TaddySearchResult,
  TaddySearchResponse,
  TaddyPodcastResponse,
  TaddyEpisodeResponse,
  TaddySortBy,
  TaddyMatchBy,
  TaddySearchOptions,
  GuestAppearance,
} from './types';
