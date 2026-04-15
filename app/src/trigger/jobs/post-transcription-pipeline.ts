import { task, logger } from "@trigger.dev/sdk";
import type { Episode, ProcessingStep, TranscriptSegment, VocabularyTerm } from "@/types/database";
import { generateShowNotesTask, type ShowNotesResult } from "./generate-show-notes";
import { generateAssetsTask, type AssetsResult } from "./generate-assets";
import { getTriggerClient } from "@/lib/supabase/trigger-client";
import { analyzeSEO } from "@/lib/seo/analyzer";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";
import { saveProcessingResults } from "../lib/save-processing-results";
import {
  sendProcessingCompleteEmail,
  sendProcessingFailedEmail,
} from "@/lib/email/processing-notification";

/**
 * Input payload for the post-transcription pipeline.
 * Triggered by the AssemblyAI webhook after transcription completes.
 */
export interface PostTranscriptionPipelinePayload {
  episodeId: string;
  showId: string;
  transcript: string;
  segments: TranscriptSegment[];
  guestName?: string;
  guestBio?: string;
  /**
   * Optional audio duration (seconds). The webhook handler already writes
   * this to `episodes.audio_duration_seconds` before triggering us, so we
   * don't strictly need it — but passing it through lets the save helper
   * idempotently re-apply it on retries if the column ever gets wiped.
   */
  audioDurationSeconds?: number;
}

/**
 * Post-transcription pipeline task.
 *
 * Handles all processing steps after transcription is complete:
 * vocabulary correction -> show notes generation -> SEO analysis -> asset generation -> save results.
 *
 * This task is triggered by the AssemblyAI webhook handler when using webhook mode
 * (production). In polling mode (local dev), these same steps run inline within
 * the process-episode orchestrator.
 */
export const postTranscriptionPipelineTask = task({
  id: "post-transcription-pipeline",
  maxDuration: 1800, // 30 minutes for content generation pipeline
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 120000,
    factor: 2,
  },
  run: async (payload: PostTranscriptionPipelinePayload) => {
    const startTime = Date.now();
    const {
      episodeId,
      showId,
      transcript,
      segments,
      guestName,
      guestBio,
      audioDurationSeconds,
    } = payload;

    logger.info("Starting post-transcription pipeline", {
      episodeId,
      showId,
      transcriptLength: transcript.length,
      segmentCount: segments.length,
      audioDurationSeconds,
    });

    try {
      // Step 1: Vocabulary processing
      await updateEpisodeStatus(episodeId, "processing", "vocabulary_processing", 40);
      logger.info("Processing vocabulary", { episodeId, showId });

      const vocabularyTerms = await fetchVocabularyTerms(showId);
      const processedTranscript = await applyVocabularyCorrections(transcript, vocabularyTerms);

      // Step 2: Generate show notes with xAI Grok
      await updateEpisodeStatus(episodeId, "processing", "generating_show_notes", 50);
      logger.info("Generating show notes", { episodeId });

      const showNotesResult = await generateShowNotesTask.triggerAndWait({
        episodeId,
        transcript: processedTranscript,
        segments,
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

      // Step 3: SEO Analysis
      await updateEpisodeStatus(episodeId, "processing", "seo_analysis", 70);
      logger.info("Running SEO analysis", { episodeId });

      const seoAnalysis = await performSEOAnalysis(
        showNotesResult.output.showNotes,
        showNotesResult.output.showNotesHtml
      );

      // Step 4: Generate all content assets
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
        logger.warn("Continuing without all assets", { episodeId });
      }

      // Step 5: Save all results to database (shared helper — audio duration,
      // idempotent delete-before-insert, embeddings, Taddy enrichment all live here)
      const userId = await getEpisodeUserId(episodeId);

      await saveProcessingResults(episodeId, {
        transcript: processedTranscript,
        segments,
        showNotes: showNotesResult.output.showNotes,
        showNotesHtml: showNotesResult.output.showNotesHtml,
        schemaMarkup: showNotesResult.output.schemaMarkup,
        seoScore: seoAnalysis.score,
        seoAnalysis: seoAnalysis,
        viralMoments: showNotesResult.output.viralMoments,
        assets: assetsResult.ok ? assetsResult.output.assets : [],
        audioDurationSeconds,
        guestName,
        userId: userId ?? undefined,
      });

      // Step 6: Mark as completed
      await updateEpisodeStatus(episodeId, "completed", "completed", 100);

      // Step 7: Notify the user (email + webhooks).
      const assetCount = assetsResult.ok ? assetsResult.output.assets.length : 0;
      await notifySuccess(episodeId, showId, seoAnalysis.score, assetCount);

      const processingTimeMs = Date.now() - startTime;
      logger.info("Post-transcription pipeline completed", {
        episodeId,
        processingTimeMs,
        processingTimeMinutes: Math.round(processingTimeMs / 60000),
      });

      return {
        episodeId,
        showNotes: showNotesResult.output,
        assets: assetsResult.ok ? assetsResult.output : { assets: [] },
        processingTimeMs,
      };
    } catch (err) {
      // Any error that escapes the pipeline triggers a failure notification.
      // This mirrors process-episode.ts so both execution paths produce the
      // same observable outcome on failure (user gets an email + webhook).
      // We re-throw so Trigger.dev records the retry/failure normally.
      const message = err instanceof Error ? err.message : "Unknown processing error";
      logger.error("Post-transcription pipeline threw", { episodeId, message });
      // Best-effort failure notification — swallow its errors so we don't
      // hide the original pipeline error behind a delivery problem.
      await notifyFailure(episodeId, showId, message).catch(() => {});
      throw err;
    }
  },
});

// --- Shared utility functions ---

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

  for (const term of vocabularyTerms) {
    if (term.alternatives && term.alternatives.length > 0) {
      for (const alternative of term.alternatives) {
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

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
    logger.error("Failed to get user_id for webhook dispatch", {
      episodeId,
      error: error?.message,
    });
    return null;
  }

  // Supabase returns the joined relation as an object
  const shows = data.shows as unknown as { user_id: string } | null;
  return shows?.user_id ?? null;
}

/**
 * Look up the metadata we need to personalize the success/failure email.
 * Best-effort: returns null on any lookup failure and the caller just
 * skips the email.
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
 * Dispatch success notifications (email + webhooks). Fire-and-forget:
 * failures here must not turn a successful pipeline into a failed one.
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
 * Dispatch failure notifications (email + webhooks). Fire-and-forget.
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

export default postTranscriptionPipelineTask;
