import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, successResponse, handleApiError } from '@/lib/api/helpers'
import { getUserTier, getTierLimits } from '@/lib/tier-limits'
import { InviteTeamMemberSchema, parseBody } from '@/lib/validation-schemas'

export interface TeamMember {
  id: string
  owner_user_id: string
  member_user_id: string
  role: 'admin' | 'editor' | 'viewer'
  invited_email: string | null
  status: 'pending' | 'active' | 'revoked'
  created_at: string
  updated_at: string
}

/**
 * GET /api/team
 * List all team members for the current user (as owner)
 */
export async function GET() {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()

    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_user_id', userId)
      .neq('status', 'revoked')
      .order('created_at', { ascending: false })

    if (error) {
console.error('Error fetching team members:', error)
return errorResponse('Internal server error', 500)
    }

    // Get seat limit
    const tier = await getUserTier(userId)
    const limits = getTierLimits(tier)
    const activeCount = (members || []).filter(
      (m: TeamMember) => m.status === 'active' || m.status === 'pending'
    ).length

    return NextResponse.json({
      data: members || [],
      seats: {
        used: activeCount,
        total: limits.teamSeats,
      },
      tier,
    })
  } catch (error) {
    return handleApiError(error, 'fetching team members')
  }
}

/**
 * POST /api/team
 * Invite a new team member
 * Body: { email: string, role: 'admin' | 'editor' | 'viewer' }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()

    // Check tier allows team seats
    const tier = await getUserTier(userId)
    const limits = getTierLimits(tier)

    if (limits.teamSeats <= 1) {
      return errorResponse('Team collaboration requires the Agency plan. Please upgrade to invite team members.', 403)
    }

    // Count current active/pending members
    const { count: seatCount, error: countError } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', userId)
      .in('status', ['pending', 'active'])

    if (countError) {
console.error('Error counting team seats:', countError)
return errorResponse('Internal server error', 500)
    }

    if ((seatCount || 0) >= limits.teamSeats) {
      return errorResponse(`You've reached your ${limits.teamSeats} team seat limit. Remove a member to add a new one.`, 403)
    }

    const body = await request.json()

    const parsed = parseBody(body, InviteTeamMemberSchema)
    if (parsed.response) return parsed.response
    const email = parsed.data.email.trim().toLowerCase()
    const role = parsed.data.role

    // Check if already invited
    const { data: existing } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('owner_user_id', userId)
      .eq('invited_email', email)
      .in('status', ['pending', 'active'])
      .maybeSingle()

    if (existing) {
      return errorResponse('This email has already been invited to your team', 409)
    }

    // Look up user by email to get member_user_id
    // If they don't exist yet, use owner's ID as placeholder (will be linked on sign-up)
    const { data: memberUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    const memberUserId = memberUser?.id || userId // placeholder if not found yet

    const { data: member, error: insertError } = await supabase
      .from('team_members')
      .insert({
        owner_user_id: userId,
        member_user_id: memberUserId,
        role,
        invited_email: email,
        status: memberUser ? 'active' : 'pending',
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return errorResponse('This user is already on your team', 409)
      }
console.error('Error inviting team member:', insertError)
return errorResponse('Internal server error', 500)
    }

    // Note: Email notification would be sent here via Resend
    // Skipping for now — just create the record

    return successResponse(member, 201)
  } catch (error) {
    return handleApiError(error, 'inviting team member')
  }
}
