"use client"

import { use } from "react"
import { EpisodeHeader } from "@/components/episodes/episode-header"
import { EpisodeTabs } from "@/components/episodes/episode-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import useEpisode from "@/hooks/use-episode"

export default function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { episode, isLoading } = useEpisode(id)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-[var(--radius-sm)]" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-[var(--radius-md)]" />
      </div>
    )
  }

  if (!episode) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-secondary)]">Episode not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <EpisodeHeader episode={episode} />
      <EpisodeTabs episode={episode} />
    </div>
  )
}
