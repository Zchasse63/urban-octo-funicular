"use client";

import { useState, useCallback } from "react";
import type { Expert } from "@/lib/experts/types";

interface UseExpertsOptions {
  showId?: string;
}

interface UseExpertsResult {
  experts: Expert[];
  topic: string;
  isLoading: boolean;
  error: string | null;
  search: (topic: string) => Promise<void>;
}

export default function useExperts(
  options: UseExpertsOptions = {}
): UseExpertsResult {
  const { showId } = options;
  const [experts, setExperts] = useState<Expert[]>([]);
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (searchTopic: string) => {
      if (!showId || !searchTopic.trim()) return;

      try {
        setIsLoading(true);
        setError(null);
        setTopic(searchTopic);

        const params = new URLSearchParams({ topic: searchTopic });
        const response = await fetch(
          `/api/shows/${showId}/experts?${params.toString()}`
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please wait a moment and try again.");
          }
          throw new Error(`Failed to search experts: ${response.statusText}`);
        }

        const result = await response.json();
        setExperts(result.experts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search experts");
        setExperts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [showId]
  );

  return { experts, topic, isLoading, error, search };
}
