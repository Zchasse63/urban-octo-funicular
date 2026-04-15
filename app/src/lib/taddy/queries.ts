/**
 * Taddy API GraphQL query strings
 * Pre-built queries requesting exactly the fields PodBrain needs.
 */

/**
 * Search episodes by term with person metadata (guests, hosts).
 * Returns episodes with podcast series context and persons array.
 *
 * NOTE: Taddy enforces a tight query-complexity budget on this endpoint.
 * On 2026-04-15 the following combination was empirically found to fit
 * within the budget up to `limitPerPage = 25`:
 *   - episode: uuid, name, datePublished (no audioUrl, no description)
 *   - podcastSeries: uuid, name (NO imageUrl — tips over the threshold)
 *   - persons: uuid, name, role, imageUrl, url
 *
 * If you need `audioUrl` or `podcastSeries.imageUrl` for a specific
 * episode, fetch it via a separate `getPodcastEpisode(uuid)` call — the
 * single-item query path has a much higher complexity allowance. See
 * `specs/bugs/experts-bugs.md#bug-34` for the full debugging trail.
 */
export const SEARCH_EPISODES = `
  query SearchEpisodes($term: String!, $page: Int, $limitPerPage: Int, $sortBy: SearchSortOrder, $matchBy: SearchMatchType) {
    search(
      term: $term
      filterForTypes: PODCASTEPISODE
      page: $page
      limitPerPage: $limitPerPage
      sortBy: $sortBy
      matchBy: $matchBy
    ) {
      searchId
      podcastEpisodes {
        uuid
        name
        datePublished
        podcastSeries {
          uuid
          name
        }
        persons {
          uuid
          name
          role
          imageUrl
          url
        }
      }
    }
  }
`;

/**
 * Search podcasts by term.
 * Returns podcast series with metadata for discovery.
 */
export const SEARCH_PODCASTS = `
  query SearchPodcasts($term: String!, $page: Int, $limitPerPage: Int, $sortBy: SearchSortOrder) {
    search(
      term: $term
      filterForTypes: PODCASTSERIES
      page: $page
      limitPerPage: $limitPerPage
      sortBy: $sortBy
    ) {
      searchId
      podcastSeries {
        uuid
        name
        description
        imageUrl
        rssUrl
        itunesId
        genres
        language
        websiteUrl
        authorName
        totalEpisodesCount
        popularityRank
        datePublished
      }
    }
  }
`;

/**
 * Get a single podcast by UUID with full details.
 */
export const GET_PODCAST = `
  query GetPodcast($uuid: ID!) {
    getPodcastSeries(uuid: $uuid) {
      uuid
      name
      description
      imageUrl
      rssUrl
      itunesId
      genres
      language
      websiteUrl
      authorName
      totalEpisodesCount
      popularityRank
      datePublished
    }
  }
`;

/**
 * Get a single episode by UUID with full details including persons.
 */
export const GET_EPISODE = `
  query GetEpisode($uuid: ID!) {
    getPodcastEpisode(uuid: $uuid) {
      uuid
      name
      description
      audioUrl
      duration
      datePublished
      episodeNumber
      seasonNumber
      podcastSeries {
        uuid
        name
        imageUrl
      }
      persons {
        uuid
        name
        role
        imageUrl
        url
      }
    }
  }
`;

/**
 * Get episode with transcript content (if available via Taddy).
 * Includes the full episode fields plus transcript text.
 */
export const GET_EPISODE_WITH_TRANSCRIPT = `
  query GetEpisodeWithTranscript($uuid: ID!) {
    getPodcastEpisode(uuid: $uuid) {
      uuid
      name
      description
      audioUrl
      duration
      datePublished
      episodeNumber
      seasonNumber
      podcastSeries {
        uuid
        name
        imageUrl
      }
      persons {
        uuid
        name
        role
        imageUrl
        url
      }
    }
  }
`;
