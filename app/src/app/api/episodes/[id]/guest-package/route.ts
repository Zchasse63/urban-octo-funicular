import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateGuestPackage, generateAlsoHeardOn } from '@/lib/guest-package/generator'
import { sendGuestPackageEmail, validateEmailAddress, EmailConfigurationError } from '@/lib/email/service'
import { logger } from '@/lib/logger'
import type { Episode, Show } from '@/types/database'
import type { SocialPostVariant, QuoteCard, AlsoHeardOnSection } from '@/lib/guest-package/generator'

interface GuestPackageResponse {
  episode: Episode
  show: Show
  package: {
    socialPosts: SocialPostVariant[]
    quoteCards: QuoteCard[]
    emailSubject: string
    emailBody: string
    alsoHeardOn?: AlsoHeardOnSection
  }
}

interface SendEmailRequest {
  guestEmail: string
  customMessage?: string
}

/**
 * GET /api/episodes/[id]/guest-package
 * Get guest package content for a completed episode
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const { id: episodeId } = await params

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400)
    }

    const supabase = await createClient()

    // Fetch episode with show relation
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        *,
        shows!inner(*)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single()

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404)
    }

    // Validate episode is completed
    if (episode.status !== 'completed') {
      return errorResponse('Episode processing not completed', 400)
    }

    // Extract show data
    const showData = Array.isArray(episode.shows) ? episode.shows[0] : episode.shows
    const episodeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://getpodbrain.ai'}/episodes/${episodeId}`

    // Generate guest package content
    const packageContent = generateGuestPackage(
      episode as unknown as Episode,
      showData.name,
      episodeUrl
    )

    // Enrich with "Also heard on..." section from Taddy cached appearances
    if (episode.guest_name) {
      try {
        const { getCachedAppearances } = await import('@/lib/taddy/cache')
        const appearances = await getCachedAppearances(episode.guest_name)
        if (appearances.length > 0) {
          // Look up podcast image URLs from taddy_podcast_cache
          const podcastUuids = [
            ...new Set(
              appearances
                .map((a) => a.podcastTaddyUuid)
                .filter((uuid): uuid is string => !!uuid)
            ),
          ]

          let podcastImageMap = new Map<string, string>()
          if (podcastUuids.length > 0) {
            const { data: podcasts } = await supabase
              .from('taddy_podcast_cache')
              .select('taddy_uuid, image_url')
              .in('taddy_uuid', podcastUuids)

            if (podcasts) {
              podcastImageMap = new Map(
                podcasts
                  .filter((p) => p.image_url)
                  .map((p) => [p.taddy_uuid, p.image_url as string])
              )
            }
          }

          const alsoHeardOn = generateAlsoHeardOn(
            appearances
              .filter((a) => a.podcastName && a.episodeName)
              .map((a) => ({
                podcastName: a.podcastName!,
                episodeName: a.episodeName!,
                datePublished: a.datePublished,
                podcastImageUrl: a.podcastTaddyUuid
                  ? podcastImageMap.get(a.podcastTaddyUuid)
                  : undefined,
              }))
          )

          if (alsoHeardOn.appearances.length > 0) {
            packageContent.alsoHeardOn = alsoHeardOn
          }
        }
      } catch {
        // Silently fall back to package without Taddy data
      }
    }

    const response: GuestPackageResponse = {
      episode: episode as unknown as Episode,
      show: showData as unknown as Show,
      package: packageContent,
    }

    return successResponse<GuestPackageResponse>(response)
  } catch (error) {
return errorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/episodes/[id]/guest-package
 * Send guest package email to guest
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()

    const rl = await checkRateLimit(`guest-package:${userId}`, 10)
    if (!rl.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Rate limit exceeded. Please try again shortly.' },
        { status: 429 }
      )
    }
    const { id: episodeId } = await params

    if (!isValidUUID(episodeId)) {
      return errorResponse('Invalid ID format', 400)
    }

    const body: SendEmailRequest = await request.json()
    const supabase = await createClient()

    // Handle email send
    const { guestEmail, customMessage } = body

    // Validate guest email
    if (!guestEmail || !validateEmailAddress(guestEmail)) {
      return errorResponse('Invalid email address', 400)
    }

    // Fetch episode with show relation
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        *,
        shows!inner(*)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', userId)
      .single()

    if (fetchError || !episode) {
      return errorResponse('Episode not found', 404)
    }

    if (episode.status !== 'completed') {
      return errorResponse('Episode processing not completed', 400)
    }

    const showData = Array.isArray(episode.shows) ? episode.shows[0] : episode.shows
    const episodeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://getpodbrain.ai'}/episodes/${episodeId}`

    // Generate guest package content
    const packageContent = generateGuestPackage(
      episode as unknown as Episode,
      showData.name,
      episodeUrl
    )

    // Validate character counts for social posts
    const invalidPosts = packageContent.socialPosts.filter(
      post => post.characterCount > post.maxCharacters
    )
    if (invalidPosts.length > 0) {
      return errorResponse(
        `Social posts exceed character limits: ${invalidPosts.map(p => p.platform).join(', ')}. Please shorten episode content.`,
        400
      )
    }

    // Send email
    const emailResult = await sendGuestPackageEmail({
      guestEmail,
      guestName: episode.guest_name || 'Guest',
      episode: episode as unknown as Episode,
      show: showData as unknown as Show,
      packageContent,
      episodeUrl,
      customMessage,
    })

    return successResponse({
      success: emailResult.success,
      messageId: emailResult.messageId,
    })
  } catch (error) {
    // Handle EmailConfigurationError specifically before the generic handler
    if (error instanceof EmailConfigurationError) {
      logger.error('Email service not configured', { error: error.message })
      return errorResponse('Email service is not configured. Please contact support.', 503)
    }

return errorResponse('Internal server error', 500)
  }
}
