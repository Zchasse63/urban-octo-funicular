"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Episode } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { extractErrorMessage } from "@/lib/errors";

interface UseEpisodeResult {
  episode: Episode | null;
  isLoading: boolean;
  error: string | null;
  processingStep: string | null;
  processingProgress: number | null;
  refetch: () => Promise<void>;
}

export default function useEpisode(id: string): UseEpisodeResult {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEpisode = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("episodes")
        .select("*")
        .eq("id", id)
        .single();

      if (dbError) throw dbError;
      setEpisode(data as Episode);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load episode"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Poll processing status when episode is being processed
  const pollProcessingStatus = useCallback(async () => {
    if (!id) return;

    try {
      const res = await fetch(`/api/episodes/${id}/process`);
      if (!res.ok) return;

      const result = await res.json();
      const data = result.data;

      if (data?.processingStep) {
        setProcessingStep(data.processingStep);
      }
      if (data?.processingProgress != null) {
        setProcessingProgress(data.processingProgress);
      }

      // If processing completed or failed, refetch the full episode and stop polling
      if (data?.status === 'completed' || data?.status === 'failed') {
        await fetchEpisode();
      }
    } catch {
      // Silently fail polling — don't break the UI
    }
  }, [id, fetchEpisode]);

  // Initial fetch
  useEffect(() => {
    fetchEpisode();
  }, [fetchEpisode]);

  // Start/stop polling based on episode status
  useEffect(() => {
    if (episode?.status === 'processing') {
      // Start polling
      pollProcessingStatus(); // Immediate first poll
      pollIntervalRef.current = setInterval(pollProcessingStatus, POLL_INTERVAL_MS);
    } else {
      // Stop polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      // Reset processing state when not processing
      setProcessingStep(null);
      setProcessingProgress(null);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [episode?.status, pollProcessingStatus]);

  return { episode, isLoading, error, processingStep, processingProgress, refetch: fetchEpisode };
}
