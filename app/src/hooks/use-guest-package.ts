"use client";

import { useState, useEffect, useCallback } from "react";
import type { Episode, Show } from "@/types/database";

interface SocialPostVariant {
  platform: string;
  content: string;
  characterCount: number;
  maxCharacters: number;
}

interface QuoteCard {
  quote: string;
  attribution: string;
  theme?: string;
}

export interface GuestPackageData {
  episode: Episode;
  show: Show;
  package: {
    socialPosts: SocialPostVariant[];
    quoteCards: QuoteCard[];
    emailSubject: string;
    emailBody: string;
  };
}

interface UseGuestPackageResult {
  guestPackage: GuestPackageData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  sendEmail: (guestEmail: string, customMessage?: string) => Promise<boolean>;
  isSending: boolean;
}

export default function useGuestPackage(
  episodeId: string
): UseGuestPackageResult {
  const [guestPackage, setGuestPackage] = useState<GuestPackageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fetchGuestPackage = useCallback(async () => {
    if (!episodeId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/episodes/${episodeId}/guest-package`);

      if (response.status === 400) {
        // Episode not completed yet — not an error, just no data
        setGuestPackage(null);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch guest package");

      const result = await response.json();
      setGuestPackage(result.data || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load guest package"
      );
    } finally {
      setIsLoading(false);
    }
  }, [episodeId]);

  const sendEmail = useCallback(
    async (guestEmail: string, customMessage?: string): Promise<boolean> => {
      if (!episodeId) return false;

      try {
        setIsSending(true);

        const response = await fetch(
          `/api/episodes/${episodeId}/guest-package`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestEmail, customMessage }),
          }
        );

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Failed to send guest package email");
        }

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send email"
        );
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [episodeId]
  );

  useEffect(() => {
    fetchGuestPackage();
  }, [fetchGuestPackage]);

  return {
    guestPackage,
    isLoading,
    error,
    refetch: fetchGuestPackage,
    sendEmail,
    isSending,
  };
}
