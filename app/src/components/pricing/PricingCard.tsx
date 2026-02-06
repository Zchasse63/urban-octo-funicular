'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PricingCardProps {
  tier: string;
  name: string;
  price: number;
  features: string[];
  buttonText: string;
  highlighted?: boolean;
  onSubscribe: () => void;
  loading?: boolean;
}

export function PricingCard({
  tier,
  name,
  price,
  features,
  buttonText,
  highlighted = false,
  onSubscribe,
  loading = false,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        'relative transition-all',
        highlighted && 'ring-2 ring-[var(--accent-blue)]'
      )}
    >
      <CardContent className="pt-6">
      {highlighted && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent-blue)' }}
        >
          Most Popular
        </div>
      )}

      <div className="mb-4">
        <p className="mb-1 text-xs font-mono uppercase tracking-[0.05em] text-[var(--text-tertiary)]">{tier}</p>
        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{name}</h3>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>${price}</span>
          {price > 0 && <span className="ml-2" style={{ color: 'var(--text-tertiary)' }}>/month</span>}
        </div>
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="mr-3 h-5 w-5 flex-shrink-0"
              style={{ color: 'var(--accent-green)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSubscribe}
        disabled={loading}
        type="button"
        variant={highlighted ? 'default' : 'secondary'}
        className={cn(
          'w-full transition-colors',
          loading && 'cursor-not-allowed opacity-50'
        )}
        style={highlighted ? { backgroundColor: 'var(--accent-blue)', color: 'white' } : undefined}
      >
        {loading ? 'Loading...' : buttonText}
      </Button>
      </CardContent>
    </Card>
  );
}
