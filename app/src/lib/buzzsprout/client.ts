import { BuzzsproutPodcast, BuzzsproutEpisode, BuzzsproutError } from './types';

export class BuzzsproutClient {
  private apiToken: string;
  private baseUrl = 'https://www.buzzsprout.com/api';
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'PUT' | 'POST' = 'GET',
    body?: object
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Authorization': `Token token=${this.apiToken}`,
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

        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');

        if (response.status === 429) {
          const resetTime = rateLimitReset ? parseInt(rateLimitReset) * 1000 : Date.now() + 60000;
          const exponentialBackoff = this.retryDelay * Math.pow(2, attempt);
          const timeUntilReset = Math.max(0, resetTime - Date.now());

          // Cap wait time at 5 minutes to prevent indefinite hangs from malicious/clock-skewed reset values
          const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes
          const waitTime = Math.min(
            Math.max(timeUntilReset, exponentialBackoff),
            MAX_WAIT_MS
          );

          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Buzzsprout API error: ${response.status} - ${errorData.error || response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryAttempts - 1) {
          const waitTime = this.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    const finalError = lastError || new Error('Request failed after all retry attempts');
    throw new Error(`${finalError.message} (failed after ${this.retryAttempts} attempts)`);
  }

  async getPodcasts(): Promise<BuzzsproutPodcast[]> {
    return this.makeRequest<BuzzsproutPodcast[]>('/podcasts.json');
  }

  async getEpisodes(podcastId: string): Promise<BuzzsproutEpisode[]> {
    return this.makeRequest<BuzzsproutEpisode[]>(`/${podcastId}/episodes.json`);
  }

  async updateEpisode(
    podcastId: string,
    episodeId: string,
    data: Partial<BuzzsproutEpisode>
  ): Promise<BuzzsproutEpisode> {
    return this.makeRequest<BuzzsproutEpisode>(
      `/${podcastId}/episodes/${episodeId}.json`,
      'PUT',
      data
    );
  }
}
