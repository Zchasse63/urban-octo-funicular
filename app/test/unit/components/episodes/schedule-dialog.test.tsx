/**
 * ScheduleDialog Component Tests
 *
 * Tests dialog open/close, existing schedule display,
 * new schedule form, cancel functionality, and error states.
 */

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ScheduleDialog from '@/components/episodes/schedule-dialog'

// Save and restore global.fetch to prevent leaks across test files (singleFork)
const _originalFetch = global.fetch
afterAll(() => { global.fetch = _originalFetch })

// Mock motion/react to render without animations
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} data-testid={onClick ? 'backdrop' : undefined}>
        {children}
      </div>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('ScheduleDialog', () => {
  const defaultProps = {
    episodeId: 'ep-123',
    episodeTitle: 'My Test Episode',
    isOpen: true,
    onClose: vi.fn(),
    onScheduled: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('when closed', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <ScheduleDialog {...defaultProps} isOpen={false} />
      )
      expect(container.innerHTML).toBe('')
    })
  })

  describe('when open', () => {
    it('renders dialog header', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      render(<ScheduleDialog {...defaultProps} />)
      expect(screen.getByText('Schedule Processing')).toBeInTheDocument()
    })

    it('shows episode title', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      render(<ScheduleDialog {...defaultProps} />)
      expect(screen.getByText('My Test Episode')).toBeInTheDocument()
    })

    it('does not show episode title when null', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      render(<ScheduleDialog {...defaultProps} episodeTitle={null} />)
      expect(screen.queryByText('My Test Episode')).not.toBeInTheDocument()
    })

    it('shows loading state while fetching schedule', () => {
      // Never resolves to keep it loading
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

      render(<ScheduleDialog {...defaultProps} />)
      expect(screen.getByText('Loading schedule...')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      render(<ScheduleDialog {...defaultProps} />)
      // The X close button
      const buttons = screen.getAllByRole('button')
      const closeButton = buttons.find(b => b.querySelector('.lucide-x'))
      if (closeButton) fireEvent.click(closeButton)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('calls onClose when backdrop is clicked', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })

      render(<ScheduleDialog {...defaultProps} />)
      const backdrop = screen.getByTestId('backdrop')
      fireEvent.click(backdrop)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('new schedule form', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })
    })

    it('shows date/time input when no existing schedule', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/Date & Time/i)).toBeInTheDocument()
      })
    })

    it('shows timezone information', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText(/Timezone:/)).toBeInTheDocument()
      })
    })

    it('shows Schedule and Cancel buttons', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument()
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
    })

    it('calls onClose when Cancel button is clicked', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Cancel'))
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('existing schedule', () => {
    const scheduleData = {
      episodeId: 'ep-123',
      scheduledAt: '2026-03-15T10:00:00.000Z',
      scheduledBy: 'user-abc',
      status: 'scheduled',
    }

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: scheduleData }),
      })
    })

    it('shows existing schedule info', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Scheduled')).toBeInTheDocument()
      })
    })

    it('shows Cancel Schedule button', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Cancel Schedule')).toBeInTheDocument()
      })
    })

    it('calls DELETE API when cancelling schedule', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Cancel Schedule')).toBeInTheDocument()
      })

      // Set up the second fetch for DELETE
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      fireEvent.click(screen.getByText('Cancel Schedule'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/episodes/ep-123/schedule',
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })
  })

  describe('scheduling', () => {
    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: null }),
      })
    })

    it('sends POST with scheduledAt on schedule', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument()
      })

      // Set up the second fetch for POST
      const scheduleResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: {
            episodeId: 'ep-123',
            scheduledAt: '2026-03-15T10:00:00.000Z',
            scheduledBy: 'user-abc',
            status: 'scheduled',
          },
        }),
      }
      global.fetch = vi.fn().mockResolvedValue(scheduleResponse)

      fireEvent.click(screen.getByText('Schedule'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/episodes/ep-123/schedule',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('shows success state after scheduling', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument()
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            episodeId: 'ep-123',
            scheduledAt: '2026-03-15T10:00:00.000Z',
            scheduledBy: 'user-abc',
            status: 'scheduled',
          },
        }),
      })

      fireEvent.click(screen.getByText('Schedule'))

      await waitFor(() => {
        expect(screen.getByText('Processing Scheduled')).toBeInTheDocument()
        expect(screen.getByText('Done')).toBeInTheDocument()
      })
    })

    it('calls onScheduled callback after scheduling', async () => {
      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument()
      })

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            episodeId: 'ep-123',
            scheduledAt: '2026-03-15T10:00:00.000Z',
            scheduledBy: 'user-abc',
            status: 'scheduled',
          },
        }),
      })

      fireEvent.click(screen.getByText('Schedule'))

      await waitFor(() => {
        expect(defaultProps.onScheduled).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('shows error when schedule fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })

      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
    })

    it('shows error when scheduling fails', async () => {
      // First call succeeds (fetch schedule)
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: null }),
        })

      render(<ScheduleDialog {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Schedule')).toBeInTheDocument()
      })

      // Second call fails (schedule POST)
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Scheduling failed' }),
      })

      fireEvent.click(screen.getByText('Schedule'))

      await waitFor(() => {
        expect(screen.getByText('Scheduling failed')).toBeInTheDocument()
      })
    })
  })
})
