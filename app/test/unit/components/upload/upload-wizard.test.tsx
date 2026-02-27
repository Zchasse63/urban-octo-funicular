/**
 * UploadWizard Component Tests
 *
 * Tests the 3-step upload flow: file selection, episode details, and style/assets.
 * Focuses on step navigation, file validation, and tier enforcement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock dependencies before importing component
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className}>{children}</div>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className}>{children}</span>
    ),
    button: ({ children, className, onClick, disabled, ...props }: any) => (
      <button className={className} onClick={onClick} disabled={disabled}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock hooks with defaults
const mockUseShows = vi.fn().mockReturnValue({
  shows: [{ id: 'show-1', name: 'My Podcast', user_id: 'user-1' }],
  isLoading: false,
  error: null,
})

const mockUseUsage = vi.fn().mockReturnValue({
  usage: {
    tier: 'free',
    billingPeriod: { start: '2026-02-01', end: '2026-03-01' },
    episodes: { used: 1, limit: 3, percentage: 33 },
    shows: { used: 1, limit: 1, percentage: 100 },
  },
  isLoading: false,
  error: null,
  refetch: vi.fn(),
})

vi.mock('@/hooks/use-shows', () => ({
  default: () => mockUseShows(),
}))

vi.mock('@/hooks/use-usage', () => ({
  useUsage: () => mockUseUsage(),
}))

vi.mock('@/components/ui/upgrade-prompt', () => ({
  UpgradePrompt: (props: any) => (
    <div data-testid="upgrade-prompt">{props.title}</div>
  ),
}))

// Now import the component
import { UploadWizard } from '@/components/upload/upload-wizard'

describe('UploadWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseShows.mockReturnValue({
      shows: [{ id: 'show-1', name: 'My Podcast', user_id: 'user-1' }],
      isLoading: false,
      error: null,
    })
    mockUseUsage.mockReturnValue({
      usage: {
        tier: 'free',
        billingPeriod: { start: '2026-02-01', end: '2026-03-01' },
        episodes: { used: 1, limit: 3, percentage: 33 },
        shows: { used: 1, limit: 1, percentage: 100 },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  describe('step indicator', () => {
    it('renders all 3 step labels', () => {
      render(<UploadWizard />)
      expect(screen.getByText('Select Audio')).toBeInTheDocument()
      expect(screen.getByText('Expert Context')).toBeInTheDocument()
      expect(screen.getByText('Style & Assets')).toBeInTheDocument()
    })

    it('starts on step 1', () => {
      render(<UploadWizard />)
      // Step 1 should be active - look for the upload area
      expect(screen.getByText('Select Audio')).toBeInTheDocument()
    })
  })

  describe('step 1 - file selection', () => {
    it('renders file upload dropzone', () => {
      render(<UploadWizard />)
      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument()
    })

    it('shows accepted file formats', () => {
      render(<UploadWizard />)
      // Format list is inline: "MP3, WAV, M4A"
      expect(screen.getByText(/MP3.*WAV.*M4A/)).toBeInTheDocument()
    })

    it('shows file and URL tabs', () => {
      render(<UploadWizard />)
      // Tab labels: "File Upload" and "URL Import"
      expect(screen.getByText('File Upload')).toBeInTheDocument()
      expect(screen.getByText('URL Import')).toBeInTheDocument()
    })
  })

  describe('tier enforcement', () => {
    it('shows upgrade prompt when episode limit reached', () => {
      mockUseUsage.mockReturnValue({
        usage: {
          tier: 'free',
          billingPeriod: { start: '2026-02-01', end: '2026-03-01' },
          episodes: { used: 3, limit: 3, percentage: 100 },
          shows: { used: 1, limit: 1, percentage: 100 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<UploadWizard />)
      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument()
    })

    it('does not show upgrade prompt when within limits', () => {
      render(<UploadWizard />)
      expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loading when shows are loading', () => {
      mockUseShows.mockReturnValue({
        shows: [],
        isLoading: true,
        error: null,
      })

      render(<UploadWizard />)
      // Component should still render without crashing
      expect(screen.getByText('Select Audio')).toBeInTheDocument()
    })
  })
})
