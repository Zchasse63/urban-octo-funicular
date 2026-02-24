"use client"

import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  Upload,
  BookOpen,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
} from "lucide-react"
import { NavItem } from "./nav-item"
import { ShowSelector } from "./show-selector"
import { PlanCard } from "./plan-card"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import useShows from "@/hooks/use-shows"
import useSubscription from "@/hooks/use-subscription"
import { useState, useEffect } from "react"
import type { Show } from "@/types/database"

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  className?: string
}

function Sidebar({ collapsed, onToggleCollapse, className }: SidebarProps) {
  const { shows } = useShows()
  const { subscription } = useSubscription()
  const [currentShow, setCurrentShow] = useState<Show | null>(null)

  // Set first show as current when shows load
  useEffect(() => {
    if (shows.length > 0 && !currentShow) {
      setCurrentShow(shows[0])
    }
  }, [shows, currentShow])

  const tier = subscription?.tier || "free"

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--color-border)]",
        "bg-[var(--color-bg-sidebar)]",
        "transition-[width] duration-[var(--duration-normal)] ease-out",
        collapsed ? "w-16" : "w-60",
        className
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-[var(--color-border)]",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4"
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent-blue)]">
          <span className="text-[11px] font-bold text-white">PB</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-bold text-[var(--color-text-ink)]">
              PodBrain
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-[var(--color-text-tertiary)]">
              AI Studio v2.4
            </span>
          </div>
        )}
      </div>

      {/* Show Selector */}
      <div className={cn("border-b border-[var(--color-border)]", collapsed ? "px-2 py-2" : "px-2 py-2")}>
        <ShowSelector
          shows={shows}
          currentShow={currentShow}
          onSelectShow={setCurrentShow}
          collapsed={collapsed}
        />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {/* Workspace section */}
        {!collapsed && (
          <span className="mb-1 px-3 text-label text-[var(--color-text-tertiary)]">
            WORKSPACE
          </span>
        )}

        <NavItem
          icon={LayoutGrid}
          label="Episodes"
          href="/episodes"
          statusColor="success"
          collapsed={collapsed}
        />
        <NavItem
          icon={Upload}
          label="Upload"
          href="/upload"
          isAccent
          collapsed={collapsed}
        />
        <NavItem
          icon={BookOpen}
          label="Vocabulary"
          href="/vocabulary"
          statusColor="warning"
          collapsed={collapsed}
        />
        <NavItem
          icon={Users}
          label="Experts"
          href="/experts"
          statusColor="success"
          collapsed={collapsed}
        />
      </nav>

      {/* Plan Card */}
      <div className="px-0 pb-2">
        <PlanCard
          tier={tier}
          collapsed={collapsed}
        />
      </div>

      {/* Footer */}
      <div
        className={cn(
          "flex flex-col gap-0.5 border-t border-[var(--color-border)] px-2 py-2",
        )}
      >
        <NavItem
          icon={Settings}
          label="Settings"
          href="/settings"
          collapsed={collapsed}
        />
        <NavItem
          icon={HelpCircle}
          label="Support"
          href="/support"
          collapsed={collapsed}
        />

        <div
          className={cn(
            "mt-1 flex items-center",
            collapsed ? "justify-center" : "justify-between px-1"
          )}
        >
          <ThemeToggle />

          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
              "text-[var(--color-text-tertiary)] transition-all duration-[var(--duration-fast)]",
              "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-[var(--duration-fast)]",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>
    </aside>
  )
}

export { Sidebar }
