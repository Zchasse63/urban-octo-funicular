/**
 * Guest Package Content Generator
 * Generates social post variants from episode data for different platforms
 */

import type { Episode } from '@/types/database'

export interface SocialPostVariant {
  platform: 'linkedin' | 'twitter' | 'instagram'
  content: string
  characterCount: number
  maxCharacters: number
}

export interface QuoteCard {
  id: string
  quote: string
  attribution: string
  episodeTitle: string
}

export interface GuestPackageContent {
  socialPosts: SocialPostVariant[]
  quoteCards: QuoteCard[]
  emailSubject: string
  emailBody: string
}

// Platform character limits
const PLATFORM_LIMITS = {
  linkedin: 3000,
  twitter: 280,
  instagram: 2200,
} as const

/**
 * Generate LinkedIn post format (professional, longer)
 */
export function generateLinkedInPost(episode: Episode, showName: string): string {
  const title = episode.title || 'Latest Episode'
  const titleHashtag = title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)

  const lines = [
    `I had the privilege of being a guest on ${showName}!`,
    '',
    `In this episode, we discussed:`,
    '',
    `${episode.description || 'Topics that matter to professionals in our industry.'}`,
    '',
    `Key takeaways:`,
    `- Insights on industry trends`,
    `- Practical strategies you can implement today`,
    `- Lessons learned from real-world experience`,
    '',
    `Listen to the full episode: [Link in comments]`,
    '',
    `Thank you to the ${showName} team for having me on the show!`,
    '',
    `#Podcast #${titleHashtag} #ProfessionalDevelopment #Leadership`,
  ]

  return lines.join('\n')
}

/**
 * Generate Twitter post format (concise, hashtags)
 */
export function generateTwitterPost(_episode: Episode, showName: string): string {
  const lines = [
    `Just dropped! My conversation on @${showName.replace(/\s+/g, '')}`,
    '',
    `We covered some exciting topics that I think you'll find valuable.`,
    '',
    `Listen now!`,
    '',
    `#Podcast #NewEpisode`,
  ]

  return lines.join('\n')
}

/**
 * Generate Instagram post format (emoji-rich, call to action)
 */
export function generateInstagramPost(_episode: Episode, showName: string): string {
  const lines = [
    `NEW PODCAST EPISODE IS LIVE!`,
    '',
    `I had an amazing time chatting with ${showName} about topics that matter.`,
    '',
    `Here's what we covered:`,
    `- Industry insights`,
    `- Behind-the-scenes stories`,
    `- Actionable tips you can use`,
    '',
    `If you found value in this episode, I'd really appreciate it if you could:`,
    `- Leave a review on Apple Podcasts`,
    `- Share with someone who might benefit`,
    `- Save this post for later`,
    '',
    `Link to listen is in @${showName.replace(/\s+/g, '').toLowerCase()}'s bio!`,
    '',
    `#podcast #newpodcast #podcastepisode #inspiration #motivation #learning #growth`,
  ]

  return lines.join('\n')
}

/**
 * Generate all social post variants for an episode
 */
export function generateSocialPosts(episode: Episode, showName: string): SocialPostVariant[] {
  const linkedInContent = generateLinkedInPost(episode, showName)
  const twitterContent = generateTwitterPost(episode, showName)
  const instagramContent = generateInstagramPost(episode, showName)

  return [
    {
      platform: 'linkedin',
      content: linkedInContent,
      characterCount: linkedInContent.length,
      maxCharacters: PLATFORM_LIMITS.linkedin,
    },
    {
      platform: 'twitter',
      content: twitterContent,
      characterCount: twitterContent.length,
      maxCharacters: PLATFORM_LIMITS.twitter,
    },
    {
      platform: 'instagram',
      content: instagramContent,
      characterCount: instagramContent.length,
      maxCharacters: PLATFORM_LIMITS.instagram,
    },
  ]
}

/**
 * Extract quote cards from viral moments or generate from description
 */
export function generateQuoteCards(episode: Episode): QuoteCard[] {
  const quotes: QuoteCard[] = []
  const guestName = episode.guest_name || 'Guest'
  const title = episode.title || 'Episode'

  // Use viral moments if available
  if (episode.viral_moments && episode.viral_moments.length > 0) {
    episode.viral_moments
      .filter(moment => moment.type === 'quotable')
      .slice(0, 5)
      .forEach((moment, index) => {
        quotes.push({
          id: `quote-${index}`,
          quote: moment.text,
          attribution: guestName,
          episodeTitle: title,
        })
      })
  }

  // Generate placeholder quotes if none from viral moments
  if (quotes.length === 0) {
    const placeholderQuotes = [
      "The key to success is consistency, not perfection.",
      "Every challenge is an opportunity in disguise.",
      "Your network is your net worth in this industry.",
      "Innovation happens at the intersection of disciplines.",
      "The best time to start was yesterday. The second best time is now.",
    ]

    placeholderQuotes.slice(0, 5).forEach((text, index) => {
      quotes.push({
        id: `quote-${index}`,
        quote: text,
        attribution: guestName,
        episodeTitle: title,
      })
    })
  }

  return quotes
}

/**
 * Generate email subject for guest notification
 */
export function generateEmailSubject(episode: Episode, showName: string): string {
  return `Your episode on ${showName} is now live!`
}

/**
 * Generate email body for guest notification
 */
export function generateEmailBody(
  episode: Episode,
  showName: string,
  episodeUrl?: string
): string {
  const guestName = episode.guest_name || 'there'
  const title = episode.title || 'our latest episode'

  const lines = [
    `Hi ${guestName},`,
    '',
    `Great news! Your episode "${title}" on ${showName} is now live and ready for your audience to enjoy.`,
    '',
    episodeUrl ? `Listen here: ${episodeUrl}` : '[Episode link will be added here]',
    '',
    '---',
    '',
    'SOCIAL POSTS FOR YOU TO SHARE',
    '',
    "We've prepared some ready-to-use social media posts for you below. Feel free to customize them or use them as-is:",
    '',
    '[Social posts are included in the promotion package]',
    '',
    '---',
    '',
    'ONE SMALL FAVOR',
    '',
    'If you enjoyed our conversation and found it valuable, we would be incredibly grateful if you could:',
    '',
    '1. Leave a review on Apple Podcasts - Reviews help us reach more listeners and grow the show.',
    '',
    '2. Share on social media - Tag us so we can amplify your post!',
    '',
    '3. Know someone who would be a great guest? - We are always looking for interesting people with valuable insights to share. If you know someone who would be a great fit, please send them our way!',
    '',
    '---',
    '',
    `Thank you again for being part of ${showName}. It was a pleasure having you on the show!`,
    '',
    'Best regards,',
    `The ${showName} Team`,
  ]

  return lines.join('\n')
}

/**
 * Generate complete guest package content
 */
export function generateGuestPackage(
  episode: Episode,
  showName: string,
  episodeUrl?: string
): GuestPackageContent {
  return {
    socialPosts: generateSocialPosts(episode, showName),
    quoteCards: generateQuoteCards(episode),
    emailSubject: generateEmailSubject(episode, showName),
    emailBody: generateEmailBody(episode, showName, episodeUrl),
  }
}
