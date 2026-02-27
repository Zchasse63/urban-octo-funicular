export type ExpertCategory = 'fresh' | 'established' | 'oversaturated';

export type ExpertSource = 'taddy' | 'grok' | 'cached';

export interface Expert {
  id: string;
  name: string;
  category: ExpertCategory;
  freshnessScore: number;
  expertise: string[];
  appearanceCount: number;
  recentAppearances: number;
  contactHints: ContactHints;
  metadata: ExpertMetadata;
  source: ExpertSource;
  appearances?: AppearanceRecord[];
}

export interface AppearanceRecord {
  podcastName: string;
  episodeName: string;
  datePublished: string | null;
  podcastImageUrl?: string;
  episodeUrl?: string;
  role: string;
}

export interface ContactHints {
  website?: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
}

export interface ExpertMetadata {
  affiliation?: string;
  bio?: string;
  lastAppearanceDate?: string;
  notableShows?: string[];
}

export interface DiscoveryQuery {
  topic: string;
  showId: string;
  maxResults?: number;
}

export interface DiscoveryResponse {
  experts: Expert[];
  searchedAt: Date;
  topic: string;
  source: ExpertSource;
}
