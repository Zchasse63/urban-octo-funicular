'use client';

import React from 'react';
import type { Expert, ExpertCategory } from '@/lib/experts/types';

interface ExpertCardProps {
  expert: Expert;
}

const categoryStyles: Record<ExpertCategory, { badge: string; meter: string }> = {
  fresh: {
    badge: 'badge-success',
    meter: 'bg-[var(--accent-green)]',
  },
  established: {
    badge: 'badge-new',
    meter: 'bg-[var(--accent-blue)]',
  },
  oversaturated: {
    badge: 'badge-warning',
    meter: 'bg-[var(--accent-amber)]',
  },
};

function isValidTwitterHandle(handle: string): boolean {
  const cleaned = handle.replace('@', '');
  return /^[a-zA-Z0-9_]{1,15}$/.test(cleaned);
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ExpertCard({ expert }: ExpertCardProps) {
  const styles = categoryStyles[expert.category] || categoryStyles.established;

  const websiteUrl = expert.contactHints.website && isValidUrl(expert.contactHints.website)
    ? expert.contactHints.website
    : null;
  const twitterHandle = expert.contactHints.twitter && isValidTwitterHandle(expert.contactHints.twitter)
    ? expert.contactHints.twitter.replace('@', '')
    : null;
  const linkedinUrl = expert.contactHints.linkedin && isValidUrl(expert.contactHints.linkedin)
    ? expert.contactHints.linkedin
    : null;

  return (
    <div className="guest-item">
      <div className="guest-avatar flex items-center justify-center text-2xl">
        {expert.name.charAt(0)}
      </div>

      <div className="guest-info flex-1">
        <h4 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{expert.name}</h4>
        {expert.metadata.affiliation && (
          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{expert.metadata.affiliation}</p>
        )}

        <div className="flex items-center gap-2 mb-2">
          <span className={`badge ${styles.badge}`}>{expert.category}</span>
          {expert.expertise.slice(0, 2).map((exp) => (
            <span key={exp} className="badge text-xs">
              {exp}
            </span>
          ))}
        </div>

        <div className="freshness-meter">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>FRESHNESS</span>
            <span className="freshness-value text-xs font-mono">{expert.freshnessScore}%</span>
          </div>
          <div className="freshness-bar">
            <div
              className={`freshness-fill ${styles.meter}`}
              style={{ width: `${expert.freshnessScore}%` }}
            />
          </div>
        </div>

        <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <p>
            {expert.recentAppearances} appearances (last 12 months) • {expert.appearanceCount}{' '}
            total
          </p>
        </div>

        {(websiteUrl || twitterHandle || linkedinUrl) && (
          <div className="mt-3 flex gap-2">
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs px-3 py-1"
              >
                Website
              </a>
            )}
            {twitterHandle && (
              <a
                href={`https://twitter.com/${twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs px-3 py-1"
              >
                Twitter
              </a>
            )}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs px-3 py-1"
              >
                LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
