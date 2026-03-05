import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers'
import { UpdateTeamMemberSchema, parseBody } from '@/lib/validation-schemas'
import type { ApiResponse } from '@/types/database'

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

const parsed = parseBody(body, UpdateTeamMemberSchema)
    if (parsed.response) return parsed.response

    const { data: member, error } = await supabase
      .from('team_members')
      .update({ role: parsed.data.role, updated_at: new Date().toISOString() })
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
