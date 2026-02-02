/**
 * Email service exports
 * Centralized exports for email functionality
 */

export { getResendClient, isResendConfigured } from './resend-client'
export type { EmailConfig } from './resend-client'

export {
  sendGuestPackageEmail,
  sendGuestPackageEmailWithRetry,
  validateEmailAddress,
  EmailValidationError,
  EmailRateLimitError,
  EmailConfigurationError,
} from './service'
export type { SendGuestPackageEmailParams, SendEmailResult } from './service'

export { generateGuestPackageEmailHTML, generateGuestPackageEmailText } from './templates'
