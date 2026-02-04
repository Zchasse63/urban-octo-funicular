"use client";

import { HealthGauge } from "@/components/podbrain/health-gauge";

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
  const getSentimentColor = (score: number) => {
    if (score >= 70) return "var(--accent-green)";
    if (score >= 40) return "var(--accent-amber)";
    return "var(--accent-red)";
  };

  return (
    <div className="grid grid-cols-3 gap-8 mb-8 justify-items-center">
      {/* Retention Score */}
      <HealthGauge
        value={metrics.retentionScore}
        label="Retention"
        color="var(--accent-green)"
        size="lg"
      />

      {/* Key Takeaways */}
      <HealthGauge
        value={metrics.keyTakeaways}
        label="Takeaways"
        color="var(--accent-blue)"
        size="lg"
      />

      {/* Sentiment Score */}
      <HealthGauge
        value={metrics.sentiment.score}
        label="Sentiment"
        color={getSentimentColor(metrics.sentiment.score)}
        size="lg"
      />
    </div>
  );
}
