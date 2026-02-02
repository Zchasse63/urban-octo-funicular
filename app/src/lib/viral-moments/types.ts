export type ViralMomentCategory =
  | 'controversial'
  | 'emotional'
  | 'quotable'
  | 'surprising'
  | 'counterintuitive';

export type SuggestedPlatform = 'tiktok' | 'instagram' | 'twitter' | 'linkedin';

export interface ViralMoment {
  id: string;
  quote: string;
  startTime: number;
  endTime: number;
  score: number;
  category: ViralMomentCategory;
  reasoning: string;
  suggestedPlatforms: SuggestedPlatform[];
}

export interface DetectionResponse {
  viralMoments: ViralMoment[];
  topMoment: ViralMoment;
}

export interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
}

export interface DetectionCriteria {
  controversial: boolean;
  emotional: boolean;
  quotable: boolean;
  surprising: boolean;
  counterintuitive: boolean;
}
