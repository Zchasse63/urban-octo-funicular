'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Expert, ExpertCategory } from '@/lib/experts/types';

interface ExpertCardProps {
  expert: Expert;
}

const categoryStyles: Record<ExpertCategory, { badge: 'success' | 'new' | 'warning'; meter: string; label: string }> = {
  fresh: {
    badge: 'success',
    meter: 'bg-[var(--accent-green)]',
    label: 'Fresh Voice',
  },
  established: {
    badge: 'new',
    meter: 'bg-[var(--accent-blue)]',
    label: 'Established',
  },
  oversaturated: {
    badge: 'warning',
    meter: 'bg-[var(--accent-amber)]',
    label: 'Over-interviewed',
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className="h-12 w-12 shrink-0 rounded-full text-center text-2xl leading-[48px] font-semibold"
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
          >
            {expert.name.charAt(0)}
          </div>

          <div className="flex-1">
            <h4 className="mb-1 text-base font-semibold text-[var(--text-primary)]">{expert.name}</h4>
            {expert.metadata.affiliation && (
              <p className="mb-2 text-xs text-[var(--text-secondary)]">{expert.metadata.affiliation}</p>
            )}

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={styles.badge}>{styles.label}</Badge>
              {expert.expertise.slice(0, 2).map((exp) => (
                <Badge key={exp} variant="outline">{exp}</Badge>
              ))}
            </div>

            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--text-tertiary)]">FRESHNESS</span>
                <span className="text-xs font-mono text-[var(--text-secondary)]">{expert.freshnessScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div
                  className={`h-full ${styles.meter}`}
                  style={{ width: `${expert.freshnessScore}%` }}
                />
              </div>
            </div>

            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              {expert.recentAppearances} appearances (last 12 months) • {expert.appearanceCount} total
            </p>

            {(websiteUrl || twitterHandle || linkedinUrl) && (
              <div className="mt-3 flex gap-2">
                {websiteUrl && (
                  <Button asChild size="sm" variant="secondary">
                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                  </Button>
                )}
                {twitterHandle && (
                  <Button asChild size="sm" variant="secondary">
                    <a href={`https://twitter.com/${twitterHandle}`} target="_blank" rel="noopener noreferrer">
                      Twitter
                    </a>
                  </Button>
                )}
                {linkedinUrl && (
                  <Button asChild size="sm" variant="secondary">
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
