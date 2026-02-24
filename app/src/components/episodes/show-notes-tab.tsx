"use client"

import { cn } from "@/lib/utils"
import DOMPurify from "isomorphic-dompurify"
import { SEOScore } from "./seo-score"
import { EmptyState } from "@/components/ui/empty-state"
import { FileText } from "lucide-react"
import useEpisodeSeo from "@/hooks/use-episode-seo"
import type { Episode } from "@/types/database"

interface ShowNotesTabProps {
  episode: Episode
}

function ShowNotesTab({ episode }: ShowNotesTabProps) {
  const { seoData } = useEpisodeSeo(episode.id)

  if (!episode.show_notes_html && !episode.show_notes) {
    return (
      <EmptyState
        icon={FileText}
        title="No show notes yet"
        description="Process this episode to generate AI-powered show notes with SEO optimization."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Show notes content */}
      <div className="flex-1">
        <div
          className={cn(
            "rounded-[var(--radius-md)] border border-[var(--color-border)]",
            "bg-[var(--color-bg-surface)] p-6"
          )}
        >
          {episode.show_notes_html ? (
            <div
              className={cn(
                "prose max-w-none",
                "font-[family-name:var(--font-body)] text-[var(--text-body)]",
                "text-[var(--color-text-ink)]",
                "[&_h1]:font-[family-name:var(--font-display)] [&_h1]:text-[var(--text-h1)]",
                "[&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-[var(--text-h2)]",
                "[&_h3]:font-[family-name:var(--font-display)] [&_h3]:text-[var(--text-h3)]",
                "[&_a]:text-[var(--color-accent-blue)]"
              )}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(episode.show_notes_html) }}
            />
          ) : (
            <div className="whitespace-pre-wrap font-[family-name:var(--font-body)] text-[var(--text-body)] text-[var(--color-text-ink)]">
              {episode.show_notes}
            </div>
          )}
        </div>
      </div>

      {/* SEO sidebar */}
      <div className="hidden w-48 flex-shrink-0 lg:block">
        <div
          className={cn(
            "sticky top-6 rounded-[var(--radius-md)] border border-[var(--color-border)]",
            "bg-[var(--color-bg-surface)] p-4"
          )}
        >
          <SEOScore
            score={seoData?.seo_score ?? episode.seo_score}
            size={88}
          />

          {seoData?.seo_analysis?.suggestions && seoData.seo_analysis.suggestions.length > 0 && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-3">
              <span className="text-label text-[var(--color-text-tertiary)]">
                SUGGESTIONS
              </span>
              <ul className="mt-2 flex flex-col gap-1.5">
                {seoData.seo_analysis.suggestions.slice(0, 3).map((s, i) => (
                  <li
                    key={i}
                    className="text-[var(--text-caption)] text-[var(--color-text-secondary)]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { ShowNotesTab }
