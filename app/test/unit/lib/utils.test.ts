/**
 * Utils Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (classname utility)', () => {
  describe('basic class merging', () => {
    it('merges single classes', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    })

    it('handles null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar')
    })

    it('handles boolean false', () => {
      expect(cn('foo', false, 'bar')).toBe('foo bar')
    })

    it('handles empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar')
    })

    it('returns empty string for no inputs', () => {
      expect(cn()).toBe('')
    })
  })

  describe('conditional classes', () => {
    it('applies class when condition is true', () => {
      const isActive = true
      expect(cn('base', isActive && 'active')).toBe('base active')
    })

    it('skips class when condition is false', () => {
      const isActive = false
      expect(cn('base', isActive && 'active')).toBe('base')
    })

    it('works with ternary operators', () => {
      const isOpen = true
      expect(cn('menu', isOpen ? 'visible' : 'hidden')).toBe('menu visible')
    })
  })

  describe('object syntax', () => {
    it('includes classes with truthy values', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('handles mixed object and string inputs', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active')
    })
  })

  describe('array syntax', () => {
    it('flattens array inputs', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('handles nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz')
    })
  })

  describe('tailwind class merging', () => {
    it('merges conflicting padding classes', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    it('merges conflicting margin classes', () => {
      expect(cn('m-4', 'm-8')).toBe('m-8')
    })

    it('merges conflicting text color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('merges conflicting background classes', () => {
      expect(cn('bg-white', 'bg-gray-100')).toBe('bg-gray-100')
    })

    it('preserves non-conflicting classes', () => {
      expect(cn('p-4', 'm-4')).toBe('p-4 m-4')
    })

    it('handles responsive prefixes', () => {
      expect(cn('md:p-4', 'md:p-8')).toBe('md:p-8')
    })

    it('handles state prefixes', () => {
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500')
    })

    it('preserves different breakpoint classes', () => {
      expect(cn('p-2', 'md:p-4', 'lg:p-8')).toBe('p-2 md:p-4 lg:p-8')
    })

    it('merges flex and grid properties', () => {
      expect(cn('flex-1', 'flex-none')).toBe('flex-none')
    })

    it('handles width classes', () => {
      expect(cn('w-full', 'w-1/2')).toBe('w-1/2')
    })

    it('handles height classes', () => {
      expect(cn('h-screen', 'h-full')).toBe('h-full')
    })
  })

  describe('common component patterns', () => {
    it('works with button variant pattern', () => {
      const variant = 'primary'
      const variants = {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-200 text-gray-800',
      }
      expect(cn('px-4 py-2 rounded', variants[variant])).toBe(
        'px-4 py-2 rounded bg-blue-500 text-white'
      )
    })

    it('works with size variant pattern', () => {
      const size = 'large'
      const sizes = {
        small: 'text-sm p-2',
        medium: 'text-base p-3',
        large: 'text-lg p-4',
      }
      expect(cn('font-medium', sizes[size])).toBe('font-medium text-lg p-4')
    })

    it('works with disabled state pattern', () => {
      const isDisabled = true
      expect(
        cn('bg-blue-500 hover:bg-blue-600', isDisabled && 'opacity-50 cursor-not-allowed')
      ).toBe('bg-blue-500 hover:bg-blue-600 opacity-50 cursor-not-allowed')
    })

    it('allows className prop to override defaults', () => {
      const defaultClasses = 'p-4 text-sm'
      const className = 'p-8'
      expect(cn(defaultClasses, className)).toBe('text-sm p-8')
    })
  })
})
