"use client";

import Link from "next/link";
import { Mic2 } from "lucide-react";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import HealthGauge from "@/components/podbrain/health-gauge";
import { StatusBadge } from "@/components/podbrain/badge";
import type { EpisodeListItem } from "@/types/database";

interface EpisodeRowProps {
  episode: EpisodeListItem;
  /** Show extra metadata like duration and guest name (used in full list view) */
  detailed?: boolean;
}

export default function EpisodeRow({ episode, detailed = false }: EpisodeRowProps) {
  return (
    <Link href={`/episodes/${episode.id}`}>
      <div className="group relative flex items-center gap-4 rounded-xl border border-border-soft bg-bg-elevated p-4 shadow-[var(--shadow-topo)] transition-all hover:shadow-[var(--shadow-topo-hover)] hover:border-border-focus/20 hover:-translate-y-0.5">
        {/* Left accent bar — fades in on hover */}
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-accent-blue opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 transition-colors group-hover:bg-accent-blue/15">
          <Mic2 className="h-5 w-5 text-accent-blue" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">
            {episode.title || "Untitled Episode"}
          </p>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{episode.shows?.name || "Unknown Show"}</span>
            <span>·</span>
            <span>{formatRelativeTime(episode.created_at)}</span>
            {detailed && episode.audio_duration_seconds && (
              <>
                <span>·</span>
                <span>{formatDuration(episode.audio_duration_seconds)}</span>
              </>
            )}
            {detailed && episode.guest_name && (
              <>
                <span>·</span>
                <span className="truncate">Guest: {episode.guest_name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {episode.seo_score !== null && (
            <HealthGauge
              value={episode.seo_score}
              label="SEO"
              size="sm"
              showLabel={false}
            />
          )}
          <StatusBadge status={episode.status} />
        </div>
      </div>
    </Link>
  );
}
