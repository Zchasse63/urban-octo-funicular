"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, LayoutGroup } from "motion/react";
import { Mic2, Search, ChevronDown } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import PageHeader from "@/components/podbrain/page-header";
import EmptyState from "@/components/podbrain/empty-state";
import EpisodeRow from "@/components/podbrain/episode-row";
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
            className="h-9 w-full rounded-lg border border-border-soft bg-bg-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          />
        </div>

        {/* Show Filter */}
        {shows.length > 1 && (
          <div className="relative">
            <select
              value={showFilter}
              onChange={(e) => {
                setShowFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 appearance-none rounded-lg border border-border-soft bg-bg-elevated pl-3 pr-8 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            >
              <option value="">All Shows</option>
              {shows.map((show) => (
                <option key={show.id} value={show.id}>
                  {show.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
          </div>
        )}

        {/* Status Tabs */}
        <LayoutGroup id="episode-filters">
          <div className="flex gap-1 rounded-lg border border-border-soft bg-bg-subtle p-0.5">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  setStatusFilter(filter.id);
                  setPage(1);
                }}
                className={`relative rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === filter.id
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {statusFilter === filter.id && (
                  <motion.div
                    layoutId="episode-status-active"
                    className="absolute inset-0 rounded-md bg-bg-elevated shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative">{filter.label}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
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
                <EpisodeRow episode={episode} detailed />
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
