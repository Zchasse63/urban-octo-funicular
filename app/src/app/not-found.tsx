'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search, Mic2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <div className="text-center max-w-md">
        {/* Icon */}
        <div
          className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-subtle)' }}
        >
          <Mic2
            className="w-12 h-12"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>

        {/* Error Code */}
        <h1
          className="text-6xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          404
        </h1>

        {/* Message */}
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Page Not Found
        </h2>
        <p
          className="mb-8"
          style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}
        >
          Looks like this episode got lost in the feed. The page you're looking for
          doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="/episodes"
            className="btn-secondary inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            Browse Episodes
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--accent-blue)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>

      {/* Decorative Element */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green), var(--accent-blue))',
          opacity: 0.5,
        }}
      />
    </div>
  )
}
