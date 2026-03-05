import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isValidUUID } from "@/lib/auth";
import { errorResponse, successResponse, handleApiError } from "@/lib/api/helpers";
import { rateLimitByIP } from "@/lib/rate-limit";
import {
  triggerEpisodeProcessing,
  getRunStatus,
  cancelRun,
  replayRun,
  type ProcessEpisodePayload,
} from "@/lib/trigger/client";

interface ProcessingResponse {
  runId: string;
  episodeId: string;
  status: string;
  message: string;
}

interface RunStatusResponse {
  runId: string;
  status: string;
  processingStep?: string;
  processingProgress?: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

/**
 * POST /api/episodes/[id]/process
 * Trigger episode processing pipeline
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit: 10 processing requests per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await rateLimitByIP(ip, 10);
    if (!rateLimit.success) {
      return NextResponse.json(
        { data: null, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse("Invalid ID format", 400);
    }

    const supabase = await createClient();

    // Fetch the episode to get required data
    const { data: episode, error: fetchError } = await supabase
      .from("episodes")
      .select(
        `
        *,
        shows!inner(id, user_id, name)
      `
      )
      .eq("id", episodeId)
      .eq("shows.user_id", userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse("Episode not found", 404);
    }

    // Don't allow processing if already in progress
    if (episode.status === "processing") {
      return errorResponse("Episode is already being processed", 409);
    }

    // Don't allow processing if no audio URL
    if (!episode.audio_url) {
      return errorResponse("Episode has no audio file", 400);
    }

    // ── Atomic status transition to prevent TOCTOU race ──
    // Two concurrent requests could both pass the status check above.
    // This atomic UPDATE with a WHERE clause on status ensures only ONE
    // request succeeds — the second will find 0 rows matched and bail out.
    const { data: claimedRows, error: claimError } = await supabase
      .from("episodes")
      .update({
        status: "processing",
        metadata: {
          ...((episode.metadata as Record<string, unknown>) || {}),
          processing_claimed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", episodeId)
      .neq("status", "processing")
      .select("id");

    if (claimError) {
      console.error("Failed to claim episode for processing:", claimError);
      return errorResponse("Failed to start processing", 500);
    }

    if (!claimedRows || claimedRows.length === 0) {
      // Another request beat us to it
      return errorResponse("Episode is already being processed", 409);
    }

    // Get optional parameters from request body
    const body = await request.json().catch(() => ({}));

    // Build the processing payload
    const payload: ProcessEpisodePayload = {
      episodeId: episode.id,
      audioUrl: episode.audio_url,
      showId: episode.show_id,
      language: episode.language || body.language || "en",
      guestName: episode.guest_name || body.guestName,
      guestBio: episode.guest_bio || body.guestBio,
    };

    // Trigger the processing job
    let runId: string;
    try {
      const result = await triggerEpisodeProcessing(payload);
      runId = result.runId;
    } catch (triggerError) {
      // If trigger fails, roll back the status so the user can retry
      await supabase
        .from("episodes")
        .update({
          status: "pending",
          metadata: {
            ...((episode.metadata as Record<string, unknown>) || {}),
            processing_trigger_failed_at: new Date().toISOString(),
            trigger_error: triggerError instanceof Error ? triggerError.message : "Unknown error",
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", episodeId);

      throw triggerError;
    }

    // Update metadata with the run ID (status is already 'processing' from the claim)
    const { error: updateError } = await supabase
      .from("episodes")
      .update({
        metadata: {
          ...((episode.metadata as Record<string, unknown>) || {}),
          processing_run_id: runId,
          processing_started_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", episodeId);

    if (updateError) {
      console.error("Failed to update episode metadata with run ID:", updateError);
      // Don't fail — the job is running and status is already 'processing'
    }

    return successResponse<ProcessingResponse>({
      runId,
      episodeId,
      status: "processing",
      message: "Episode processing has been triggered",
    });
  } catch (error) {
    return handleApiError(error, "triggering episode processing");
  }
}

/**
 * GET /api/episodes/[id]/process
 * Get the status of the current processing run
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse("Invalid ID format", 400);
    }

    const supabase = await createClient();

    // Get the episode with its processing metadata
    const { data: episode, error: fetchError } = await supabase
      .from("episodes")
      .select(
        `
        id,
        status,
        metadata,
        shows!inner(user_id)
      `
      )
      .eq("id", episodeId)
      .eq("shows.user_id", userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse("Episode not found", 404);
    }

    const metadata = episode.metadata as Record<string, unknown> | null;
    const runId = metadata?.processing_run_id as string | undefined;

    // Extract processing step info from episode metadata (set by Trigger.dev job)
    const processingStep = metadata?.processing_step as string | undefined;
    const processingProgress = metadata?.processing_progress as number | undefined;

    if (!runId) {
      return successResponse<RunStatusResponse>({
        runId: "",
        status: episode.status,
        processingStep,
        processingProgress,
        createdAt: "",
        updatedAt: "",
      });
    }

    // Get the run status from Trigger.dev
    const runStatus = await getRunStatus(runId);

    if (!runStatus) {
      return successResponse<RunStatusResponse>({
        runId,
        status: episode.status,
        processingStep,
        processingProgress,
        createdAt: "",
        updatedAt: "",
        error: "Could not retrieve run status",
      });
    }

    return successResponse<RunStatusResponse>({
      runId: runStatus.id,
      status: episode.status,
      processingStep,
      processingProgress,
      createdAt: runStatus.createdAt.toISOString(),
      updatedAt: runStatus.updatedAt.toISOString(),
      error: runStatus.error,
    });
  } catch (error) {
    return handleApiError(error, "getting processing status");
  }
}

/**
 * DELETE /api/episodes/[id]/process
 * Cancel the current processing run
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse("Invalid ID format", 400);
    }

    const supabase = await createClient();

    // Get the episode with its processing metadata
    const { data: episode, error: fetchError } = await supabase
      .from("episodes")
      .select(
        `
        id,
        status,
        metadata,
        shows!inner(user_id)
      `
      )
      .eq("id", episodeId)
      .eq("shows.user_id", userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse("Episode not found", 404);
    }

    if (episode.status !== "processing") {
      return errorResponse("Episode is not currently processing", 400);
    }

    const metadata = episode.metadata as Record<string, unknown> | null;
    const runId = metadata?.processing_run_id as string | undefined;

    if (!runId) {
      return errorResponse("No processing run found", 400);
    }

    // Cancel the run
    const cancelled = await cancelRun(runId);

    if (!cancelled) {
      return errorResponse("Failed to cancel processing run", 500);
    }

    // Update episode status back to pending
    await supabase
      .from("episodes")
      .update({
        status: "pending",
        metadata: {
          ...metadata,
          processing_cancelled_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", episodeId);

    return successResponse({ cancelled: true });
  } catch (error) {
    return handleApiError(error, "cancelling processing");
  }
}

/**
 * PUT /api/episodes/[id]/process
 * Replay a failed processing run
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return errorResponse("Invalid ID format", 400);
    }

    const supabase = await createClient();

    // Get the episode with its processing metadata
    const { data: episode, error: fetchError } = await supabase
      .from("episodes")
      .select(
        `
        id,
        status,
        metadata,
        shows!inner(user_id)
      `
      )
      .eq("id", episodeId)
      .eq("shows.user_id", userId)
      .single();

    if (fetchError || !episode) {
      return errorResponse("Episode not found", 404);
    }

    if (episode.status !== "failed") {
      return errorResponse("Only failed episodes can be replayed", 400);
    }

    const metadata = episode.metadata as Record<string, unknown> | null;
    const runId = metadata?.processing_run_id as string | undefined;

    if (!runId) {
      return errorResponse("No previous processing run found", 400);
    }

    // Replay the run
    const result = await replayRun(runId);

    if (!result) {
      return errorResponse("Failed to replay processing run", 500);
    }

    // Update episode status to processing
    await supabase
      .from("episodes")
      .update({
        status: "processing",
        metadata: {
          ...metadata,
          processing_run_id: result.newRunId,
          processing_replayed_at: new Date().toISOString(),
          previous_run_id: runId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", episodeId);

    return successResponse<ProcessingResponse>({
      runId: result.newRunId,
      episodeId,
      status: "processing",
      message: "Episode processing has been replayed",
    });
  } catch (error) {
    return handleApiError(error, "replaying processing");
  }
}
