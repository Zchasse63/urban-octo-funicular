import { tasks, runs } from "@trigger.dev/sdk";
import {
  processEpisodeTask,
  type ProcessEpisodePayload,
  type ProcessEpisodeResult,
} from "@/trigger/jobs/process-episode";
import {
  transcribeAudioTask,
  type TranscribeAudioPayload,
  type TranscriptionResult,
} from "@/trigger/jobs/transcribe-audio";
import {
  generateShowNotesTask,
  type GenerateShowNotesPayload,
  type ShowNotesResult,
} from "@/trigger/jobs/generate-show-notes";
import {
  generateAssetsTask,
  generateSingleAssetTask,
  type GenerateAssetsPayload,
  type AssetsResult,
} from "@/trigger/jobs/generate-assets";
import {
  postTranscriptionPipelineTask,
  type PostTranscriptionPipelinePayload,
} from "@/trigger/jobs/post-transcription-pipeline";
import type { AssetType } from "@/types/database";

/**
 * Run status for tracking job progress
 */
export interface RunStatus {
  id: string;
  status: "PENDING" | "EXECUTING" | "COMPLETED" | "FAILED" | "CANCELED";
  createdAt: Date;
  updatedAt: Date;
  output?: unknown;
  error?: string;
}

/**
 * Trigger the main episode processing pipeline
 * This is the primary entry point for processing a new episode
 */
export async function triggerEpisodeProcessing(
  payload: ProcessEpisodePayload
): Promise<{ runId: string }> {
  const handle = await processEpisodeTask.trigger(payload, {
    tags: [`episode:${payload.episodeId}`, `show:${payload.showId}`],
    idempotencyKey: `process-episode-${payload.episodeId}`,
  });

  return { runId: handle.id };
}

/**
 * Trigger audio transcription only
 * Useful for re-transcribing or debugging
 */
export async function triggerTranscription(
  payload: TranscribeAudioPayload
): Promise<{ runId: string }> {
  const handle = await transcribeAudioTask.trigger(payload, {
    tags: [`episode:${payload.episodeId}`, "transcription"],
    idempotencyKey: `transcribe-${payload.episodeId}`,
  });

  return { runId: handle.id };
}

/**
 * Trigger the post-transcription processing pipeline.
 * Called by the AssemblyAI webhook handler when a transcription completes.
 * Runs vocabulary processing, show notes generation, SEO analysis, and asset generation.
 */
export async function triggerPostTranscriptionPipeline(
  payload: PostTranscriptionPipelinePayload
): Promise<{ runId: string }> {
  const handle = await postTranscriptionPipelineTask.trigger(payload, {
    tags: [`episode:${payload.episodeId}`, `show:${payload.showId}`, "post-transcription"],
    idempotencyKey: `post-transcription-${payload.episodeId}-${Date.now()}`,
  });

  return { runId: handle.id };
}

/**
 * Trigger show notes generation only
 * Useful for regenerating show notes with different settings
 */
export async function triggerShowNotesGeneration(
  payload: GenerateShowNotesPayload
): Promise<{ runId: string }> {
  const handle = await generateShowNotesTask.trigger(payload, {
    tags: [`episode:${payload.episodeId}`, "show-notes"],
    idempotencyKey: `show-notes-${payload.episodeId}-${Date.now()}`,
  });

  return { runId: handle.id };
}

/**
 * Trigger all asset generation
 * Generates all content assets for an episode
 */
export async function triggerAssetGeneration(
  payload: GenerateAssetsPayload
): Promise<{ runId: string }> {
  const handle = await generateAssetsTask.trigger(payload, {
    tags: [`episode:${payload.episodeId}`, "assets"],
    idempotencyKey: `assets-${payload.episodeId}-${Date.now()}`,
  });

  return { runId: handle.id };
}

/**
 * Trigger single asset generation
 * Regenerates a specific asset type
 */
export async function triggerSingleAssetGeneration(payload: {
  episodeId: string;
  assetType: AssetType;
  transcript: string;
  showNotes: string;
  guestName?: string;
}): Promise<{ runId: string }> {
  const handle = await generateSingleAssetTask.trigger(payload, {
    tags: [`episode:${payload.episodeId}`, `asset:${payload.assetType}`],
    idempotencyKey: `asset-${payload.episodeId}-${payload.assetType}-${Date.now()}`,
  });

  return { runId: handle.id };
}

/**
 * Get the status of a specific run
 */
export async function getRunStatus(runId: string): Promise<RunStatus | null> {
  try {
    const run = await runs.retrieve(runId);

    return {
      id: run.id,
      status: run.status as RunStatus["status"],
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      output: run.output,
      error: run.error?.message,
    };
  } catch (error) {
    console.error("Failed to retrieve run status:", error);
    return null;
  }
}

/**
 * Cancel a running job
 */
export async function cancelRun(runId: string): Promise<boolean> {
  try {
    await runs.cancel(runId);
    return true;
  } catch (error) {
    console.error("Failed to cancel run:", error);
    return false;
  }
}

/**
 * Replay a failed run with the same payload
 */
export async function replayRun(runId: string): Promise<{ newRunId: string } | null> {
  try {
    const result = await runs.replay(runId);
    return { newRunId: result.id };
  } catch (error) {
    console.error("Failed to replay run:", error);
    return null;
  }
}

/**
 * Get all runs for a specific episode
 */
export async function getEpisodeRuns(episodeId: string): Promise<RunStatus[]> {
  try {
    const episodeRuns = await runs.list({
      tag: `episode:${episodeId}`,
      limit: 50,
    });

    return episodeRuns.data.map((run) => ({
      id: run.id,
      status: run.status as RunStatus["status"],
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      output: undefined, // List doesn't include output
      error: undefined,
    }));
  } catch (error) {
    console.error("Failed to retrieve episode runs:", error);
    return [];
  }
}

/**
 * Batch trigger processing for multiple episodes
 * Useful for bulk operations
 */
export async function triggerBatchProcessing(
  episodes: ProcessEpisodePayload[]
): Promise<{ runIds: string[] }> {
  const runIds: string[] = [];

  // Trigger each episode individually for batch processing
  // This maintains consistent error handling per episode
  for (const payload of episodes) {
    const handle = await processEpisodeTask.trigger(payload, {
      tags: [`episode:${payload.episodeId}`, `show:${payload.showId}`, "batch"],
      idempotencyKey: `process-episode-${payload.episodeId}`,
    });
    runIds.push(handle.id);
  }

  return { runIds };
}

// Export types for external use
export type {
  ProcessEpisodePayload,
  ProcessEpisodeResult,
  TranscribeAudioPayload,
  TranscriptionResult,
  GenerateShowNotesPayload,
  ShowNotesResult,
  GenerateAssetsPayload,
  AssetsResult,
  PostTranscriptionPipelinePayload,
};
