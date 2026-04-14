import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError, parsePagination } from '@/lib/api/helpers'
import { canProcessEpisode } from '@/lib/tier-limits'
import { checkRateLimit } from '@/lib/rate-limit'
import { CreateEpisodeSchema, parseBody } from '@/lib/validation-schemas'
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
    const { page, perPage, offset } = parsePagination(searchParams)

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
console.error('Error counting episodes:', countError)
return errorResponse('Internal server error', 500)
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
console.error('Error fetching episodes:', error)
return errorResponse('Internal server error', 500)
    }

    return NextResponse.json<PaginatedResponse<EpisodeListItem>>({
      data: episodes || [],
      total: count || 0,
      page,
      per_page: perPage,
    })
  } catch (error) {
    return handleApiError(error, 'fetching episodes')
  }
}

/**
 * POST /api/episodes
 * Create a new episode for a show
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth()

    const rl = await checkRateLimit(`create-episode:${userId}`, 20)
    if (!rl.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Rate limit exceeded. Please try again shortly.' },
        { status: 429 }
      )
    }

    // Tier enforcement: check audio hours limit
    const hoursCheck = await canProcessEpisode(userId)
    if (!hoursCheck.allowed) {
      return errorResponse(hoursCheck.reason || 'Audio hours limit reached', 403)
    }

    const supabase = await createClient()
    const body = await request.json()

    const parsed = parseBody(body, CreateEpisodeSchema)
    if (parsed.response) return parsed.response

const { show_id, title, description, audio_url, guest_name, guest_bio, language } = parsed.data

    // Verify the show exists and belongs to the user
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('id')
      .eq('id', show_id)
      .eq('user_id', userId)
      .single()

    if (showError || !show) {
      return errorResponse('Show not found or access denied', 404)
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
console.error('Error creating episode:', error)
return errorResponse('Internal server error', 500)
    }

    return successResponse(episode, 201)
  } catch (error) {
    return handleApiError(error, 'creating episode')
  }
}
