/**
 * Tests for the shared ErrorFallback component used by all `error.tsx`
 * route boundaries. The error.tsx files are thin wrappers that delegate
 * to this component, so testing this component covers all 5 boundaries.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorFallback } from '@/components/error-fallback'

// Mock Sentry to avoid importing the real SDK in tests
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

describe('<ErrorFallback>', () => {
  const mockError = Object.assign(new Error('Test error message'), {
    digest: 'abc123',
  })

  it('renders the generic "Something went wrong" heading', () => {
    const reset = vi.fn()
    render(<ErrorFallback error={mockError} reset={reset} />)
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('shows the error message to the user', () => {
    const reset = vi.fn()
    render(<ErrorFallback error={mockError} reset={reset} />)
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('shows the error digest when present (for support tickets)', () => {
    const reset = vi.fn()
    render(<ErrorFallback error={mockError} reset={reset} />)
    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })

  it('renders the default segmentLabel when not provided', () => {
    const reset = vi.fn()
    render(<ErrorFallback error={mockError} reset={reset} />)
    expect(screen.getByText(/this page/i)).toBeInTheDocument()
  })

  it('uses a custom segmentLabel when provided', () => {
    const reset = vi.fn()
    render(
      <ErrorFallback error={mockError} reset={reset} segmentLabel="the upload wizard" />
    )
    expect(screen.getByText(/the upload wizard/i)).toBeInTheDocument()
  })

  it('calls the reset function when "Try again" is clicked', () => {
    const reset = vi.fn()
    render(<ErrorFallback error={mockError} reset={reset} />)
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }))
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('renders a "Go home" link pointing to /episodes by default', () => {
    const reset = vi.fn()
    render(<ErrorFallback error={mockError} reset={reset} />)
    const homeLink = screen.getByRole('link', { name: /Go home/i })
    expect(homeLink).toHaveAttribute('href', '/episodes')
  })

  it('honors a custom homeHref prop', () => {
    const reset = vi.fn()
    render(<ErrorFallback error={mockError} reset={reset} homeHref="/login" />)
    const homeLink = screen.getByRole('link', { name: /Go home/i })
    expect(homeLink).toHaveAttribute('href', '/login')
  })

  it('captures the error via Sentry on mount', async () => {
    const { captureException } = await import('@sentry/nextjs')
    vi.mocked(captureException).mockClear()
    const reset = vi.fn()
    render(
      <ErrorFallback error={mockError} reset={reset} segmentLabel="episodes" />
    )
    expect(captureException).toHaveBeenCalledWith(
      mockError,
      expect.objectContaining({ tags: { segment: 'episodes' } })
    )
  })

  it('does not render digest when error.digest is undefined', () => {
    const errorNoDigest = new Error('Plain error')
    const reset = vi.fn()
    render(<ErrorFallback error={errorNoDigest} reset={reset} />)
    // "ref:" label should not appear if there's no digest
    expect(screen.queryByText(/ref:/i)).not.toBeInTheDocument()
  })
})
