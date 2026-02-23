"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: string | number
  accent?: boolean
}

function NavItem({ href, icon: Icon, label, badge, accent = false }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3",
        "px-3 py-2 mx-2 rounded-[var(--radius-md)]",
        "text-[var(--text-body-sm)] font-[family-name:var(--font-display)] font-medium",
        "transition-all duration-[var(--duration-fast)]",
        "group relative",
        isActive
          ? [
              "bg-[var(--color-bg-surface)] text-[var(--color-text-ink)]",
              "shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)]",
              "border border-[var(--color-border-strong)]",
              "ring-1 ring-inset ring-white/40",
            ].join(" ")
          : accent
            ? "text-[var(--color-accent-blue)] hover:bg-[var(--color-bg-surface)] hover:shadow-[var(--shadow-button)]"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-ink)] hover:bg-[var(--color-bg-active)]"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--color-accent-blue)]" />
      )}
      <Icon
        className={cn(
          "w-[18px] h-[18px] flex-shrink-0",
          "transition-colors duration-[var(--duration-fast)]",
          isActive
            ? "text-[var(--color-accent-blue)]"
            : accent
              ? "text-[var(--color-accent-blue)]"
              : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]"
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "text-[var(--text-label)] font-[family-name:var(--font-mono)]",
            "px-1.5 py-0.5 rounded-[var(--radius-full)]",
            "bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]",
            "border border-[var(--color-border)]",
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

export { NavItem }
