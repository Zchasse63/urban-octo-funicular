import { AssemblyAI } from 'assemblyai';
import type { TranscriptResult, TranscribeOptions } from './types';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function transcribeAudio(
  audioUrl: string,
  options: TranscribeOptions = {}
): Promise<TranscriptResult> {
  try {
    const config: Parameters<typeof client.transcripts.transcribe>[0] = {
      audio_url: audioUrl,
      speaker_labels: true,
      auto_highlights: true,
    };

    if (options.language) {
      config.language_code = options.language;
    }

    if (options.customVocabulary && options.customVocabulary.length > 0) {
      config.word_boost = options.customVocabulary;
      config.boost_param = 'high';
    }

    const transcript = await client.transcripts.transcribe(config);

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    const words = (transcript.words || []).map((word) => ({
      text: word.text,
      start: word.start,
      end: word.end,
      confidence: word.confidence,
      speaker: word.speaker || undefined,
    }));

    const utterances = (transcript.utterances || []).map((utterance) => ({
      speaker: utterance.speaker,
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
    }));

    return {
      id: transcript.id,
      text: transcript.text || '',
      words,
      utterances,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AssemblyAI transcription failed: ${error.message}`);
    }
    throw error;
  }
}
