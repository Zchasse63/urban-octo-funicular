"use client";

import { useState, useEffect, useCallback } from "react";
import type { Episode } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface UseEpisodeResult {
  episode: Episode | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export default function useEpisode(id: string): UseEpisodeResult {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(
        err instanceof Error ? err.message : "Failed to load episode"
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEpisode();
  }, [fetchEpisode]);

  return { episode, isLoading, error, refetch: fetchEpisode };
}
