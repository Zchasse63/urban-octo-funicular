"use client";

import { useState, useEffect, useCallback } from "react";
import { extractErrorMessage } from "@/lib/errors";
import type { PricingTier } from "@/lib/stripe/products";

interface SubscriptionData {
  id?: string;
  status: string | null;
  tier: PricingTier;
  stripe_subscription_id?: string;
  current_period_end?: string;
}

interface UseSubscriptionResult {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  checkout: (tier: string) => Promise<void>;
  openPortal: () => Promise<void>;
}

export default function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/subscriptions");
      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load subscription"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkout = useCallback(async (tier: string) => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Checkout failed"));
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to open billing portal");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to open portal"));
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
    checkout,
    openPortal,
  };
}
