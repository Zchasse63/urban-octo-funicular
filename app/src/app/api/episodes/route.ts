import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { canCreateEpisode } from '@/lib/tier-limits'
import { PAGINATION } from '@/lib/constants'
import type { EpisodeListItem, ApiResponse, PaginatedResponse, Episode } from '@/types/database'

/**
 * GET /api/episodes
 * List all episodes, optionally filtered by show_id
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const showId = searchParams.get('show_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = Math.min(
      parseInt(searchParams.get('per_page') || String(PAGINATION.defaultPageSize), 10),
      PAGINATION.maxPageSize
    )
    const offset = (page - 1) * perPage

    // Build base query for count
    let countQuery = supabase
      .from('episodes')
      .select('*, shows!inner(user_id)', { count: 'exact', head: true })
      .eq('shows.user_id', userId)

    // Apply filters to count query
    if (showId) {
      countQuery = countQuery.eq('show_id', showId)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: countError.message },
        { status: 500 }
      )
    }

    // Build data query
    let dataQuery = supabase
      .from('episodes')
      .select(`
        id,
        show_id,
        title,
        description,
        audio_url,
        audio_duration_seconds,
        language,
        status,
        seo_score,
        seo_analysis,
        show_notes,
        guest_name,
        published_at,
        created_at,
        updated_at,
        shows!inner(user_id, name)
      `)
      .eq('shows.user_id', userId)

    // Apply filters to data query
    if (showId) {
      dataQuery = dataQuery.eq('show_id', showId)
    }
    if (status) {
      dataQuery = dataQuery.eq('status', status)
    }

    // Apply ordering and pagination
    const { data: episodes, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<PaginatedResponse<EpisodeListItem>>({
      data: episodes || [],
      total: count || 0,
      page,
      per_page: perPage,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching episodes:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/episodes
 * Create a new episode for a show
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth()

    // Tier enforcement: check episode limit
    const episodeCheck = await canCreateEpisode(userId)
    if (!episodeCheck.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: episodeCheck.reason || 'Episode limit reached' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    const {
      show_id,
      title,
      description,
      audio_url,
      guest_name,
      guest_bio,
      language = 'en',
    } = body

    // Validate required fields
    if (!show_id) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'show_id is required' },
        { status: 400 }
      )
    }

    if (!audio_url) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'audio_url is required' },
        { status: 400 }
      )
    }

    // Verify the show exists and belongs to the user
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('id')
      .eq('id', show_id)
      .eq('user_id', userId)
      .single()

    if (showError || !show) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show not found or access denied' },
        { status: 404 }
      )
    }

    // Insert the new episode
    const { data: episode, error } = await supabase
      .from('episodes')
      .insert({
        show_id,
        title: title || null,
        description: description || null,
        audio_url,
        language: language || 'en',
        status: 'pending',
        guest_name: guest_name || null,
        guest_bio: guest_bio || null,
        metadata: {},
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Episode>>(
      { data: episode, error: null },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error creating episode:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
