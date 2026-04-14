"use client"

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  /**
   * What part of the app the user was in. Shown in the UI so they can tell
   * whether they should retry, go back, or report.
   */
  segmentLabel?: string
  /**
   * Where the "Home" button should send users. Defaults to the dashboard.
   */
  homeHref?: string
}

/**
 * Shared error boundary fallback rendered by the various route-level
 * `error.tsx` files. Logs to Sentry and gives the user a reset button so a
 * single page failure doesn't unmount the whole app.
 */
export function ErrorFallback({
  error,
  reset,
  segmentLabel = 'this page',
  homeHref = '/episodes',
}: ErrorFallbackProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { segment: segmentLabel },
    })
  }, [error, segmentLabel])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-sm p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="font-sans font-bold text-base text-foreground tracking-tight">
              Something went wrong
            </h2>
            <p className="font-serif text-[12.5px] text-muted-foreground mt-0.5">
              We hit an unexpected error in {segmentLabel}.
            </p>
          </div>
        </div>

        {error.message && (
          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5">
            <p className="font-mono text-[11px] text-muted-foreground break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">
                ref: {error.digest}
              </p>
            )}
          </div>
        )}

        <p className="font-serif text-[12.5px] text-muted-foreground leading-relaxed">
          Our team has been notified. You can try again, or head back to the
          dashboard.
        </p>

        <div className="flex items-center gap-2">
          <Button onClick={reset} size="sm" className="gap-2 flex-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </Button>
          <Button asChild variant="secondary" size="sm" className="gap-2 flex-1">
            <Link href={homeHref}>
              <Home className="w-3.5 h-3.5" />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
