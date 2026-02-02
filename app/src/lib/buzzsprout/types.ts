export interface BuzzsproutPodcast {
  id: number;
  title: string;
  artwork_url: string;
  description?: string;
  author?: string;
  website_address?: string;
}

export interface BuzzsproutEpisode {
  id: number;
  title: string;
  audio_url: string;
  description: string;
  summary?: string;
  artist?: string;
  tags?: string;
  published_at?: string;
  duration?: number;
  guid?: string;
  inactive_at?: string;
}

export interface BuzzsproutCredentials {
  api_token: string;
  podcast_id?: string;
}

export interface BuzzsproutError {
  error: string;
  message: string;
  status: number;
}
