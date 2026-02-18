"use client";

import { useState, useEffect, useCallback } from "react";
import type { GeneratedAsset } from "@/types/database";

interface UseEpisodeAssetsResult {
  assets: GeneratedAsset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  regenerateAsset: (assetType: string) => Promise<void>;
}

export default function useEpisodeAssets(
  episodeId: string
): UseEpisodeAssetsResult {
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!episodeId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/episodes/${episodeId}/assets`);
      if (!response.ok) throw new Error("Failed to fetch assets");

      const result = await response.json();
      setAssets(result.data?.assets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setIsLoading(false);
    }
  }, [episodeId]);

  const regenerateAsset = useCallback(
    async (assetType: string) => {
      try {
        const response = await fetch(`/api/episodes/${episodeId}/assets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetType, regenerate: true }),
        });

        if (!response.ok) throw new Error("Failed to regenerate asset");
        await fetchAssets();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to regenerate asset"
        );
      }
    },
    [episodeId, fetchAssets]
  );

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return { assets, isLoading, error, refetch: fetchAssets, regenerateAsset };
}
