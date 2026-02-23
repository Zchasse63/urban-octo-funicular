"use client"

import { use, useState, useCallback } from "react"
import {
  FileText,
  LayoutGrid,
  ScrollText,
  Gift,
  Lightbulb,
  Loader2,
  CheckCircle2,
  Copy,
  ArrowUpRight,
} from "lucide-react"
import { EpisodeHeader } from "@/components/episodes/episode-header"
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { SEOScore } from "@/components/episodes/seo-score"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import useEpisode from "@/hooks/use-episode"

const ASSET_CATEGORIES = [
  {
    category: "Core",
    description: "Essential episode content",
    color: "var(--color-accent-blue)",
    types: ["show_notes", "key_takeaways", "chapter_markers", "episode_titles"],
  },
  {
    category: "Social",
    description: "Platform-ready posts",
    color: "var(--color-accent-warm)",
    types: ["linkedin_post", "twitter_thread", "instagram_caption", "tiktok_hooks"],
  },
  {
    category: "Long-form",
    description: "Extended written content",
    color: "var(--color-status-success)",
    types: ["blog_post", "newsletter_email", "youtube_description"],
  },
  {
    category: "Guest",
    description: "Guest promotion materials",
    color: "#8B5CF6",
    types: ["guest_bio_short", "guest_promo_kit"],
  },
  {
    category: "Visual",
    description: "Shareable media",
    color: "#EC4899",
    types: ["quote_cards", "audiogram_clips"],
  },
  {
    category: "AI Summary",
    description: "AI-generated analysis",
    color: "var(--color-status-processing)",
    types: ["ai_summary_short", "ai_summary_detailed", "highlight_reel"],
  },
]

export default function EpisodeWorkspace({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { episode, isLoading } = useEpisode(id)
  const [generatingAssets, setGeneratingAssets] = useState<Set<string>>(new Set())
  const [generatedAssets, setGeneratedAssets] = useState<Set<string>>(new Set())

  const handleGenerateAsset = useCallback(async (assetType: string) => {
    if (!episode?.id) return
    setGeneratingAssets(prev => new Set(prev).add(assetType))

    try {
      const response = await fetch(`/api/episodes/${episode.id}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_type: assetType }),
      })

      if (response.ok) {
        setGeneratedAssets(prev => new Set(prev).add(assetType))
      }
    } catch {
      // Silently handle — button returns to Generate state
    } finally {
      setGeneratingAssets(prev => {
        const next = new Set(prev)
        next.delete(assetType)
        return next
      })
    }
  }, [episode?.id])

  const handleGenerateAll = useCallback(async () => {
    if (!episode?.id) return
    const allTypes = ASSET_CATEGORIES.flatMap(c => c.types)
    for (const type of allTypes) {
      handleGenerateAsset(type)
    }
  }, [episode?.id, handleGenerateAsset])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-[var(--radius-lg)]" />
      </div>
    )
  }

  if (!episode) {
    return (
      <EmptyState
        icon={FileText}
        title="Episode not found"
        description="This episode may have been deleted or you may not have access."
      />
    )
  }

  return (
    <>
      <EpisodeHeader
        title={episode.title}
        status={episode.status}
        guestName={episode.guest_name}
        seoScore={episode.seo_score}
      />

      <Tabs defaultValue="notes">
        <Card>
          <TabList>
            <TabTrigger value="notes" icon={<FileText className="w-4 h-4" />}>
              Show Notes
            </TabTrigger>
            <TabTrigger value="assets" icon={<LayoutGrid className="w-4 h-4" />}>
              Assets
            </TabTrigger>
            <TabTrigger value="transcript" icon={<ScrollText className="w-4 h-4" />}>
              Transcript
            </TabTrigger>
            <TabTrigger value="guest" icon={<Gift className="w-4 h-4" />}>
              Guest Package
            </TabTrigger>
            <TabTrigger value="intel" icon={<Lightbulb className="w-4 h-4" />}>
              Intelligence
            </TabTrigger>
          </TabList>

          {/* Show Notes Tab */}
          <TabContent value="notes">
            <div className="flex">
              <div className="flex-1 p-6 min-w-0">
                {episode.show_notes ? (
                  <article
                    className="prose prose-stone max-w-none font-[family-name:var(--font-body)] text-[var(--text-body)] leading-relaxed [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[var(--text-h2)] [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[var(--color-text-ink)] [&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[var(--text-h3)] [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[var(--color-text-ink)] [&_p]:text-[var(--color-text-secondary)] [&_p]:mb-4 [&_li]:text-[var(--color-text-secondary)] [&_li]:mb-1.5 [&_ul]:mb-4 [&_strong]:text-[var(--color-text-ink)]"
                    dangerouslySetInnerHTML={{ __html: episode.show_notes_html || episode.show_notes }}
                  />
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No show notes yet"
                    description={
                      episode.status === "pending"
                        ? "Process this episode to generate show notes."
                        : episode.status === "processing"
                          ? "Show notes are being generated..."
                          : "Something went wrong during generation."
                    }
                  />
                )}
              </div>

              {/* SEO Sidebar */}
              {episode.status === "completed" && (
                <div className="w-72 border-l border-[var(--color-border)] flex-shrink-0 bg-[var(--color-bg-hover)]/30">
                  <div className="sticky top-0 p-5 space-y-5">
                    <div className="text-label">SEO Analysis</div>
                    <div className="flex justify-center py-2">
                      <SEOScore score={episode.seo_score} size="lg" />
                    </div>

                    {episode.seo_analysis && episode.seo_analysis.suggestions && (
                      <div className="space-y-2">
                        <div className="text-label text-[10px]">Suggestions</div>
                        {episode.seo_analysis.suggestions.slice(0, 3).map((suggestion: string, i: number) => (
                          <div
                            key={i}
                            className="text-[var(--text-caption)] text-[var(--color-text-secondary)] p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] leading-relaxed"
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabContent>

          {/* Assets Tab */}
          <TabContent value="assets">
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-h3)]">
                    Content Assets
                  </h3>
                  <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)] mt-0.5">
                    Generate and manage content across 30+ formats
                  </p>
                </div>
                <Button variant="warm" size="sm" onClick={handleGenerateAll}>
                  <Lightbulb className="w-3.5 h-3.5" />
                  Generate All
                </Button>
              </div>

              {episode.status !== "completed" ? (
                <EmptyState
                  icon={LayoutGrid}
                  title="Process episode first"
                  description="Assets are generated after the episode has been fully processed."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ASSET_CATEGORIES.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <div className="flex items-center gap-2 pb-1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-label">{group.category}</span>
                      </div>

                      {group.types.map((type) => {
                        const isGenerating = generatingAssets.has(type)
                        const isGenerated = generatedAssets.has(type)

                        return (
                          <div
                            key={type}
                            className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all group"
                          >
                            <span className="text-[var(--text-body-sm)] text-[var(--color-text-ink)] capitalize">
                              {type.replace(/_/g, " ")}
                            </span>

                            {isGenerating ? (
                              <Loader2 className="w-3.5 h-3.5 text-[var(--color-accent-blue)] animate-spin" />
                            ) : isGenerated ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-status-success)]" />
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer">
                                  <Copy className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleGenerateAsset(type)}
                                className="text-[var(--text-label)] font-[family-name:var(--font-mono)] uppercase tracking-wider text-[var(--color-accent-blue)] hover:text-[var(--color-accent-blue-hover)] transition-colors cursor-pointer"
                              >
                                Generate
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </TabContent>

          {/* Transcript Tab */}
          <TabContent value="transcript">
            <CardContent>
              {episode.transcript ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-label">Transcript</span>
                    {episode.transcript_segments && (
                      <Badge>{episode.transcript_segments.length} segments</Badge>
                    )}
                  </div>
                  {episode.transcript_segments ? (
                    <div className="space-y-1">
                      {episode.transcript_segments.map((segment: { text: string; start: number; speaker: string | null }, i: number) => (
                        <div key={i} className="flex gap-4 group hover:bg-[var(--color-bg-hover)] -mx-2 px-2 py-1.5 rounded-[var(--radius-sm)] transition-colors">
                          <div className="flex-shrink-0 w-16 text-right">
                            <span className="text-mono text-[var(--color-text-tertiary)]">
                              {formatTimestamp(segment.start)}
                            </span>
                          </div>
                          {segment.speaker && (
                            <div className="flex-shrink-0 w-20">
                              <Badge variant="blue">{segment.speaker}</Badge>
                            </div>
                          )}
                          <p className="flex-1 text-[var(--text-body-sm)] leading-relaxed text-[var(--color-text-ink)]">
                            {segment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-[var(--text-body-sm)] leading-relaxed font-[family-name:var(--font-body)]">
                      {episode.transcript}
                    </pre>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={ScrollText}
                  title="No transcript yet"
                  description="Process this episode to generate a transcript with speaker labels and timestamps."
                />
              )}
            </CardContent>
          </TabContent>

          {/* Guest Package Tab */}
          <TabContent value="guest">
            <CardContent>
              {episode.guest_name ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-h3)]">
                      Guest Promotion Package
                    </h3>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)] mt-0.5">
                      Ready-to-share content for {episode.guest_name}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {["LinkedIn", "Twitter/X", "Instagram"].map((platform) => (
                      <div
                        key={platform}
                        className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-hover)]/50 space-y-3 hover:border-[var(--color-border-strong)] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-label">{platform}</span>
                          <Button variant="ghost" size="sm">
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </Button>
                        </div>
                        <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)] italic">
                          Generate this episode&apos;s assets to create {platform} posts.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Gift}
                  title="No guest for this episode"
                  description="Guest packages are generated for episodes that have a guest name set."
                />
              )}
            </CardContent>
          </TabContent>

          {/* Intelligence Tab */}
          <TabContent value="intel">
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-label">Viral Moments</div>
                  {episode.viral_moments && episode.viral_moments.length > 0 ? (
                    episode.viral_moments.map((moment: { text: string; score: number; type: string; start_time: number }, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-hover)]/50 space-y-2 hover:border-[var(--color-border-strong)] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="warm">{moment.type}</Badge>
                          <span className="text-mono text-[var(--color-accent-warm)] font-medium">
                            {moment.score}/10
                          </span>
                        </div>
                        <p className="text-[var(--text-body-sm)] text-[var(--color-text-ink)] italic">
                          &ldquo;{moment.text}&rdquo;
                        </p>
                        <span className="text-mono text-[var(--color-text-tertiary)]">
                          {formatTimestamp(moment.start_time)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)]">
                      No viral moments detected yet. Process the episode to analyze.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-label">Guest Intelligence</div>
                  {episode.guest_name ? (
                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] space-y-2">
                      <h4 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-body)]">
                        {episode.guest_name}
                      </h4>
                      {episode.guest_bio && (
                        <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)]">
                          {episode.guest_bio}
                        </p>
                      )}
                      <Button variant="link" size="sm">
                        <ArrowUpRight className="w-3 h-3" />
                        Load Full Guest Intel
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)]">
                      No guest assigned to this episode.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </TabContent>
        </Card>
      </Tabs>
    </>
  )
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}
