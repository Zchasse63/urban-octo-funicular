'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          backgroundColor: '#FDFDFD',
          color: '#121212',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            {/* Icon */}
            <div
              style={{
                width: '6rem',
                height: '6rem',
                borderRadius: '50%',
                margin: '0 auto 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
              }}
            >
              <AlertTriangle
                style={{ width: '3rem', height: '3rem', color: '#EF4444' }}
              />
            </div>

            {/* Error Message */}
            <h1
              style={{
                fontSize: '3.75rem',
                fontWeight: 700,
                marginBottom: '1rem',
                letterSpacing: '-0.02em',
              }}
            >
              500
            </h1>

            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Critical Error
            </h2>

            <p
              style={{
                color: '#6A6A69',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              A critical error occurred while loading the application. Please try
              refreshing the page or contact support if the problem persists.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={reset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#121212',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Try Again
              </button>

              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: '#121212',
                  border: '1px solid #EDEDEC',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  minHeight: '44px',
                }}
              >
                <Home style={{ width: '1rem', height: '1rem' }} />
                Go Home
              </a>
            </div>

            {/* Error ID */}
            {error.digest && (
              <p
                style={{
                  marginTop: '1.5rem',
                  fontSize: '0.75rem',
                  color: '#9A9A99',
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>

          {/* Decorative Element */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #EF4444, #F59E0B, #EF4444)',
              opacity: 0.5,
            }}
          />
        </div>
      </body>
    </html>
  )
}
