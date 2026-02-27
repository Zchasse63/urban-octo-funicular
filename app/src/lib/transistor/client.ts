/**
 * Transistor.fm API Client
 * REST API with Bearer token auth.
 * Follows the same patterns as the Buzzsprout client (retry, rate-limit, error handling).
 */

import type {
  TransistorShow,
  TransistorEpisode,
  TransistorEpisodeUpdate,
  TransistorListResponse,
  TransistorSingleResponse,
} from './types';

export class TransistorApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'TransistorApiError';
  }
}

export class TransistorClient {
  private apiKey: string;
  private baseUrl = 'https://api.transistor.fm/v1';
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'PATCH' | 'POST' = 'GET',
    body?: object
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 0;
          const exponentialBackoff = this.retryDelay * Math.pow(2, attempt);

          // Cap wait time at 5 minutes to prevent indefinite hangs
          const MAX_WAIT_MS = 5 * 60 * 1000;
          const waitTime = Math.min(
            Math.max(retryAfterMs, exponentialBackoff),
            MAX_WAIT_MS
          );

          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.errors?.[0]?.detail
            || errorData.errors?.[0]?.title
            || response.statusText;
          throw new TransistorApiError(
            `Transistor API error: ${response.status} - ${errorMessage}`,
            response.status,
            errorMessage
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except rate limiting
        if (error instanceof TransistorApiError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt < this.retryAttempts - 1) {
          const waitTime = this.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    const finalError = lastError || new Error('Request failed after all retry attempts');
    throw new Error(`${finalError.message} (failed after ${this.retryAttempts} attempts)`);
  }

  async getShows(): Promise<TransistorShow[]> {
    const response = await this.makeRequest<TransistorListResponse<TransistorShow>>('/shows');
    return response.data;
  }

  async getEpisodes(showId: string): Promise<TransistorEpisode[]> {
    const response = await this.makeRequest<TransistorListResponse<TransistorEpisode>>(
      `/episodes?show_id=${encodeURIComponent(showId)}`
    );
    return response.data;
  }

  async updateEpisode(
    episodeId: string,
    data: Partial<TransistorEpisodeUpdate>
  ): Promise<TransistorEpisode> {
    const response = await this.makeRequest<TransistorSingleResponse<TransistorEpisode>>(
      `/episodes/${encodeURIComponent(episodeId)}`,
      'PATCH',
      {
        episode: {
          ...data,
        },
      }
    );
    return response.data;
  }
}
