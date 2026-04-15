/**
 * Shared persistence layer for the episode processing pipeline.
 *
 * This helper consolidates the end-of-pipeline DB writes that used to be
 * duplicated between `process-episode.ts` (polling mode / local dev) and
 * `post-transcription-pipeline.ts` (webhook mode / production). Keeping the
 * logic in one place means the two execution paths cannot drift — a fix
 * applied here is applied to both modes automatically.
 *
 * Fixes the following bugs the first E2E run exposed:
 *
 *   BUG #4 — `episodes.audio_duration_seconds` was never written in polling
 *            mode (the webhook path writes it, but the polling path didn't).
 *            We now accept an optional `audioDurationSeconds` and include it
 *            in the episodes UPDATE when present.
 *
 *   BUG #5 — On a Trigger.dev retry, `saveProcessingResults` called plain
 *            `.insert()` on `generated_assets` and `episode_sections` without
 *            first clearing the previous attempt's rows, causing duplicate
 *            assets and duplicate segments. We now DELETE existing rows for
 *            the episode before inserting, making the helper fully idempotent.
 *
 *   GAP  — `generateEmbeddings()` from `cross-episode/embeddings.ts` was
 *          never called from the pipeline, so `episode_sections.embedding`
 *          was always NULL and semantic search across the episode never
 *          worked. We now generate a 1536-dim xAI embedding per segment
 *          (sequentially, with a 100ms delay between calls to stay well
 *          under xAI's rate limits) and persist it alongside each row.
 *          Individual embedding failures degrade gracefully to NULL — we
 *          never block the pipeline on a flaky embedding call.
 *
 * Error policy:
 *   - Episode UPDATE failure → throw (causes Trigger.dev retry; this write
 *     is the critical one and the user will see a broken episode otherwise)
 *   - Any other failure (asset delete/insert, section delete/insert,
 *     embedding, guest enrichment) → log and continue. These are non-critical
 *     and should never turn a mostly-successful run into a full failure.
 */

import { logger } from "@trigger.dev/sdk";
import type { TranscriptSegment, ViralMoment, AssetType } from "@/types/database";
import { getTriggerClient } from "@/lib/supabase/trigger-client";
import { generateEmbeddings } from "@/lib/cross-episode/embeddings";
import { enrichGuestFromTaddy } from "./guest-enrichment";

/** Shape of an already-generated asset ready for persistence. */
export interface SaveableAsset {
  assetType: AssetType;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input for `saveProcessingResults`. Everything except the new optional
 * fields matches the old local `saveProcessingResults` signatures in
 * `process-episode.ts` and `post-transcription-pipeline.ts`.
 */
export interface SaveProcessingResultsInput {
  transcript: string;
  segments: TranscriptSegment[];
  showNotes: string;
  showNotesHtml: string;
  schemaMarkup: Record<string, unknown>;
  seoScore: number;
  seoAnalysis: Record<string, unknown>;
  viralMoments: ViralMoment[];
  assets: SaveableAsset[];

  /**
   * Audio duration in seconds (from AssemblyAI). Optional so the
   * webhook-mode path can omit it (the webhook handler already writes
   * `audio_duration_seconds` directly to the episode row before this
   * helper runs). Polling mode MUST pass it.
   */
  audioDurationSeconds?: number;

  /**
   * Optional guest name. Used only to trigger fire-and-forget Taddy
   * enrichment. Safe to omit.
   */
  guestName?: string;

  /**
   * Optional user_id. Used only for Taddy guest enrichment so rows are
   * attributed correctly. If omitted, Taddy enrichment is skipped.
   */
  userId?: string;
}

const EMBEDDING_CALL_DELAY_MS = 100;

/**
 * Pause for the given number of milliseconds. Used to rate-limit sequential
 * xAI embedding calls so we never burst past the API's per-second budget.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Persist the full processing pipeline output for an episode.
 * Safe to call more than once for the same episode (e.g. on Trigger.dev retries).
 */
export async function saveProcessingResults(
  episodeId: string,
  results: SaveProcessingResultsInput
): Promise<void> {
  const supabase = getTriggerClient();

  logger.info("Saving processing results", {
    episodeId,
    transcriptLength: results.transcript.length,
    segmentCount: results.segments.length,
    assetsCount: results.assets.length,
    hasAudioDuration: typeof results.audioDurationSeconds === "number",
    hasGuestName: !!results.guestName,
  });

  // ─── 1. Idempotent cleanup ────────────────────────────────────────────
  // Delete any rows left over from a previous attempt at this episode.
  // Retries happen either because Trigger.dev is retrying the task or
  // because the user manually retried processing. Without these deletes
  // we accumulate duplicate assets/sections on every retry.

  const { error: sectionDeleteError } = await supabase
    .from("episode_sections")
    .delete()
    .eq("episode_id", episodeId);

  if (sectionDeleteError) {
    logger.error("Failed to clear previous episode_sections (continuing)", {
      episodeId,
      error: sectionDeleteError.message,
    });
  }

  const { error: assetDeleteError } = await supabase
    .from("generated_assets")
    .delete()
    .eq("episode_id", episodeId);

  if (assetDeleteError) {
    logger.error("Failed to clear previous generated_assets (continuing)", {
      episodeId,
      error: assetDeleteError.message,
    });
  }

  // ─── 2. Update the episodes row ────────────────────────────────────────
  // This is the only operation that will `throw` on failure — if the
  // episode itself can't be updated, the whole pipeline result is
  // unusable and the task should retry.

  const episodeUpdate: Record<string, unknown> = {
    transcript: results.transcript,
    transcript_segments: results.segments,
    show_notes: results.showNotes,
    show_notes_html: results.showNotesHtml,
    schema_markup: results.schemaMarkup,
    seo_score: results.seoScore,
    seo_analysis: results.seoAnalysis,
    viral_moments: results.viralMoments,
    updated_at: new Date().toISOString(),
  };

  if (typeof results.audioDurationSeconds === "number") {
    // Use Math.ceil to match the AssemblyAI webhook handler's initial
    // write (see `app/src/app/api/webhooks/assemblyai/route.ts`). Both
    // call sites MUST produce identical integer values, otherwise a
    // Trigger.dev retry would alternately write `Math.round()` and
    // `Math.ceil()` values differing by up to 1 second, which looks like
    // a bug to anyone auditing the episode row. Math.ceil is also the
    // safer direction for tier-limit enforcement (slight over-estimate
    // of audio minutes used).
    episodeUpdate.audio_duration_seconds = Math.ceil(results.audioDurationSeconds);
  }

  const { error: episodeError } = await supabase
    .from("episodes")
    .update(episodeUpdate)
    .eq("id", episodeId);

  if (episodeError) {
    logger.error("Failed to update episode", { episodeId, error: episodeError.message });
    throw new Error(`Failed to save episode: ${episodeError.message}`);
  }

  // ─── 3. Insert generated assets ────────────────────────────────────────

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
      // Don't throw — assets are non-critical and the user can regenerate
    } else {
      logger.info("Assets saved", { episodeId, count: results.assets.length });
    }
  }

  // ─── 4. Generate embeddings per segment, then bulk insert sections ────
  // Embeddings power cross-episode similarity, viral moment surfacing, and
  // in-episode semantic search. We do them sequentially with a 100ms gap
  // to stay comfortably under xAI's per-second rate limit. A long episode
  // with 200 segments will spend ~20s in this loop which is cheap relative
  // to the 30+ seconds already spent on transcription and show-notes gen.

  if (results.segments.length > 0) {
    logger.info("Generating segment embeddings", {
      episodeId,
      segmentCount: results.segments.length,
    });

    const sectionRows: Array<{
      episode_id: string;
      content: string;
      start_time: number;
      end_time: number;
      speaker: string | null;
      embedding: number[] | null;
      metadata: Record<string, unknown>;
      created_at: string;
    }> = [];

    let embeddingSuccessCount = 0;
    let embeddingFailureCount = 0;

    for (const segment of results.segments) {
      let embedding: number[] | null = null;

      // Skip empty segments entirely — embeddings endpoints reject empty
      // strings and there's nothing to search on anyway.
      const content = (segment.text || "").trim();
      if (content.length > 0) {
        try {
          embedding = await generateEmbeddings(content);
          embeddingSuccessCount += 1;
        } catch (err) {
          embeddingFailureCount += 1;
          logger.warn("Embedding generation failed for segment (storing NULL)", {
            episodeId,
            start: segment.start,
            error: err instanceof Error ? err.message : "Unknown",
          });
        }
      }

      sectionRows.push({
        episode_id: episodeId,
        content: segment.text,
        start_time: segment.start,
        end_time: segment.end,
        speaker: segment.speaker || null,
        embedding,
        metadata: {},
        created_at: new Date().toISOString(),
      });

      // Rate-limit sequential xAI calls. Only delay if we actually made a
      // request — empty-segment path should fall through immediately.
      if (content.length > 0) {
        await delay(EMBEDDING_CALL_DELAY_MS);
      }
    }

    logger.info("Segment embeddings generated", {
      episodeId,
      successCount: embeddingSuccessCount,
      failureCount: embeddingFailureCount,
    });

    const { error: sectionsError } = await supabase
      .from("episode_sections")
      .insert(sectionRows);

    if (sectionsError) {
      logger.error("Failed to insert episode_sections", {
        episodeId,
        error: sectionsError.message,
      });
      // Don't throw — semantic search is non-critical to the show-notes delivery
    } else {
      logger.info("Episode sections saved", {
        episodeId,
        count: sectionRows.length,
      });
    }
  }

  // ─── 5. Fire-and-forget Taddy guest enrichment ────────────────────────
  // If we know the guest's name and the user who owns this episode, ask
  // Taddy about their other podcast appearances and cache the results.
  // This is pure best-effort: we never block the pipeline on it and any
  // failure is swallowed inside `enrichGuestFromTaddy`.

  if (results.guestName && results.userId) {
    enrichGuestFromTaddy({
      guestName: results.guestName,
      userId: results.userId,
      episodeId,
    }).catch((err) => {
      logger.warn("Taddy guest enrichment failed (non-fatal)", {
        episodeId,
        guestName: results.guestName,
        error: err instanceof Error ? err.message : "Unknown",
      });
    });
  }

  logger.info("Processing results saved successfully", { episodeId });
}
