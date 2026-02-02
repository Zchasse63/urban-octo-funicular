'use client';

import { cn } from '@/lib/utils';

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
    <div
      className={cn(
        'relative rounded-lg border bg-white p-8 shadow-sm transition-all hover:shadow-lg',
        highlighted && 'border-blue-500 shadow-md ring-2 ring-blue-500'
      )}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white">
          Most Popular
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-gray-900">${price}</span>
          {price > 0 && <span className="ml-2 text-gray-500">/month</span>}
        </div>
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="mr-3 h-5 w-5 flex-shrink-0 text-green-500"
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
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSubscribe}
        disabled={loading}
        className={cn(
          'w-full rounded-lg px-6 py-3 font-medium transition-colors',
          highlighted
            ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300'
            : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400',
          loading && 'cursor-not-allowed opacity-50'
        )}
      >
        {loading ? 'Loading...' : buttonText}
      </button>
    </div>
  );
}
