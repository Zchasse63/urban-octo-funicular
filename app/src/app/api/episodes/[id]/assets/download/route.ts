import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateAssetsZipServer, type AssetForDownload } from '@/lib/export/zip-generator'
import { getAssetDefinition, ASSET_CATEGORIES } from '@/lib/assets/asset-types'

/**
 * GET /api/episodes/[id]/assets/download
 * Download all generated assets as a ZIP file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: episodeId } = await params

    if (!episodeId) {
      return NextResponse.json(
        { error: 'Episode ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch episode with show info
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        show_id,
        shows (
          id,
          name
        )
      `)
      .eq('id', episodeId)
      .single()

    if (episodeError || !episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      )
    }

    // Fetch all generated assets for this episode
    const { data: assets, error: assetsError } = await supabase
      .from('generated_assets')
      .select('*')
      .eq('episode_id', episodeId)
      .not('content', 'is', null)

    if (assetsError) {
      console.error('Failed to fetch assets:', assetsError)
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      )
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json(
        { error: 'No assets available for download' },
        { status: 404 }
      )
    }

    // Transform assets for ZIP generation
    const assetsForDownload: AssetForDownload[] = assets.map((asset) => {
      const definition = getAssetDefinition(asset.asset_type)

      // Find the category for this asset type
      let category = 'other'
      for (const [cat, types] of Object.entries(ASSET_CATEGORIES)) {
        if (types.includes(asset.asset_type)) {
          category = cat
          break
        }
      }

      return {
        id: asset.id,
        type: asset.asset_type,
        name: definition?.name || asset.asset_type,
        category,
        content: asset.content || '',
      }
    })

    // Generate ZIP
    const showData = episode.shows as { id: string; name: string } | null
    const zipBuffer = await generateAssetsZipServer({
      episodeTitle: episode.title || 'Untitled Episode',
      showName: showData?.name || 'Unknown Show',
      assets: assetsForDownload,
    })

    // Create safe filename
    const safeTitle = (episode.title || 'episode')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      .substring(0, 50)
    const filename = `${safeTitle}-assets-${Date.now()}.zip`

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.length),
      },
    })
  } catch (error) {
    console.error('Failed to generate assets ZIP:', error)
    return NextResponse.json(
      { error: 'Failed to generate download' },
      { status: 500 }
    )
  }
}
