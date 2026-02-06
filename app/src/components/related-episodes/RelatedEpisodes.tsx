'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RelatedEpisode } from '@/lib/cross-episode/types';

interface RelatedEpisodesProps {
  relatedEpisodes: RelatedEpisode[];
}

export default function RelatedEpisodes({ relatedEpisodes }: RelatedEpisodesProps) {
  if (!relatedEpisodes || relatedEpisodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm normal-case tracking-normal font-sans">Related Episodes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)]">No related episodes found yet.</p>
        </CardContent>
      </Card>
    );
  }

  const getSimilarityVariant = (score: number): 'success' | 'new' | 'warning' => {
    if (score >= 0.9) return 'success';
    if (score >= 0.8) return 'new';
    return 'warning';
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm normal-case tracking-normal font-sans">Related Episodes</CardTitle>
        <Badge variant="default">{relatedEpisodes.length} found</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {relatedEpisodes.map((related) => (
          <Link
            key={related.episodeId}
            href={`/episodes/${related.episodeId}`}
            className="block rounded-[var(--radius-lg)] border border-[var(--border-soft)] p-4 transition-colors hover:border-[var(--accent-blue)] hover:bg-[var(--bg-subtle)]"
          >
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="mb-1 text-sm text-[var(--text-secondary)]">
                  You also discussed{' '}
                  <span className="font-medium text-[var(--text-primary)]">{related.extractedTopic}</span> in
                </p>
                <h4 className="text-base font-semibold text-[var(--text-primary)]">
                  {related.episodeNumber
                    ? `Episode ${related.episodeNumber}: `
                    : ''}
                  {related.episodeTitle}
                </h4>
              </div>
              <Badge variant={getSimilarityVariant(related.similarityScore)}>
                {Math.round(related.similarityScore * 100)}%
              </Badge>
            </div>

            {related.matchedSections.length > 0 && (
              <div className="mt-3 border-t border-[var(--border-soft)] pt-3">
                <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">
                  {related.matchedSections[0].content}
                </p>
              </div>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
