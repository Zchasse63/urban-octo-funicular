import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, isValidUUID } from "@/lib/auth";
import { rateLimitByIP } from "@/lib/rate-limit";
import {
  triggerEpisodeProcessing,
  getRunStatus,
  cancelRun,
  replayRun,
  type ProcessEpisodePayload,
} from "@/lib/trigger/client";
import type { ApiResponse, Episode } from "@/types/database";

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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { userId } = await requireAuth();
    const { id: episodeId } = await params;

    if (!isValidUUID(episodeId)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Invalid ID format" },
        { status: 400 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Episode not found" },
        { status: 404 }
      );
    }

    // Don't allow processing if already in progress
    if (episode.status === "processing") {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Episode is already being processed" },
        { status: 409 }
      );
    }

    // Don't allow processing if no audio URL
    if (!episode.audio_url) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Episode has no audio file" },
        { status: 400 }
      );
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
    const { runId } = await triggerEpisodeProcessing(payload);

    // Update episode status to processing
    const { error: updateError } = await supabase
      .from("episodes")
      .update({
        status: "processing",
        metadata: {
          ...((episode.metadata as Record<string, unknown>) || {}),
          processing_run_id: runId,
          processing_started_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", episodeId);

    if (updateError) {
      console.error("Failed to update episode status:", updateError);
      // Don't fail the request - the job has been triggered
    }

    return NextResponse.json<ApiResponse<ProcessingResponse>>({
      data: {
        runId,
        episodeId,
        status: "processing",
        message: "Episode processing has been triggered",
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error triggering episode processing:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Invalid ID format" },
        { status: 400 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Episode not found" },
        { status: 404 }
      );
    }

    const metadata = episode.metadata as Record<string, unknown> | null;
    const runId = metadata?.processing_run_id as string | undefined;

    // Extract processing step info from episode metadata (set by Trigger.dev job)
    const processingStep = metadata?.processing_step as string | undefined;
    const processingProgress = metadata?.processing_progress as number | undefined;

    if (!runId) {
      return NextResponse.json<ApiResponse<RunStatusResponse>>({
        data: {
          runId: "",
          status: episode.status,
          processingStep,
          processingProgress,
          createdAt: "",
          updatedAt: "",
        },
        error: null,
      });
    }

    // Get the run status from Trigger.dev
    const runStatus = await getRunStatus(runId);

    if (!runStatus) {
      return NextResponse.json<ApiResponse<RunStatusResponse>>({
        data: {
          runId,
          status: episode.status,
          processingStep,
          processingProgress,
          createdAt: "",
          updatedAt: "",
          error: "Could not retrieve run status",
        },
        error: null,
      });
    }

    return NextResponse.json<ApiResponse<RunStatusResponse>>({
      data: {
        runId: runStatus.id,
        status: episode.status,
        processingStep,
        processingProgress,
        createdAt: runStatus.createdAt.toISOString(),
        updatedAt: runStatus.updatedAt.toISOString(),
        error: runStatus.error,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error getting processing status:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Invalid ID format" },
        { status: 400 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Episode not found" },
        { status: 404 }
      );
    }

    if (episode.status !== "processing") {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Episode is not currently processing" },
        { status: 400 }
      );
    }

    const metadata = episode.metadata as Record<string, unknown> | null;
    const runId = metadata?.processing_run_id as string | undefined;

    if (!runId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "No processing run found" },
        { status: 400 }
      );
    }

    // Cancel the run
    const cancelled = await cancelRun(runId);

    if (!cancelled) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Failed to cancel processing run" },
        { status: 500 }
      );
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

    return NextResponse.json<ApiResponse<{ cancelled: boolean }>>({
      data: { cancelled: true },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error cancelling processing:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Invalid ID format" },
        { status: 400 }
      );
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Episode not found" },
        { status: 404 }
      );
    }

    if (episode.status !== "failed") {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Only failed episodes can be replayed" },
        { status: 400 }
      );
    }

    const metadata = episode.metadata as Record<string, unknown> | null;
    const runId = metadata?.processing_run_id as string | undefined;

    if (!runId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "No previous processing run found" },
        { status: 400 }
      );
    }

    // Replay the run
    const result = await replayRun(runId);

    if (!result) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Failed to replay processing run" },
        { status: 500 }
      );
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

    return NextResponse.json<ApiResponse<ProcessingResponse>>({
      data: {
        runId: result.newRunId,
        episodeId,
        status: "processing",
        message: "Episode processing has been replayed",
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Error replaying processing:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
