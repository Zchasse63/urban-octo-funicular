export interface Timestamp {
  time: number;
  description: string;
}

export interface ShowNotesResult {
  summary: string;
  keyTopics: string[];
  timestamps: Timestamp[];
  resources: string[];
  guestBio?: string;
  markdown: string;
  html: string;
}

export interface GenerateShowNotesOptions {
  episodeTitle?: string;
  guestName?: string;
  targetKeywords?: string[];
}
