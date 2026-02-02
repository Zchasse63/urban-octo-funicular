import type { Episode, Show } from '@/types/database'
import type { GuestPackageContent } from '@/lib/guest-package/generator'
import { getResendClient, isResendConfigured } from './resend-client'
import { generateGuestPackageEmailHTML, generateGuestPackageEmailText } from './templates'
import { logger } from '@/lib/logger'

/**
 * Email service for sending guest promotion packages
 */

export interface SendGuestPackageEmailParams {
  guestEmail: string
  guestName: string
  episode: Episode
  show: Show
  packageContent: GuestPackageContent
  episodeUrl?: string
  customMessage?: string
  fromEmail?: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Email validation using improved RFC 5322 pattern
 * Handles most common valid email formats and rejects obvious invalid formats
 */
export function validateEmailAddress(email: string): boolean {
  // Basic checks first
  if (!email || typeof email !== 'string') return false
  if (email.length > 254) return false // RFC 5321

  // Improved regex that handles:
  // - No consecutive dots
  // - No leading/trailing dots in local part
  // - No spaces
  // - Requires valid domain structure
  const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/

  return emailRegex.test(email)
}

/**
 * Specific error types for email sending
 */
export class EmailValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmailValidationError'
  }
}

export class EmailRateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmailRateLimitError'
  }
}

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmailConfigurationError'
  }
}

/**
 * Send guest package email via Resend
 */
export async function sendGuestPackageEmail(
  params: SendGuestPackageEmailParams
): Promise<SendEmailResult> {
  const {
    guestEmail,
    guestName,
    episode,
    show,
    packageContent,
    episodeUrl,
    customMessage,
    fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    replyTo,
  } = params

  // Validate email address
  if (!validateEmailAddress(guestEmail)) {
    throw new EmailValidationError(`Invalid email address: ${guestEmail}`)
  }

  // Check if Resend is configured
  if (!isResendConfigured()) {
    throw new EmailConfigurationError(
      'RESEND_API_KEY is not configured. Email functionality is disabled.'
    )
  }

  try {
    const resend = getResendClient()

    // Generate email content
    const htmlContent = generateGuestPackageEmailHTML({
      guestName,
      episode,
      show,
      packageContent,
      episodeUrl,
      customMessage,
    })

    const textContent = generateGuestPackageEmailText({
      guestName,
      episode,
      show,
      packageContent,
      episodeUrl,
      customMessage,
    })

    // Send email via Resend
    const response = await resend.emails.send({
      from: fromEmail,
      to: guestEmail,
      subject: packageContent.emailSubject,
      html: htmlContent,
      text: textContent,
      ...(replyTo && { replyTo }),
    })

    // Check for error in response
    if ('error' in response && response.error) {
      const error = response.error

      // Check for rate limiting
      if (error.message?.includes('rate limit')) {
        throw new EmailRateLimitError(error.message)
      }

      // Generic API error
      throw new Error(error.message || 'Failed to send email')
    }

    const messageId = 'id' in response && typeof response.id === 'string' ? response.id : undefined

    // Log successful email send
    logger.info('Guest package email sent', {
      event: 'email_sent' as const,
      episode_id: episode.id,
      guest_email: guestEmail,
      message_id: messageId,
      show_id: show.id,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      messageId,
    }
  } catch (error) {
    // Re-throw all errors for consistent error handling
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error occurred during email send')
  }
}

/**
 * Retry email send with exponential backoff
 */
export async function sendGuestPackageEmailWithRetry(
  params: SendGuestPackageEmailParams,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<SendEmailResult> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await sendGuestPackageEmail(params)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Don't retry validation errors
      if (error instanceof EmailValidationError || error instanceof EmailConfigurationError) {
        throw error
      }

      // For rate limit errors or other failures, wait and retry
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Failed to send email after multiple retries',
  }
}
