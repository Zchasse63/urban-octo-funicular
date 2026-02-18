"use client";

import { useState, useEffect, useCallback } from "react";
import type { Show } from "@/types/database";

interface UseShowsResult {
  shows: Show[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createShow: (data: {
    name: string;
    description?: string;
    default_language?: string;
    artwork_url?: string;
  }) => Promise<Show | null>;
}

export default function useShows(): UseShowsResult {
  const [shows, setShows] = useState<Show[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/shows");
      if (!response.ok) {
        throw new Error(`Failed to fetch shows: ${response.statusText}`);
      }

      const result = await response.json();
      const showsData = result.data || result;
      setShows(Array.isArray(showsData) ? showsData : []);
      setTotal(Array.isArray(showsData) ? showsData.length : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shows");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createShow = useCallback(
    async (data: {
      name: string;
      description?: string;
      default_language?: string;
      artwork_url?: string;
    }) => {
      try {
        const response = await fetch("/api/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to create show");
        }

        const result = await response.json();
        await fetchShows();
        return result.data || result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create show");
        return null;
      }
    },
    [fetchShows]
  );

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  return { shows, total, isLoading, error, refetch: fetchShows, createShow };
}
