/**
 * Unit tests for utility hooks:
 * - useDebounce
 * - useToast
 * - useKeyboardShortcuts
 * - usePolling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─────────────────────────────────────────────────
// useDebounce
// ─────────────────────────────────────────────────

import useDebounce from '@/hooks/use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500))
    expect(result.current).toBe('hello')
  })

  it('does not update value before delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    )

    rerender({ value: 'world', delay: 500 })

    // Advance by less than delay
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('hello')
  })

  it('updates value after delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    )

    rerender({ value: 'world', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('world')
  })

  it('resets timer when value changes before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    )

    rerender({ value: 'b', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Change again before first timer fires
    rerender({ value: 'c', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should still be 'a' since neither timer completed
    expect(result.current).toBe('a')

    // Now let the second timer complete
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('c')
  })

  it('uses default delay of 500ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'start' } }
    )

    rerender({ value: 'end' })

    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current).toBe('start')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('end')
  })

  it('works with non-string types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 42 } }
    )

    rerender({ value: 99 })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe(99)
  })

  it('cleans up timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = renderHook(() => useDebounce('test', 500))
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})

// ─────────────────────────────────────────────────
// useToast
// ─────────────────────────────────────────────────

vi.mock('sonner', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  }
  return { toast: mockToast }
})

import { useToast } from '@/hooks/use-toast'
import { toast as sonnerToast } from 'sonner'

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls sonner success with message and description', () => {
    const { result } = renderHook(() => useToast())
    result.current.success('Done!', 'All good')
    expect(sonnerToast.success).toHaveBeenCalledWith('Done!', { description: 'All good' })
  })

  it('calls sonner success with only message', () => {
    const { result } = renderHook(() => useToast())
    result.current.success('Done!')
    expect(sonnerToast.success).toHaveBeenCalledWith('Done!', { description: undefined })
  })

  it('calls sonner error', () => {
    const { result } = renderHook(() => useToast())
    result.current.error('Oops', 'Something went wrong')
    expect(sonnerToast.error).toHaveBeenCalledWith('Oops', { description: 'Something went wrong' })
  })

  it('calls sonner info', () => {
    const { result } = renderHook(() => useToast())
    result.current.info('Info message')
    expect(sonnerToast.info).toHaveBeenCalledWith('Info message', { description: undefined })
  })

  it('calls sonner warning', () => {
    const { result } = renderHook(() => useToast())
    result.current.warning('Watch out!')
    expect(sonnerToast.warning).toHaveBeenCalledWith('Watch out!', { description: undefined })
  })

  it('calls sonner loading', () => {
    const { result } = renderHook(() => useToast())
    result.current.loading('Processing...')
    expect(sonnerToast.loading).toHaveBeenCalledWith('Processing...')
  })

  it('calls sonner dismiss with specific id', () => {
    const { result } = renderHook(() => useToast())
    result.current.dismiss('toast-123')
    expect(sonnerToast.dismiss).toHaveBeenCalledWith('toast-123')
  })

  it('calls sonner dismiss without id', () => {
    const { result } = renderHook(() => useToast())
    result.current.dismiss()
    expect(sonnerToast.dismiss).toHaveBeenCalledWith(undefined)
  })

  it('calls sonner promise', () => {
    const { result } = renderHook(() => useToast())
    const p = Promise.resolve('ok')
    result.current.promise(p, {
      loading: 'Loading...',
      success: 'Done!',
      error: 'Failed',
    })
    expect(sonnerToast.promise).toHaveBeenCalledWith(p, {
      loading: 'Loading...',
      success: 'Done!',
      error: 'Failed',
    })
  })
})

// ─────────────────────────────────────────────────
// useKeyboardShortcuts
// ─────────────────────────────────────────────────

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import useKeyboardShortcuts from '@/hooks/use-keyboard-shortcuts'

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('navigates to /upload on Meta+n', () => {
    renderHook(() => useKeyboardShortcuts())

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
      bubbles: true,
    })
    window.dispatchEvent(event)

    expect(mockPush).toHaveBeenCalledWith('/upload')
  })

  it('navigates to / on Meta+1', () => {
    renderHook(() => useKeyboardShortcuts())

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '1', metaKey: true, bubbles: true })
    )

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('navigates to /episodes on Meta+2', () => {
    renderHook(() => useKeyboardShortcuts())

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '2', metaKey: true, bubbles: true })
    )

    expect(mockPush).toHaveBeenCalledWith('/episodes')
  })

  it('focuses search input on Meta+k', () => {
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'Search episodes...'
    document.body.appendChild(input)

    const focusSpy = vi.spyOn(input, 'focus')
    const selectSpy = vi.spyOn(input, 'select')

    renderHook(() => useKeyboardShortcuts())

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    )

    expect(focusSpy).toHaveBeenCalled()
    expect(selectSpy).toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('clicks export button on Meta+e', () => {
    const button = document.createElement('button')
    button.setAttribute('data-export-button', '')
    document.body.appendChild(button)

    const clickSpy = vi.spyOn(button, 'click')

    renderHook(() => useKeyboardShortcuts())

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'e', metaKey: true, bubbles: true })
    )

    expect(clickSpy).toHaveBeenCalled()

    document.body.removeChild(button)
  })

  it('does not fire shortcuts without meta key for non-input targets', () => {
    renderHook(() => useKeyboardShortcuts())

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'n', metaKey: false, bubbles: true })
    )

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('removes event listener on unmount', () => {
    const removeListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useKeyboardShortcuts())
    unmount()

    expect(removeListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeListenerSpy.mockRestore()
  })
})

// ─────────────────────────────────────────────────
// usePolling
// ─────────────────────────────────────────────────

import usePolling from '@/hooks/use-polling'

describe('usePolling', () => {
  it('returns initial state correctly', () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() =>
      usePolling({ fetcher, enabled: false })
    )

    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isPolling).toBe(false)
  })

  it('fetches data immediately when enabled', async () => {
    const fetcher = vi.fn().mockResolvedValue('result-data')

    const { result } = renderHook(() =>
      usePolling({ fetcher, enabled: true, interval: 5000 })
    )

    await waitFor(() => {
      expect(result.current.data).toBe('result-data')
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('polls at specified interval', async () => {
    let callCount = 0
    const fetcher = vi.fn().mockImplementation(async () => {
      callCount++
      return `data-${callCount}`
    })

    renderHook(() =>
      usePolling({ fetcher, enabled: true, interval: 50 })
    )

    // Initial call
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1)
    })

    // Wait for at least one more interval
    await waitFor(() => {
      expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('stops polling when shouldStop returns true', async () => {
    const fetcher = vi.fn().mockResolvedValue({ done: true })
    const shouldStop = vi.fn().mockReturnValue(true)

    const { result } = renderHook(() =>
      usePolling({ fetcher, shouldStop, enabled: true, interval: 5000 })
    )

    await waitFor(() => {
      expect(result.current.isPolling).toBe(false)
    })
  })

  it('calls onSuccess callback with data', async () => {
    const onSuccess = vi.fn()
    const fetcher = vi.fn().mockResolvedValue('success-data')

    renderHook(() =>
      usePolling({ fetcher, onSuccess, enabled: true, interval: 5000 })
    )

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('success-data')
    })
  })

  it('calls onError callback on failure', async () => {
    const onError = vi.fn()
    const fetcher = vi.fn().mockRejectedValue(new Error('fetch failed'))

    renderHook(() =>
      usePolling({ fetcher, onError, enabled: true, interval: 5000 })
    )

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'fetch failed' }))
    })
  })

  it('sets error state on fetcher failure', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() =>
      usePolling({ fetcher, enabled: true, interval: 5000 })
    )

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('network error')
    })
  })

  it('can start and stop polling manually', () => {
    const fetcher = vi.fn().mockResolvedValue('data')

    const { result } = renderHook(() =>
      usePolling({ fetcher, enabled: false, interval: 5000 })
    )

    expect(result.current.isPolling).toBe(false)

    act(() => {
      result.current.start()
    })

    expect(result.current.isPolling).toBe(true)

    act(() => {
      result.current.stop()
    })

    expect(result.current.isPolling).toBe(false)
  })

  it('can manually refetch', async () => {
    const fetcher = vi.fn().mockResolvedValue('manual-data')

    const { result } = renderHook(() =>
      usePolling({ fetcher, enabled: false, interval: 5000 })
    )

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.data).toBe('manual-data')
    })
  })

  it('clears interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    const fetcher = vi.fn().mockResolvedValue('data')

    const { unmount } = renderHook(() =>
      usePolling({ fetcher, enabled: true, interval: 5000 })
    )

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalled()
    })

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
