import { Resend } from 'resend'

let resendClient: Resend | null = null
function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

interface ProcessingCompleteEmailParams {
  to: string
  episodeTitle: string
  showName: string
  episodeUrl: string
  assetCount: number
}

export async function sendProcessingCompleteEmail(params: ProcessingCompleteEmailParams): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set, skipping email notification')
      return false
    }

    const resend = getResendClient()

    await resend.emails.send({
      from: 'PodBrain <noreply@getpodbrain.ai>',
      to: params.to,
      subject: `"${params.episodeTitle}" is ready`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="font-size: 24px; color: #1a1a1e;">Your Episode is Ready!</h1>
          <p style="color: #6b7280; line-height: 1.6;">
            <strong>${params.episodeTitle}</strong> from <em>${params.showName}</em> has been processed successfully.
          </p>
          <p style="color: #6b7280; line-height: 1.6;">
            We generated <strong>${params.assetCount} content assets</strong> including show notes, social posts, and more.
          </p>
          <div style="margin: 24px 0;">
            <a href="${params.episodeUrl}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
              View Your Episode
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px;">
            — The PodBrain Team
          </p>
        </div>
      `,
      text: `Your episode "${params.episodeTitle}" from ${params.showName} is ready! We generated ${params.assetCount} content assets. View it at: ${params.episodeUrl}`,
    })

    return true
  } catch (error) {
    console.error('Failed to send processing notification:', error)
    return false
  }
}

interface ProcessingFailedEmailParams {
  to: string
  episodeTitle: string
  showName: string
  episodeUrl: string
  errorMessage?: string
}

export async function sendProcessingFailedEmail(params: ProcessingFailedEmailParams): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) return false

    const resend = getResendClient()

    await resend.emails.send({
      from: 'PodBrain <noreply@getpodbrain.ai>',
      to: params.to,
      subject: `Processing issue with "${params.episodeTitle}"`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="font-size: 24px; color: #1a1a1e;">Processing Issue</h1>
          <p style="color: #6b7280; line-height: 1.6;">
            We encountered an issue processing <strong>${params.episodeTitle}</strong> from <em>${params.showName}</em>.
          </p>
          ${params.errorMessage ? `<p style="color: #dc2626; background: #fef2f2; padding: 12px; border-radius: 8px; font-size: 14px;">${params.errorMessage}</p>` : ''}
          <p style="color: #6b7280; line-height: 1.6;">
            You can retry processing from the episode page.
          </p>
          <div style="margin: 24px 0;">
            <a href="${params.episodeUrl}" style="display: inline-block; padding: 12px 24px; background: #2563EB; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
              View Episode
            </a>
          </div>
        </div>
      `,
      text: `Processing issue with "${params.episodeTitle}". ${params.errorMessage || 'Please retry from the episode page.'}`,
    })

    return true
  } catch (error) {
    console.error('Failed to send processing failure notification:', error)
    return false
  }
}
