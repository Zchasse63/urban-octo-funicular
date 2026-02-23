"use client"

import { ArrowLeft, Play, Download, MoreHorizontal, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { StatusDot } from "./status-dot"
import { SignalChain } from "./signal-chain"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { EpisodeStatus } from "@/types/database"

interface EpisodeHeaderProps {
  title: string | null
  status: EpisodeStatus
  guestName: string | null
  seoScore: number | null
  onProcess?: () => void
  onExport?: () => void
}

function EpisodeHeader({ title, status, guestName, seoScore, onProcess, onExport }: EpisodeHeaderProps) {
  const statusVariant = {
    completed: "success" as const,
    processing: "processing" as const,
    failed: "error" as const,
    pending: "default" as const,
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Back + Status */}
      <div className="flex items-center gap-3">
        <Link
          href="/episodes"
          className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-ink)] transition-colors text-[var(--text-body-sm)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-[family-name:var(--font-display)]">Episodes</span>
        </Link>
        <span className="text-[var(--color-border)]">/</span>
        <Badge variant={statusVariant[status]}>
          <StatusDot status={status} />
          {status}
        </Badge>
      </div>

      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[var(--text-display)] font-[family-name:var(--font-display)] font-bold text-[var(--color-text-ink)]">
            {title || "Untitled Episode"}
          </h1>
          {guestName && (
            <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] mt-1">
              with {guestName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {status === "pending" && (
            <Button onClick={onProcess}>
              <Play className="w-4 h-4" />
              Process
            </Button>
          )}
          {status === "completed" && (
            <Button variant="secondary" onClick={onExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
          {status === "failed" && (
            <Button variant="warm" onClick={onProcess}>
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <RefreshCw className="w-4 h-4" />
                Reprocess
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[var(--color-status-error)]">
                <Trash2 className="w-4 h-4" />
                Delete Episode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Signal Chain */}
      <SignalChain status={status} />
    </div>
  )
}

export { EpisodeHeader }
