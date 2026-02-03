/**
 * LoadingStates Components Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CardSkeleton,
  ListSkeleton,
  Spinner,
  PageLoader,
  TableRowSkeleton,
} from '@/components/LoadingStates'

describe('CardSkeleton', () => {
  it('renders with correct role', () => {
    render(<CardSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<CardSkeleton />)
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument()
  })

  it('applies animate-pulse class', () => {
    render(<CardSkeleton />)
    const skeleton = screen.getByRole('status')
    expect(skeleton).toHaveClass('animate-pulse')
  })

  it('has topo-card class', () => {
    render(<CardSkeleton />)
    const skeleton = screen.getByRole('status')
    expect(skeleton).toHaveClass('topo-card')
  })
})

describe('ListSkeleton', () => {
  it('renders with correct role', () => {
    render(<ListSkeleton />)
    // ListSkeleton has multiple status roles (outer + inner CardSkeletons)
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1)
  })

  it('has correct aria-label', () => {
    render(<ListSkeleton />)
    expect(screen.getByLabelText('Loading list')).toBeInTheDocument()
  })

  it('renders 6 skeletons by default', () => {
    render(<ListSkeleton />)
    const skeleton = screen.getByLabelText('Loading list')
    // Count child CardSkeleton elements
    const children = skeleton.querySelectorAll('.topo-card')
    expect(children.length).toBe(6)
  })

  it('renders custom count of skeletons', () => {
    render(<ListSkeleton count={3} />)
    const skeleton = screen.getByLabelText('Loading list')
    const children = skeleton.querySelectorAll('.topo-card')
    expect(children.length).toBe(3)
  })

  it('renders 10 skeletons when requested', () => {
    render(<ListSkeleton count={10} />)
    const skeleton = screen.getByLabelText('Loading list')
    const children = skeleton.querySelectorAll('.topo-card')
    expect(children.length).toBe(10)
  })

  it('applies grid classes', () => {
    render(<ListSkeleton />)
    const skeleton = screen.getByLabelText('Loading list')
    expect(skeleton).toHaveClass('grid')
    expect(skeleton).toHaveClass('gap-6')
  })
})

describe('Spinner', () => {
  it('renders with correct role', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<Spinner />)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('applies animate-spin class', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('applies rounded-full class', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('rounded-full')
  })

  describe('sizes', () => {
    it('applies small size classes', () => {
      render(<Spinner size="sm" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-4')
      expect(spinner).toHaveClass('h-4')
    })

    it('applies medium size classes by default', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-8')
      expect(spinner).toHaveClass('h-8')
    })

    it('applies large size classes', () => {
      render(<Spinner size="lg" />)
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-12')
      expect(spinner).toHaveClass('h-12')
    })
  })
})

describe('PageLoader', () => {
  it('renders with correct role', () => {
    render(<PageLoader />)
    // PageLoader has multiple status roles (outer container + inner spinner)
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1)
  })

  it('has default aria-label when no message', () => {
    render(<PageLoader />)
    expect(screen.getByLabelText('Loading page')).toBeInTheDocument()
  })

  it('uses custom message as aria-label', () => {
    render(<PageLoader message="Loading episodes" />)
    expect(screen.getByLabelText('Loading episodes')).toBeInTheDocument()
  })

  it('displays message text when provided', () => {
    render(<PageLoader message="Please wait..." />)
    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })

  it('does not display message text when not provided', () => {
    render(<PageLoader />)
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
  })

  it('contains a large spinner', () => {
    render(<PageLoader />)
    // Use more specific selector to find the outer container
    const container = screen.getByLabelText(/loading page/i)
    const spinner = container.querySelector('.w-12.h-12')
    expect(spinner).toBeInTheDocument()
  })

  it('centers content vertically', () => {
    render(<PageLoader />)
    // Use more specific selector to find the outer container
    const container = screen.getByLabelText(/loading page/i)
    expect(container).toHaveClass('flex')
    expect(container).toHaveClass('items-center')
    expect(container).toHaveClass('justify-center')
  })
})

describe('TableRowSkeleton', () => {
  it('renders with correct role', () => {
    render(<TableRowSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<TableRowSkeleton />)
    expect(screen.getByLabelText('Loading row')).toBeInTheDocument()
  })

  it('applies animate-pulse class', () => {
    render(<TableRowSkeleton />)
    const skeleton = screen.getByRole('status')
    expect(skeleton).toHaveClass('animate-pulse')
  })

  it('applies flex layout', () => {
    render(<TableRowSkeleton />)
    const skeleton = screen.getByRole('status')
    expect(skeleton).toHaveClass('flex')
    expect(skeleton).toHaveClass('items-center')
    expect(skeleton).toHaveClass('gap-4')
  })

  it('has border-bottom styling', () => {
    render(<TableRowSkeleton />)
    const skeleton = screen.getByRole('status')
    expect(skeleton).toHaveClass('border-b')
  })
})
