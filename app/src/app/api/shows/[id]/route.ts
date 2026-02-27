import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID, verifyShowOwnership } from '@/lib/auth'
import type { Show, ApiResponse } from '@/types/database'

/**
 * GET /api/shows/[id]
 * Get a single show by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    if (!isValidUUID(id)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid show ID' },
        { status: 400 }
      )
    }

    const { data: show, error } = await supabase
      .from('shows')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !show) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<Show>>({ data: show, error: null })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching show:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/shows/[id]
 * Update a show's properties
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    if (!isValidUUID(id)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid show ID' },
        { status: 400 }
      )
    }

    const isOwner = await verifyShowOwnership(id, userId)
    if (!isOwner) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Build update object from allowed fields
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.default_language !== undefined) updateData.default_language = body.default_language
    if (body.style_preferences !== undefined) updateData.style_preferences = body.style_preferences
    if (body.artwork_url !== undefined) updateData.artwork_url = body.artwork_url

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()

    const { data: show, error } = await supabase
      .from('shows')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Show>>({ data: show, error: null })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error updating show:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shows/[id]
 * Delete a show
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    if (!isValidUUID(id)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid show ID' },
        { status: 400 }
      )
    }

    const isOwner = await verifyShowOwnership(id, userId)
    if (!isOwner) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Show not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: { deleted: true }, error: null })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error deleting show:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
