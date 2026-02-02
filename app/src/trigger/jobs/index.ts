/**
 * PodBrain Trigger.dev Jobs
 *
 * This file exports all background jobs for the episode processing pipeline.
 * These jobs are automatically discovered by Trigger.dev based on the
 * configuration in trigger.config.ts
 */

// Main orchestrator job
export {
  processEpisodeTask,
  type ProcessEpisodePayload,
  type ProcessEpisodeResult,
  type ProcessingProgress,
} from "./process-episode";

// Individual processing jobs
export {
  transcribeAudioTask,
  type TranscribeAudioPayload,
  type TranscriptionResult,
} from "./transcribe-audio";

export {
  generateShowNotesTask,
  type GenerateShowNotesPayload,
  type ShowNotesResult,
} from "./generate-show-notes";

export {
  generateAssetsTask,
  generateSingleAssetTask,
  type GenerateAssetsPayload,
  type AssetsResult,
  type GeneratedAssetOutput,
} from "./generate-assets";
