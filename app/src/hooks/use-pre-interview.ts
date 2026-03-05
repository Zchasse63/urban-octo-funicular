"use client"

import { useState, useCallback } from 'react';
import { extractErrorMessage } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreInterviewAppearance {
  podcastName: string;
  episodeName: string;
  datePublished: string | null;
  topicsDiscussed: string[];
}

export interface PreInterviewData {
  guestName: string;
  guestSummary: string;
  appearanceCount: number;
  appearances: PreInterviewAppearance[];
  suggestedQuestions: string[];
  topicGaps: string[];
  talkingPoints: string[];
  icebreakers: string[];
  avoidTopics: string[];
}

interface UsePreInterviewReturn {
  data: PreInterviewData | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  generate: (guestName: string, guestBio?: string, topics?: string[]) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export default function usePreInterview(episodeId?: string): UsePreInterviewReturn {
  const [data, setData] = useState<PreInterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * GET — Fetch existing pre-interview data for this episode.
   */
  const fetchData = useCallback(async () => {
    if (!episodeId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/pre-interview`);

      if (res.status === 404) {
        // No cached data yet — not an error
        setData(null);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to fetch pre-interview data (${res.status})`);
      }

      const json = await res.json();
      setData(json.data ?? json);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch pre-interview data'));
    } finally {
      setIsLoading(false);
    }
  }, [episodeId]);

  /**
   * POST — Generate (or regenerate) pre-interview intelligence.
   */
  const generate = useCallback(
    async (guestName: string, guestBio?: string, topics?: string[]) => {
      if (!episodeId) return;

      setIsGenerating(true);
      setError(null);

      try {
        const res = await fetch(`/api/episodes/${episodeId}/pre-interview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestName, guestBio, topics }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to generate pre-interview data (${res.status})`);
        }

        const json = await res.json();
        setData(json.data ?? json);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to generate pre-interview data'));
      } finally {
        setIsGenerating(false);
      }
    },
    [episodeId]
  );

  return { data, isLoading, isGenerating, error, fetch: fetchData, generate };
}
