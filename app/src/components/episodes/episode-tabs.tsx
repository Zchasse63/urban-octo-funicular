"use client"

import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs"
import { ShowNotesTab } from "./show-notes-tab"
import { AssetsTab } from "./assets-tab"
import { TranscriptTab } from "./transcript-tab"
import { GuestPackageTab } from "./guest-package-tab"
import { IntelligenceTab } from "./intelligence-tab"
import type { Episode } from "@/types/database"

interface EpisodeTabsProps {
  episode: Episode
}

function EpisodeTabs({ episode }: EpisodeTabsProps) {
  return (
    <Tabs defaultValue="notes">
      <TabList>
        <TabTrigger value="notes">Show Notes</TabTrigger>
        <TabTrigger value="assets">Assets</TabTrigger>
        <TabTrigger value="transcript">Transcript</TabTrigger>
        <TabTrigger value="guest">Guest Package</TabTrigger>
        <TabTrigger value="intelligence">Intelligence</TabTrigger>
      </TabList>

      <TabContent value="notes">
        <ShowNotesTab episode={episode} />
      </TabContent>
      <TabContent value="assets">
        <AssetsTab episodeId={episode.id} />
      </TabContent>
      <TabContent value="transcript">
        <TranscriptTab episode={episode} />
      </TabContent>
      <TabContent value="guest">
        <GuestPackageTab episodeId={episode.id} />
      </TabContent>
      <TabContent value="intelligence">
        <IntelligenceTab episode={episode} />
      </TabContent>
    </Tabs>
  )
}

export { EpisodeTabs }
