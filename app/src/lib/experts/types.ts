export type ExpertCategory = 'fresh' | 'established' | 'oversaturated';

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
}
