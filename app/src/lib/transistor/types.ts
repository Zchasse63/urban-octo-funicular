/**
 * Transistor.fm API Types
 * Based on Transistor REST API v1 (JSON:API format)
 */

export interface TransistorShow {
  id: string;
  type: 'show';
  attributes: {
    title: string;
    description: string;
    image_url: string;
    website_url: string;
    created_at: string;
  };
}

export interface TransistorEpisode {
  id: string;
  type: 'episode';
  attributes: {
    title: string;
    summary: string;
    description: string; // HTML show notes
    status: string;
    published_at: string;
    audio_url: string;
    duration: number;
  };
}

export interface TransistorEpisodeUpdate {
  title?: string;
  summary?: string;
  description?: string;
}

export interface TransistorCredentials {
  api_key: string;
}

export interface TransistorApiError {
  errors: Array<{
    title: string;
    detail: string;
    status: string;
  }>;
}

/** JSON:API list response wrapper */
export interface TransistorListResponse<T> {
  data: T[];
}

/** JSON:API single response wrapper */
export interface TransistorSingleResponse<T> {
  data: T;
}
