'use client';

import * as React from 'react';
import { Search, Plus, Users, ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="topo-card">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="guest-avatar w-12 h-12 text-xl flex-shrink-0">
          {guest.name.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
            {guest.name}
          </h3>
          <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {guest.bio}
          </p>

          {/* Topics */}
          <div className="flex flex-wrap gap-2 mb-3">
            {guest.topics.slice(0, 3).map((topic) => (
              <span key={topic} className="badge text-xs">
                {topic}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span>{guest.episodeCount} episode{guest.episodeCount !== 1 ? 's' : ''}</span>
            <span>Last: {new Date(guest.lastAppearance).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {guest.social && (
        <div className="mt-4 pt-4 border-t flex gap-2" style={{ borderColor: 'var(--border-soft)' }}>
          {guest.social.website && (
            <a
              href={guest.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs px-3 py-1.5"
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
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Twitter
            </a>
          )}
          {guest.social.linkedin && (
            <a
              href={guest.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs px-3 py-1.5"
            >
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
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
    <div className="animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)] mb-2">
            Guests
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage your podcast guests and their information
          </p>
        </div>
        <Button className="min-h-[44px]" aria-label="Add new guest">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Guest
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          placeholder="Search guests by name, bio, or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-bar pl-10"
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
        <div className="topo-card text-center py-12">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <Users className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No guests found
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
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
        </div>
      )}
    </div>
  );
}
