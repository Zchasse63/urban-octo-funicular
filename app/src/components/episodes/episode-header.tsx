"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Send } from "lucide-react";

interface EpisodeHeaderProps {
  episodeNumber: number;
  processedAt: string;
  title: string;
  onExportPdf?: () => void;
  onPublish?: () => void;
}

export function EpisodeHeader({
  episodeNumber,
  processedAt,
  title,
  onExportPdf,
  onPublish,
}: EpisodeHeaderProps) {
  return (
    <div className="mb-8">
      {/* Top Row: Badge, Timestamp, and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Badge variant="default" className="font-mono">
            EPISODE #{episodeNumber}
          </Badge>
          <span className="font-mono text-xs text-[var(--text-secondary)] tracking-wide">
            Processed {processedAt}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onExportPdf}>
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
          <Button size="sm" onClick={onPublish}>
            Publish to Notion
          </Button>
        </div>
      </div>

      {/* Title - 2rem per design system */}
      <h1 className="text-[2rem] font-semibold tracking-tight leading-tight text-[var(--text-primary)]">
        {title}
      </h1>
    </div>
  );
}
