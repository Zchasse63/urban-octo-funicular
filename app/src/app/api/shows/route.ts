import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { canCreateShow } from '@/lib/tier-limits'
import { PAGINATION } from '@/lib/constants'
import type { Show, ApiResponse, PaginatedResponse } from '@/types/database'

/**
 * GET /api/shows
 * List all shows for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = Math.min(
      parseInt(searchParams.get('per_page') || String(PAGINATION.defaultPageSize), 10),
      PAGINATION.maxPageSize
    )
    const offset = (page - 1) * perPage

    // Get total count
    const { count, error: countError } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: countError.message },
        { status: 500 }
      )
    }

    // Get paginated shows
    const { data: shows, error } = await supabase
      .from('shows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<PaginatedResponse<Show>>({
      data: shows || [],
      total: count || 0,
      page,
      per_page: perPage,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching shows:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shows
 * Create a new show
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth()

    // Tier enforcement: check show limit
    const showCheck = await canCreateShow(userId)
    if (!showCheck.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: showCheck.reason || 'Show limit reached' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show name is required' },
        { status: 400 }
      )
    }

    const showData = {
      user_id: userId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      default_language: body.default_language || 'en',
      style_preferences: body.style_preferences || {},
      artwork_url: body.artwork_url || null,
    }

    const { data: show, error } = await supabase
      .from('shows')
      .insert(showData)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'A show with this name already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Show>>(
      { data: show, error: null },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error creating show:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
