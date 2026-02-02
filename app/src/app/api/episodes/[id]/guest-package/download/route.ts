import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { generateGuestPackage } from '@/lib/guest-package/generator'
import { generateGuestPackageZipServer } from '@/lib/export/zip-generator'
import { logger } from '@/lib/logger'
import type { ApiResponse, Episode, Show } from '@/types/database'

/**
 * GET /api/episodes/[id]/guest-package/download
 * Download guest package as ZIP file
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

    const showData = Array.isArray(episode.shows) ? episode.shows[0] : episode.shows
    const episodeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://getpodbrain.ai'}/episodes/${episodeId}`

    // Generate guest package content
    const packageContent = generateGuestPackage(
      episode as unknown as Episode,
      showData.name,
      episodeUrl
    )

    // Generate ZIP file
    const zipBuffer = await generateGuestPackageZipServer({
      episode: episode as unknown as Episode,
      show: showData as unknown as Show,
      packageContent,
    })

    const guestName = episode.guest_name || 'guest'
    const filename = `guest-package-${guestName.toLowerCase().replace(/\s+/g, '-')}.zip`

    logger.info('Guest package ZIP generated', {
      event: 'zip_generated' as const,
      episode_id: episodeId,
      filename,
    })

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(zipBuffer)

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error) {
    logger.error('Error generating guest package ZIP', error instanceof Error ? error : { error })
    return NextResponse.json<ApiResponse<null>>(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
