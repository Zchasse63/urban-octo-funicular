"use client";

import { TopoCard, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface TimestampedSection {
  timestamp: string;
  title: string;
  content: string;
}

interface ShowNotesData {
  summary: string;
  executiveSummary: TimestampedSection[];
  keyDiscussionPoints: string[];
  actionItems: string[];
  resourcesMentioned: {
    title: string;
    url?: string;
  }[];
  guestBio: string;
}

interface ShowNotesCardProps {
  showNotes: ShowNotesData;
}

function TimestampLink({ timestamp }: { timestamp: string }) {
  return (
    <a href="#" className="timestamp-link">
      {timestamp}
    </a>
  );
}

export function ShowNotesCard({ showNotes }: ShowNotesCardProps) {
  return (
    <TopoCard hover={false} className="h-full">
      <CardHeader>
        <CardTitle>Generated Show Notes</CardTitle>
        <Badge variant="new" className="gap-1">
          <Sparkles className="w-3 h-3" />
          AI Assisted
        </Badge>
      </CardHeader>
      <CardContent className="notes-area">
        {/* Summary */}
        <p className="text-[var(--text-primary)] leading-relaxed">
          {showNotes.summary}
        </p>

        {/* Executive Summary */}
        <div className="section-divider">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Executive Summary
          </h3>
          <div className="space-y-4 mt-3">
            {showNotes.executiveSummary.map((section, index) => (
              <div key={index}>
                <div className="flex items-start gap-2">
                  <TimestampLink timestamp={section.timestamp} />
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">
                      {section.title}
                    </span>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Discussion Points */}
        <div className="section-divider">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Key Discussion Points
          </h3>
          <ul className="mt-3 space-y-2">
            {showNotes.keyDiscussionPoints.map((point, index) => (
              <li key={index} className="text-[var(--text-secondary)]">
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Items for Listeners */}
        <div className="section-divider">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Action Items for Listeners
          </h3>
          <ul className="mt-3 space-y-2">
            {showNotes.actionItems.map((item, index) => (
              <li key={index} className="text-[var(--text-secondary)]">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Resources Mentioned */}
        <div className="section-divider">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Resources Mentioned
          </h3>
          <ul className="mt-3 space-y-2">
            {showNotes.resourcesMentioned.map((resource, index) => (
              <li key={index}>
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-blue)] hover:underline"
                  >
                    {resource.title}
                  </a>
                ) : (
                  <span className="text-[var(--text-secondary)]">
                    {resource.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Guest Bio */}
        <div className="section-divider">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Guest Bio
          </h3>
          <p className="mt-3 text-[var(--text-secondary)]">
            {showNotes.guestBio}
          </p>
        </div>
      </CardContent>
    </TopoCard>
  );
}
