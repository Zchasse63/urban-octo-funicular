/**
 * ErrorBoundary - React error boundary for graceful error handling
 * Catches runtime errors in child component tree and displays user-friendly fallback UI
 */

'use client'

import * as React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallbackMessage?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card
            className="max-w-lg w-full text-center"
            role="alert"
            aria-live="assertive"
          >
            <CardContent className="pt-6">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <AlertTriangle
                className="w-8 h-8"
                style={{ color: 'var(--accent-red)' }}
                aria-hidden="true"
              />
            </div>

            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Something went wrong
            </h2>

            <p
              className="text-sm mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              {this.props.fallbackMessage ||
                "We're sorry, but something unexpected happened. Please try again."}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary
                  className="cursor-pointer text-sm font-mono mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Error details (development only)
                </summary>
                <pre
                  className="text-xs p-3 rounded overflow-auto"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                aria-label="Try again"
                type="button"
                variant="secondary"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Try Again
              </Button>
              <Button
                onClick={this.handleRefresh}
                aria-label="Refresh page"
                type="button"
              >
                Refresh Page
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
