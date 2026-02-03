/**
 * Custom Error Classes Unit Tests
 */

import { describe, it, expect } from 'vitest'
import {
  TranscriptionError,
  ShowNotesGenerationError,
  StorageError,
} from '@/lib/errors'

describe('TranscriptionError', () => {
  it('creates error with message', () => {
    const error = new TranscriptionError('Transcription failed')
    expect(error.message).toBe('Transcription failed')
  })

  it('has correct name property', () => {
    const error = new TranscriptionError('Test error')
    expect(error.name).toBe('TranscriptionError')
  })

  it('is instanceof Error', () => {
    const error = new TranscriptionError('Test error')
    expect(error).toBeInstanceOf(Error)
  })

  it('is instanceof TranscriptionError', () => {
    const error = new TranscriptionError('Test error')
    expect(error).toBeInstanceOf(TranscriptionError)
  })

  it('stores cause when provided', () => {
    const cause = new Error('Original error')
    const error = new TranscriptionError('Transcription failed', cause)
    expect(error.cause).toBe(cause)
  })

  it('has undefined cause when not provided', () => {
    const error = new TranscriptionError('Test error')
    expect(error.cause).toBeUndefined()
  })

  it('has stack trace', () => {
    const error = new TranscriptionError('Test error')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('TranscriptionError')
  })
})

describe('ShowNotesGenerationError', () => {
  it('creates error with message', () => {
    const error = new ShowNotesGenerationError('Generation failed')
    expect(error.message).toBe('Generation failed')
  })

  it('has correct name property', () => {
    const error = new ShowNotesGenerationError('Test error')
    expect(error.name).toBe('ShowNotesGenerationError')
  })

  it('is instanceof Error', () => {
    const error = new ShowNotesGenerationError('Test error')
    expect(error).toBeInstanceOf(Error)
  })

  it('is instanceof ShowNotesGenerationError', () => {
    const error = new ShowNotesGenerationError('Test error')
    expect(error).toBeInstanceOf(ShowNotesGenerationError)
  })

  it('stores cause when provided', () => {
    const cause = new Error('API timeout')
    const error = new ShowNotesGenerationError('Generation failed', cause)
    expect(error.cause).toBe(cause)
  })

  it('can chain error causes', () => {
    const rootCause = new Error('Network error')
    const intermediateCause = new TranscriptionError('Transcript unavailable', rootCause)
    const error = new ShowNotesGenerationError('Cannot generate notes', intermediateCause)

    expect(error.cause).toBe(intermediateCause)
    expect((error.cause as TranscriptionError).cause).toBe(rootCause)
  })
})

describe('StorageError', () => {
  it('creates error with message', () => {
    const error = new StorageError('Upload failed')
    expect(error.message).toBe('Upload failed')
  })

  it('has correct name property', () => {
    const error = new StorageError('Test error')
    expect(error.name).toBe('StorageError')
  })

  it('is instanceof Error', () => {
    const error = new StorageError('Test error')
    expect(error).toBeInstanceOf(Error)
  })

  it('is instanceof StorageError', () => {
    const error = new StorageError('Test error')
    expect(error).toBeInstanceOf(StorageError)
  })

  it('stores cause when provided', () => {
    const cause = new Error('Disk full')
    const error = new StorageError('Upload failed', cause)
    expect(error.cause).toBe(cause)
  })

  it('can be thrown and caught', () => {
    expect(() => {
      throw new StorageError('Storage unavailable')
    }).toThrow(StorageError)
  })

  it('can be caught as generic Error', () => {
    expect(() => {
      throw new StorageError('Storage unavailable')
    }).toThrow(Error)
  })
})

describe('Error type differentiation', () => {
  it('can differentiate between error types using instanceof', () => {
    const transcriptionError = new TranscriptionError('Test')
    const showNotesError = new ShowNotesGenerationError('Test')
    const storageError = new StorageError('Test')

    expect(transcriptionError).toBeInstanceOf(TranscriptionError)
    expect(transcriptionError).not.toBeInstanceOf(ShowNotesGenerationError)
    expect(transcriptionError).not.toBeInstanceOf(StorageError)

    expect(showNotesError).not.toBeInstanceOf(TranscriptionError)
    expect(showNotesError).toBeInstanceOf(ShowNotesGenerationError)
    expect(showNotesError).not.toBeInstanceOf(StorageError)

    expect(storageError).not.toBeInstanceOf(TranscriptionError)
    expect(storageError).not.toBeInstanceOf(ShowNotesGenerationError)
    expect(storageError).toBeInstanceOf(StorageError)
  })

  it('can differentiate using name property', () => {
    const errors = [
      new TranscriptionError('Test'),
      new ShowNotesGenerationError('Test'),
      new StorageError('Test'),
    ]

    const names = errors.map((e) => e.name)
    expect(names).toEqual([
      'TranscriptionError',
      'ShowNotesGenerationError',
      'StorageError',
    ])
  })
})
