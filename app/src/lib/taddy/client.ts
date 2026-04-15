/**
 * Taddy API GraphQL client
 * Handles authentication, request tracking, rate limiting, and retries.
 *
 * Auth: X-USER-ID + X-API-KEY headers
 * Rate limit: 100K requests/month on Pro plan
 * Timeout: 15s per request
 */

import type {
  TaddySearchResponse,
  TaddyPodcastResponse,
  TaddyEpisodeResponse,
  TaddySortBy,
  TaddyMatchBy,
} from './types';
import {
  SEARCH_EPISODES,
  SEARCH_PODCASTS,
  GET_PODCAST,
  GET_EPISODE,
} from './queries';
import { TADDY_API_URL, TADDY_MONTHLY_REQUEST_LIMIT } from '@/lib/constants';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 15000;

class TaddyClient {
  private apiKey: string;
  private userId: string;
  private requestCount: number = 0;
  private monthStart: number = Date.now();

  constructor() {
    this.apiKey = process.env.TADDY_API_KEY || '';
    this.userId = process.env.TADDY_USER_ID || '';
  }

  /**
   * Execute a raw GraphQL query against the Taddy API.
   * Includes retry logic and rate limit tracking.
   */
  async query<T>(graphqlQuery: string, variables?: Record<string, unknown>): Promise<T> {
    if (!this.apiKey || !this.userId) {
      throw new TaddyConfigError('Taddy API credentials not configured. Set TADDY_API_KEY and TADDY_USER_ID.');
    }

    this.trackRequest();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(TADDY_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-USER-ID': this.userId,
            'X-API-KEY': this.apiKey,
          },
          body: JSON.stringify({
            query: graphqlQuery,
            ...(variables ? { variables } : {}),
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (response.status === 429) {
          throw new TaddyRateLimitError('Taddy API rate limit exceeded');
        }

        if (!response.ok) {
          throw new TaddyApiError(`Taddy API error: ${response.status} ${response.statusText}`, response.status);
        }

        const data = await response.json();

        if (data.errors && data.errors.length > 0) {
          const message = data.errors[0]?.message || 'Unknown GraphQL error';
          throw new TaddyGraphQLError(`Taddy GraphQL error: ${message}`, data.errors);
        }

        return data.data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on config errors, rate limits, or auth issues
        if (
          error instanceof TaddyConfigError ||
          error instanceof TaddyRateLimitError ||
          (error instanceof TaddyApiError && (error.statusCode === 401 || error.statusCode === 403))
        ) {
          throw error;
        }

        // Retry on transient errors
        if (attempt < MAX_RETRIES) {
          await this.delay(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError || new Error('Taddy API request failed after retries');
  }

  // -- High-level search methods --

  /**
   * Search for podcast episodes by term.
   */
  async searchEpisodes(
    term: string,
    options?: {
      page?: number;
      limitPerPage?: number;
      sortBy?: TaddySortBy;
      matchBy?: TaddyMatchBy;
    }
  ): Promise<TaddySearchResponse> {
    return this.query<TaddySearchResponse>(SEARCH_EPISODES, {
      term,
      page: options?.page ?? 1,
      limitPerPage: options?.limitPerPage ?? 25,
      // Taddy 2026-04-15 schema: SearchSortOrder = POPULARITY | EXACTNESS;
      // RELEVANCE and DATE were removed. SearchMatchType replaces the old
      // TERM with MOST_TERMS (the closest functional equivalent).
      sortBy: options?.sortBy ?? 'EXACTNESS',
      matchBy: options?.matchBy ?? 'MOST_TERMS',
    });
  }

  /**
   * Search for podcast series by term.
   */
  async searchPodcasts(
    term: string,
    options?: {
      page?: number;
      limitPerPage?: number;
      sortBy?: TaddySortBy;
    }
  ): Promise<TaddySearchResponse> {
    return this.query<TaddySearchResponse>(SEARCH_PODCASTS, {
      term,
      page: options?.page ?? 1,
      limitPerPage: options?.limitPerPage ?? 25,
      sortBy: options?.sortBy ?? 'EXACTNESS',
    });
  }

  /**
   * Get a single episode by its Taddy UUID.
   */
  async getEpisode(uuid: string): Promise<TaddyEpisodeResponse> {
    return this.query<TaddyEpisodeResponse>(GET_EPISODE, { uuid });
  }

  /**
   * Get a single podcast series by its Taddy UUID.
   */
  async getPodcast(uuid: string): Promise<TaddyPodcastResponse> {
    return this.query<TaddyPodcastResponse>(GET_PODCAST, { uuid });
  }

  // -- Rate limit tracking --

  /**
   * Track request count against the monthly limit.
   * Resets when a new month begins.
   */
  private trackRequest(): void {
    const now = Date.now();
    const msPerMonth = 30 * 24 * 60 * 60 * 1000;

    // Reset counter if a month has passed
    if (now - this.monthStart > msPerMonth) {
      this.requestCount = 0;
      this.monthStart = now;
    }

    this.requestCount++;

    if (this.requestCount > TADDY_MONTHLY_REQUEST_LIMIT) {
      throw new TaddyRateLimitError(
        `Monthly request limit of ${TADDY_MONTHLY_REQUEST_LIMIT} exceeded. Current count: ${this.requestCount}`
      );
    }
  }

  /**
   * Get the current request count for this billing period.
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Check whether Taddy credentials are configured.
   */
  isAvailable(): boolean {
    return !!this.apiKey && !!this.userId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// -- Error classes --

export class TaddyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaddyConfigError';
  }
}

export class TaddyApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'TaddyApiError';
  }
}

export class TaddyRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaddyRateLimitError';
  }
}

export class TaddyGraphQLError extends Error {
  constructor(
    message: string,
    public readonly errors: Array<{ message: string; [key: string]: unknown }>
  ) {
    super(message);
    this.name = 'TaddyGraphQLError';
  }
}

// -- Singleton access --

let taddyClient: TaddyClient | null = null;

/**
 * Get or create the singleton TaddyClient instance.
 */
export function getTaddyClient(): TaddyClient {
  if (!taddyClient) {
    taddyClient = new TaddyClient();
  }
  return taddyClient;
}

/**
 * Check whether Taddy integration is available (credentials configured).
 */
export function isTaddyAvailable(): boolean {
  return !!(process.env.TADDY_API_KEY && process.env.TADDY_USER_ID);
}
