import { task, logger, wait } from "@trigger.dev/sdk";
import type { Episode, ProcessingStep, VocabularyTerm } from "@/types/database";
import { transcribeAudioTask, type TranscriptionResult } from "./transcribe-audio";
import { generateShowNotesTask, type ShowNotesResult } from "./generate-show-notes";
import { generateAssetsTask, type AssetsResult } from "./generate-assets";

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

    const seoAnalysis = await performSEOAnalysis(showNotesResult.output.showNotes);

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
  // TODO: Implement Supabase update
  // This will be implemented when Supabase client is set up
  logger.info("Status update", { episodeId, status, step, progress, errorMessage });

  // Placeholder for database update
  // const { error } = await supabase
  //   .from("episodes")
  //   .update({
  //     status,
  //     metadata: {
  //       processing_step: step,
  //       processing_progress: progress,
  //       ...(errorMessage && { error_message: errorMessage }),
  //     },
  //     updated_at: new Date().toISOString(),
  //   })
  //   .eq("id", episodeId);
}

/**
 * Fetch vocabulary terms for the show
 */
async function fetchVocabularyTerms(showId: string): Promise<VocabularyTerm[]> {
  // TODO: Implement Supabase fetch
  logger.info("Fetching vocabulary terms", { showId });

  // Placeholder - will return terms from database
  // const { data, error } = await supabase
  //   .from("vocabulary_terms")
  //   .select("*")
  //   .eq("show_id", showId)
  //   .order("occurrence_count", { ascending: false });

  return [];
}

/**
 * Apply vocabulary corrections to transcript using LLM post-processing
 */
async function applyVocabularyCorrections(
  transcript: string,
  vocabularyTerms: VocabularyTerm[]
): Promise<string> {
  if (vocabularyTerms.length === 0) {
    return transcript;
  }

  // TODO: Implement vocabulary correction with xAI Grok
  // This will use the vocabulary terms to correct common misheard words
  logger.info("Applying vocabulary corrections", {
    termCount: vocabularyTerms.length,
    transcriptLength: transcript.length,
  });

  // For now, return the transcript unchanged
  // In production, this will use fuzzy matching and LLM post-processing
  return transcript;
}

/**
 * Perform SEO analysis on the generated show notes
 */
async function performSEOAnalysis(showNotes: string): Promise<{
  score: number;
  keyword_density: Record<string, number>;
  readability_score: number;
  header_structure: boolean;
  suggestions: string[];
  estimated_position: number | null;
}> {
  // TODO: Import and use the SEO analyzer
  logger.info("Performing SEO analysis", { showNotesLength: showNotes.length });

  // Placeholder SEO analysis
  // Will be replaced with actual analyzer from src/lib/seo/analyzer.ts
  return {
    score: 75,
    keyword_density: {},
    readability_score: 80,
    header_structure: true,
    suggestions: ["Add more internal links", "Include a call-to-action"],
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
  // TODO: Implement Supabase update
  logger.info("Saving processing results", {
    episodeId,
    transcriptLength: results.transcript.length,
    assetsCount: results.assets.length,
  });

  // Placeholder for database update
  // This will:
  // 1. Update the episode record with transcript, show_notes, etc.
  // 2. Insert generated_assets records
  // 3. Create episode_sections for semantic search
}

export default processEpisodeTask;
