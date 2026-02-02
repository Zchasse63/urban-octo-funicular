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
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-[var(--bg-subtle)]"></div>
          <div className="h-4 w-64 rounded bg-[var(--bg-subtle)]"></div>
          <div className="h-4 w-56 rounded bg-[var(--bg-subtle)]"></div>
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
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
        Billing
      </h1>
      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-4 sm:p-6 shadow-sm">
        <h2 className="mb-4 text-xl sm:text-2xl font-semibold text-[var(--text-primary)]">
          Current Plan
        </h2>

        <div className="mb-6">
          <div className="mb-2 text-3xl font-bold text-[var(--text-primary)]">{tierName}</div>
          {subscription?.status && (
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium" style={{ backgroundColor: 'var(--accent-green-bg)', color: 'var(--accent-green)' }}>
              {subscription.status === 'active' ? 'Active' : subscription.status}
            </div>
          )}
        </div>

        {hasActiveSubscription && subscription?.current_period_end && (
          <div className="mb-6 space-y-2 text-sm text-[var(--text-secondary)]">
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
              className="rounded-lg px-6 py-3 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              style={{ backgroundColor: 'var(--accent-blue)' }}
              aria-label="Manage subscription in Stripe portal"
            >
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </button>
          ) : (
            <Link
              href="/pricing"
              className="rounded-lg px-6 py-3 text-white transition-colors min-h-[44px] inline-flex items-center"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-4 sm:p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">
          Payment Information
        </h3>
        <p className="text-[var(--text-secondary)]">
          {hasActiveSubscription
            ? 'Manage your payment methods in the Stripe billing portal.'
            : 'Subscribe to a paid plan to add payment information.'}
        </p>
      </div>
    </div>
  );
}
