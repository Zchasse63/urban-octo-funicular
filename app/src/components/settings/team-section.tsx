"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Users, Plus, Trash2, ChevronDown, Mail, Shield, Eye, Edit3, UserPlus, X, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string
  owner_user_id: string
  member_user_id: string
  role: 'admin' | 'editor' | 'viewer'
  invited_email: string | null
  status: 'pending' | 'active' | 'revoked'
  created_at: string
  updated_at: string
}

interface TeamData {
  data: TeamMember[]
  seats: { used: number; total: number }
  tier: string
}

interface TeamSectionProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info', icon?: React.ElementType) => void
}

// ─── Role Config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Shield, color: 'text-amber-700 bg-amber-50 border-amber-200/60' },
  editor: { label: 'Editor', icon: Edit3, color: 'text-sky-700 bg-sky-50 border-sky-200/60' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-stone-600 bg-stone-100 border-stone-200/60' },
} as const

// ─── Status Dot ───────────────────────────────────────────────────────────────

const StatusIndicator = ({ status }: { status: TeamMember['status'] }) => {
  const config = {
    active: { color: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]', label: 'Active' },
    pending: { color: 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]', label: 'Pending' },
    revoked: { color: 'bg-stone-300', label: 'Revoked' },
  }
  const { color, label } = config[status]

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-1.5 h-1.5 rounded-full', color)} />
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

// ─── Role Dropdown ────────────────────────────────────────────────────────────

const RoleDropdown = ({
  currentRole,
  onChange,
}: {
  currentRole: TeamMember['role']
  onChange: (role: TeamMember['role']) => void
}) => {
  const [open, setOpen] = useState(false)
  const config = ROLE_CONFIG[currentRole]
  const Icon = config.icon

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-sans font-semibold border transition-all',
          config.color
        )}
      >
        <Icon className="w-3 h-3" />
        {config.label}
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-1 z-30 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[140px]"
          >
            <div className="p-1">
              {(Object.keys(ROLE_CONFIG) as Array<TeamMember['role']>).map((role) => {
                const rc = ROLE_CONFIG[role]
                const RIcon = rc.icon
                return (
                  <button
                    key={role}
                    onClick={() => {
                      onChange(role)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-sans font-medium transition-colors',
                      role === currentRole
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <RIcon className="w-3.5 h-3.5" />
                    {rc.label}
                    {role === currentRole && <Check className="w-3 h-3 ml-auto text-emerald-500" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Member Row ───────────────────────────────────────────────────────────────

const MemberRow = ({
  member,
  onRoleChange,
  onRemove,
}: {
  member: TeamMember
  onRoleChange: (id: string, role: TeamMember['role']) => void
  onRemove: (id: string) => void
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 sm:px-5 py-3.5 group"
    >
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center flex-shrink-0">
        <Mail className="w-3.5 h-3.5 text-stone-500" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[13px] font-medium text-foreground truncate">
          {member.invited_email || 'Unknown'}
        </p>
        <StatusIndicator status={member.status} />
      </div>

      {/* Role */}
      <RoleDropdown
        currentRole={member.role}
        onChange={(role) => onRoleChange(member.id, role)}
      />

      {/* Remove */}
      <button
        onClick={() => onRemove(member.id)}
        className="p-1.5 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove member"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

// ─── Invite Form ──────────────────────────────────────────────────────────────

const InviteForm = ({
  onInvite,
  onCancel,
}: {
  onInvite: (email: string, role: TeamMember['role']) => void
  onCancel: () => void
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamMember['role']>('editor')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim() && email.includes('@')) {
      onInvite(email.trim(), role)
    }
  }

  return (
    <motion.form
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden"
      onSubmit={handleSubmit}
    >
      <div className="px-4 sm:px-5 py-4 bg-muted/50 border-b border-border/50 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            New Invitation
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            autoFocus
            type="email"
            placeholder="team-member@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-[13px] font-sans text-foreground placeholder:text-muted-foreground bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamMember['role'])}
            className="px-3 py-2 rounded-lg text-[13px] font-sans text-foreground bg-card border border-border focus:outline-none focus:border-stone-400 transition-all"
          >
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-lg text-[12px] font-sans text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!email.trim() || !email.includes('@')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-sans font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Send Invite
          </button>
        </div>
      </div>
    </motion.form>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeamSection({ addToast }: TeamSectionProps) {
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/team')
      if (!res.ok) throw new Error('Failed to fetch team')
      const data = await res.json()
      setTeamData(data)
    } catch {
      addToast('Failed to load team members', 'error', AlertCircle)
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const handleInvite = async (email: string, role: TeamMember['role']) => {
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to invite member')
      }

      addToast(`Invitation sent to ${email}`, 'success', Check)
      setShowInviteForm(false)
      await fetchTeam()
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to invite member',
        'error',
        AlertCircle
      )
    }
  }

  const handleRoleChange = async (memberId: string, role: TeamMember['role']) => {
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!res.ok) throw new Error('Failed to update role')

      addToast(`Role updated to ${role}`, 'success', Check)
      await fetchTeam()
    } catch {
      addToast('Failed to update role', 'error', AlertCircle)
    }
  }

  const handleRemove = async (memberId: string) => {
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to remove member')

      addToast('Team member removed', 'success', Check)
      await fetchTeam()
    } catch {
      addToast('Failed to remove team member', 'error', AlertCircle)
    }
  }

  const members = teamData?.data || []
  const seats = teamData?.seats || { used: 0, total: 5 }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-[14px] text-foreground tracking-tight">Team Members</h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {seats.used}/{seats.total} seats used
              </span>
              {/* Seat usage bar */}
              <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    seats.used / seats.total >= 0.8
                      ? 'bg-amber-400'
                      : 'bg-violet-400'
                  )}
                  style={{ width: `${Math.min(100, (seats.used / seats.total) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowInviteForm(true)}
          disabled={showInviteForm || seats.used >= seats.total}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white text-[11px] font-sans font-semibold hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-sm"
        >
          <Plus className="w-3 h-3" />
          Invite
        </button>
      </div>

      {/* Invite form */}
      <AnimatePresence>
        {showInviteForm && (
          <InviteForm
            onInvite={handleInvite}
            onCancel={() => setShowInviteForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Members list */}
      <div className="divide-y divide-border/50">
        {loading ? (
          <div className="px-5 py-8 text-center">
            <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mx-auto mb-2" />
            <p className="font-sans text-[11px] text-muted-foreground">Loading team...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <p className="font-sans text-[13px] font-medium text-muted-foreground mb-1">No team members yet</p>
            <p className="font-sans text-[11px] text-muted-foreground mb-4">
              Invite collaborators to help manage your podcast shows.
            </p>
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-sans font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite your first member
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer with seat info */}
      {members.length > 0 && (
        <div className="px-4 sm:px-5 py-3 bg-muted/30 border-t border-border/50">
          <p className="font-sans text-[11px] text-muted-foreground">
            <span className="font-semibold">Admins</span> can manage episodes and shows.{' '}
            <span className="font-semibold">Editors</span> can create and edit content.{' '}
            <span className="font-semibold">Viewers</span> have read-only access.
          </p>
        </div>
      )}
    </div>
  )
}
