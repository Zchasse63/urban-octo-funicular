export interface RelatedEpisode {
  episodeId: string;
  episodeTitle: string;
  episodeNumber?: number;
  similarityScore: number;
  extractedTopic: string;
  matchedSections: SectionMatch[];
}

export interface SectionMatch {
  sectionId: string;
  content: string;
  startTime: number;
  endTime: number;
  similarity: number;
}

export interface SimilarityResult {
  episodeId: string;
  sectionId: string;
  content: string;
  startTime: number;
  endTime: number;
  similarity: number;
  speaker?: string;
}

export interface EpisodeContext {
  id: string;
  title: string;
  episodeNumber?: number;
}
