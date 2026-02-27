import { task, logger, wait } from "@trigger.dev/sdk";
import type { TranscriptSegment } from "@/types/database";
import { getTriggerClient } from "@/lib/supabase/trigger-client";

/**
 * Input payload for the transcribe-audio job
 */
export interface TranscribeAudioPayload {
  episodeId: string;
  audioUrl: string;
  language?: string;
  speakerLabels?: boolean;
  wordBoost?: string[];
}

/**
 * Result of the transcription job.
 *
 * In webhook mode (production), the job submits to AssemblyAI with a webhook_url,
 * stores the transcript_id in episode metadata, and returns immediately with
 * status: 'webhook_pending'. The AssemblyAI webhook handler at
 * /api/webhooks/assemblyai picks up the result asynchronously.
 *
 * In polling mode (local dev), the job polls until completion and returns the
 * full transcript with status: 'completed'.
 */
export interface TranscriptionResult {
  status: "completed" | "webhook_pending";
  transcript: string;
  segments: TranscriptSegment[];
  audioDurationSeconds: number;
  speakerCount: number;
  wordCount: number;
  confidence: number;
  transcriptId?: string;
}

/**
 * AssemblyAI transcript response structure (simplified)
 */
interface AssemblyAITranscript {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  words: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string | null;
  }> | null;
  utterances: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string;
  }> | null;
  audio_duration: number | null;
  error: string | null;
}

/**
 * Determine if the webhook URL is available for use.
 * Only use webhooks in production when NEXT_PUBLIC_APP_URL is set,
 * since the webhook endpoint must be publicly accessible.
 */
function getWebhookUrl(): string | undefined {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return undefined;

  // Only use webhooks in production (local dev URLs aren't reachable by AssemblyAI)
  if (process.env.NODE_ENV !== "production") return undefined;

  return `${appUrl}/api/webhooks/assemblyai`;
}

/**
 * Transcribe audio using AssemblyAI with speaker diarization.
 *
 * In production, uses webhook callbacks to avoid polling timeouts on long podcasts.
 * In development, falls back to polling every 10 seconds.
 */
export const transcribeAudioTask = task({
  id: "transcribe-audio",
  // Polling fallback needs up to 30 min; webhook mode returns in seconds
  maxDuration: 1800,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 10000,
    maxTimeoutInMs: 60000,
    factor: 2,
  },
  run: async (payload: TranscribeAudioPayload): Promise<TranscriptionResult> => {
    const { episodeId, audioUrl, language = "en", speakerLabels = true, wordBoost = [] } = payload;

    logger.info("Starting audio transcription", {
      episodeId,
      audioUrl,
      language,
      speakerLabels,
    });

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      throw new Error("ASSEMBLYAI_API_KEY environment variable is not set");
    }

    const webhookUrl = getWebhookUrl();

    logger.info("Transcription mode", {
      episodeId,
      mode: webhookUrl ? "webhook" : "polling",
      webhookUrl: webhookUrl || "none",
    });

    // Step 1: Submit transcription request to AssemblyAI
    logger.info("Submitting transcription request", { episodeId });

    const transcriptRequest = await submitTranscriptionRequest(
      apiKey,
      audioUrl,
      language,
      speakerLabels,
      wordBoost,
      webhookUrl
    );

    logger.info("Transcription request submitted", {
      episodeId,
      transcriptId: transcriptRequest.id,
      webhookConfigured: !!webhookUrl,
    });

    // --- WEBHOOK MODE (production) ---
    // Store the transcript ID in episode metadata so the webhook can find
    // the episode when AssemblyAI calls back, then return immediately.
    if (webhookUrl) {
      const supabase = getTriggerClient();

      // Fetch current metadata to merge with
      const { data: episode } = await supabase
        .from("episodes")
        .select("metadata")
        .eq("id", episodeId)
        .single();

      const existingMetadata = (episode?.metadata as Record<string, unknown>) || {};

      await supabase
        .from("episodes")
        .update({
          metadata: {
            ...existingMetadata,
            assemblyai_transcript_id: transcriptRequest.id,
            processing_step: "transcribing",
            processing_progress: 10,
            transcription_mode: "webhook",
            transcription_submitted_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", episodeId);

      logger.info("Webhook mode: stored transcript_id and returning early", {
        episodeId,
        transcriptId: transcriptRequest.id,
      });

      return {
        status: "webhook_pending",
        transcript: "",
        segments: [],
        audioDurationSeconds: 0,
        speakerCount: 0,
        wordCount: 0,
        confidence: 0,
        transcriptId: transcriptRequest.id,
      };
    }

    // --- POLLING MODE (local development fallback) ---
    const completedTranscript = await pollTranscriptionStatus(
      apiKey,
      transcriptRequest.id,
      episodeId
    );

    // Process the transcript into our format
    const segments = processTranscriptSegments(completedTranscript);

    const result: TranscriptionResult = {
      status: "completed",
      transcript: completedTranscript.text || "",
      segments,
      audioDurationSeconds: completedTranscript.audio_duration || 0,
      speakerCount: countUniqueSpeakers(segments),
      wordCount: completedTranscript.words?.length || 0,
      confidence: calculateAverageConfidence(completedTranscript.words || []),
      transcriptId: transcriptRequest.id,
    };

    logger.info("Transcription completed successfully (polling mode)", {
      episodeId,
      wordCount: result.wordCount,
      audioDurationSeconds: result.audioDurationSeconds,
      speakerCount: result.speakerCount,
    });

    return result;
  },
});

/**
 * Submit a transcription request to AssemblyAI.
 * Optionally includes a webhook_url for async completion callbacks.
 */
async function submitTranscriptionRequest(
  apiKey: string,
  audioUrl: string,
  language: string,
  speakerLabels: boolean,
  wordBoost: string[],
  webhookUrl?: string
): Promise<{ id: string }> {
  logger.info("AssemblyAI API request", {
    audioUrl,
    language,
    speakerLabels,
    wordBoostCount: wordBoost.length,
    webhookUrl: webhookUrl || "none",
  });

  const response = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: language,
      speaker_labels: speakerLabels,
      word_boost: wordBoost.length > 0 ? wordBoost : undefined,
      boost_param: wordBoost.length > 0 ? "high" : undefined,
      punctuate: true,
      format_text: true,
      ...(webhookUrl && { webhook_url: webhookUrl }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AssemblyAI API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Poll AssemblyAI for transcription completion.
 * Used as fallback in local development where webhooks are not reachable.
 */
async function pollTranscriptionStatus(
  apiKey: string,
  transcriptId: string,
  episodeId: string
): Promise<AssemblyAITranscript> {
  const maxAttempts = 180; // 30 minutes with 10-second intervals

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    logger.info("Polling transcription status", {
      episodeId,
      transcriptId,
      attempt: attempt + 1,
    });

    const response = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: {
          "Authorization": apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`AssemblyAI polling error: ${response.status}`);
    }

    const transcript: AssemblyAITranscript = await response.json();

    if (transcript.status === "completed") {
      return transcript;
    }

    if (transcript.status === "error") {
      throw new Error(`Transcription error: ${transcript.error}`);
    }

    // Wait 10 seconds before next poll
    await wait.for({ seconds: 10 });
  }

  throw new Error("Transcription timed out");
}

/**
 * Process AssemblyAI response into our TranscriptSegment format
 */
function processTranscriptSegments(transcript: AssemblyAITranscript): TranscriptSegment[] {
  // If we have utterances (speaker-labeled segments), use those
  if (transcript.utterances && transcript.utterances.length > 0) {
    return transcript.utterances.map((utterance) => ({
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      speaker: utterance.speaker,
      confidence: utterance.confidence,
    }));
  }

  // Otherwise, create segments from words
  if (!transcript.words || transcript.words.length === 0) {
    return [];
  }

  // Group words into segments (by sentence or time chunks)
  const segments: TranscriptSegment[] = [];
  let currentSegment: {
    text: string[];
    start: number;
    end: number;
    speaker: string | null;
    confidences: number[];
  } | null = null;

  for (const word of transcript.words) {
    if (!currentSegment) {
      currentSegment = {
        text: [word.text],
        start: word.start,
        end: word.end,
        speaker: word.speaker,
        confidences: [word.confidence],
      };
    } else if (
      word.speaker !== currentSegment.speaker ||
      word.start - currentSegment.end > 2000 // 2 second gap = new segment
    ) {
      // Push current segment and start new one
      segments.push({
        text: currentSegment.text.join(" "),
        start: currentSegment.start,
        end: currentSegment.end,
        speaker: currentSegment.speaker,
        confidence:
          currentSegment.confidences.reduce((a, b) => a + b, 0) /
          currentSegment.confidences.length,
      });

      currentSegment = {
        text: [word.text],
        start: word.start,
        end: word.end,
        speaker: word.speaker,
        confidences: [word.confidence],
      };
    } else {
      // Add to current segment
      currentSegment.text.push(word.text);
      currentSegment.end = word.end;
      currentSegment.confidences.push(word.confidence);
    }
  }

  // Don't forget the last segment
  if (currentSegment) {
    segments.push({
      text: currentSegment.text.join(" "),
      start: currentSegment.start,
      end: currentSegment.end,
      speaker: currentSegment.speaker,
      confidence:
        currentSegment.confidences.reduce((a, b) => a + b, 0) /
        currentSegment.confidences.length,
    });
  }

  return segments;
}

/**
 * Count unique speakers in the transcript
 */
function countUniqueSpeakers(segments: TranscriptSegment[]): number {
  const speakers = new Set(segments.map((s) => s.speaker).filter(Boolean));
  return speakers.size;
}

/**
 * Calculate average confidence score
 */
function calculateAverageConfidence(
  words: Array<{ confidence: number }>
): number {
  if (words.length === 0) return 0;
  const total = words.reduce((sum, word) => sum + word.confidence, 0);
  return total / words.length;
}

/**
 * Create a mock transcript for development/testing
 */
function createMockTranscript(transcriptId: string): AssemblyAITranscript {
  return {
    id: transcriptId,
    status: "completed",
    text: "Welcome to the podcast. Today we're discussing artificial intelligence and its impact on podcasting. [Speaker 1]: That's right, AI is transforming how we create content. [Speaker 2]: I couldn't agree more. Let me share some insights about transcription technology.",
    words: [
      { text: "Welcome", start: 0, end: 500, confidence: 0.98, speaker: "A" },
      { text: "to", start: 500, end: 600, confidence: 0.99, speaker: "A" },
      { text: "the", start: 600, end: 700, confidence: 0.99, speaker: "A" },
      { text: "podcast", start: 700, end: 1200, confidence: 0.97, speaker: "A" },
    ],
    utterances: [
      {
        text: "Welcome to the podcast. Today we're discussing artificial intelligence and its impact on podcasting.",
        start: 0,
        end: 5000,
        confidence: 0.96,
        speaker: "A",
      },
      {
        text: "That's right, AI is transforming how we create content.",
        start: 5500,
        end: 9000,
        confidence: 0.95,
        speaker: "B",
      },
      {
        text: "I couldn't agree more. Let me share some insights about transcription technology.",
        start: 9500,
        end: 14000,
        confidence: 0.94,
        speaker: "A",
      },
    ],
    audio_duration: 14,
    error: null,
  };
}

export default transcribeAudioTask;
