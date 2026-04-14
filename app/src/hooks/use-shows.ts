"use client";

import { useState, useEffect, useCallback } from "react";
import { extractErrorMessage } from "@/lib/errors";
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
    style_preferences?: Record<string, unknown>;
  }) => Promise<Show | null>;
}

// ─── Cross-instance sync ─────────────────────────────────────────────────────
// Multiple components mount this hook independently. When one creates or
// deletes a show, broadcast a custom event so all other instances refetch.
const SHOWS_CHANGE_EVENT = "podbrain:shows-changed";

function broadcastShowsChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SHOWS_CHANGE_EVENT));
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
      setError(extractErrorMessage(err, "Failed to load shows"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  // Sync across hook instances (sidebar + page-level usages of this hook)
  useEffect(() => {
    const handler = () => fetchShows();
    window.addEventListener(SHOWS_CHANGE_EVENT, handler);
    return () => window.removeEventListener(SHOWS_CHANGE_EVENT, handler);
  }, [fetchShows]);

  const createShow = useCallback(
    async (data: {
      name: string;
      description?: string;
      default_language?: string;
      artwork_url?: string;
      style_preferences?: Record<string, unknown>;
    }) => {
      try {
        const response = await fetch("/api/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          let message = "Failed to create show";
          try {
            const errorBody = await response.json();
            if (errorBody?.error) message = errorBody.error;
          } catch {
            // Non-JSON body — keep generic message
          }
          throw new Error(message);
        }

        const result = await response.json();
        await fetchShows();
        broadcastShowsChange();
        return result.data || result;
      } catch (err) {
        const message = extractErrorMessage(err, "Failed to create show");
        setError(message);
        // Re-throw so dialog/wizard callers can show the *specific* error
        // (e.g. "A show with this name already exists") instead of a generic
        // "Show creation failed" fallback. The hook's `error` state remains
        // populated for any consumers that read it instead of using try/catch.
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [fetchShows]
  );

  return { shows, total, isLoading, error, refetch: fetchShows, createShow };
}
