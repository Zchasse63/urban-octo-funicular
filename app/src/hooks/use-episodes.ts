"use client";

import { useState, useEffect, useCallback } from "react";
import type { EpisodeListItem, PaginatedResponse } from "@/types/database";

interface UseEpisodesOptions {
  showId?: string;
  status?: string;
  page?: number;
  perPage?: number;
  search?: string;
}

interface UseEpisodesResult {
  episodes: EpisodeListItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export default function useEpisodes(
  options: UseEpisodesOptions = {}
): UseEpisodesResult {
  const { showId, status, page = 1, perPage = 20, search } = options;
  const [episodes, setEpisodes] = useState<EpisodeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (showId) params.set("show_id", showId);
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("per_page", String(perPage));

      const response = await fetch(`/api/episodes?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch episodes: ${response.statusText}`);
      }

      const result: PaginatedResponse<EpisodeListItem> = await response.json();

      // Client-side search filter (API doesn't support search param)
      let filtered = result.data;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (ep) =>
            ep.title?.toLowerCase().includes(q) ||
            ep.guest_name?.toLowerCase().includes(q) ||
            ep.description?.toLowerCase().includes(q)
        );
      }

      setEpisodes(filtered);
      setTotal(search ? filtered.length : result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load episodes");
    } finally {
      setIsLoading(false);
    }
  }, [showId, status, page, perPage, search]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  return { episodes, total, isLoading, error, refetch: fetchEpisodes };
}
