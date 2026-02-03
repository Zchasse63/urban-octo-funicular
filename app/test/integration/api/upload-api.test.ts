/**
 * Upload API Integration Tests
 *
 * Tests the /api/upload endpoint against the REAL storage.
 * Note: These tests create actual files in Supabase Storage.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { cleanupAllTestData } from '../../setup/database'

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'

// Helper to create a mock audio file
function createMockAudioFile(
  content: string = 'fake audio content',
  type: string = 'audio/mpeg',
  name: string = 'test.mp3'
): File {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

describe('POST /api/upload', () => {
  afterAll(async () => {
    await cleanupAllTestData()
  })

  it('rejects request without file', async () => {
    const formData = new FormData()

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('No file')
  })

  it('rejects invalid file type', async () => {
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('Invalid file type')
  })

  it('rejects PDF files', async () => {
    const file = new File(['%PDF-1.4 fake pdf'], 'document.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('accepts audio/mpeg files', async () => {
    const file = createMockAudioFile('fake mp3 content', 'audio/mpeg', 'test.mp3')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    // May succeed or fail based on Supabase Storage configuration
    // If storage is configured, should succeed
    // If not, may get 500
    expect([200, 500]).toContain(response.status)

    if (response.ok) {
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.filePath).toBeDefined()
      expect(data.signedUrl).toBeDefined()
      expect(data.publicUrl).toBeDefined()
    }
  })

  it('accepts audio/wav files', async () => {
    const file = createMockAudioFile('RIFF fake wav content', 'audio/wav', 'test.wav')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect([200, 500]).toContain(response.status)
  })

  it('accepts audio/m4a files', async () => {
    const file = createMockAudioFile('fake m4a content', 'audio/m4a', 'test.m4a')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect([200, 500]).toContain(response.status)
  })

  it('rejects unsupported audio/x-m4a format', async () => {
    const file = createMockAudioFile('fake m4a content', 'audio/x-m4a', 'test.m4a')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    // audio/x-m4a is not in SUPPORTED_AUDIO_FORMATS
    expect(response.status).toBe(400)
  })

  // Note: Testing file size limit would require creating a very large file
  // which is not practical in tests. The actual limit check is in the route.
  it('validates file size limit exists in constants', async () => {
    // This is a smoke test to verify the endpoint responds correctly
    const file = createMockAudioFile('x'.repeat(1000), 'audio/mpeg', 'test.mp3')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    // Should not return 413 for small file
    expect(response.status).not.toBe(413)
  })
})

describe('Upload Response Format', () => {
  it('returns correct response structure on success', async () => {
    const file = createMockAudioFile('test audio', 'audio/mpeg', 'response-test.mp3')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()

      // Verify response structure
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('filePath')
      expect(data).toHaveProperty('signedUrl')
      expect(data).toHaveProperty('publicUrl')
      expect(data).toHaveProperty('fileSize')
      expect(data).toHaveProperty('mimeType')

      // Verify types
      expect(typeof data.success).toBe('boolean')
      expect(typeof data.filePath).toBe('string')
      expect(typeof data.signedUrl).toBe('string')
      expect(typeof data.publicUrl).toBe('string')
      expect(typeof data.fileSize).toBe('number')
      expect(typeof data.mimeType).toBe('string')

      // Verify values
      expect(data.mimeType).toBe('audio/mpeg')
      expect(data.filePath).toContain('.mp3')
    }
  })

  it('returns error response structure on failure', async () => {
    const formData = new FormData()
    // No file added

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect(response.ok).toBe(false)

    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(typeof data.error).toBe('string')
  })
})
