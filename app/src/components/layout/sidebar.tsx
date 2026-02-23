"use client"

import { useState, useEffect } from "react"
import {
  Mic,
  Upload,
  BookType,
  Search,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Brain,
  Zap,
  ArrowUpRight,
} from "lucide-react"
import { NavItem } from "./nav-item"
import { ShowSelector } from "./show-selector"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"
import useShows from "@/hooks/use-shows"

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { shows } = useShows()
  const [currentShow, setCurrentShow] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (shows.length > 0 && !currentShow) {
      setCurrentShow({ id: shows[0].id, name: shows[0].name })
    }
  }, [shows, currentShow])

  return (
    <aside
      className={cn(
        "flex flex-col h-screen",
        "bg-[var(--color-bg-sidebar)]",
        "border-r border-[var(--color-border-strong)]",
        "transition-all duration-[var(--duration-slow)] ease-[var(--ease-out)]",
        "flex-shrink-0",
        collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Brand */}
      <div className="border-b border-[var(--color-border)]">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-8 h-8 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-blue)] to-[#1D4ED8] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_4px_rgba(37,99,235,0.4),0_4px_12px_rgba(37,99,235,0.15)]">
              <Brain className="w-4.5 h-4.5 text-white drop-shadow-sm" />
            </div>
            <div>
              <span className="font-[family-name:var(--font-display)] font-bold text-[var(--text-body)] text-[var(--color-text-ink)] leading-none block tracking-tight">
                PodBrain
              </span>
              <span className="text-[9px] font-[family-name:var(--font-mono)] text-[var(--color-text-tertiary)] uppercase tracking-[0.12em] leading-none mt-[2px] block">
                AI Studio
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="w-8 h-8 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-blue)] to-[#1D4ED8] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_4px_rgba(37,99,235,0.4),0_4px_12px_rgba(37,99,235,0.15)]">
              <Brain className="w-4.5 h-4.5 text-white drop-shadow-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Show Selector */}
      {!collapsed && (
        <div className="border-b border-[var(--color-border)]">
          <ShowSelector
            shows={shows.map(s => ({ id: s.id, name: s.name }))}
            currentShow={currentShow}
            onSelectShow={setCurrentShow}
            onCreateShow={() => {/* TODO: open create show dialog */}}
          />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {!collapsed && (
          <div className="text-label px-5 py-2">Workspace</div>
        )}
        <NavItem href="/episodes" icon={Mic} label="Episodes" />
        <NavItem href="/upload" icon={Upload} label="Upload" accent />

        <div className="my-3 mx-4 h-px bg-[var(--color-border)]" />

        {!collapsed && (
          <div className="text-label px-5 py-2">Tools</div>
        )}
        <NavItem href="/vocabulary" icon={BookType} label="Vocabulary" />
        <NavItem href="/experts" icon={Search} label="Experts" />
      </nav>

      {/* Usage indicator — mini card with upgrade CTA */}
      {!collapsed && (
        <div className="mx-3 mb-3">
          <div className="px-3 py-3 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[var(--color-accent-warm)]" />
                <span className="text-[var(--text-label)] font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Free Plan
                </span>
              </div>
              <a
                href="/settings"
                className="text-[9px] font-[family-name:var(--font-mono)] text-[var(--color-accent-blue)] uppercase tracking-wider hover:underline flex items-center gap-0.5"
              >
                Upgrade
                <ArrowUpRight className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-warm)] to-[var(--color-accent-warm-hover)]"
                style={{ width: '33%' }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--color-text-tertiary)]">
                1 of 3 episodes
              </span>
              <span className="text-[10px] font-[family-name:var(--font-mono)] text-[var(--color-text-tertiary)]">
                33%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] py-2">
        <NavItem href="/settings" icon={Settings} label="Settings" />
        <NavItem href="/support" icon={HelpCircle} label="Support" />

        {/* Theme toggle + Collapse */}
        <div className={cn(
          "flex items-center mx-2 mt-1",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <ThemeToggle />
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-2",
              "px-2 py-2 rounded-[var(--radius-md)]",
              "text-[var(--color-text-tertiary)]",
              "transition-colors duration-[var(--duration-fast)]",
              "hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-active)]",
              "cursor-pointer",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-[18px] h-[18px]" />
            ) : (
              <>
                <PanelLeftClose className="w-[18px] h-[18px]" />
                <span className="text-[var(--text-caption)] font-[family-name:var(--font-display)]">
                  Collapse
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}

export { Sidebar }
