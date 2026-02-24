"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, Plus } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { Show } from "@/types/database"

interface ShowSelectorProps {
  shows: Show[]
  currentShow: Show | null
  onSelectShow: (show: Show) => void
  onCreateShow?: () => void
  collapsed?: boolean
}

const showColors = [
  "bg-[var(--color-accent-blue)]",
  "bg-[var(--color-accent-warm)]",
  "bg-[var(--color-status-success)]",
  "bg-[#A34EBE]",
  "bg-[#F4A600]",
]

function getShowColor(index: number) {
  return showColors[index % showColors.length]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function ShowSelector({
  shows,
  currentShow,
  onSelectShow,
  onCreateShow,
  collapsed,
}: ShowSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentIndex = shows.findIndex((s) => s.id === currentShow?.id)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2",
          "transition-colors duration-[var(--duration-fast)]",
          "hover:bg-[var(--color-bg-hover)]",
          collapsed && "justify-center px-0"
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
            "text-[11px] font-bold text-white",
            currentIndex >= 0 ? getShowColor(currentIndex) : "bg-[var(--color-text-secondary)]"
          )}
        >
          {currentShow ? getInitials(currentShow.name) : "?"}
        </span>

        {!collapsed && (
          <>
            <div className="flex flex-1 flex-col items-start overflow-hidden">
              <span className="w-full truncate text-left font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
                {currentShow?.name || "Select Show"}
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {shows.length} show{shows.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[var(--color-text-tertiary)] transition-transform duration-[var(--duration-fast)]",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-1",
            "rounded-[var(--radius-md)] border border-[var(--color-border)]",
            "bg-[var(--color-bg-surface)] shadow-[var(--shadow-dropdown)]",
            "animate-enter py-1",
            collapsed && "left-full ml-2 top-0 w-52"
          )}
        >
          {shows.map((show, i) => (
            <button
              key={show.id}
              onClick={() => {
                onSelectShow(show)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2",
                "text-left transition-colors duration-[var(--duration-fast)]",
                "hover:bg-[var(--color-bg-hover)]",
                show.id === currentShow?.id && "bg-[var(--color-bg-active)]"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
                  "text-[9px] font-bold text-white",
                  getShowColor(i)
                )}
              >
                {getInitials(show.name)}
              </span>
              <span className="truncate font-[family-name:var(--font-display)] text-[var(--text-caption)] font-medium text-[var(--color-text-ink)]">
                {show.name}
              </span>
            </button>
          ))}

          {onCreateShow && (
            <>
              <div className="my-1 border-t border-[var(--color-border)]" />
              <button
                onClick={() => {
                  onCreateShow()
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2",
                  "text-left transition-colors duration-[var(--duration-fast)]",
                  "hover:bg-[var(--color-bg-hover)]",
                  "text-[var(--color-accent-blue)]"
                )}
              >
                <Plus className="h-4 w-4" />
                <span className="font-[family-name:var(--font-display)] text-[var(--text-caption)] font-medium">
                  New Show
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export { ShowSelector }
