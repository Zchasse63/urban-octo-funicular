/**
 * Taddy API GraphQL query strings
 * Pre-built queries requesting exactly the fields PodBrain needs.
 */

/**
 * Search episodes by term with person metadata (guests, hosts).
 * Returns episodes with podcast series context and persons array.
 */
export const SEARCH_EPISODES = `
  query SearchEpisodes($term: String!, $page: Int, $limitPerPage: Int, $sortBy: SearchSortByEnum, $matchBy: SearchMatchByEnum) {
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
          name
          role
          img
          href
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
  query SearchPodcasts($term: String!, $page: Int, $limitPerPage: Int, $sortBy: SearchSortByEnum) {
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
        country
        websiteUrl
        authorName
        totalEpisodesCount
        popularity
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
      country
      websiteUrl
      authorName
      totalEpisodesCount
      popularity
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
        name
        role
        img
        href
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
        name
        role
        img
        href
      }
    }
  }
`;
