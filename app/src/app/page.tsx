import { Mic2, TrendingUp, Clock, Sparkles } from "lucide-react";

function MetricCard({
  label,
  value,
  trend,
  trendDirection,
}: {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: "up" | "down";
}) {
  return (
    <div className="metric-card">
      <span className="mono">{label}</span>
      <div className="metric-value">{value}</div>
      {trend && (
        <span
          className={`metric-label ${
            trendDirection === "up" ? "trend-up" : "trend-down"
          }`}
        >
          {trendDirection === "up" ? "+" : ""}
          {trend} from last month
        </span>
      )}
    </div>
  );
}

function RecentEpisodeCard({
  title,
  date,
  duration,
  status,
}: {
  title: string;
  date: string;
  duration: string;
  status: "completed" | "processing" | "draft";
}) {
  const statusStyles = {
    completed: "badge-success",
    processing: "badge-warning",
    draft: "badge",
  };

  const statusLabels = {
    completed: "Completed",
    processing: "Processing",
    draft: "Draft",
  };

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0" style={{ borderColor: "var(--border-soft)" }}>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)" }}
        >
          <Mic2 className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
        </div>
        <div>
          <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {date}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {duration}
            </span>
          </div>
        </div>
      </div>
      <span className={`badge ${statusStyles[status]}`}>{statusLabels[status]}</span>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          Welcome back. Here&apos;s an overview of your podcast performance.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Episodes" value="24" trend="3" trendDirection="up" />
        <MetricCard label="Total Listens" value="12.4K" trend="18%" trendDirection="up" />
        <MetricCard label="Avg. Duration" value="48m" />
        <MetricCard label="SEO Score" value="87" trend="5pts" trendDirection="up" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Episodes */}
        <div className="lg:col-span-2">
          <div className="topo-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Recent Episodes
              </h2>
              <a
                href="/episodes"
                className="text-sm font-medium"
                style={{ color: "var(--accent-blue)" }}
              >
                View all
              </a>
            </div>
            <div className="-mx-6 -mb-6">
              <RecentEpisodeCard
                title="The Future of AI in Podcasting"
                date="Jan 28, 2026"
                duration="52 min"
                status="completed"
              />
              <RecentEpisodeCard
                title="Building a Loyal Audience"
                date="Jan 21, 2026"
                duration="45 min"
                status="completed"
              />
              <RecentEpisodeCard
                title="Interview with Tech Leaders"
                date="Jan 14, 2026"
                duration="1h 12 min"
                status="processing"
              />
              <RecentEpisodeCard
                title="Monetization Strategies for 2026"
                date="Draft"
                duration="--"
                status="draft"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="topo-card">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Quick Actions
            </h2>
            <div className="space-y-2">
              <a href="/upload" className="btn-primary w-full justify-center">
                <Sparkles className="w-4 h-4" />
                Upload New Episode
              </a>
              <a href="/episodes" className="btn-secondary w-full justify-center">
                <Clock className="w-4 h-4" />
                View Processing Queue
              </a>
            </div>
          </div>

          {/* SEO Health */}
          <div className="topo-card">
            <div className="health-score">
              <span className="mono">Overall SEO Health</span>
              <div className="health-score-value" style={{ color: "var(--accent-green)" }}>
                87
              </div>
              <div className="health-score-label">out of 100</div>
              <div className="health-score-trend trend-up">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +5 pts this month
              </div>
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-soft)" }}>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>Keyword Coverage</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill success" style={{ width: "92%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>Schema Markup</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill warning" style={{ width: "78%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>Content Quality</span>
                    <span className="font-medium">91%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill success" style={{ width: "91%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
