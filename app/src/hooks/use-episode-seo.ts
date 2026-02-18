"use client";

import { useState, useEffect, useCallback } from "react";
import type { SEOAnalysis } from "@/types/database";

interface SEOData {
  seo_score: number | null;
  seo_analysis: SEOAnalysis | null;
  schema_markup: Record<string, unknown> | null;
}

interface UseEpisodeSeoResult {
  seoData: SEOData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export default function useEpisodeSeo(
  episodeId: string
): UseEpisodeSeoResult {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeo = useCallback(async () => {
    if (!episodeId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/episodes/${episodeId}/seo`);
      if (!response.ok) throw new Error("Failed to fetch SEO data");

      const result = await response.json();
      if (result.data) {
        setSeoData({
          seo_score: result.data.episode?.seo_score ?? null,
          seo_analysis: result.data.analysis ?? null,
          schema_markup: result.data.schema ?? null,
        });
      } else {
        setSeoData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SEO data");
    } finally {
      setIsLoading(false);
    }
  }, [episodeId]);

  useEffect(() => {
    fetchSeo();
  }, [fetchSeo]);

  return { seoData, isLoading, error, refetch: fetchSeo };
}
