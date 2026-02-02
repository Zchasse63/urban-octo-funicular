import type { Episode, Show } from '@/types/database'
import type { GuestPackageContent } from '@/lib/guest-package/generator'

/**
 * Email template generator for guest promotion packages
 * Uses inline CSS for maximum email client compatibility
 */

interface GuestPackageEmailParams {
  guestName: string
  episode: Episode
  show: Show
  packageContent: GuestPackageContent
  episodeUrl?: string
  customMessage?: string
}

/**
 * Design system colors safe for email clients
 */
const COLORS = {
  bgBase: '#FDFDFD',
  bgElevated: '#FFFFFF',
  textPrimary: '#121212',
  textSecondary: '#666666',
  textTertiary: '#999999',
  accentBlue: '#007AFF',
  borderSoft: '#E5E5E5',
} as const

/**
 * Generate HTML email template for guest promotion package
 */
export function generateGuestPackageEmailHTML(params: GuestPackageEmailParams): string {
  const { guestName, episode, show, packageContent, episodeUrl, customMessage } = params

  const socialPostsHTML = packageContent.socialPosts
    .map(
      (post) => `
      <div style="margin-bottom: 24px; padding: 16px; background-color: ${COLORS.bgBase}; border: 1px solid ${COLORS.borderSoft}; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; color: ${COLORS.textTertiary};">
          ${post.platform}
        </h3>
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: ${COLORS.textPrimary}; margin-bottom: 12px;">
${post.content}
        </div>
        <p style="margin: 0; font-size: 12px; color: ${COLORS.textSecondary};">
          ${post.characterCount} / ${post.maxCharacters} characters
        </p>
      </div>
    `
    )
    .join('')

  const quotesHTML = packageContent.quoteCards
    .map(
      (quote) => `
      <div style="margin-bottom: 16px; padding: 20px; background-color: ${COLORS.bgElevated}; border-left: 4px solid ${COLORS.accentBlue}; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 16px; font-style: italic; color: ${COLORS.textPrimary};">
          "${quote.quote}"
        </p>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.textSecondary};">
          — ${quote.attribution}
        </p>
      </div>
    `
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${packageContent.emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.bgBase};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: ${COLORS.bgElevated}; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: ${COLORS.bgElevated}; border-bottom: 1px solid ${COLORS.borderSoft};">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: ${COLORS.textPrimary};">
                Your Episode is Live! 🎉
              </h1>
              <p style="margin: 0; font-size: 16px; color: ${COLORS.textSecondary};">
                ${show.name}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${COLORS.textPrimary};">
                Hi ${guestName},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${COLORS.textPrimary};">
                Great news! Your episode <strong>"${episode.title || 'Untitled Episode'}"</strong> on ${show.name} is now live and ready for your audience to enjoy.
              </p>
              ${
                episodeUrl
                  ? `
              <div style="margin: 24px 0; text-align: center;">
                <a href="${episodeUrl}" style="display: inline-block; padding: 12px 24px; background-color: ${COLORS.accentBlue}; color: #FFFFFF; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Listen Now
                </a>
              </div>
              `
                  : ''
              }
              ${
                customMessage
                  ? `
              <div style="margin: 24px 0; padding: 16px; background-color: ${COLORS.bgBase}; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.textPrimary}; white-space: pre-wrap;">
${customMessage}
                </p>
              </div>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Social Posts Section -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: ${COLORS.textPrimary};">
                Social Media Posts
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: ${COLORS.textSecondary};">
                We've prepared ready-to-use social media posts for you. Feel free to customize them or use as-is:
              </p>
              ${socialPostsHTML}
            </td>
          </tr>

          <!-- Quotes Section -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: ${COLORS.textPrimary};">
                Quote Cards
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: ${COLORS.textSecondary};">
                Share these memorable quotes from your conversation:
              </p>
              ${quotesHTML}
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding: 0 32px 32px 32px; border-top: 1px solid ${COLORS.borderSoft};">
              <div style="padding-top: 32px;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: ${COLORS.textPrimary};">
                  One Small Favor
                </h2>
                <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: ${COLORS.textPrimary};">
                  If you enjoyed our conversation and found it valuable, we would be incredibly grateful if you could:
                </p>
                <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: ${COLORS.textPrimary};">
                  <li><strong>Leave a review</strong> on Apple Podcasts - Reviews help us reach more listeners!</li>
                  <li><strong>Share on social media</strong> - Tag us so we can amplify your post!</li>
                  <li><strong>Know a great guest?</strong> - Send them our way!</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: ${COLORS.bgBase}; border-top: 1px solid ${COLORS.borderSoft};">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: ${COLORS.textPrimary};">
                Thank you again for being part of ${show.name}. It was a pleasure having you on the show!
              </p>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: ${COLORS.textSecondary};">
                Best regards,
              </p>
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${COLORS.textPrimary};">
                The ${show.name} Team
              </p>
            </td>
          </tr>

          <!-- Unsubscribe -->
          <tr>
            <td style="padding: 16px 32px; text-align: center; background-color: ${COLORS.bgBase};">
              <p style="margin: 0; font-size: 12px; color: ${COLORS.textTertiary};">
                This email was sent because you were a guest on ${show.name}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function generateGuestPackageEmailText(params: GuestPackageEmailParams): string {
  const { guestName, episode, show, packageContent, episodeUrl, customMessage } = params

  const socialPostsText = packageContent.socialPosts
    .map(
      (post) => `
=== ${post.platform.toUpperCase()} ===
${post.content}

(${post.characterCount} / ${post.maxCharacters} characters)
    `.trim()
    )
    .join('\n\n')

  const quotesText = packageContent.quoteCards
    .map((quote) => `"${quote.quote}"\n— ${quote.attribution}`)
    .join('\n\n')

  return `
${show.name}
Your Episode is Live!

Hi ${guestName},

Great news! Your episode "${episode.title || 'Untitled Episode'}" on ${show.name} is now live and ready for your audience to enjoy.

${episodeUrl ? `Listen here: ${episodeUrl}\n` : ''}
${customMessage ? `\n${customMessage}\n` : ''}

${'='.repeat(60)}

SOCIAL MEDIA POSTS

We've prepared ready-to-use social media posts for you. Feel free to customize them or use as-is:

${socialPostsText}

${'='.repeat(60)}

QUOTE CARDS

Share these memorable quotes from your conversation:

${quotesText}

${'='.repeat(60)}

ONE SMALL FAVOR

If you enjoyed our conversation and found it valuable, we would be incredibly grateful if you could:

1. Leave a review on Apple Podcasts - Reviews help us reach more listeners!
2. Share on social media - Tag us so we can amplify your post!
3. Know a great guest? - Send them our way!

${'='.repeat(60)}

Thank you again for being part of ${show.name}. It was a pleasure having you on the show!

Best regards,
The ${show.name} Team

---

This email was sent because you were a guest on ${show.name}.
  `.trim()
}
