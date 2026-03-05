import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers'

/**
 * PATCH /api/team/[id]
 * Update a team member's role
 * Body: { role: 'admin' | 'editor' | 'viewer' }
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
      return errorResponse('Invalid team member ID', 400)
    }

    const body = await request.json()
    const validRoles = ['admin', 'editor', 'viewer']

    if (!body.role || !validRoles.includes(body.role)) {
      return errorResponse('Role must be admin, editor, or viewer', 400)
    }

    const { data: member, error } = await supabase
      .from('team_members')
      .update({ role: body.role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_user_id', userId)
      .select()
      .single()

    if (error) {
console.error('Error updating team member:', error)
return errorResponse('Internal server error', 500)
    }

    if (!member) {
      return errorResponse('Team member not found', 404)
    }

    return successResponse(member)
  } catch (error) {
    return handleApiError(error, 'updating team member')
  }
}

/**
 * DELETE /api/team/[id]
 * Remove (revoke) a team member
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
      return errorResponse('Invalid team member ID', 400)
    }

    // Soft-delete: set status to 'revoked'
    const { data: member, error } = await supabase
      .from('team_members')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_user_id', userId)
      .select()
      .single()

    if (error) {
console.error('Error removing team member:', error)
return errorResponse('Internal server error', 500)
    }

    if (!member) {
      return errorResponse('Team member not found', 404)
    }

    return successResponse(member)
  } catch (error) {
    return handleApiError(error, 'removing team member')
  }
}
