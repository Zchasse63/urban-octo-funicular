'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PRICING_TIERS } from '@/lib/stripe/products';

export default function PricingPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string | null, tier: string) => {
    if (!priceId) {
      window.location.href = '/dashboard';
      return;
    }

    setLoadingTier(tier);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price_id: priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoadingTier(null);
        toast.error(data.error || 'Unable to create checkout session. Please try again.');
      }
    } catch (error) {
      setLoadingTier(null);
      toast.error(error instanceof Error ? error.message : 'Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start free and scale as your podcast grows
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          <PricingCard
            tier="free"
            name={PRICING_TIERS.free.name}
            price={PRICING_TIERS.free.price}
            features={PRICING_TIERS.free.features}
            buttonText="Start Free"
            onSubscribe={() => handleSubscribe(PRICING_TIERS.free.priceId, 'free')}
            loading={loadingTier === 'free'}
          />

          <PricingCard
            tier="pro"
            name={PRICING_TIERS.pro.name}
            price={PRICING_TIERS.pro.price}
            features={PRICING_TIERS.pro.features}
            buttonText="Subscribe to Pro"
            highlighted
            onSubscribe={() => handleSubscribe(PRICING_TIERS.pro.priceId, 'pro')}
            loading={loadingTier === 'pro'}
          />

          <PricingCard
            tier="agency"
            name={PRICING_TIERS.agency.name}
            price={PRICING_TIERS.agency.price}
            features={PRICING_TIERS.agency.features}
            buttonText="Subscribe to Agency"
            onSubscribe={() => handleSubscribe(PRICING_TIERS.agency.priceId, 'agency')}
            loading={loadingTier === 'agency'}
          />
        </div>
      </div>
    </div>
  );
}
