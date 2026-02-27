/**
 * PageHeader Component Tests
 *
 * Tests rendering, conditional elements, and responsive layout
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/layout/page-header'

describe('PageHeader', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(<PageHeader title="Episodes" />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Episodes')
    })

    it('renders description when provided', () => {
      render(<PageHeader title="Episodes" description="Manage your episodes" />)
      expect(screen.getByText('Manage your episodes')).toBeInTheDocument()
    })

    it('does not render description when not provided', () => {
      render(<PageHeader title="Episodes" />)
      expect(screen.queryByText('Manage your episodes')).not.toBeInTheDocument()
    })

    it('renders badge when provided', () => {
      render(<PageHeader title="Episodes" badge={{ label: 'Pro' }} />)
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    it('does not render badge when not provided', () => {
      const { container } = render(<PageHeader title="Episodes" />)
      const badges = container.querySelectorAll('.rounded-full')
      expect(badges.length).toBe(0)
    })

    it('renders actions slot when provided', () => {
      render(
        <PageHeader
          title="Episodes"
          actions={<button data-testid="action-btn">New Episode</button>}
        />
      )
      expect(screen.getByTestId('action-btn')).toBeInTheDocument()
    })

    it('does not render actions container when not provided', () => {
      const { container } = render(<PageHeader title="Episodes" />)
      // Only the title container should exist
      const flexContainers = container.querySelectorAll('.flex.items-center.gap-2')
      expect(flexContainers.length).toBe(0)
    })
  })

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(<PageHeader title="Test" className="my-custom-class" />)
      expect(container.firstChild).toHaveClass('my-custom-class')
    })

    it('merges custom className with defaults', () => {
      const { container } = render(<PageHeader title="Test" className="extra-class" />)
      expect(container.firstChild).toHaveClass('flex')
      expect(container.firstChild).toHaveClass('extra-class')
    })
  })

  describe('complete configuration', () => {
    it('renders all elements together', () => {
      render(
        <PageHeader
          title="My Show"
          description="Your podcast dashboard"
          badge={{ label: 'Agency' }}
          actions={<button>Settings</button>}
        />
      )
      expect(screen.getByRole('heading')).toHaveTextContent('My Show')
      expect(screen.getByText('Your podcast dashboard')).toBeInTheDocument()
      expect(screen.getByText('Agency')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    })
  })
})
