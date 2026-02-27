/**
 * AssetEditor Component Tests
 *
 * Tests edit/view modes, character limits, copy, save, revert,
 * and toolbar state transitions.
 */

import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AssetEditor } from '@/components/episodes/asset-editor'

// Save and restore global.fetch to prevent leaks across test files (singleFork)
const _originalFetch = global.fetch
afterAll(() => { global.fetch = _originalFetch })

// Mock motion/react to render without animations
vi.mock('motion/react', () => ({
  motion: {
    span: ({ children, className, ...props }: any) => (
      <span className={className} {...props}>{children}</span>
    ),
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
})

describe('AssetEditor', () => {
  const defaultProps = {
    episodeId: 'ep-123',
    assetId: 'asset-456',
    assetType: 'linkedin_post',
    initialContent: 'Original AI-generated content for LinkedIn.',
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('view mode', () => {
    it('renders content in view mode by default', () => {
      render(<AssetEditor {...defaultProps} />)
      expect(screen.getByText('Original AI-generated content for LinkedIn.')).toBeInTheDocument()
    })

    it('shows Edit and Copy buttons in view mode', () => {
      render(<AssetEditor {...defaultProps} />)
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })

    it('does not show textarea in view mode', () => {
      render(<AssetEditor {...defaultProps} />)
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('shows "No content yet." when initialContent is empty', () => {
      render(<AssetEditor {...defaultProps} initialContent="" />)
      expect(screen.getByText('No content yet.')).toBeInTheDocument()
    })
  })

  describe('copy functionality', () => {
    it('copies content to clipboard', async () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Copy'))
      expect(mockWriteText).toHaveBeenCalledWith('Original AI-generated content for LinkedIn.')
    })

    it('shows Copied feedback after clicking copy', async () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Copy'))
      expect(screen.getByText('Copied')).toBeInTheDocument()
    })

    it('resets copy feedback after timeout', async () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Copy'))
      expect(screen.getByText('Copied')).toBeInTheDocument()

      act(() => { vi.advanceTimersByTime(2000) })
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })
  })

  describe('edit mode', () => {
    it('switches to edit mode on Edit click', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('populates textarea with current content', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.getByRole('textbox')).toHaveValue('Original AI-generated content for LinkedIn.')
    })

    it('shows Cancel and Save buttons in edit mode', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('hides Edit and Copy in edit mode', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.queryByText('Copy')).not.toBeInTheDocument()
    })

    it('returns to view mode on Cancel', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      fireEvent.click(screen.getByText('Cancel'))
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('updates textarea on input', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Updated content' } })
      expect(textarea).toHaveValue('Updated content')
    })
  })

  describe('character limits', () => {
    it('shows character count for twitter_single (280)', () => {
      render(<AssetEditor {...defaultProps} assetType="twitter_single" />)
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.getByText(/\/280/)).toBeInTheDocument()
    })

    it('shows character count for linkedin_post (3000)', () => {
      render(<AssetEditor {...defaultProps} assetType="linkedin_post" />)
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.getByText(/\/3000/)).toBeInTheDocument()
    })

    it('does not show character count for unknown asset types', () => {
      render(<AssetEditor {...defaultProps} assetType="unknown_type" />)
      fireEvent.click(screen.getByText('Edit'))
      // No character counter should render
      expect(screen.queryByText(/\/\d+/)).not.toBeInTheDocument()
    })

    it('disables Save when over character limit', () => {
      render(<AssetEditor {...defaultProps} assetType="twitter_single" />)
      fireEvent.click(screen.getByText('Edit'))

      const longText = 'A'.repeat(300)
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: longText } })

      const saveButton = screen.getByText('Save').closest('button')
      expect(saveButton).toBeDisabled()
    })
  })

  describe('revert functionality', () => {
    it('does not show Revert button when content matches original', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      expect(screen.queryByText('Revert')).not.toBeInTheDocument()
    })

    it('shows Revert button when content differs from original', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Changed content' } })
      expect(screen.getByText('Revert')).toBeInTheDocument()
    })

    it('restores original content on Revert click', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Changed content' } })
      fireEvent.click(screen.getByText('Revert'))
      expect(textarea).toHaveValue('Original AI-generated content for LinkedIn.')
    })
  })

  describe('save functionality', () => {
    it('disables Save when content has not changed', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const saveButton = screen.getByText('Save').closest('button')
      expect(saveButton).toBeDisabled()
    })

    it('enables Save when content has changed', () => {
      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'New content' } })
      const saveButton = screen.getByText('Save').closest('button')
      expect(saveButton).not.toBeDisabled()
    })

    it('calls API on save with correct payload', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true })
      global.fetch = mockFetch

      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Updated text' } })
      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/episodes/ep-123/assets/asset-456',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Updated text' }),
          })
        )
      })
    })

    it('calls onSave callback after successful save', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true })
      const onSave = vi.fn()

      render(<AssetEditor {...defaultProps} onSave={onSave} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Updated text' } })
      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('Updated text')
      })
    })

    it('returns to view mode after successful save', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Updated text' } })
      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      })
    })

    it('shows Saved status after successful save', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Updated text' } })
      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument()
      })
    })

    it('stays in edit mode on save failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false })
      vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<AssetEditor {...defaultProps} />)
      fireEvent.click(screen.getByText('Edit'))
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'Updated text' } })
      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        // Should still be in edit mode
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
    })
  })
})
