import { PageHeader } from "@/components/layout/page-header"
import { EpisodeList } from "@/components/episodes/episode-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function EpisodesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Episodes"
        description="Manage your podcast episodes and AI-generated content"
        actions={
          <Button asChild>
            <Link href="/upload">
              <Plus className="h-4 w-4" />
              New Episode
            </Link>
          </Button>
        }
      />
      <EpisodeList />
    </div>
  )
}
