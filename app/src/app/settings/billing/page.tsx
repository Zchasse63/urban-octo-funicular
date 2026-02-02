'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Subscription {
  tier: string;
  status: string | null;
  current_period_start?: string;
  current_period_end?: string;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalLoading(false);
        toast.error(data.error || 'Unable to open billing portal. Please try again.');
      }
    } catch (error) {
      setPortalLoading(false);
      toast.error(error instanceof Error ? error.message : 'Network error. Please check your connection and try again.');
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200"></div>
          <div className="h-4 w-64 rounded bg-gray-200"></div>
          <div className="h-4 w-56 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  const tierName = subscription?.tier
    ? subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)
    : 'Free';

  const hasActiveSubscription = subscription?.status && subscription.status !== 'canceled';

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Current Plan
        </h2>

        <div className="mb-6">
          <div className="mb-2 text-3xl font-bold text-gray-900">{tierName}</div>
          {subscription?.status && (
            <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              {subscription.status === 'active' ? 'Active' : subscription.status}
            </div>
          )}
        </div>

        {hasActiveSubscription && subscription?.current_period_end && (
          <div className="mb-6 space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Billing cycle:</span>{' '}
              {new Date(subscription.current_period_start!).toLocaleDateString()} -{' '}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">Next billing date:</span>{' '}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {hasActiveSubscription ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          ) : (
            <Link
              href="/pricing"
              className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Payment Information
        </h2>
        <p className="text-gray-600">
          {hasActiveSubscription
            ? 'Manage your payment methods in the Stripe billing portal.'
            : 'Subscribe to a paid plan to add payment information.'}
        </p>
      </div>
    </div>
  );
}
