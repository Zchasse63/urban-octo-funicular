'use client';

import * as React from 'react';
import { Search, Plus, Users, ExternalLink, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/podbrain';
import { Input } from '@/components/ui/input';

interface Guest {
  id: string;
  name: string;
  bio: string;
  episodeCount: number;
  lastAppearance: string;
  topics: string[];
  social?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

// Mock data for demonstration
const mockGuests: Guest[] = [
  {
    id: 'guest-001',
    name: 'Sarah Chen',
    bio: 'AI Product Leader at TechCorp, focusing on applied machine learning',
    episodeCount: 3,
    lastAppearance: '2026-01-28',
    topics: ['AI Products', 'Machine Learning', 'Product Strategy'],
    social: {
      twitter: 'sarahchen',
      linkedin: 'https://linkedin.com/in/sarahchen',
      website: 'https://sarahchen.io',
    },
  },
  {
    id: 'guest-002',
    name: 'Marcus Johnson',
    bio: 'Founder & CEO of RemoteFirst, remote work consultant',
    episodeCount: 1,
    lastAppearance: '2026-01-21',
    topics: ['Remote Work', 'Leadership', 'Company Culture'],
    social: {
      twitter: 'marcusjohnson',
      linkedin: 'https://linkedin.com/in/marcusjohnson',
    },
  },
  {
    id: 'guest-003',
    name: 'Dr. Emily Rodriguez',
    bio: 'Neuroscientist and author specializing in productivity research',
    episodeCount: 2,
    lastAppearance: '2026-01-07',
    topics: ['Productivity', 'Neuroscience', 'Peak Performance'],
    social: {
      website: 'https://emilyrodriguez.com',
    },
  },
  {
    id: 'guest-004',
    name: 'Alex Kim',
    bio: 'Startup advisor, former VP of Growth at ScaleUp',
    episodeCount: 1,
    lastAppearance: '2025-12-28',
    topics: ['Growth', 'Startups', 'Monetization'],
    social: {
      twitter: 'alexkimgrowth',
      linkedin: 'https://linkedin.com/in/alexkim',
    },
  },
];

function GuestCard({ guest }: { guest: Guest }) {
  return (
    <ContentCard title="Guest Profile" className="flex flex-col">
      <div className="flex items-start gap-4">
        {/* Avatar with gradient background and online indicator */}
        <div className="relative flex-shrink-0">
          <div
            className="w-14 h-14 text-xl flex items-center justify-center rounded-full font-semibold text-[var(--text-primary)]"
            style={{
              background: 'linear-gradient(135deg, #F5F5F4 0%, #E5E5E4 100%)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
            }}
          >
            {guest.name.charAt(0)}
          </div>
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-[var(--accent-green)] rounded-full"></div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              {guest.name}
            </h3>
            {/* Episode count badge */}
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              {guest.episodeCount} ep
            </span>
          </div>
          <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {guest.bio}
          </p>

          {/* Topics as small rounded pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {guest.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 text-[10px] font-medium rounded-full border"
                style={{
                  borderColor: 'var(--border-soft)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-base)'
                }}
              >
                {topic}
              </span>
            ))}
          </div>

          {/* Last appearance with calendar icon */}
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <Calendar className="w-3 h-3" />
            <span>Last appearance: {new Date(guest.lastAppearance).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Actions with hover states */}
      {guest.social && (
        <div className="mt-4 pt-4 border-t flex gap-2" style={{ borderColor: 'var(--border-soft)' }}>
          {guest.social.website && (
            <a
              href={guest.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 font-medium text-md rounded-md inline-flex items-center justify-center whitespace-nowrap text-sm transition-all duration-200 border border-black/10 dark:border-white/10 bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Website
            </a>
          )}
          {guest.social.twitter && (
            <a
              href={`https://twitter.com/${guest.social.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 font-medium text-md rounded-md inline-flex items-center justify-center whitespace-nowrap text-sm transition-all duration-200 border border-black/10 dark:border-white/10 bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
            >
              Twitter
            </a>
          )}
          {guest.social.linkedin && (
            <a
              href={guest.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 font-medium text-md rounded-md inline-flex items-center justify-center whitespace-nowrap text-sm transition-all duration-200 border border-black/10 dark:border-white/10 bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
            >
              LinkedIn
            </a>
          )}
        </div>
      )}
    </ContentCard>
  );
}

export default function GuestsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredGuests, setFilteredGuests] = React.useState(mockGuests);

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGuests(mockGuests);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = mockGuests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(query) ||
        guest.bio.toLowerCase().includes(query) ||
        guest.topics.some((topic) => topic.toLowerCase().includes(query))
    );
    setFilteredGuests(filtered);
  }, [searchQuery]);

  return (
    <div>
      {/* Header with section-label */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <span className="section-label mb-2 block">Guest Directory</span>
          <h1 className="text-heading-lg mb-2">
            Guests
          </h1>
          <p className="text-body">
            Manage your podcast guests and their information
          </p>
        </div>
        <Button className="min-h-[44px]" aria-label="Add new guest">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Guest
        </Button>
      </div>

      {/* Search with enhanced focus states */}
      <div className="relative mb-6">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search
            className="w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
        <Input
          type="text"
          placeholder="Search guests by name, bio, or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 focus:ring-2 focus:ring-[rgba(0,122,255,0.1)]"
        />
      </div>

      {/* Guest Count */}
      <div className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Showing {filteredGuests.length} of {mockGuests.length} guests
      </div>

      {/* Guest Grid */}
      {filteredGuests.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {filteredGuests.map((guest) => (
            <GuestCard key={guest.id} guest={guest} />
          ))}
        </div>
      ) : (
        <ContentCard title="No Results" className="text-center py-12">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #F5F5F4 0%, #E5E5E4 100%)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
            }}
          >
            <Users className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 className="text-heading-lg mb-2">
            No guests found
          </h3>
          <p className="text-body mb-4">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Add your first guest to get started'}
          </p>
          {!searchQuery && (
            <Button>
              <Plus className="h-4 w-4" />
              Add Guest
            </Button>
          )}
        </ContentCard>
      )}
    </div>
  );
}
