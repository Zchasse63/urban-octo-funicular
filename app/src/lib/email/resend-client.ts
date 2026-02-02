import { Resend } from 'resend'

/**
 * Resend email client singleton
 * Requires RESEND_API_KEY environment variable
 */

let resendClient: Resend | null = null

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY environment variable is not set. Email functionality is disabled. ' +
        'Please add RESEND_API_KEY to your .env file. Visit https://resend.com to get an API key.'
      )
    }

    resendClient = new Resend(apiKey)
  }

  return resendClient
}

/**
 * Check if Resend is configured without throwing an error
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * Email configuration types
 */
export interface EmailConfig {
  from: string
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}
