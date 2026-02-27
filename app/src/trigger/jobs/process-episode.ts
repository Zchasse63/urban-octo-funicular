import { task, logger } from "@trigger.dev/sdk";
import type { Episode, ProcessingStep, VocabularyTerm } from "@/types/database";
import { transcribeAudioTask, type TranscriptionResult } from "./transcribe-audio";
import { generateShowNotesTask, type ShowNotesResult } from "./generate-show-notes";
import { generateAssetsTask, type AssetsResult } from "./generate-assets";
import { getTriggerClient } from "@/lib/supabase/trigger-client";
import { analyzeSEO } from "@/lib/seo/analyzer";

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
      throw new Error(`Transcription failed: ${transcriptionResult.error}`);
    }

    // --- WEBHOOK MODE ---
    // When using webhooks (production), the transcription task returns immediately
    // with status 'webhook_pending'. The remaining pipeline steps are handled by
    // the AssemblyAI webhook handler (/api/webhooks/assemblyai) which triggers
    // the postTranscriptionPipelineTask when the transcript is ready.
    if (transcriptionResult.output.status === "webhook_pending") {
      logger.info("Transcription submitted with webhook callback, pipeline will continue asynchronously", {
        episodeId,
        transcriptId: transcriptionResult.output.transcriptId,
      });

      return {
        episodeId,
        transcription: transcriptionResult.output,
        showNotes: { showNotes: "", showNotesHtml: "", schemaMarkup: {}, summary: "", keyTopics: [], timestamps: [], viralMoments: [] } as unknown as ShowNotesResult,
        assets: { assets: [] } as unknown as AssetsResult,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // --- POLLING MODE (local dev) ---
    // Transcription completed synchronously, continue with the pipeline.
    logger.info("Transcription completed", {
      episodeId,
      wordCount: transcriptionResult.output.transcript.split(" ").length,
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
      logger.error("Show notes generation failed", { episodeId, error: showNotesResult.error });
      await updateEpisodeStatus(episodeId, "failed", "failed", 0, "Show notes generation failed");
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

    // Step 7: Save all results to database
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
    });

    // Step 8: Mark as completed
    await updateEpisodeStatus(episodeId, "completed", "completed", 100);

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
async function performSEOAnalysis(showNotes: string, showNotesHtml?: string): Promise<{
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
    suggestions: analysis.suggestions.map(s => s.description),
    estimated_position: null,
  };
}

/**
 * Save all processing results to the database
 */
async function saveProcessingResults(
  episodeId: string,
  results: {
    transcript: string;
    segments: TranscriptionResult["segments"];
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

  // 1. Update the episode record with all processing results
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

  // 2. Insert generated assets
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
      // Don't throw - assets are not critical
    } else {
      logger.info("Assets saved", { episodeId, count: results.assets.length });
    }
  }

  // 3. Create episode sections for semantic search
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
      // Don't throw - sections are not critical for basic functionality
    } else {
      logger.info("Sections saved", { episodeId, count: results.segments.length });
    }
  }

  logger.info("Processing results saved successfully", { episodeId });
}

export default processEpisodeTask;
