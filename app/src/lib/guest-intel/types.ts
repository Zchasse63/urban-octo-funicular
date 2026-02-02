export interface GuestIntelligence {
  guestName: string;
  questionsAskedBefore: string[];
  uniqueAngles: string[];
  repeatedStories: RepeatedStory[];
  publicPositions: Position[];
  trendingTopics: string[];
}

export interface RepeatedStory {
  story: string;
  count: number;
  examples?: string[];
}

export interface Position {
  topic: string;
  stance: string;
  source: string;
  date?: string;
}

export interface QuestionAnalysis {
  question: string;
  frequency: number;
  podcasts: string[];
}
