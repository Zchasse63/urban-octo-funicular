import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { generateGuestPackage } from '@/lib/guest-package/generator'
import { sendGuestPackageEmail, validateEmailAddress, EmailConfigurationError } from '@/lib/email/service'
import { logger } from '@/lib/logger'
import type { ApiResponse, Episode, Show } from '@/types/database'
import type { SocialPostVariant, QuoteCard } from '@/lib/guest-package/generator'

interface GuestPackageResponse {
  episode: Episode
  show: Show
  package: {
    socialPosts: SocialPostVariant[]
    quoteCards: QuoteCard[]
    emailSubject: string
    emailBody: string
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
    const { id: episodeId } = await params
    const supabase = await createClient()

    // Fetch episode with show relation
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        *,
        shows!inner(*)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', DEFAULT_USER_ID)
      .single()

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      )
    }

    // Validate episode is completed
    if (episode.status !== 'completed') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode processing not completed' },
        { status: 400 }
      )
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

    const response: GuestPackageResponse = {
      episode: episode as unknown as Episode,
      show: showData as unknown as Show,
      package: packageContent,
    }

    return NextResponse.json<ApiResponse<GuestPackageResponse>>({
      data: response,
      error: null,
    })
  } catch (error) {
    logger.error('Error fetching guest package', error instanceof Error ? error : { error })
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
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
    const { id: episodeId } = await params
    const body: SendEmailRequest = await request.json()
    const supabase = await createClient()

    // Handle email send
    const { guestEmail, customMessage } = body

    // Validate guest email
    if (!guestEmail || !validateEmailAddress(guestEmail)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Fetch episode with show relation
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        *,
        shows!inner(*)
      `)
      .eq('id', episodeId)
      .eq('shows.user_id', DEFAULT_USER_ID)
      .single()

    if (fetchError || !episode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode not found' },
        { status: 404 }
      )
    }

    if (episode.status !== 'completed') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Episode processing not completed' },
        { status: 400 }
      )
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
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: `Social posts exceed character limits: ${invalidPosts.map(p => p.platform).join(', ')}. Please shorten episode content.`,
        },
        { status: 400 }
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

    return NextResponse.json<ApiResponse<{ success: boolean; messageId?: string }>>({
      data: {
        success: emailResult.success,
        messageId: emailResult.messageId,
      },
      error: null,
    })
  } catch (error) {
    // Handle EmailConfigurationError specifically
    if (error instanceof EmailConfigurationError) {
      logger.error('Email service not configured', { error: error.message })
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          error: 'Email service is not configured. Please contact support.',
        },
        { status: 503 }
      )
    }

    logger.error('Error processing guest package action', error instanceof Error ? error : { error })
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
