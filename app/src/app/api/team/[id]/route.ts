import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, isValidUUID } from '@/lib/auth'
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid team member ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validRoles = ['admin', 'editor', 'viewer']

    if (!body.role || !validRoles.includes(body.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Role must be admin, editor, or viewer' },
        { status: 400 }
      )
    }

    const { data: member, error } = await supabase
      .from('team_members')
      .update({ role: body.role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    if (!member) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Team member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: member, error: null })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error updating team member:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid team member ID' },
        { status: 400 }
      )
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
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: error.message },
        { status: 500 }
      )
    }

    if (!member) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Team member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: member, error: null })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error removing team member:', error)
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
