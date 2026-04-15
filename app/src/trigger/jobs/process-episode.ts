import { task, logger } from "@trigger.dev/sdk";
import type { Episode, ProcessingStep, VocabularyTerm } from "@/types/database";
import { transcribeAudioTask, type TranscriptionResult } from "./transcribe-audio";
import { generateShowNotesTask, type ShowNotesResult } from "./generate-show-notes";
import { generateAssetsTask, type AssetsResult } from "./generate-assets";
import { getTriggerClient } from "@/lib/supabase/trigger-client";
import { analyzeSEO } from "@/lib/seo/analyzer";
import { saveProcessingResults } from "../lib/save-processing-results";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";
import {
  sendProcessingCompleteEmail,
  sendProcessingFailedEmail,
} from "@/lib/email/processing-notification";

/**
 * Input payload for the process-episode job
 */
export interface ProcessEpisodePayload {
  episodeId: string;
  audioUrl: string;
  showId: string;
  language?: string;
  guestName?: string;
  guestBio?: string;
}

/**
 * Result of the complete episode processing pipeline
 */
export interface ProcessEpisodeResult {
  episodeId: string;
  transcription: TranscriptionResult;
  showNotes: ShowNotesResult;
  assets: AssetsResult;
  processingTimeMs: number;
}

/**
 * Progress update structure for status tracking
 */
export interface ProcessingProgress {
  step: ProcessingStep;
  progress: number;
  message: string;
}

/**
 * Main episode processing task
 * Orchestrates the complete pipeline: upload -> transcribe -> vocabulary -> content -> complete
 */
export const processEpisodeTask = task({
  id: "process-episode",
  // Max duration of 30 minutes for long podcasts
  maxDuration: 1800,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 120000,
    factor: 2,
  },
  run: async (payload: ProcessEpisodePayload) => {
    const startTime = Date.now();
    const { episodeId, audioUrl, showId, language, guestName, guestBio } = payload;

    logger.info("Starting episode processing", { episodeId, audioUrl, showId });

    try {
      // Step 1: Update status to processing
      await updateEpisodeStatus(episodeId, "processing", "uploading", 0);

      // Step 2: Transcribe audio with AssemblyAI
      logger.info("Starting transcription", { episodeId });
      await updateEpisodeStatus(episodeId, "processing", "transcribing", 10);

      const transcriptionResult = await transcribeAudioTask.triggerAndWait({
        episodeId,
        audioUrl,
        language: language || "en",
        speakerLabels: true,
      });

      if (!transcriptionResult.ok) {
        logger.error("Transcription failed", { episodeId, error: transcriptionResult.error });
        await updateEpisodeStatus(episodeId, "failed", "failed", 0, "Transcription failed");
        await notifyFailure(episodeId, showId, "Transcription failed");
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      }

      // --- WEBHOOK MODE ---
      // When using webhooks (production), the transcription task returns immediately
      // with status 'webhook_pending'. The remaining pipeline steps are handled by
      // the AssemblyAI webhook handler (/api/webhooks/assemblyai) which triggers
      // the postTranscriptionPipelineTask when the transcript is ready.
      if (transcriptionResult.output.status === "webhook_pending") {
        logger.info(
          "Transcription submitted with webhook callback, pipeline will continue asynchronously",
          {
            episodeId,
            transcriptId: transcriptionResult.output.transcriptId,
          }
        );

        return {
          episodeId,
          transcription: transcriptionResult.output,
          showNotes: {
            showNotes: "",
            showNotesHtml: "",
            schemaMarkup: {},
            summary: "",
            keyTopics: [],
            timestamps: [],
            viralMoments: [],
          } as unknown as ShowNotesResult,
          assets: { assets: [] } as unknown as AssetsResult,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // --- POLLING MODE (local dev) ---
      // Transcription completed synchronously, continue with the pipeline.
      logger.info("Transcription completed", {
        episodeId,
        wordCount: transcriptionResult.output.transcript.split(" ").length,
        audioDurationSeconds: transcriptionResult.output.audioDurationSeconds,
      });

      // Step 3: Apply vocabulary processing
      await updateEpisodeStatus(episodeId, "processing", "vocabulary_processing", 40);
      logger.info("Processing vocabulary", { episodeId, showId });

      const vocabularyTerms = await fetchVocabularyTerms(showId);
      const processedTranscript = await applyVocabularyCorrections(
        transcriptionResult.output.transcript,
        vocabularyTerms
      );

      // Step 4: Generate show notes with xAI Grok
      await updateEpisodeStatus(episodeId, "processing", "generating_show_notes", 50);
      logger.info("Generating show notes", { episodeId });

      const showNotesResult = await generateShowNotesTask.triggerAndWait({
        episodeId,
        transcript: processedTranscript,
        segments: transcriptionResult.output.segments,
        guestName,
        guestBio,
      });

      if (!showNotesResult.ok) {
        logger.error("Show notes generation failed", {
          episodeId,
          error: showNotesResult.error,
        });
        await updateEpisodeStatus(episodeId, "failed", "failed", 0, "Show notes generation failed");
        await notifyFailure(episodeId, showId, "Show notes generation failed");
        throw new Error(`Show notes generation failed: ${showNotesResult.error}`);
      }

      logger.info("Show notes generated", { episodeId });

      // Step 5: SEO Analysis
      await updateEpisodeStatus(episodeId, "processing", "seo_analysis", 70);
      logger.info("Running SEO analysis", { episodeId });

      const seoAnalysis = await performSEOAnalysis(
        showNotesResult.output.showNotes,
        showNotesResult.output.showNotesHtml
      );

      // Step 6: Generate all content assets
      await updateEpisodeStatus(episodeId, "processing", "generating_assets", 80);
      logger.info("Generating content assets", { episodeId });

      const assetsResult = await generateAssetsTask.triggerAndWait({
        episodeId,
        transcript: processedTranscript,
        showNotes: showNotesResult.output.showNotes,
        guestName,
        viralMoments: showNotesResult.output.viralMoments,
      });

      if (!assetsResult.ok) {
        logger.error("Asset generation failed", { episodeId, error: assetsResult.error });
        // Assets are not critical - continue with warning
        logger.warn("Continuing without all assets", { episodeId });
      }

      // Step 7: Save all results to database (shared helper — audio duration,
      // idempotent delete-before-insert, embeddings, Taddy enrichment all live here)
      const userId = await getEpisodeUserId(episodeId);

      await saveProcessingResults(episodeId, {
        transcript: processedTranscript,
        segments: transcriptionResult.output.segments,
        showNotes: showNotesResult.output.showNotes,
        showNotesHtml: showNotesResult.output.showNotesHtml,
        schemaMarkup: showNotesResult.output.schemaMarkup,
        seoScore: seoAnalysis.score,
        seoAnalysis: seoAnalysis,
        viralMoments: showNotesResult.output.viralMoments,
        assets: assetsResult.ok ? assetsResult.output.assets : [],
        audioDurationSeconds: transcriptionResult.output.audioDurationSeconds,
        guestName,
        userId: userId ?? undefined,
      });

      // Step 8: Mark as completed
      await updateEpisodeStatus(episodeId, "completed", "completed", 100);

      // Step 9: Notify the user (email + webhooks). Fire-and-forget — a delivery
      // failure must not turn a successful pipeline into a failed one.
      const assetCount = assetsResult.ok ? assetsResult.output.assets.length : 0;
      await notifySuccess(episodeId, showId, seoAnalysis.score, assetCount);

      const processingTimeMs = Date.now() - startTime;
      logger.info("Episode processing completed", {
        episodeId,
        processingTimeMs,
        processingTimeMinutes: Math.round(processingTimeMs / 60000),
      });

      return {
        episodeId,
        transcription: transcriptionResult.output,
        showNotes: showNotesResult.output,
        assets: assetsResult.ok ? assetsResult.output : { assets: [] },
        processingTimeMs,
      };
    } catch (err) {
      // Any error that escapes the pipeline triggers a failure notification.
      // Re-throw so Trigger.dev can record the retry/failure.
      const message = err instanceof Error ? err.message : "Unknown processing error";
      logger.error("Episode processing threw", { episodeId, message });
      // Best-effort failure notification (may have already been sent by a
      // specific step above; both emails go to the same address so worst
      // case the user sees a duplicate).
      await notifyFailure(episodeId, showId, message).catch(() => {});
      throw err;
    }
  },
});

/**
 * Update episode status in the database
 */
async function updateEpisodeStatus(
  episodeId: string,
  status: Episode["status"],
  step: ProcessingStep,
  progress: number,
  errorMessage?: string
): Promise<void> {
  const supabase = getTriggerClient();

  logger.info("Status update", { episodeId, status, step, progress, errorMessage });

  const { error } = await supabase
    .from("episodes")
    .update({
      status,
      metadata: {
        processing_step: step,
        processing_progress: progress,
        ...(errorMessage && { error_message: errorMessage }),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId);

  if (error) {
    logger.error("Failed to update episode status", { episodeId, error: error.message });
  }
}

/**
 * Fetch vocabulary terms for the show
 */
async function fetchVocabularyTerms(showId: string): Promise<VocabularyTerm[]> {
  const supabase = getTriggerClient();

  logger.info("Fetching vocabulary terms", { showId });

  const { data, error } = await supabase
    .from("vocabulary_terms")
    .select("*")
    .eq("show_id", showId)
    .order("occurrence_count", { ascending: false })
    .limit(1000);

  if (error) {
    logger.error("Failed to fetch vocabulary terms", { showId, error: error.message });
    return [];
  }

  return (data || []) as VocabularyTerm[];
}

/**
 * Apply vocabulary corrections to transcript using pattern matching
 * Replaces known alternative spellings with correct terms
 */
async function applyVocabularyCorrections(
  transcript: string,
  vocabularyTerms: VocabularyTerm[]
): Promise<string> {
  if (vocabularyTerms.length === 0) {
    return transcript;
  }

  logger.info("Applying vocabulary corrections", {
    termCount: vocabularyTerms.length,
    transcriptLength: transcript.length,
  });

  let correctedTranscript = transcript;
  let correctionCount = 0;

  // Apply corrections for each vocabulary term with alternatives
  for (const term of vocabularyTerms) {
    if (term.alternatives && term.alternatives.length > 0) {
      for (const alternative of term.alternatives) {
        // Case-insensitive replacement while preserving word boundaries
        const regex = new RegExp(`\\b${escapeRegExp(alternative)}\\b`, "gi");
        const matches = correctedTranscript.match(regex);
        if (matches) {
          correctedTranscript = correctedTranscript.replace(regex, term.term);
          correctionCount += matches.length;
        }
      }
    }
  }

  logger.info("Vocabulary corrections applied", { correctionCount });

  return correctedTranscript;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Perform SEO analysis on the generated show notes
 */
async function performSEOAnalysis(
  showNotes: string,
  showNotesHtml?: string
): Promise<{
  score: number;
  keyword_density: Record<string, number>;
  readability_score: number;
  header_structure: boolean;
  suggestions: string[];
  estimated_position: number | null;
}> {
  logger.info("Performing SEO analysis", { showNotesLength: showNotes.length });

  // Use the real SEO analyzer
  const analysis = analyzeSEO(showNotes, showNotesHtml);

  return {
    score: analysis.overallScore,
    keyword_density: analysis.keywordDensityMap,
    readability_score: analysis.factors.readability.score,
    header_structure: analysis.factors.headerStructure.score >= 80,
    suggestions: analysis.suggestions.map((s) => s.description),
    estimated_position: null,
  };
}

/**
 * Look up the user_id for an episode via its parent show.
 * Returns null on failure — callers must treat it as best-effort.
 */
async function getEpisodeUserId(episodeId: string): Promise<string | null> {
  const supabase = getTriggerClient();
  const { data, error } = await supabase
    .from("episodes")
    .select("shows(user_id)")
    .eq("id", episodeId)
    .single();

  if (error || !data) {
    logger.error("Failed to get user_id", { episodeId, error: error?.message });
    return null;
  }

  const shows = data.shows as unknown as { user_id: string } | null;
  return shows?.user_id ?? null;
}

/**
 * Look up the metadata we need to personalize the success/failure email.
 * Returns null if any of the lookups fail — callers must treat it as
 * optional (the webhook dispatch still fires).
 *
 * Implementation note: we deliberately split this into two queries rather
 * than using a 3-deep PostgREST nested join (`shows(users(email))`).
 * The split form is clearer, produces more specific log messages when one
 * hop fails, and avoids subtle failure modes if the public.users row ever
 * gets out of sync with auth.users.
 */
async function getNotificationContext(episodeId: string): Promise<{
  userId: string;
  userEmail: string;
  episodeTitle: string;
  showName: string;
  appUrl: string;
} | null> {
  const supabase = getTriggerClient();

  // Query 1: episode title + show name + user_id (one FK hop)
  const { data: episode, error: episodeError } = await supabase
    .from("episodes")
    .select("title, shows(name, user_id)")
    .eq("id", episodeId)
    .single();

  if (episodeError || !episode) {
    logger.warn("Could not load notification context (episode lookup)", {
      episodeId,
      error: episodeError?.message,
    });
    return null;
  }

  const shows = episode.shows as unknown as
    | { name: string; user_id: string }
    | null;

  if (!shows?.user_id) {
    logger.warn("Episode has no parent show or show has no owner", { episodeId });
    return null;
  }

  // Query 2: user email from the public.users table (separate hop)
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("email")
    .eq("id", shows.user_id)
    .single();

  if (userError || !user?.email) {
    logger.warn("Could not load notification context (user lookup)", {
      episodeId,
      userId: shows.user_id,
      error: userError?.message,
    });
    return null;
  }

  return {
    userId: shows.user_id,
    userEmail: user.email,
    episodeTitle: (episode.title as string) || "Your episode",
    showName: shows.name || "your show",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://getpodbrain.ai",
  };
}

/**
 * Dispatch a success notification (email + webhooks). Fire-and-forget:
 * any failure here is logged and swallowed — a delivery problem must not
 * turn a successful pipeline into a failed one.
 */
async function notifySuccess(
  episodeId: string,
  showId: string,
  seoScore: number,
  assetCount: number
): Promise<void> {
  try {
    const ctx = await getNotificationContext(episodeId);
    if (!ctx) return;

    const episodeUrl = `${ctx.appUrl}/episodes/${episodeId}`;

    await sendProcessingCompleteEmail({
      to: ctx.userEmail,
      episodeTitle: ctx.episodeTitle,
      showName: ctx.showName,
      episodeUrl,
      assetCount,
    }).catch((err) => {
      logger.warn("Success email failed (non-fatal)", {
        episodeId,
        error: err instanceof Error ? err.message : "Unknown",
      });
    });

    dispatchWebhooks(
      ctx.userId,
      {
        event: "episode.completed",
        timestamp: new Date().toISOString(),
        data: {
          episodeId,
          showId,
          seoScore,
          assetCount,
        },
      },
      getTriggerClient()
    ).catch(() => {});
  } catch (err) {
    logger.warn("notifySuccess unexpected error (non-fatal)", {
      episodeId,
      error: err instanceof Error ? err.message : "Unknown",
    });
  }
}

/**
 * Dispatch a failure notification (email + webhooks). Fire-and-forget:
 * failures to deliver must not hide the original error from Trigger.dev.
 */
async function notifyFailure(
  episodeId: string,
  showId: string,
  errorMessage: string
): Promise<void> {
  try {
    const ctx = await getNotificationContext(episodeId);
    if (!ctx) return;

    const episodeUrl = `${ctx.appUrl}/episodes/${episodeId}`;

    await sendProcessingFailedEmail({
      to: ctx.userEmail,
      episodeTitle: ctx.episodeTitle,
      showName: ctx.showName,
      episodeUrl,
      errorMessage,
    }).catch((err) => {
      logger.warn("Failure email failed (non-fatal)", {
        episodeId,
        error: err instanceof Error ? err.message : "Unknown",
      });
    });

    dispatchWebhooks(
      ctx.userId,
      {
        event: "episode.failed",
        timestamp: new Date().toISOString(),
        data: {
          episodeId,
          showId,
          reason: errorMessage,
        },
      },
      getTriggerClient()
    ).catch(() => {});
  } catch (err) {
    logger.warn("notifyFailure unexpected error (non-fatal)", {
      episodeId,
      error: err instanceof Error ? err.message : "Unknown",
    });
  }
}

export default processEpisodeTask;
