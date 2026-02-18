"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  Globe,
  Twitter,
  Linkedin,
  Mail,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { PageHeader, FreshnessMeter, Badge, EmptyState } from "@/components/podbrain";
import useShows from "@/hooks/use-shows";
import useExperts from "@/hooks/use-experts";
import { springs, staggerContainer, staggerItem } from "@/lib/motion";
import type { Expert, ExpertCategory } from "@/lib/experts/types";

const CATEGORY_TABS: { id: ExpertCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fresh", label: "Fresh Voices" },
  { id: "established", label: "Established" },
  { id: "oversaturated", label: "Oversaturated" },
];

function ExpertCard({ expert }: { expert: Expert }) {
  const categoryColors: Record<ExpertCategory, string> = {
    fresh: "bg-status-success-bg text-status-success-text",
    established: "bg-status-warning-bg text-status-warning-text",
    oversaturated: "bg-status-error-bg text-status-error-text",
  };

  return (
    <motion.div
      variants={staggerItem}
      className="group rounded-xl border border-border-soft bg-bg-elevated p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary truncate">
              {expert.name}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${categoryColors[expert.category]}`}
            >
              {expert.category}
            </span>
          </div>
          {expert.metadata.affiliation && (
            <p className="mt-0.5 text-sm text-text-secondary">
              {expert.metadata.affiliation}
            </p>
          )}
          {expert.metadata.bio && (
            <p className="mt-2 text-sm text-text-secondary line-clamp-2">
              {expert.metadata.bio}
            </p>
          )}
        </div>
      </div>

      {/* Expertise Tags */}
      {expert.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {expert.expertise.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-bg-subtle px-2 py-0.5 text-xs text-text-secondary"
            >
              {tag}
            </span>
          ))}
          {expert.expertise.length > 4 && (
            <span className="inline-flex items-center rounded-md bg-bg-subtle px-2 py-0.5 text-xs text-text-tertiary">
              +{expert.expertise.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Freshness Meter */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>Freshness Score</span>
          <span className="font-mono">{expert.freshnessScore}/100</span>
        </div>
        <FreshnessMeter value={expert.freshnessScore} />
      </div>

      {/* Stats Row */}
      <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
        <span>{expert.appearanceCount} appearances</span>
        <span>{expert.recentAppearances} recent (12mo)</span>
        {expert.metadata.lastAppearanceDate && (
          <span>
            Last:{" "}
            {new Date(expert.metadata.lastAppearanceDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Contact Links */}
      <div className="mt-3 flex items-center gap-2 border-t border-border-soft pt-3">
        {expert.contactHints.website && (
          <a
            href={expert.contactHints.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-subtle hover:text-accent-blue"
          >
            <Globe className="h-4 w-4" />
          </a>
        )}
        {expert.contactHints.twitter && (
          <a
            href={`https://twitter.com/${expert.contactHints.twitter.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-subtle hover:text-accent-blue"
          >
            <Twitter className="h-4 w-4" />
          </a>
        )}
        {expert.contactHints.linkedin && (
          <a
            href={expert.contactHints.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-subtle hover:text-accent-blue"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
        {expert.contactHints.email && (
          <a
            href={`mailto:${expert.contactHints.email}`}
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-bg-subtle hover:text-accent-blue"
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
        {!expert.contactHints.website &&
          !expert.contactHints.twitter &&
          !expert.contactHints.linkedin &&
          !expert.contactHints.email && (
            <span className="text-xs text-text-tertiary italic">No contact info</span>
          )}
      </div>
    </motion.div>
  );
}

export default function ExpertsPage() {
  const { shows, isLoading: showsLoading } = useShows();
  const [selectedShowId, setSelectedShowId] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpertCategory | "all">("all");

  const { experts, topic, isLoading, error, search } = useExperts({
    showId: selectedShowId,
  });

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchInput.trim() && selectedShowId) {
        search(searchInput.trim());
      }
    },
    [searchInput, selectedShowId, search]
  );

  const filteredExperts =
    categoryFilter === "all"
      ? experts
      : experts.filter((e) => e.category === categoryFilter);

  return (
    <div>
      <PageHeader
        title="Expert Discovery"
        description="Find fresh guest experts and thought leaders by topic"
      />

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Show Selector */}
        <div className="relative">
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Select a show
          </label>
          <div className="relative">
            <select
              value={selectedShowId}
              onChange={(e) => setSelectedShowId(e.target.value)}
              disabled={showsLoading}
              className="w-full appearance-none rounded-lg border border-border-soft bg-bg-elevated px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
            >
              <option value="">Choose a show...</option>
              {shows.map((show) => (
                <option key={show.id} value={show.id}>
                  {show.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          </div>
        </div>

        {/* Topic Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for a topic (e.g., AI ethics, climate change, growth marketing)..."
              disabled={!selectedShowId}
              className="w-full rounded-lg border border-border-soft bg-bg-elevated py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!selectedShowId || !searchInput.trim() || isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isLoading ? "Searching..." : "Discover"}
          </button>
        </form>
      </div>

      {/* Category Filter Tabs */}
      {experts.length > 0 && (
        <div className="mb-6 flex gap-1 rounded-lg border border-border-soft bg-bg-subtle p-1">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.id === "all"
                ? experts.length
                : experts.filter((e) => e.category === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  categoryFilter === tab.id
                    ? "bg-bg-elevated text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 font-mono text-xs text-text-tertiary">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-status-error-bg bg-status-error-bg/30 p-6 text-center"
          >
            <p className="text-sm text-status-error-text">{error}</p>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-border-soft bg-bg-elevated p-16"
          >
            <div className="relative mb-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent-blue/20 border-t-accent-blue" />
            </div>
            <p className="text-sm text-text-secondary">
              Discovering experts for &ldquo;{searchInput}&rdquo;...
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              This may take a moment as we search across podcast databases
            </p>
          </motion.div>
        ) : experts.length > 0 ? (
          <motion.div
            key="results"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
            {filteredExperts.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-text-secondary">
                  No experts match the &ldquo;{CATEGORY_TABS.find((t) => t.id === categoryFilter)?.label}&rdquo; filter
                </p>
              </div>
            )}
          </motion.div>
        ) : topic ? (
          <EmptyState
            icon={Users}
            title="No Experts Found"
            description={`We couldn't find experts for "${topic}". Try a different topic or broader search terms.`}
          />
        ) : !selectedShowId ? (
          <EmptyState
            icon={Users}
            title="Select a Show"
            description="Choose a show above to start discovering guest experts"
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Discover Experts"
            description="Enter a topic to find fresh voices and thought leaders for your podcast"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
