"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, UserCircle } from "lucide-react"

interface GuestPackageTabProps {
  episodeId: string
}

interface GuestPackage {
  social_posts?: { platform: string; content: string }[]
  promo_kit?: { type: string; content: string }[]
  email_template?: string
}

function GuestPackageTab({ episodeId }: GuestPackageTabProps) {
  const [data, setData] = useState<GuestPackage | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPackage() {
      try {
        const res = await fetch(`/api/episodes/${episodeId}/guest-package`)
        if (res.ok) {
          const result = await res.json()
          setData(result.data || null)
        }
      } catch {
        // Silently handle — empty state shown
      } finally {
        setIsLoading(false)
      }
    }
    fetchPackage()
  }, [episodeId])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4"
          >
            <Skeleton className="mb-3 h-4 w-1/3" />
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        icon={UserCircle}
        title="No guest package yet"
        description="Process this episode to generate a guest promotion package with social posts and a promo kit."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Social Posts */}
      {data.social_posts && data.social_posts.length > 0 && (
        <div>
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
            Social Posts
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.social_posts.map((post, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-[var(--radius-md)] border border-[var(--color-border)]",
                  "bg-[var(--color-bg-surface)] p-4"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="blue">{post.platform}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(post.content)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-[family-name:var(--font-body)] text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                  {post.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promo Kit */}
      {data.promo_kit && data.promo_kit.length > 0 && (
        <div>
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
            Promo Kit
          </h3>
          <div className="flex flex-col gap-3">
            {data.promo_kit.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-[var(--radius-md)] border border-[var(--color-border)]",
                  "bg-[var(--color-bg-surface)] p-4"
                )}
              >
                <span className="mb-2 block font-[family-name:var(--font-display)] text-[var(--text-caption)] font-semibold text-[var(--color-text-ink)]">
                  {item.type}
                </span>
                <p className="font-[family-name:var(--font-body)] text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download all */}
      <div className="flex justify-end">
        <Button variant="secondary">
          <Download className="h-4 w-4" />
          Download Package
        </Button>
      </div>
    </div>
  )
}

export { GuestPackageTab }
