"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ContentHealthData {
  pacingScore: number;
  clarityMetric: number;
  recommendation: string;
}

interface ContentHealthCardProps {
  health: ContentHealthData;
}

function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const getColor = (score: number) => {
    if (score >= 70) return "var(--accent-green)";
    if (score >= 40) return "var(--accent-amber)";
    return "var(--accent-red)";
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
          {value}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${value}%`, backgroundColor: getColor(value) }}
        />
      </div>
    </div>
  );
}

export function ContentHealthCard({ health }: ContentHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Health</CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressBar value={health.pacingScore} label="Pacing Score" />
        <ProgressBar value={health.clarityMetric} label="Clarity Metric" />

        {/* Recommendation */}
        <div className="mt-5 p-3 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-soft)]">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--accent-amber)] flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                Recommendation
              </h5>
              <p className="text-sm text-[var(--text-primary)]">
                {health.recommendation}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
