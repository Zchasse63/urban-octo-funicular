/**
 * Validation Utilities Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
  validateUUID,
  validateEmail,
  sanitizeString,
  validatePagination,
} from '@/lib/validation'

describe('validateUUID', () => {
  describe('valid UUIDs', () => {
    it('validates a standard UUID v4', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('validates UUID with uppercase letters', () => {
      expect(validateUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true)
    })

    it('validates UUID v1', () => {
      expect(validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
    })

    // Permissive validation: accepts any hex in version/variant positions
    // because Supabase-generated UUIDs don't always match strict RFC 4122
    it('accepts the default user ID (permissive hex validation)', () => {
      expect(validateUUID('00000000-0000-0000-0000-000000000001')).toBe(true)
    })
  })

  describe('invalid UUIDs', () => {
    it('rejects empty string', () => {
      expect(validateUUID('')).toBe(false)
    })

    it('rejects string without dashes', () => {
      expect(validateUUID('550e8400e29b41d4a716446655440000')).toBe(false)
    })

    it('rejects string with wrong length', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716')).toBe(false)
    })

    it('rejects string with invalid characters', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false)
    })

    it('rejects random text', () => {
      expect(validateUUID('not-a-uuid')).toBe(false)
    })

    it('rejects null-like strings', () => {
      expect(validateUUID('null')).toBe(false)
      expect(validateUUID('undefined')).toBe(false)
    })
  })
})

describe('validateEmail', () => {
  describe('valid emails', () => {
    it('validates standard email format', () => {
      expect(validateEmail('user@example.com')).toBe(true)
    })

    it('validates email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true)
    })

    it('validates email with plus sign', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true)
    })

    it('validates email with numbers', () => {
      expect(validateEmail('user123@example123.com')).toBe(true)
    })

    it('validates email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBe(true)
    })

    it('validates email with hyphen in domain', () => {
      expect(validateEmail('user@my-domain.com')).toBe(true)
    })
  })

  describe('invalid emails', () => {
    it('rejects empty string', () => {
      expect(validateEmail('')).toBe(false)
    })

    it('rejects email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false)
    })

    it('rejects email without domain', () => {
      expect(validateEmail('user@')).toBe(false)
    })

    it('rejects email without local part', () => {
      expect(validateEmail('@example.com')).toBe(false)
    })

    it('rejects email with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false)
    })

    it('rejects email without TLD', () => {
      expect(validateEmail('user@example')).toBe(false)
    })
  })
})

describe('sanitizeString', () => {
  it('trims whitespace from start and end', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })

  it('preserves internal whitespace', () => {
    expect(sanitizeString('hello world')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('')
  })

  it('handles string with only whitespace', () => {
    expect(sanitizeString('   ')).toBe('')
  })

  it('truncates strings longer than 10000 characters', () => {
    const longString = 'a'.repeat(15000)
    const result = sanitizeString(longString)
    expect(result.length).toBe(10000)
  })

  it('preserves strings at exactly 10000 characters', () => {
    const exactString = 'b'.repeat(10000)
    expect(sanitizeString(exactString)).toBe(exactString)
  })

  it('preserves strings shorter than 10000 characters', () => {
    const shortString = 'c'.repeat(100)
    expect(sanitizeString(shortString)).toBe(shortString)
  })
})

describe('validatePagination', () => {
  describe('default values', () => {
    it('uses default values when no params provided', () => {
      const result = validatePagination()
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.offset).toBe(0)
    })

    it('uses default values for undefined params', () => {
      const result = validatePagination(undefined, undefined)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.offset).toBe(0)
    })
  })

  describe('page validation', () => {
    it('accepts valid page number', () => {
      const result = validatePagination(5)
      expect(result.page).toBe(5)
    })

    it('rejects page less than 1', () => {
      const result = validatePagination(0)
      expect(result.page).toBe(1)
    })

    it('rejects negative page', () => {
      const result = validatePagination(-5)
      expect(result.page).toBe(1)
    })
  })

  describe('limit validation', () => {
    it('accepts valid limit', () => {
      const result = validatePagination(1, 50)
      expect(result.limit).toBe(50)
    })

    it('caps limit at 100', () => {
      const result = validatePagination(1, 200)
      expect(result.limit).toBe(100)
    })

    it('uses default limit when 0 is passed (falsy)', () => {
      // 0 is falsy, so it falls back to default of 20
      const result = validatePagination(1, 0)
      expect(result.limit).toBe(20)
    })

    it('handles negative limit', () => {
      const result = validatePagination(1, -10)
      expect(result.limit).toBe(1)
    })
  })

  describe('offset calculation', () => {
    it('calculates offset for page 1', () => {
      const result = validatePagination(1, 20)
      expect(result.offset).toBe(0)
    })

    it('calculates offset for page 2', () => {
      const result = validatePagination(2, 20)
      expect(result.offset).toBe(20)
    })

    it('calculates offset for page 3 with limit 50', () => {
      const result = validatePagination(3, 50)
      expect(result.offset).toBe(100)
    })

    it('calculates correct offset for large page numbers', () => {
      const result = validatePagination(100, 25)
      expect(result.offset).toBe(2475)
    })
  })
})
