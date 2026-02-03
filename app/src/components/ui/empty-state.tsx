import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-8", className)}>
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-blue)]/10 to-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/20 flex items-center justify-center mb-6 text-[var(--accent-blue)]">
        {icon}
      </div>
      <h3 className="text-heading-lg text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-body text-[var(--text-secondary)] max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
