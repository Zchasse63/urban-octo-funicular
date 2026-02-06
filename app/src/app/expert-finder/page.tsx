'use client';

import * as React from 'react';
import { Search, Users, ExternalLink } from 'lucide-react';
import { ContentCard } from '@/components/podbrain';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Expert, ExpertCategory } from '@/lib/experts/types';

// Mock experts data
const mockExperts: Expert[] = [
  {
    id: 'exp-001',
    name: 'Dr. Maya Patel',
    category: 'fresh',
    freshnessScore: 92,
    expertise: ['AI Ethics', 'Machine Learning', 'Tech Policy'],
    appearanceCount: 4,
    recentAppearances: 2,
    contactHints: {
      twitter: 'mayapatel_ai',
      linkedin: 'https://linkedin.com/in/mayapatel',
      website: 'https://mayapatel.io',
    },
    metadata: {
      affiliation: 'MIT Media Lab',
      bio: 'Leading researcher in AI ethics and responsible AI development',
    },
  },
  {
    id: 'exp-002',
    name: 'Chris Hartley',
    category: 'fresh',
    freshnessScore: 88,
    expertise: ['Podcast Growth', 'Content Strategy', 'Audience Building'],
    appearanceCount: 6,
    recentAppearances: 3,
    contactHints: {
      twitter: 'chrishartley',
      website: 'https://podcastgrowth.co',
    },
    metadata: {
      affiliation: 'Podcast Growth Co.',
      bio: 'Helped 200+ podcasts reach their first 10,000 downloads',
    },
  },
  {
    id: 'exp-003',
    name: 'Amanda Foster',
    category: 'established',
    freshnessScore: 65,
    expertise: ['Entrepreneurship', 'Funding', 'Startup Scaling'],
    appearanceCount: 28,
    recentAppearances: 8,
    contactHints: {
      linkedin: 'https://linkedin.com/in/amandafoster',
      website: 'https://amandafoster.vc',
    },
    metadata: {
      affiliation: 'Foster Ventures',
      bio: 'General Partner at Foster Ventures, invested in 40+ startups',
    },
  },
  {
    id: 'exp-004',
    name: 'Dr. Robert Kim',
    category: 'established',
    freshnessScore: 58,
    expertise: ['Productivity', 'Deep Work', 'Time Management'],
    appearanceCount: 45,
    recentAppearances: 12,
    contactHints: {
      twitter: 'drrobertkim',
      website: 'https://deepworkbook.com',
    },
    metadata: {
      affiliation: 'UC Berkeley',
      bio: 'Author of "The Deep Work Method" - 500K copies sold',
    },
  },
  {
    id: 'exp-005',
    name: 'Tim Ferriss',
    category: 'oversaturated',
    freshnessScore: 25,
    expertise: ['Lifestyle Design', 'Investing', 'Biohacking'],
    appearanceCount: 500,
    recentAppearances: 45,
    contactHints: {
      twitter: 'tferriss',
      website: 'https://tim.blog',
    },
    metadata: {
      affiliation: 'Tim Ferriss Show',
      bio: 'Best-selling author and podcast host',
    },
  },
  {
    id: 'exp-006',
    name: 'Sarah Williams',
    category: 'fresh',
    freshnessScore: 95,
    expertise: ['Remote Work', 'Team Culture', 'Async Communication'],
    appearanceCount: 2,
    recentAppearances: 2,
    contactHints: {
      linkedin: 'https://linkedin.com/in/sarahwilliams',
    },
    metadata: {
      affiliation: 'Notion',
      bio: 'Head of Remote at Notion, building the future of distributed work',
    },
  },
];

const categoryConfig: Record<ExpertCategory, { label: string; badgeVariant: 'success' | 'new' | 'warning'; meterColor: string }> = {
  fresh: {
    label: 'Fresh Voice',
    badgeVariant: 'success',
    meterColor: 'var(--accent-green)',
  },
  established: {
    label: 'Established',
    badgeVariant: 'new',
    meterColor: 'var(--accent-blue)',
  },
  oversaturated: {
    label: 'Over-interviewed',
    badgeVariant: 'warning',
    meterColor: 'var(--accent-amber)',
  },
};

function ExpertResultCard({ expert }: { expert: Expert }) {
  const config = categoryConfig[expert.category];

  return (
    <ContentCard title="Expert" className="flex flex-col">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 text-xl flex-shrink-0 flex items-center justify-center rounded-full font-semibold"
          style={{
            background: 'linear-gradient(135deg, #F5F5F4 0%, #E5E5E4 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
            color: 'var(--text-primary)',
          }}
        >
          {expert.name.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              {expert.name}
            </h3>
            <Badge variant={config.badgeVariant}>{config.label}</Badge>
          </div>

          {expert.metadata.affiliation && (
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              {expert.metadata.affiliation}
            </p>
          )}

          {expert.metadata.bio && (
            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
              {expert.metadata.bio}
            </p>
          )}

          {/* Expertise Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {expert.expertise.map((exp) => (
              <Badge key={exp} variant="outline" className="text-xs">
                {exp}
              </Badge>
            ))}
          </div>

          {/* Freshness Meter */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                FRESHNESS
              </span>
              <span className="text-xs font-mono">{expert.freshnessScore}%</span>
            </div>
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                height: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${expert.freshnessScore}%`,
                  height: '100%',
                  backgroundColor: config.meterColor,
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {expert.recentAppearances} appearances (last 12 months) • {expert.appearanceCount} total
          </div>
        </div>
      </div>

      {/* Contact Actions */}
      {(expert.contactHints.website || expert.contactHints.twitter || expert.contactHints.linkedin) && (
        <div className="mt-4 pt-4 border-t flex gap-2" style={{ borderColor: 'var(--border-soft)' }}>
          {expert.contactHints.website && (
            <a
              href={expert.contactHints.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-soft)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Website
            </a>
          )}
          {expert.contactHints.twitter && (
            <a
              href={`https://twitter.com/${expert.contactHints.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-soft)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              Twitter
            </a>
          )}
          {expert.contactHints.linkedin && (
            <a
              href={expert.contactHints.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-soft)] bg-[var(--bg-elevated)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              LinkedIn
            </a>
          )}
        </div>
      )}
    </ContentCard>
  );
}

export default function ExpertFinderPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<ExpertCategory | 'all'>('all');
  const [filteredExperts, setFilteredExperts] = React.useState(mockExperts);

  React.useEffect(() => {
    let results = mockExperts;

    // Filter by category
    if (categoryFilter !== 'all') {
      results = results.filter((e) => e.category === categoryFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (expert) =>
          expert.name.toLowerCase().includes(query) ||
          expert.expertise.some((e) => e.toLowerCase().includes(query)) ||
          expert.metadata.affiliation?.toLowerCase().includes(query) ||
          expert.metadata.bio?.toLowerCase().includes(query)
      );
    }

    // Sort by freshness
    results = results.sort((a, b) => b.freshnessScore - a.freshnessScore);

    setFilteredExperts(results);
  }, [searchQuery, categoryFilter]);

  const categoryGroups = {
    fresh: filteredExperts.filter((e) => e.category === 'fresh'),
    established: filteredExperts.filter((e) => e.category === 'established'),
    oversaturated: filteredExperts.filter((e) => e.category === 'oversaturated'),
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)] mb-2">
          Expert Finder
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Discover fresh voices and industry experts for your podcast
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <Input
            type="text"
            placeholder="Search by name, topic, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'fresh', 'established', 'oversaturated'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-[var(--text-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              {cat === 'all' ? 'All' : categoryConfig[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Found {filteredExperts.length} experts
      </div>

      {/* Results */}
      {filteredExperts.length > 0 ? (
        categoryFilter === 'all' ? (
          // Grouped view when showing all
          <div className="space-y-8">
            {categoryGroups.fresh.length > 0 && (
              <div>
                <h2 className="mono mb-4 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--accent-green)' }}
                  />
                  Fresh Voices ({categoryGroups.fresh.length})
                </h2>
                <div className="grid gap-4">
                  {categoryGroups.fresh.map((expert) => (
                    <ExpertResultCard key={expert.id} expert={expert} />
                  ))}
                </div>
              </div>
            )}

            {categoryGroups.established.length > 0 && (
              <div>
                <h2 className="mono mb-4 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--accent-blue)' }}
                  />
                  Established ({categoryGroups.established.length})
                </h2>
                <div className="grid gap-4">
                  {categoryGroups.established.map((expert) => (
                    <ExpertResultCard key={expert.id} expert={expert} />
                  ))}
                </div>
              </div>
            )}

            {categoryGroups.oversaturated.length > 0 && (
              <div>
                <h2 className="mono mb-4 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--accent-amber)' }}
                  />
                  Over-interviewed ({categoryGroups.oversaturated.length})
                </h2>
                <div className="grid gap-4">
                  {categoryGroups.oversaturated.map((expert) => (
                    <ExpertResultCard key={expert.id} expert={expert} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Flat list when filtering by category
          <div className="grid gap-4">
            {filteredExperts.map((expert) => (
              <ExpertResultCard key={expert.id} expert={expert} />
            ))}
          </div>
        )
      ) : (
        <ContentCard title="No Results" className="text-center py-12">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <Users className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No experts found
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try adjusting your search terms or filters
          </p>
        </ContentCard>
      )}
    </div>
  );
}
