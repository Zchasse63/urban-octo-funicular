/**
 * Input sanitization utilities
 * Prevents prompt injection and XSS in user-supplied text
 */

/**
 * Sanitize text that will be used in AI prompts.
 * Strips potential injection patterns while preserving normal text.
 */
export function sanitizeForAI(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    // Remove potential system/instruction injection patterns
    .replace(/\b(system|instruction|ignore previous|disregard|forget|you are now|act as|pretend)\b/gi, '')
    // Remove code/command injection patterns
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove excessive whitespace
    .replace(/\s{3,}/g, ' ')
    // Limit length to prevent token abuse
    .slice(0, 10000)
    .trim()
}

/**
 * Sanitize text for safe HTML rendering.
 * This is a basic sanitizer — DOMPurify should be used for rich HTML content.
 */
export function sanitizeForDisplay(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null
  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(trimmed) ? trimmed : null
}
