"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Mic2, Search } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import PageHeader from "@/components/podbrain/page-header";
import EmptyState from "@/components/podbrain/empty-state";
import { StatusBadge } from "@/components/podbrain/badge";
import HealthGauge from "@/components/podbrain/health-gauge";
import { PrimaryButton } from "@/components/podbrain/buttons";
import useEpisodes from "@/hooks/use-episodes";
import useShows from "@/hooks/use-shows";
import useDebounce from "@/hooks/use-debounce";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "processing", label: "Processing" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

export default function EpisodesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilter, setShowFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { shows } = useShows();
  const { episodes, total, isLoading } = useEpisodes({
    showId: showFilter || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    perPage: 20,
    search: debouncedSearch || undefined,
  });

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader
        title="Episodes"
        description={`${total} episode${total !== 1 ? "s" : ""}`}
        actions={
          <Link href="/upload">
            <PrimaryButton>New Episode</PrimaryButton>
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search episodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border-soft bg-bg-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/15"
          />
        </div>

        {/* Show Filter */}
        {shows.length > 1 && (
          <select
            value={showFilter}
            onChange={(e) => {
              setShowFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-border-soft bg-bg-elevated px-3 text-sm text-text-primary"
          >
            <option value="">All Shows</option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
        )}

        {/* Status Tabs */}
        <div className="flex gap-1 rounded-lg border border-border-soft bg-bg-subtle p-0.5">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setStatusFilter(filter.id);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === filter.id
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Episode List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-border-soft" />
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="No episodes found"
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Upload your first episode to get started"
          }
          actionLabel={!search && statusFilter === "all" ? "Upload Episode" : undefined}
          actionHref="/upload"
        />
      ) : (
        <>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {episodes.map((episode) => (
              <motion.div key={episode.id} variants={staggerItem}>
                <Link href={`/episodes/${episode.id}`}>
                  <div className="flex items-center gap-4 rounded-xl border border-border-soft bg-bg-elevated p-4 transition-all hover:shadow-[var(--shadow-topo)] hover:border-border-focus/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
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
                        {episode.audio_duration_seconds && (
                          <>
                            <span>·</span>
                            <span>{formatDuration(episode.audio_duration_seconds)}</span>
                          </>
                        )}
                        {episode.guest_name && (
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
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border-soft px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-subtle disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-text-tertiary">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-border-soft px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-subtle disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
