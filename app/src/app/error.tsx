'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RefreshCw, AlertTriangle, Bug } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-base)' }}
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center max-w-md">
        {/* Icon */}
        <div
          className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
        >
          <AlertTriangle
            className="w-12 h-12"
            style={{ color: 'var(--accent-red)' }}
          />
        </div>

        {/* Error Code */}
        <h1
          className="text-6xl font-bold mb-4"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          500
        </h1>

        {/* Message */}
        <h2
          className="text-2xl font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Something Went Wrong
        </h2>
        <p
          className="mb-8"
          style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}
        >
          We hit an unexpected error while processing your request. Our team has been
          notified and is working on a fix.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="btn-secondary inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details
            className="mt-8 text-left p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-soft)',
            }}
          >
            <summary
              className="cursor-pointer text-sm font-medium mb-2 flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Bug className="w-4 h-4" />
              Error Details (Dev Only)
            </summary>
            <pre
              className="text-xs overflow-auto p-3 rounded mt-2"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--accent-red)',
                maxHeight: '200px',
              }}
            >
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Error ID for support */}
        {error.digest && (
          <p
            className="mt-6 text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Error ID: {error.digest}
          </p>
        )}
      </div>

      {/* Decorative Element */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, var(--accent-red), var(--accent-amber), var(--accent-red))',
          opacity: 0.5,
        }}
      />
    </div>
  )
}
