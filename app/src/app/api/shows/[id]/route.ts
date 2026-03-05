import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID, verifyShowOwnership } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers'

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
      return errorResponse('Invalid show ID', 400)
    }

    const { data: show, error } = await supabase
      .from('shows')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !show) {
      return errorResponse('Show not found', 404)
    }

    return successResponse(show)
  } catch (error) {
    return handleApiError(error, 'fetching show')
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
      return errorResponse('Invalid show ID', 400)
    }

    const isOwner = await verifyShowOwnership(id, userId)
    if (!isOwner) {
      return errorResponse('Show not found', 404)
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
      return errorResponse('No valid fields to update', 400)
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
      return errorResponse(error.message, 500)
    }

    return successResponse(show)
  } catch (error) {
    return handleApiError(error, 'updating show')
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
      return errorResponse('Invalid show ID', 400)
    }

    const isOwner = await verifyShowOwnership(id, userId)
    if (!isOwner) {
      return errorResponse('Show not found', 404)
    }

    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error, 'deleting show')
  }
}
