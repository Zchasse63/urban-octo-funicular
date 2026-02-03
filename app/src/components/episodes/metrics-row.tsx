"use client";

import { MetricCard, MetricValue, MetricLabel } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Lightbulb, Smile } from "lucide-react";

interface MetricData {
  retentionScore: number;
  retentionTrend: number;
  keyTakeaways: number;
  sentiment: {
    label: string;
    score: number;
  };
}

interface MetricsRowProps {
  metrics: MetricData;
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  const isPositiveTrend = metrics.retentionTrend >= 0;

  const getSentimentColor = (score: number) => {
    if (score >= 70) return "text-[var(--accent-green)]";
    if (score >= 40) return "text-[var(--accent-amber)]";
    return "text-[var(--accent-red)]";
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* Retention Score */}
      <MetricCard>
        <MetricLabel>
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Retention Score
          </span>
        </MetricLabel>
        <MetricValue className="text-[var(--text-primary)]">
          {metrics.retentionScore}%
        </MetricValue>
        <MetricLabel>
          {isPositiveTrend ? (
            <TrendingUp className="w-3 h-3 text-[var(--accent-green)]" />
          ) : (
            <TrendingDown className="w-3 h-3 text-[var(--accent-red)]" />
          )}
          <span
            className={
              isPositiveTrend
                ? "text-[var(--accent-green)]"
                : "text-[var(--accent-red)]"
            }
          >
            {isPositiveTrend ? "+" : ""}
            {metrics.retentionTrend}% vs last episode
          </span>
        </MetricLabel>
      </MetricCard>

      {/* Key Takeaways */}
      <MetricCard>
        <MetricLabel>
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Key Takeaways
          </span>
        </MetricLabel>
        <MetricValue className="text-[var(--text-primary)]">
          {metrics.keyTakeaways}
        </MetricValue>
        <MetricLabel>
          <Lightbulb className="w-3 h-3" />
          <span>Actionable insights</span>
        </MetricLabel>
      </MetricCard>

      {/* Sentiment Analysis */}
      <MetricCard>
        <MetricLabel>
          <span className="font-mono text-[10px] uppercase tracking-wider">
            Sentiment Analysis
          </span>
        </MetricLabel>
        <MetricValue className={getSentimentColor(metrics.sentiment.score)}>
          {metrics.sentiment.label}
        </MetricValue>
        <MetricLabel>
          <Smile className="w-3 h-3" />
          <span>{metrics.sentiment.score}% positive</span>
        </MetricLabel>
      </MetricCard>
    </div>
  );
}
