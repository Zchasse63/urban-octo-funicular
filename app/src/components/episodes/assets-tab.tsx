"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Copy, RefreshCw, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import useEpisodeAssets from "@/hooks/use-episode-assets"
import type { GeneratedAsset } from "@/types/database"

interface AssetsTabProps {
  episodeId: string
}

const assetCategories: Record<string, { label: string; types: string[] }> = {
  core: {
    label: "Core Content",
    types: ["show_notes", "episode_titles", "key_takeaways", "chapter_markers"],
  },
  social: {
    label: "Social Media",
    types: [
      "linkedin_post", "linkedin_post_host", "linkedin_post_guest", "linkedin_article",
      "twitter_thread", "twitter_single",
      "instagram_carousel", "instagram_caption", "instagram_reel_script",
      "tiktok_hooks", "tiktok_script",
    ],
  },
  longform: {
    label: "Long-form",
    types: ["blog_post", "newsletter_email", "press_release", "transcript_summary", "seo_description"],
  },
  youtube: {
    label: "YouTube",
    types: ["youtube_description", "youtube_shorts_script", "youtube_title_tags"],
  },
  guest: {
    label: "Guest Content",
    types: ["guest_bio_short", "guest_promo_kit"],
  },
  engagement: {
    label: "Engagement",
    types: ["discussion_questions", "poll_ideas", "call_to_action"],
  },
}

function formatAssetName(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function AssetCard({ asset, onRegenerate }: { asset: GeneratedAsset; onRegenerate: () => void }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--color-border)]",
        "bg-[var(--color-bg-surface)] p-4"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-[family-name:var(--font-display)] text-[var(--text-caption)] font-semibold text-[var(--color-text-ink)]">
          {formatAssetName(asset.asset_type)}
        </span>
        <Badge variant="success">Generated</Badge>
      </div>
      <p className="line-clamp-3 font-[family-name:var(--font-body)] text-[var(--text-caption)] text-[var(--color-text-secondary)]">
        {asset.content.slice(0, 200)}
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigator.clipboard.writeText(asset.content)}
        >
          <Copy className="h-3 w-3" />
          Copy
        </Button>
        <Button size="sm" variant="ghost" onClick={onRegenerate}>
          <RefreshCw className="h-3 w-3" />
          Regenerate
        </Button>
      </div>
    </div>
  )
}

function AssetsTab({ episodeId }: AssetsTabProps) {
  const { assets, isLoading, regenerateAsset } = useEpisodeAssets(episodeId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4"
          >
            <Skeleton className="mb-3 h-4 w-2/3" />
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No assets generated yet"
        description="Process this episode to generate 30+ content assets for distribution."
      />
    )
  }

  const assetMap = new Map<string, GeneratedAsset>()
  assets.forEach((a) => assetMap.set(a.asset_type, a))

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(assetCategories).map(([key, category]) => {
        const categoryAssets = category.types
          .map((t) => assetMap.get(t))
          .filter(Boolean) as GeneratedAsset[]

        if (categoryAssets.length === 0) return null

        return (
          <div key={key}>
            <h3 className="mb-3 font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
              {category.label}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categoryAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onRegenerate={() => regenerateAsset(asset.asset_type)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { AssetsTab }
