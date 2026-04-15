import { Suspense } from "react"
import { EpisodeDetail } from "@/components/episodes/episode-detail"

// BUG #28 fix: EpisodeDetail now calls `useSearchParams()` to sync the
// active tab with the `?tab=` URL query param. In the Next.js App Router,
// any client component that calls `useSearchParams()` MUST be wrapped in
// a <Suspense> boundary or the page will fail to build / hard-crash on
// load. The fallback is intentionally null because EpisodeDetail already
// renders its own loading state when the episode hook is in-flight.
export default function EpisodeDetailPage() {
  return (
    <Suspense fallback={null}>
      <EpisodeDetail />
    </Suspense>
  )
}
