import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError, parsePagination } from '@/lib/api/helpers'
import { canCreateShow } from '@/lib/tier-limits'
import type { Show, PaginatedResponse } from '@/types/database'
import { CreateShowSchema, parseBody } from '@/lib/validation-schemas'
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
    const { page, perPage, offset } = parsePagination(searchParams)

    // Get total count
    const { count, error: countError } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
console.error('Error counting shows:', countError)
return errorResponse('Internal server error', 500)
    }

    // Get paginated shows
    const { data: shows, error } = await supabase
      .from('shows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    if (error) {
console.error('Error fetching shows:', error)
return errorResponse('Internal server error', 500)
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
    return handleApiError(error, 'fetching shows')
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
      return errorResponse(showCheck.reason || 'Show limit reached', 403)
    }

    const supabase = await createClient()
    const body = await request.json()

const parsed = parseBody(body, CreateShowSchema)
    if (parsed.response) return parsed.response

    const showData = {
      user_id: userId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      default_language: parsed.data.default_language,
      style_preferences: parsed.data.style_preferences,
      artwork_url: parsed.data.artwork_url || null,
    }

    const { data: show, error } = await supabase
      .from('shows')
      .insert(showData)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return errorResponse('A show with this name already exists', 409)
      }
console.error('Error creating show:', error)
return errorResponse('Internal server error', 500)
    }

    return successResponse(show, 201)
  } catch (error) {
    return handleApiError(error, 'creating show')
  }
}
