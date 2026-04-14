"use client";

import { useState, useEffect, useCallback } from "react";
import { extractErrorMessage } from "@/lib/errors";
import type { PricingTier, BillingInterval } from "@/lib/stripe/products";

interface SubscriptionData {
  id?: string;
  status: string | null;
  tier: PricingTier;
  stripe_subscription_id?: string;
  current_period_end?: string;
}

/** State describing which checkout modal to show (null = closed) */
export interface CheckoutIntent {
  tier: string;
  interval: BillingInterval;
}

interface UseSubscriptionResult {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /**
   * Open the embedded checkout modal for the given tier.
   * The Settings page renders <EmbeddedCheckoutModal> when this is non-null.
   */
  startCheckout: (tier: string, interval?: BillingInterval) => void;
  /** The current checkout intent (which tier/interval to check out) or null */
  checkoutIntent: CheckoutIntent | null;
  /** Close the checkout modal */
  cancelCheckout: () => void;
  /** Open the Stripe Customer Portal for managing existing subscriptions */
  openPortal: () => Promise<void>;
}

export default function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutIntent, setCheckoutIntent] = useState<CheckoutIntent | null>(null);

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

  const startCheckout = useCallback(
    (tier: string, interval: BillingInterval = "monthly") => {
      setCheckoutIntent({ tier, interval });
    },
    []
  );

  const cancelCheckout = useCallback(() => {
    setCheckoutIntent(null);
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
    startCheckout,
    checkoutIntent,
    cancelCheckout,
    openPortal,
  };
}
