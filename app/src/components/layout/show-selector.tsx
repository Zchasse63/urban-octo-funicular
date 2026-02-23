"use client"

import { ChevronDown, Plus, Radio } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

interface Show {
  id: string
  name: string
}

interface ShowSelectorProps {
  shows: Show[]
  currentShow: Show | null
  onSelectShow: (show: Show) => void
  onCreateShow: () => void
}

function ShowSelector({ shows, currentShow, onSelectShow, onCreateShow }: ShowSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={[
            "flex items-center gap-3 w-full",
            "px-4 py-3",
            "text-left",
            "transition-colors duration-[var(--duration-fast)]",
            "hover:bg-[var(--color-bg-active)]",
            "cursor-pointer",
          ].join(" ")}
        >
          {/* Show avatar */}
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-warm-light)] border border-[var(--color-accent-warm)]/20 flex items-center justify-center flex-shrink-0">
            <Radio className="w-3.5 h-3.5 text-[var(--color-accent-warm)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[var(--text-body-sm)] font-[family-name:var(--font-display)] font-semibold text-[var(--color-text-ink)] truncate leading-tight">
              {currentShow?.name || "Select Show"}
            </div>
            <div className="text-[var(--text-label)] font-[family-name:var(--font-mono)] text-[var(--color-text-tertiary)] uppercase tracking-wider leading-tight">
              {shows.length} show{shows.length !== 1 ? "s" : ""}
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel>Your Shows</DropdownMenuLabel>
        {shows.map((show) => (
          <DropdownMenuItem
            key={show.id}
            onClick={() => onSelectShow(show)}
          >
            <Radio className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            <span className="truncate">{show.name}</span>
            {currentShow?.id === show.id && (
              <span className="ml-auto status-dot status-dot-success" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateShow}>
          <Plus className="w-4 h-4 text-[var(--color-accent-blue)]" />
          <span className="text-[var(--color-accent-blue)]">New Show</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ShowSelector }
