'use client';

import * as React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ExternalLink, Users, Mic2, BarChart3 } from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  description: string;
  episodeCount: number;
  avgEpisodeLength: number;
  frequency: string;
  audienceSize: string;
  rating: number;
  reviewCount: number;
  topTopics: string[];
  recentGrowth: 'up' | 'down' | 'stable';
  growthPercent: number;
  overlap: number;
  opportunities: string[];
  platform: string;
}

// Mock competitor data
const mockCompetitors: Competitor[] = [
  {
    id: 'comp-001',
    name: 'The Startup Podcast',
    description: 'Weekly conversations with founders building the future of technology.',
    episodeCount: 245,
    avgEpisodeLength: 48,
    frequency: 'Weekly',
    audienceSize: '50K-100K',
    rating: 4.8,
    reviewCount: 1240,
    topTopics: ['Startups', 'Funding', 'Product Development'],
    recentGrowth: 'up',
    growthPercent: 15,
    overlap: 72,
    opportunities: ['More focus on bootstrapping', 'International founders'],
    platform: 'Apple Podcasts',
  },
  {
    id: 'comp-002',
    name: 'Growth Hacking Weekly',
    description: 'Tactical strategies for scaling your business and acquiring customers.',
    episodeCount: 180,
    avgEpisodeLength: 35,
    frequency: 'Weekly',
    audienceSize: '25K-50K',
    rating: 4.6,
    reviewCount: 580,
    topTopics: ['Growth', 'Marketing', 'Analytics'],
    recentGrowth: 'up',
    growthPercent: 22,
    overlap: 45,
    opportunities: ['B2B focus', 'Enterprise case studies'],
    platform: 'Spotify',
  },
  {
    id: 'comp-003',
    name: 'The Leadership Lab',
    description: 'Exploring what it takes to lead teams and build culture in modern companies.',
    episodeCount: 320,
    avgEpisodeLength: 55,
    frequency: 'Twice weekly',
    audienceSize: '100K-250K',
    rating: 4.9,
    reviewCount: 2100,
    topTopics: ['Leadership', 'Culture', 'Management'],
    recentGrowth: 'stable',
    growthPercent: 3,
    overlap: 38,
    opportunities: ['Remote leadership', 'First-time managers'],
    platform: 'Apple Podcasts',
  },
  {
    id: 'comp-004',
    name: 'Tech Founders Daily',
    description: 'Short, daily episodes with actionable insights for tech entrepreneurs.',
    episodeCount: 890,
    avgEpisodeLength: 12,
    frequency: 'Daily',
    audienceSize: '10K-25K',
    rating: 4.4,
    reviewCount: 340,
    topTopics: ['Tech', 'Entrepreneurship', 'Daily Habits'],
    recentGrowth: 'down',
    growthPercent: -8,
    overlap: 55,
    opportunities: ['Longer-form content', 'Guest interviews'],
    platform: 'Spotify',
  },
];

function GrowthIndicator({ growth, percent }: { growth: 'up' | 'down' | 'stable'; percent: number }) {
  const config = {
    up: { icon: TrendingUp, color: 'var(--accent-green)', bg: 'rgba(52, 199, 89, 0.1)' },
    down: { icon: TrendingDown, color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)' },
    stable: { icon: Minus, color: 'var(--text-secondary)', bg: 'var(--bg-subtle)' },
  };

  const Icon = config[growth].icon;

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium"
      style={{ backgroundColor: config[growth].bg, color: config[growth].color }}
    >
      <Icon className="w-3 h-3" />
      {growth === 'stable' ? 'Stable' : `${percent > 0 ? '+' : ''}${percent}%`}
    </div>
  );
}

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  return (
    <div className="topo-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              {competitor.name}
            </h3>
            <span className="badge text-xs">{competitor.platform}</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {competitor.description}
          </p>
        </div>
        <GrowthIndicator growth={competitor.recentGrowth} percent={competitor.growthPercent} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="metric-card">
          <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Episodes
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {competitor.episodeCount}
          </div>
        </div>
        <div className="metric-card">
          <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Avg Length
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {competitor.avgEpisodeLength}m
          </div>
        </div>
        <div className="metric-card">
          <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Rating
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {competitor.rating} <span className="text-xs font-normal">({competitor.reviewCount})</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Audience
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {competitor.audienceSize}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="mb-4">
        <div className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Top Topics
        </div>
        <div className="flex flex-wrap gap-2">
          {competitor.topTopics.map((topic) => (
            <span key={topic} className="badge text-xs">
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Overlap Meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Topic Overlap
          </span>
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {competitor.overlap}%
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${competitor.overlap}%`,
              backgroundColor:
                competitor.overlap > 60
                  ? 'var(--accent-red)'
                  : competitor.overlap > 40
                  ? 'var(--accent-amber)'
                  : 'var(--accent-green)',
            }}
          />
        </div>
      </div>

      {/* Opportunities */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <div className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Differentiation Opportunities
        </div>
        <ul className="space-y-1">
          {competitor.opportunities.map((opp, i) => (
            <li key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-green)' }}>+</span>
              {opp}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CompetitorsPage() {
  return (
    <div className="animate-in">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)] mb-2">
          Competitors
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Analyze competitor podcasts and find opportunities to differentiate
        </p>
      </div>

      {/* Summary Card */}
      <div className="topo-card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Competitive Landscape
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Analysis based on {mockCompetitors.length} podcasts in your niche
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {mockCompetitors.length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Competitors Tracked
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>
              {mockCompetitors.filter((c) => c.recentGrowth === 'up').length}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Growing
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {Math.round(mockCompetitors.reduce((acc, c) => acc + c.overlap, 0) / mockCompetitors.length)}%
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Avg Topic Overlap
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {mockCompetitors.reduce((acc, c) => acc + c.opportunities.length, 0)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Opportunities Found
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity Highlight */}
      <div className="alert-card success mb-6">
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-green)' }} />
          <div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Top Opportunity
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Based on competitor analysis, there&apos;s a gap in <strong>bootstrapping stories</strong> and <strong>international founder perspectives</strong>.
              Consider featuring more self-funded founders and entrepreneurs from outside the US.
            </p>
          </div>
        </div>
      </div>

      {/* Competitor Cards */}
      <div className="grid gap-6">
        {mockCompetitors.map((competitor) => (
          <CompetitorCard key={competitor.id} competitor={competitor} />
        ))}
      </div>
    </div>
  );
}
