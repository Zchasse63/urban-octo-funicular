"use client";

import React from "react";
import { motion, AnimatePresence, Variants, useReducedMotion } from "motion/react";
import { InteractiveCard } from "./interactive-card";
import { EpisodeRowData } from "@/components/episodes/episode-row";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EpisodeStatus } from "@/types/database";

// Reusable animation variants for staggered list animations
export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

interface EpisodeListProps {
  episodes: EpisodeRowData[];
  onEpisodeClick?: (id: string) => void;
}

function getHealthScoreColor(score: number | null): string {
  if (score === null) return "text-[var(--text-tertiary)]";
  if (score >= 80) return "text-[var(--accent-green)]";
  if (score >= 50) return "text-[var(--accent-amber)]";
  return "text-[var(--accent-red)]";
}

function getHealthScoreGradient(score: number | null): {
  background: string;
  border: string;
} {
  if (score === null) {
    return {
      background: "transparent",
      border: "var(--border-soft)",
    };
  }
  if (score >= 80) {
    return {
      background:
        "linear-gradient(135deg, rgba(52,199,89,0.1) 0%, rgba(52,199,89,0.05) 100%)",
      border: "rgba(52,199,89,0.2)",
    };
  }
  if (score >= 50) {
    return {
      background:
        "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)",
      border: "rgba(245,158,11,0.2)",
    };
  }
  return {
    background:
      "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)",
    border: "rgba(239,68,68,0.2)",
  };
}

function StatusBadge({
  status,
  alertCount,
}: {
  status: EpisodeStatus;
  alertCount?: number;
}) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="success" className="gap-1">
          <Check className="h-3 w-3" />
          Complete
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="new" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="error" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case "pending":
      if (alertCount && alertCount > 0) {
        return (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {alertCount} Alert{alertCount > 1 ? "s" : ""}
          </Badge>
        );
      }
      return <Badge variant="default">Pending</Badge>;
    default:
      return null;
  }
}

export function EpisodeList({ episodes, onEpisodeClick }: EpisodeListProps) {
  const prefersReducedMotion = useReducedMotion();

  const dynamicItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0 } : springs.gentle,
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: prefersReducedMotion ? 0 : 0.2 },
    },
  };

  if (episodes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : springs.gentle}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
        aria-label={`No episodes found. Upload your first episode to get started.`}
      >
        <p className="text-[var(--text-secondary)] text-lg">
          No episodes found
        </p>
        <p className="text-[var(--text-tertiary)] text-sm mt-2">
          Upload your first episode to get started
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
      aria-label={`Episode list with ${episodes.length} episode${episodes.length === 1 ? '' : 's'}`}
    >
      <AnimatePresence mode="popLayout">
        {episodes.map((episode) => {
          const scoreGradient = getHealthScoreGradient(episode.healthScore);

          return (
            <motion.div
              key={episode.id}
              variants={dynamicItemVariants}
              layout
              exit="exit"
            >
              <InteractiveCard
                onClick={() => onEpisodeClick?.(episode.id)}
                className="p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Episode title and number */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs text-[var(--text-tertiary)]">
                        EP {episode.episodeNumber.toString().padStart(3, "0")}
                      </span>
                      <h3 className="font-medium text-[var(--text-primary)] text-base truncate">
                        {episode.title}
                      </h3>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {episode.date}
                      </span>
                    </div>
                  </div>

                  {/* Health score and status */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    {/* Health Score */}
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full border"
                      style={{
                        background: scoreGradient.background,
                        borderColor: scoreGradient.border,
                      }}
                      aria-label={`Health score: ${episode.healthScore !== null ? episode.healthScore : "Not available"}`}
                    >
                      <span
                        className={cn(
                          "font-mono text-sm font-semibold tabular-nums",
                          getHealthScoreColor(episode.healthScore)
                        )}
                      >
                        {episode.healthScore !== null
                          ? episode.healthScore
                          : "--"}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      <StatusBadge
                        status={episode.status}
                        alertCount={episode.alertCount}
                      />
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
