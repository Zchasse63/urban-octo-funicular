"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Upload, ArrowRight, Sparkles } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";
import PageHeader from "@/components/podbrain/page-header";
import { StatCard } from "@/components/podbrain/content-card";
import HealthGauge from "@/components/podbrain/health-gauge";
import EmptyState from "@/components/podbrain/empty-state";
import EpisodeRow from "@/components/podbrain/episode-row";
import SectionHeading from "@/components/podbrain/section-heading";
import { PrimaryButton } from "@/components/podbrain/buttons";
import useEpisodes from "@/hooks/use-episodes";
import useShows from "@/hooks/use-shows";

export default function DashboardPage() {
  const { episodes, total: totalEpisodes, isLoading: episodesLoading } = useEpisodes({ perPage: 5 });
  const { shows, total: totalShows, isLoading: showsLoading } = useShows();

  const isLoading = episodesLoading || showsLoading;

  // Aggregate health scores from completed episodes
  const completedEpisodes = episodes.filter((ep) => ep.status === "completed");
  const avgSeoScore =
    completedEpisodes.length > 0
      ? Math.round(
          completedEpisodes.reduce((sum, ep) => sum + (ep.seo_score || 0), 0) /
            completedEpisodes.length
        )
      : 0;

  // Compute readability from seo_analysis (now included in API response)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getAnalysis = (ep: unknown): any => (ep as any)?.seo_analysis;
  const episodesWithReadability = completedEpisodes.filter(
    (ep) => getAnalysis(ep)?.readability_score
  );
  const avgReadability =
    episodesWithReadability.length > 0
      ? Math.round(
          episodesWithReadability.reduce(
            (sum, ep) => sum + (getAnalysis(ep)?.readability_score || 0),
            0
          ) / episodesWithReadability.length
        )
      : 0;

  // Quality: % of completed episodes with show notes content
  const episodesWithNotes = completedEpisodes.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ep) => (ep as any)?.show_notes
  );
  const qualityScore =
    completedEpisodes.length > 0
      ? Math.round((episodesWithNotes.length / completedEpisodes.length) * 100)
      : 0;

  const processingCount = episodes.filter(
    (ep) => ep.status === "processing"
  ).length;
  const currentShow = shows[0];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-border-soft" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-border-soft" />
          ))}
        </div>
      </div>
    );
  }

  if (totalEpisodes === 0 && totalShows === 0) {
    return (
      <div>
        <PageHeader
          title="Welcome to PodBrain"
          description="AI-powered podcast content platform"
        />
        <EmptyState
          icon={Sparkles}
          title="Let's get started"
          description="Create a show and upload your first episode to unlock AI-powered show notes, SEO optimization, and 30+ content assets."
          actionLabel="Upload First Episode"
          actionHref="/upload"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={currentShow?.name || "Dashboard"}
        description={`${totalEpisodes} episode${totalEpisodes !== 1 ? "s" : ""} · ${totalShows} show${totalShows !== 1 ? "s" : ""}`}
        actions={
          <Link href="/upload">
            <PrimaryButton>
              <Upload className="mr-2 h-4 w-4" />
              New Episode
            </PrimaryButton>
          </Link>
        }
      />

      {/* Stats Row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <motion.div variants={staggerItem}>
          <StatCard label="Total Episodes" value={totalEpisodes} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard label="Shows" value={totalShows} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Processing"
            value={processingCount}
            sublabel={processingCount > 0 ? "In progress" : "All clear"}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label="Avg SEO Score"
            value={avgSeoScore || "—"}
            sublabel={completedEpisodes.length > 0 ? "Across episodes" : "No data yet"}
          />
        </motion.div>
      </motion.div>

      {/* Health Gauges */}
      {completedEpisodes.length > 0 && (
        <div className="mb-8">
          <SectionHeading className="mb-4">Content Health</SectionHeading>
          <div className="flex flex-wrap gap-6">
            <HealthGauge value={avgSeoScore} label="SEO" size="lg" />
            <HealthGauge value={qualityScore} label="Quality" size="lg" />
            <HealthGauge value={avgReadability} label="Readability" size="lg" />
          </div>
        </div>
      )}

      {/* Recent Episodes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <SectionHeading>Recent Episodes</SectionHeading>
          <Link
            href="/episodes"
            className="flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {episodes.map((episode) => (
            <motion.div key={episode.id} variants={staggerItem}>
              <EpisodeRow episode={episode} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
