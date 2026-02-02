import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_USER_ID, PAGINATION } from '@/lib/constants'
import type { EpisodeListItem, ApiResponse, PaginatedResponse } from '@/types/database'

/**
 * GET /api/episodes
 * List all episodes, optionally filtered by show_id
 */
export async function GET(request: NextRequest) {
  try {
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
      .eq('shows.user_id', DEFAULT_USER_ID)

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
        guest_name,
        published_at,
        created_at,
        updated_at,
        shows!inner(user_id, name)
      `)
      .eq('shows.user_id', DEFAULT_USER_ID)

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
    console.error('Error fetching episodes:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
