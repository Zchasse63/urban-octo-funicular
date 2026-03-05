import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID, verifyShowOwnership } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers'
import { UpdateShowSchema, parseBody } from '@/lib/validation-schemas'
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

    const parsed = parseBody(body, UpdateShowSchema)
    if (parsed.response) return parsed.response

const updateData: Record<string, unknown> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }

    const { data: show, error } = await supabase
      .from('shows')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
console.error('Error updating show:', error)
return errorResponse('Internal server error', 500)
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
console.error('Error deleting show:', error)
return errorResponse('Internal server error', 500)
    }

    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error, 'deleting show')
  }
}
