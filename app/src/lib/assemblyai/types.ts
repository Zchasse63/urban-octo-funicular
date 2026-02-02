export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface TranscriptUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface TranscriptResult {
  id: string;
  text: string;
  words: TranscriptWord[];
  utterances?: TranscriptUtterance[];
}

export interface TranscribeOptions {
  language?: string;
  customVocabulary?: string[];
}
