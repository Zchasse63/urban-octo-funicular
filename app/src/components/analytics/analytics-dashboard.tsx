"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  BarChart3,
  TrendingUp,
  Clock,
  BookOpen,
  FileText,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'
import useShows from '@/hooks/use-shows'
import type { Show } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsOverview {
  episodeTrends: { period: string; count: number }[]
  seoScoreTrend: {
    episodeId: string
    title: string | null
    seoScore: number | null
    createdAt: string
  }[]
  averageSeoScore: number
  popularAssetTypes: { type: string; count: number }[]
  processingStats: {
    totalEpisodes: number
    completedEpisodes: number
    averageDurationSeconds: number | null
    minDurationSeconds: number | null
    maxDurationSeconds: number | null
  }
  vocabularyGrowth: {
    totalTerms: number
    newThisMonth: number
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  color,
  delay = 0,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | 'neutral'
  color: string
  delay?: number
}) => {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus
  const trendColor =
    trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-stone-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-0.5', trendColor)}>
            <TrendIcon className="w-3 h-3" />
          </div>
        )}
      </div>
      <div className="font-mono text-2xl font-bold text-foreground tracking-tight leading-none mb-1">
        {value}
      </div>
      <div className="font-sans text-[12px] text-muted-foreground">{label}</div>
      {subtext && (
        <div className="font-mono text-[10px] text-muted-foreground/70 mt-1">{subtext}</div>
      )}
    </motion.div>
  )
}

// ─── Bar Chart (CSS-based) ────────────────────────────────────────────────────

const BarList = ({
  items,
  maxValue,
  color,
}: {
  items: { label: string; value: number }[]
  maxValue: number
  color: string
}) => {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-foreground/80 truncate max-w-[60%]">
                {formatAssetLabel(item.label)}
              </span>
              <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                {item.value}
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                className={cn('h-full rounded-full', color)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── SEO Score List ───────────────────────────────────────────────────────────

const SeoScoreList = ({
  episodes,
}: {
  episodes: AnalyticsOverview['seoScoreTrend']
}) => {
  return (
    <div className="space-y-1.5">
      {episodes.map((ep) => {
        const score = ep.seoScore || 0
        const scoreColor =
          score >= 80 ? 'text-emerald-600 bg-emerald-50' : score >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
        const barColor =
          score >= 80 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'

        return (
          <div
            key={ep.episodeId}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/30 transition-colors"
          >
            <span
              className={cn(
                'font-mono text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[38px] text-center',
                scoreColor
              )}
            >
              {score}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[12px] text-foreground truncate">
                {ep.title || 'Untitled'}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {new Date(ep.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
              <div className={cn('h-full rounded-full', barColor)} style={{ width: `${score}%` }} />
            </div>
          </div>
        )
      })}
      {episodes.length === 0 && (
        <div className="py-6 text-center">
          <p className="font-sans text-[12px] text-muted-foreground">No scored episodes yet</p>
        </div>
      )}
    </div>
  )
}

// ─── Episode Trend Mini-Chart ─────────────────────────────────────────────────

const EpisodeTrendChart = ({
  trends,
}: {
  trends: AnalyticsOverview['episodeTrends']
}) => {
  if (trends.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="font-sans text-[12px] text-muted-foreground">No episodes in this period</p>
      </div>
    )
  }

  const maxCount = Math.max(...trends.map((t) => t.count), 1)

  return (
    <div className="flex items-end gap-1.5 h-24">
      {trends.map((t, i) => {
        const height = (t.count / maxCount) * 100
        return (
          <div key={t.period} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
              className="w-full bg-gradient-to-t from-sky-500 to-sky-400 rounded-t-md min-h-[4px]"
              title={`Week of ${t.period}: ${t.count} episode${t.count !== 1 ? 's' : ''}`}
            />
            <span className="font-mono text-[8px] text-muted-foreground/60 truncate w-full text-center">
              {new Date(t.period).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAssetLabel(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Range Selector ───────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState(30)
  const { shows } = useShows()
  const [selectedShow, setSelectedShow] = useState<Show | null>(null)

  // Auto-select first show
  useEffect(() => {
    if (shows.length > 0 && !selectedShow) {
      setSelectedShow(shows[0])
    }
  }, [shows, selectedShow])

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ range: String(range) })
      if (selectedShow) {
        params.set('showId', selectedShow.id)
      }

      const res = await fetch(`/api/analytics/overview?${params}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')

      const json = await res.json()
      setOverview(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [range, selectedShow])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest">
              Analytics
            </span>
          </div>
          <h1 className="font-sans font-bold text-xl sm:text-[22px] text-foreground tracking-tight leading-tight mb-1.5">
            Performance Overview
          </h1>
          <p className="font-serif text-sm text-muted-foreground leading-relaxed">
            Track episode metrics, SEO performance, and content generation trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Show selector */}
          {shows.length > 1 && (
            <select
              value={selectedShow?.id || ''}
              onChange={(e) => {
                const show = shows.find((s) => s.id === e.target.value)
                setSelectedShow(show || null)
              }}
              className="px-3 py-2 rounded-lg text-[12px] font-sans text-foreground bg-card border border-border focus:outline-none focus:border-stone-400 transition-all"
            >
              {shows.map((show) => (
                <option key={show.id} value={show.id}>
                  {show.name}
                </option>
              ))}
            </select>
          )}

          {/* Range selector */}
          <div className="flex items-center bg-muted/40 rounded-lg p-0.5 border border-border">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[11px] font-mono font-semibold transition-all',
                  range === opt.value
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="font-sans text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && !overview ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="w-9 h-9 bg-muted rounded-lg" />
              <div className="h-6 w-16 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : overview ? (
        <>
          {/* Stat cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              label="Total Episodes"
              value={overview.processingStats.totalEpisodes}
              subtext={`${overview.processingStats.completedEpisodes} completed`}
              color="bg-gradient-to-br from-sky-500 to-sky-600"
              delay={0}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg SEO Score"
              value={overview.averageSeoScore}
              subtext="out of 100"
              trend={overview.averageSeoScore >= 70 ? 'up' : overview.averageSeoScore >= 40 ? 'neutral' : 'down'}
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              delay={0.05}
            />
            <StatCard
              icon={Clock}
              label="Avg Duration"
              value={formatDuration(overview.processingStats.averageDurationSeconds)}
              subtext={
                overview.processingStats.minDurationSeconds != null
                  ? `${formatDuration(overview.processingStats.minDurationSeconds)} - ${formatDuration(overview.processingStats.maxDurationSeconds)}`
                  : undefined
              }
              color="bg-gradient-to-br from-violet-500 to-violet-600"
              delay={0.1}
            />
            <StatCard
              icon={BookOpen}
              label="Vocabulary Terms"
              value={overview.vocabularyGrowth.totalTerms}
              subtext={`+${overview.vocabularyGrowth.newThisMonth} this month`}
              trend={overview.vocabularyGrowth.newThisMonth > 0 ? 'up' : 'neutral'}
              color="bg-gradient-to-br from-amber-500 to-amber-600"
              delay={0.15}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Episode Processing Trend */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            >
              <div className="px-5 py-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-500" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Episode Processing
                  </span>
                </div>
              </div>
              <div className="p-5">
                <EpisodeTrendChart trends={overview.episodeTrends} />
              </div>
            </motion.div>

            {/* SEO Score Trend */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            >
              <div className="px-5 py-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    SEO Scores
                  </span>
                </div>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto scrollbar-none">
                <SeoScoreList episodes={overview.seoScoreTrend} />
              </div>
            </motion.div>
          </div>

          {/* Popular Asset Types */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          >
            <div className="px-5 py-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Popular Asset Types
                </span>
                <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full">
                  {overview.popularAssetTypes.length} types
                </span>
              </div>
            </div>
            <div className="p-5">
              {overview.popularAssetTypes.length > 0 ? (
                <BarList
                  items={overview.popularAssetTypes.map((a) => ({
                    label: a.type,
                    value: a.count,
                  }))}
                  maxValue={overview.popularAssetTypes[0]?.count || 1}
                  color="bg-gradient-to-r from-amber-400 to-amber-500"
                />
              ) : (
                <div className="py-6 text-center">
                  <p className="font-sans text-[12px] text-muted-foreground">
                    No generated assets yet. Process an episode to see asset analytics.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </div>
  )
}
