import { task, logger } from "@trigger.dev/sdk";
import type { Episode, ProcessingStep, TranscriptSegment, VocabularyTerm } from "@/types/database";
import { generateShowNotesTask, type ShowNotesResult } from "./generate-show-notes";
import { generateAssetsTask, type AssetsResult } from "./generate-assets";
import { getTriggerClient } from "@/lib/supabase/trigger-client";
import { analyzeSEO } from "@/lib/seo/analyzer";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";

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
    const { episodeId, showId, transcript, segments, guestName, guestBio } = payload;

    logger.info("Starting post-transcription pipeline", {
      episodeId,
      showId,
      transcriptLength: transcript.length,
      segmentCount: segments.length,
    });

    // Step 1: Vocabulary processing
    await updateEpisodeStatus(episodeId, "processing", "vocabulary_processing", 40);
    logger.info("Processing vocabulary", { episodeId, showId });

    const vocabularyTerms = await fetchVocabularyTerms(showId);
    const processedTranscript = await applyVocabularyCorrections(
      transcript,
      vocabularyTerms
    );

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
      logger.error("Show notes generation failed", { episodeId, error: showNotesResult.error });
      await updateEpisodeStatus(episodeId, "failed", "failed", 0, "Show notes generation failed");

      // Dispatch webhook for failure
      const failUserId = await getEpisodeUserId(episodeId);
      if (failUserId) {
        dispatchWebhooks(failUserId, {
          event: "episode.failed",
          timestamp: new Date().toISOString(),
          data: { episodeId, showId, reason: "Show notes generation failed" },
        }, getTriggerClient()).catch(() => {});
      }

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

    // Step 5: Save all results to database
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
    });

    // Step 6: Mark as completed
    await updateEpisodeStatus(episodeId, "completed", "completed", 100);

    // Dispatch webhook for completion
    const completionUserId = await getEpisodeUserId(episodeId);
    if (completionUserId) {
      dispatchWebhooks(completionUserId, {
        event: "episode.completed",
        timestamp: new Date().toISOString(),
        data: {
          episodeId,
          showId,
          seoScore: seoAnalysis.score,
          assetCount: assetsResult.ok ? assetsResult.output.assets.length : 0,
        },
      }, getTriggerClient()).catch(() => {});
    }

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
  },
});

// --- Shared utility functions (same logic as process-episode.ts) ---

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

async function performSEOAnalysis(showNotes: string, showNotesHtml?: string): Promise<{
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
    suggestions: analysis.suggestions.map(s => s.description),
    estimated_position: null,
  };
}

async function saveProcessingResults(
  episodeId: string,
  results: {
    transcript: string;
    segments: TranscriptSegment[];
    showNotes: string;
    showNotesHtml: string;
    schemaMarkup: Record<string, unknown>;
    seoScore: number;
    seoAnalysis: Record<string, unknown>;
    viralMoments: ShowNotesResult["viralMoments"];
    assets: AssetsResult["assets"];
  }
): Promise<void> {
  const supabase = getTriggerClient();

  logger.info("Saving processing results", {
    episodeId,
    transcriptLength: results.transcript.length,
    assetsCount: results.assets.length,
  });

  const { error: episodeError } = await supabase
    .from("episodes")
    .update({
      transcript: results.transcript,
      transcript_segments: results.segments,
      show_notes: results.showNotes,
      show_notes_html: results.showNotesHtml,
      schema_markup: results.schemaMarkup,
      seo_score: results.seoScore,
      seo_analysis: results.seoAnalysis,
      viral_moments: results.viralMoments,
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId);

  if (episodeError) {
    logger.error("Failed to update episode", { episodeId, error: episodeError.message });
    throw new Error(`Failed to save episode: ${episodeError.message}`);
  }

  if (results.assets.length > 0) {
    const assetsToInsert = results.assets.map((asset) => ({
      episode_id: episodeId,
      asset_type: asset.assetType,
      content: asset.content,
      metadata: asset.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: assetsError } = await supabase
      .from("generated_assets")
      .insert(assetsToInsert);

    if (assetsError) {
      logger.error("Failed to insert assets", { episodeId, error: assetsError.message });
    } else {
      logger.info("Assets saved", { episodeId, count: results.assets.length });
    }
  }

  if (results.segments.length > 0) {
    const sectionsToInsert = results.segments.map((segment) => ({
      episode_id: episodeId,
      content: segment.text,
      start_time: segment.start,
      end_time: segment.end,
      speaker: segment.speaker || null,
      metadata: {},
      created_at: new Date().toISOString(),
    }));

    const { error: sectionsError } = await supabase
      .from("episode_sections")
      .insert(sectionsToInsert);

    if (sectionsError) {
      logger.error("Failed to insert sections", { episodeId, error: sectionsError.message });
    } else {
      logger.info("Sections saved", { episodeId, count: results.segments.length });
    }
  }

  logger.info("Processing results saved successfully", { episodeId });
}

/**
 * Look up the user_id for an episode via its parent show.
 * Returns null if the lookup fails (the webhook dispatch is best-effort).
 */
async function getEpisodeUserId(episodeId: string): Promise<string | null> {
  const supabase = getTriggerClient();
  const { data, error } = await supabase
    .from("episodes")
    .select("shows(user_id)")
    .eq("id", episodeId)
    .single();

  if (error || !data) {
    logger.error("Failed to get user_id for webhook dispatch", { episodeId, error: error?.message });
    return null;
  }

  // Supabase returns the joined relation as an object
  const shows = data.shows as unknown as { user_id: string } | null;
  return shows?.user_id ?? null;
}

export default postTranscriptionPipelineTask;
