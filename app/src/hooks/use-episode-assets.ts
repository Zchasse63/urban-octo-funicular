"use client";

import { useState, useEffect, useCallback } from "react";
import { extractErrorMessage } from "@/lib/errors";
import type { GeneratedAsset } from "@/types/database";

interface UseEpisodeAssetsResult {
  assets: GeneratedAsset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /**
   * Generate an asset for the first time. Silently no-ops on a 409 (asset
   * already exists) so callers can race against the user reloading the page.
   */
  generateAsset: (assetType: string) => Promise<void>;
  /**
   * Force-regenerate an asset, replacing any existing one.
   */
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
      setError(extractErrorMessage(err, "Failed to load assets"));
    } finally {
      setIsLoading(false);
    }
  }, [episodeId]);

  const generateAsset = useCallback(
    async (assetType: string) => {
      if (!episodeId) return;
      // We deliberately do NOT call setError here because callers (single-shot
      // AssetRow buttons and the batched handleGenerateAll loop) need to
      // present errors themselves — toasts in the batch case, per-row state
      // in the single case. Setting a hook-wide error from a batch would
      // overwrite earlier failures and confuse the user.
      const response = await fetch(`/api/episodes/${episodeId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetType, regenerate: false }),
      });

      // 409 = asset already exists. Refresh so the caller's UI sees it.
      if (response.status === 409) {
        await fetchAssets();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate asset");
      }

      await fetchAssets();
    },
    [episodeId, fetchAssets]
  );

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
        // Surface as state-only error so existing callers (AssetEditor) that
        // rely on `error` instead of try/catch keep working. Use generateAsset
        // when you need a thrown rejection.
        setError(extractErrorMessage(err, "Failed to regenerate asset"));
      }
    },
    [episodeId, fetchAssets]
  );

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    assets,
    isLoading,
    error,
    refetch: fetchAssets,
    generateAsset,
    regenerateAsset,
  };
}
