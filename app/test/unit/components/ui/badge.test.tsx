/**
 * Badge Component Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  describe('rendering', () => {
    it('renders badge with text', () => {
      render(<Badge>New</Badge>)
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('renders badge with children', () => {
      render(
        <Badge>
          <span data-testid="icon">★</span>
          Featured
        </Badge>
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Featured')).toBeInTheDocument()
    })

    it('applies base classes', () => {
      render(<Badge>Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toHaveClass('inline-flex')
      expect(badge).toHaveClass('items-center')
      expect(badge).toHaveClass('rounded')
      expect(badge).toHaveClass('border')
    })
  })

  describe('variants', () => {
    it('applies default variant classes', () => {
      render(<Badge variant="default">Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toHaveClass('bg-[var(--bg-subtle)]')
      expect(badge).toHaveClass('text-[var(--text-primary)]')
    })

    it('applies default variant when no variant specified', () => {
      render(<Badge>No Variant</Badge>)
      const badge = screen.getByText('No Variant')
      expect(badge).toHaveClass('bg-[var(--bg-subtle)]')
    })

    it('applies new variant classes', () => {
      render(<Badge variant="new">New</Badge>)
      const badge = screen.getByText('New')
      expect(badge).toHaveClass('text-[var(--accent-blue)]')
    })

    it('applies success variant classes', () => {
      render(<Badge variant="success">Completed</Badge>)
      const badge = screen.getByText('Completed')
      expect(badge).toHaveClass('text-[var(--accent-green)]')
    })

    it('applies warning variant classes', () => {
      render(<Badge variant="warning">Pending</Badge>)
      const badge = screen.getByText('Pending')
      expect(badge).toHaveClass('text-[var(--accent-amber)]')
    })

    it('applies error variant classes', () => {
      render(<Badge variant="error">Failed</Badge>)
      const badge = screen.getByText('Failed')
      expect(badge).toHaveClass('text-[var(--accent-red)]')
    })
  })

  describe('custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Badge className="custom-badge">Custom</Badge>)
      const badge = screen.getByText('Custom')
      expect(badge).toHaveClass('custom-badge')
      expect(badge).toHaveClass('inline-flex')
    })

    it('allows overriding default classes', () => {
      render(<Badge className="rounded-full">Pill</Badge>)
      const badge = screen.getByText('Pill')
      expect(badge).toHaveClass('rounded-full')
    })
  })

  describe('typography', () => {
    it('has correct font size', () => {
      render(<Badge>Small Text</Badge>)
      const badge = screen.getByText('Small Text')
      expect(badge).toHaveClass('text-[11px]')
    })

    it('has font-semibold', () => {
      render(<Badge>Bold</Badge>)
      const badge = screen.getByText('Bold')
      expect(badge).toHaveClass('font-semibold')
    })
  })

  describe('status badges', () => {
    it('renders processing status badge', () => {
      render(<Badge variant="warning">Processing</Badge>)
      const badge = screen.getByText('Processing')
      expect(badge).toBeInTheDocument()
    })

    it('renders completed status badge', () => {
      render(<Badge variant="success">Completed</Badge>)
      const badge = screen.getByText('Completed')
      expect(badge).toBeInTheDocument()
    })

    it('renders error status badge', () => {
      render(<Badge variant="error">Error</Badge>)
      const badge = screen.getByText('Error')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('HTML attributes', () => {
    it('passes through HTML attributes', () => {
      render(
        <Badge data-testid="test-badge" title="Badge tooltip">
          Hover me
        </Badge>
      )
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveAttribute('title', 'Badge tooltip')
    })

    it('supports role attribute', () => {
      render(<Badge role="status">Status</Badge>)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})
