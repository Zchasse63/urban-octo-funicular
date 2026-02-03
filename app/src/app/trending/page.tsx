'use client';

import * as React from 'react';
import { TrendingUp, ArrowUpRight, Users, Mic2, Clock } from 'lucide-react';

interface TrendingTopic {
  id: string;
  topic: string;
  description: string;
  growth: number;
  mentions: number;
  expertCount: number;
  recentEpisodes: number;
  relatedTopics: string[];
  topExperts: {
    name: string;
    affiliation?: string;
  }[];
}

// Mock trending data
const mockTrending: TrendingTopic[] = [
  {
    id: 'trend-001',
    topic: 'AI Agents & Autonomous Systems',
    description: 'Discussion of AI agents that can perform complex tasks independently, from coding to research.',
    growth: 340,
    mentions: 1250,
    expertCount: 45,
    recentEpisodes: 23,
    relatedTopics: ['LLMs', 'Automation', 'AGI'],
    topExperts: [
      { name: 'Dr. Sarah Mitchell', affiliation: 'Stanford AI Lab' },
      { name: 'James Chen', affiliation: 'Anthropic' },
    ],
  },
  {
    id: 'trend-002',
    topic: 'Creator Economy Monetization',
    description: 'New revenue models for content creators beyond sponsorships and ads.',
    growth: 180,
    mentions: 890,
    expertCount: 32,
    recentEpisodes: 18,
    relatedTopics: ['Subscriptions', 'Community Building', 'Digital Products'],
    topExperts: [
      { name: 'Pat Flynn', affiliation: 'Smart Passive Income' },
      { name: 'Ali Abdaal', affiliation: 'Part-Time YouTuber Academy' },
    ],
  },
  {
    id: 'trend-003',
    topic: 'Remote Team Leadership',
    description: 'Strategies for managing distributed teams effectively in a post-pandemic world.',
    growth: 95,
    mentions: 720,
    expertCount: 28,
    recentEpisodes: 15,
    relatedTopics: ['Async Work', 'Company Culture', 'Productivity'],
    topExperts: [
      { name: 'Darren Murph', affiliation: 'GitLab' },
      { name: 'Liam Martin', affiliation: 'Running Remote' },
    ],
  },
  {
    id: 'trend-004',
    topic: 'Personal Branding for Founders',
    description: 'How startup founders can leverage personal brands to drive business growth.',
    growth: 75,
    mentions: 540,
    expertCount: 22,
    recentEpisodes: 12,
    relatedTopics: ['LinkedIn Strategy', 'Thought Leadership', 'Networking'],
    topExperts: [
      { name: 'Justin Welsh', affiliation: 'The Saturday Solopreneur' },
      { name: 'Sahil Bloom', affiliation: 'The Curiosity Chronicle' },
    ],
  },
  {
    id: 'trend-005',
    topic: 'Podcast SEO & Discovery',
    description: 'Techniques to improve podcast visibility in search and app algorithms.',
    growth: 62,
    mentions: 380,
    expertCount: 15,
    recentEpisodes: 8,
    relatedTopics: ['Apple Podcasts', 'Spotify', 'Show Notes'],
    topExperts: [
      { name: 'Ross Winn', affiliation: 'Podcast Insights' },
      { name: 'Jared Ranere', affiliation: 'Grow The Show' },
    ],
  },
];

function TrendingCard({ topic }: { topic: TrendingTopic }) {
  return (
    <div className="topo-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            {topic.topic}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {topic.description}
          </p>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium"
          style={{
            backgroundColor: 'rgba(52, 199, 89, 0.1)',
            color: 'var(--accent-green)',
          }}
        >
          <ArrowUpRight className="w-3 h-3" />
          {topic.growth}%
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="metric-card">
          <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Mentions
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {topic.mentions.toLocaleString()}
          </div>
        </div>
        <div className="metric-card">
          <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Experts
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {topic.expertCount}
          </div>
        </div>
        <div className="metric-card">
          <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Episodes
          </div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {topic.recentEpisodes}
          </div>
        </div>
      </div>

      {/* Related Topics */}
      <div className="mb-4">
        <div className="text-xs font-mono uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>
          Related Topics
        </div>
        <div className="flex flex-wrap gap-2">
          {topic.relatedTopics.map((t) => (
            <span key={t} className="badge text-xs">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Top Experts */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <div className="text-xs font-mono uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Top Experts
        </div>
        <div className="space-y-2">
          {topic.topExperts.map((expert) => (
            <div key={expert.name} className="flex items-center gap-2">
              <div className="guest-avatar w-8 h-8 text-sm">
                {expert.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {expert.name}
                </div>
                {expert.affiliation && (
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {expert.affiliation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TrendingPage() {
  return (
    <div className="animate-in">
      {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)] mb-2">
            Trending
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Discover what topics are gaining momentum in your podcast niche
          </p>
        </div>

        {/* Summary Card */}
        <div className="topo-card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                This Week's Insights
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Based on analysis of 500+ podcasts in your niche
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {mockTrending.length}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Trending Topics
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>
                +142
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                New Experts
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                3.8K
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Total Mentions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                76
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                New Episodes
              </div>
            </div>
          </div>
        </div>

        {/* Trending Topics List */}
        <div className="grid gap-6">
          {mockTrending.map((topic, index) => (
            <div key={topic.id} className="relative">
              <div
                className="absolute -left-4 sm:-left-8 top-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: index === 0 ? 'var(--accent-green)' : 'var(--bg-subtle)',
                  color: index === 0 ? 'white' : 'var(--text-secondary)',
                }}
              >
                {index + 1}
              </div>
            <TrendingCard topic={topic} />
          </div>
        ))}
      </div>
    </div>
  );
}
