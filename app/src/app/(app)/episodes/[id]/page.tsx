"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  RefreshCw,
  Send,
  Gift,
  Sparkles,
  FileText,
  BarChart3,
  Share2,
  Search as SearchIcon,
} from "lucide-react";
import { cn, formatDate, formatDuration, truncate } from "@/lib/utils";
import { springs } from "@/lib/motion";
import PageHeader from "@/components/podbrain/page-header";
import SectionHeading from "@/components/podbrain/section-heading";
import HealthGauge from "@/components/podbrain/health-gauge";
import { Badge, StatusBadge } from "@/components/podbrain/badge";
import {
  PrimaryButton,
  SecondaryButton,
  ExportButton,
  PublishButton,
} from "@/components/podbrain/buttons";
import GuestCard from "@/components/podbrain/guest-card";
import { ElevatedCard } from "@/components/podbrain/content-card";
import {
  AILoadingOrb,
  ProcessingSteps,
  ProcessingProgressBar,
} from "@/components/podbrain/processing-states";
import useEpisode from "@/hooks/use-episode";
import useEpisodeAssets from "@/hooks/use-episode-assets";
import useEpisodeSeo from "@/hooks/use-episode-seo";
import { useToast } from "@/hooks/use-toast";
import { getAssetsByCategory, ASSET_CATEGORIES, type AssetCategory } from "@/lib/assets/asset-types";
import type { GeneratedAsset } from "@/types/database";

const tabs = [
  { id: "show-notes", label: "Show Notes", icon: FileText },
  { id: "assets", label: "Social Assets", icon: Share2 },
  { id: "seo", label: "SEO", icon: SearchIcon },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-subtle hover:text-text-secondary transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-accent-green" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function AssetCard({
  asset,
  onRegenerate,
}: {
  asset: GeneratedAsset;
  onRegenerate: () => void;
}) {
  return (
    <div className="rounded-xl border border-border-soft bg-bg-elevated p-4">
      <div className="mb-2 flex items-center justify-between">
        <Badge variant="ai">
          {asset.asset_type.replace(/_/g, " ")}
        </Badge>
        <div className="flex items-center gap-1">
          <CopyButton text={asset.content} />
          <button
            type="button"
            onClick={onRegenerate}
            className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-subtle hover:text-text-secondary transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-text-primary whitespace-pre-wrap line-clamp-6">
        {asset.content}
      </p>
    </div>
  );
}

export default function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("show-notes");
  const [assetCategory, setAssetCategory] = useState("all");

  const { episode, isLoading: episodeLoading } = useEpisode(id);
  const { assets, isLoading: assetsLoading, regenerateAsset } = useEpisodeAssets(id);
  const { seoData, isLoading: seoLoading } = useEpisodeSeo(id);
  const toast = useToast();

  if (episodeLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-border-soft" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 h-96 rounded-xl bg-border-soft" />
          <div className="lg:col-span-2 h-96 rounded-xl bg-border-soft" />
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Episode not found</p>
        <Link href="/episodes" className="mt-2 text-accent-blue text-sm hover:underline">
          Back to Episodes
        </Link>
      </div>
    );
  }

  // Processing state
  if (episode.status === "processing") {
    return (
      <div>
        <Link
          href="/episodes"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mx-auto max-w-lg py-16 text-center">
          <AILoadingOrb className="mb-8" />
          <h2 className="text-xl font-semibold text-text-primary">
            Processing Episode
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {episode.title || "Your episode"} is being analyzed by AI
          </p>
          <ProcessingProgressBar
            progress={45}
            label="Overall Progress"
            className="mt-8"
          />
          <ProcessingSteps
            className="mt-6 text-left"
            steps={[
              { id: "1", label: "Transcribing audio", status: "completed" },
              { id: "2", label: "Processing vocabulary", status: "completed" },
              { id: "3", label: "Generating show notes", status: "active" },
              { id: "4", label: "SEO analysis", status: "pending" },
              { id: "5", label: "Creating content assets", status: "pending" },
            ]}
          />
        </div>
      </div>
    );
  }

  // Filter assets by category
  const filteredAssets =
    assetCategory === "all"
      ? assets
      : assets.filter((a) => {
          const categoryDefs = getAssetsByCategory(assetCategory as AssetCategory);
          const categoryAssetTypes = categoryDefs.map((def) => def.id);
          return categoryAssetTypes.includes(a.asset_type);
        });

  return (
    <div>
      {/* Back nav */}
      <Link
        href="/episodes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Episodes
      </Link>

      {/* Header */}
      <PageHeader
        title={episode.title || "Untitled Episode"}
        description={
          [
            episode.guest_name ? `Guest: ${episode.guest_name}` : null,
            formatDate(episode.created_at),
            episode.audio_duration_seconds
              ? formatDuration(episode.audio_duration_seconds)
              : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              onClick={() => {
                window.open(
                  `/api/episodes/${id}/assets/download`,
                  "_blank"
                );
              }}
            />
            {episode.guest_name && (
              <Link href={`/episodes/${id}/guest-package`}>
                <SecondaryButton>
                  <Gift className="mr-2 h-4 w-4" />
                  Guest Package
                </SecondaryButton>
              </Link>
            )}
            <PublishButton />
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="mb-8 flex flex-wrap gap-6">
        <HealthGauge
          value={episode.seo_score || 0}
          label="SEO Score"
          size="md"
        />
        <HealthGauge
          value={episode.seo_analysis?.readability_score || 0}
          label="Readability"
          size="md"
        />
        <HealthGauge
          value={assets.length > 0 ? Math.min(100, Math.round((assets.length / 30) * 100)) : 0}
          label="Assets"
          size="md"
        />
        <div className="ml-auto">
          <StatusBadge status={episode.status} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border-soft bg-bg-subtle p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Main Content (60%) */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === "show-notes" && (
              <motion.div
                key="show-notes"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={springs.smooth}
              >
                <ElevatedCard>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge variant="ai">
                      <Sparkles className="mr-1 h-3 w-3" />
                      AI Generated
                    </Badge>
                  </div>
                  {episode.show_notes_html ? (
                    <div
                      className="prose prose-sm max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-accent-blue"
                      dangerouslySetInnerHTML={{
                        __html: episode.show_notes_html,
                      }}
                    />
                  ) : episode.show_notes ? (
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">
                      {episode.show_notes}
                    </p>
                  ) : (
                    <p className="text-sm text-text-tertiary italic">
                      Show notes will appear here after processing completes.
                    </p>
                  )}
                </ElevatedCard>
              </motion.div>
            )}

            {activeTab === "assets" && (
              <motion.div
                key="assets"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={springs.smooth}
              >
                {/* Category Filter */}
                <div className="mb-4 flex gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setAssetCategory("all")}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      assetCategory === "all"
                        ? "bg-accent-blue text-white"
                        : "bg-bg-subtle text-text-secondary hover:text-text-primary"
                    )}
                  >
                    All ({assets.length})
                  </button>
                  {Object.entries(ASSET_CATEGORIES).map(([key, catInfo]) => {
                    const count = assets.filter((a) => {
                      const defs = getAssetsByCategory(key as AssetCategory);
                      return defs.map((d) => d.id).includes(a.asset_type);
                    }).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAssetCategory(key)}
                        className={cn(
                          "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          assetCategory === key
                            ? "bg-accent-blue text-white"
                            : "bg-bg-subtle text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {catInfo.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Asset Grid */}
                {filteredAssets.length === 0 ? (
                  <p className="py-8 text-center text-sm text-text-tertiary">
                    No assets generated yet
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onRegenerate={() => {
                          regenerateAsset(asset.asset_type);
                          toast.loading("Regenerating asset...");
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "seo" && (
              <motion.div
                key="seo"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={springs.smooth}
              >
                <ElevatedCard>
                  <h3 className="mb-4 text-sm font-semibold text-text-primary">
                    SEO Analysis
                  </h3>
                  {seoData?.seo_analysis ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <HealthGauge
                          value={seoData.seo_score || 0}
                          label="Overall Score"
                          size="lg"
                        />
                        <div className="space-y-1">
                          <p className="text-sm text-text-primary">
                            Readability:{" "}
                            <span className="font-medium">
                              {seoData.seo_analysis.readability_score}/100
                            </span>
                          </p>
                          <p className="text-sm text-text-primary">
                            Header Structure:{" "}
                            <span className="font-medium">
                              {seoData.seo_analysis.header_structure
                                ? "Good"
                                : "Needs Improvement"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {seoData.seo_analysis.suggestions.length > 0 && (
                        <div>
                          <SectionHeading className="mb-2 text-xs">
                            Suggestions
                          </SectionHeading>
                          <ul className="space-y-2">
                            {seoData.seo_analysis.suggestions.map(
                              (suggestion, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm text-text-secondary"
                                >
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-amber" />
                                  {suggestion}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-text-tertiary italic">
                      SEO data will appear here after processing completes.
                    </p>
                  )}
                </ElevatedCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar (40%) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Guest Info */}
          {episode.guest_name && (
            <ElevatedCard className="p-4">
              <SectionHeading className="mb-3 text-xs">
                Guest
              </SectionHeading>
              <GuestCard
                name={episode.guest_name}
                title={episode.guest_bio || undefined}
                className="border-0 p-0 shadow-none hover:shadow-none"
              />
            </ElevatedCard>
          )}

          {/* Episode Info */}
          <ElevatedCard className="p-4">
            <SectionHeading className="mb-3 text-xs">
              Details
            </SectionHeading>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Status</dt>
                <dd><StatusBadge status={episode.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Created</dt>
                <dd className="text-text-primary">{formatDate(episode.created_at)}</dd>
              </div>
              {episode.audio_duration_seconds && (
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Duration</dt>
                  <dd className="text-text-primary">
                    {formatDuration(episode.audio_duration_seconds)}
                  </dd>
                </div>
              )}
              {episode.language && (
                <div className="flex justify-between">
                  <dt className="text-text-secondary">Language</dt>
                  <dd className="text-text-primary">{episode.language}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-text-secondary">Assets</dt>
                <dd className="text-text-primary">{assets.length} generated</dd>
              </div>
            </dl>
          </ElevatedCard>

          {/* Viral Moments */}
          {episode.viral_moments && episode.viral_moments.length > 0 && (
            <ElevatedCard className="p-4">
              <SectionHeading className="mb-3 text-xs">
                Viral Moments
              </SectionHeading>
              <div className="space-y-2">
                {episode.viral_moments.slice(0, 3).map((moment, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-bg-subtle p-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="ai">{moment.type}</Badge>
                      <span className="text-xs font-medium text-accent-blue">
                        Score: {moment.score}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {moment.text}
                    </p>
                  </div>
                ))}
              </div>
            </ElevatedCard>
          )}
        </div>
      </div>
    </div>
  );
}
