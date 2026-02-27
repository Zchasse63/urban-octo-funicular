/**
 * ImportFeedDialog Component Tests
 *
 * Tests dialog open/close, feed URL input, import flow,
 * success/error states, and result display.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImportFeedDialog } from '@/components/shows/import-feed-dialog'

// Save and restore global.fetch to prevent leaks across test files (singleFork)
const _originalFetch = global.fetch
afterAll(() => { global.fetch = _originalFetch })

// Mock radix dialog to make it testable
vi.mock('@radix-ui/react-dialog', () => {
  const Root = ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog-root" data-open={open}>
      {children}
    </div>
  )
  const Trigger = ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <div data-testid="dialog-trigger" {...props}>{children}</div>
    }
    return <button data-testid="dialog-trigger" {...props}>{children}</button>
  }
  const Portal = ({ children }: any) => <div data-testid="dialog-portal">{children}</div>
  const Overlay = ({ className }: any) => <div data-testid="dialog-overlay" className={className} />
  const Content = ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  )
  const Title = ({ children, className }: any) => (
    <h2 data-testid="dialog-title" className={className}>{children}</h2>
  )
  const Description = ({ children, className }: any) => (
    <p data-testid="dialog-description" className={className}>{children}</p>
  )
  const Close = ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <div data-testid="dialog-close" {...props}>{children}</div>
    }
    return <button data-testid="dialog-close" {...props}>{children}</button>
  }

  return { Root, Trigger, Portal, Overlay, Content, Title, Description, Close }
})

describe('ImportFeedDialog', () => {
  const defaultProps = {
    showId: 'show-123',
    onImportComplete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('trigger button', () => {
    it('renders Import RSS trigger button', () => {
      render(<ImportFeedDialog {...defaultProps} />)
      expect(screen.getByText('Import RSS')).toBeInTheDocument()
    })
  })

  describe('dialog content', () => {
    it('shows dialog title', () => {
      render(<ImportFeedDialog {...defaultProps} />)
      expect(screen.getByText('Import from RSS Feed')).toBeInTheDocument()
    })

    it('shows dialog description', () => {
      render(<ImportFeedDialog {...defaultProps} />)
      expect(screen.getByText('Import your existing episodes from an RSS feed')).toBeInTheDocument()
    })
  })

  describe('input step', () => {
    it('shows RSS Feed URL input', () => {
      render(<ImportFeedDialog {...defaultProps} />)
      expect(screen.getByPlaceholderText(/feeds\.example\.com/)).toBeInTheDocument()
    })

    it('shows Import Episodes button', () => {
      render(<ImportFeedDialog {...defaultProps} />)
      expect(screen.getByText('Import Episodes')).toBeInTheDocument()
    })

    it('disables import button when URL is empty', () => {
      render(<ImportFeedDialog {...defaultProps} />)
      const button = screen.getByText('Import Episodes').closest('button')
      expect(button).toBeDisabled()
    })

    it('enables import button when URL is entered', () => {
      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } })
      const button = screen.getByText('Import Episodes').closest('button')
      expect(button).not.toBeDisabled()
    })
  })

  describe('import flow', () => {
    it('calls import API with feed URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            feedTitle: 'Test Podcast',
            imported: 10,
            skipped: 2,
            total: 12,
          },
        }),
      })
      global.fetch = mockFetch

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/shows/show-123/import',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ feedUrl: 'https://example.com/feed.xml' }),
          })
        )
      })
    })

    it('shows success state with import results', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            feedTitle: 'My Great Podcast',
            imported: 15,
            skipped: 3,
            total: 18,
          },
        }),
      })

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(screen.getByText('Import Complete')).toBeInTheDocument()
        expect(screen.getByText('Feed: My Great Podcast')).toBeInTheDocument()
      })
    })

    it('shows import statistics', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            feedTitle: 'Podcast',
            imported: 15,
            skipped: 3,
            total: 18,
          },
        }),
      })

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument() // imported
        expect(screen.getByText('3')).toBeInTheDocument()  // skipped
        expect(screen.getByText('18')).toBeInTheDocument() // total
        expect(screen.getByText('Imported')).toBeInTheDocument()
        expect(screen.getByText('Skipped')).toBeInTheDocument()
        expect(screen.getByText('Total in feed')).toBeInTheDocument()
      })
    })

    it('shows skip explanation when episodes were skipped', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            feedTitle: 'Podcast',
            imported: 10,
            skipped: 5,
            total: 15,
          },
        }),
      })

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(screen.getByText(/already in your library/)).toBeInTheDocument()
      })
    })

    it('calls onImportComplete callback on success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            feedTitle: 'Podcast',
            imported: 10,
            skipped: 0,
            total: 10,
          },
        }),
      })

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed.xml' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(defaultProps.onImportComplete).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('shows error state on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid feed URL' }),
      })

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://bad-url.com/feed' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(screen.getByText('Import Failed')).toBeInTheDocument()
        expect(screen.getByText('Invalid feed URL')).toBeInTheDocument()
      })
    })

    it('shows Try Again button on error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Network error' }),
      })

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })

    it('returns to input step on Try Again click', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' }),
      })

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Try Again'))

      // Should be back to input step
      expect(screen.getByPlaceholderText(/feeds\.example\.com/)).toBeInTheDocument()
    })

    it('handles network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'))

      render(<ImportFeedDialog {...defaultProps} />)
      const input = screen.getByPlaceholderText(/feeds\.example\.com/)
      fireEvent.change(input, { target: { value: 'https://example.com/feed' } })
      fireEvent.click(screen.getByText('Import Episodes'))

      await waitFor(() => {
        expect(screen.getByText('Import Failed')).toBeInTheDocument()
        expect(screen.getByText('Network timeout')).toBeInTheDocument()
      })
    })
  })
})
