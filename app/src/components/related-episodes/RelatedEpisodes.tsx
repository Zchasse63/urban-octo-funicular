'use client';

import React from 'react';
import Link from 'next/link';
import type { RelatedEpisode } from '@/lib/cross-episode/types';

interface RelatedEpisodesProps {
  relatedEpisodes: RelatedEpisode[];
}

export default function RelatedEpisodes({ relatedEpisodes }: RelatedEpisodesProps) {
  if (!relatedEpisodes || relatedEpisodes.length === 0) {
    return (
      <div className="topo-card">
        <h3 className="mono mb-4">Related Episodes</h3>
        <p className="text-secondary text-sm">No related episodes found yet.</p>
      </div>
    );
  }

  const similarityColor = (score: number): string => {
    if (score >= 0.9) return 'bg-green-100 text-green-700';
    if (score >= 0.8) return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="topo-card">
      <div className="card-header mb-6">
        <h3 className="mono">Related Episodes</h3>
        <span className="badge">{relatedEpisodes.length} found</span>
      </div>

      <div className="space-y-3">
        {relatedEpisodes.map((related) => (
          <Link
            key={related.episodeId}
            href={`/episodes/${related.episodeId}`}
            className="block"
          >
            <div className="related-card p-4 rounded-lg border border-border-soft hover:border-accent-blue hover:bg-bg-subtle transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm text-secondary mb-1">
                    You also discussed{' '}
                    <span className="font-medium text-primary">{related.extractedTopic}</span> in
                  </p>
                  <h4 className="text-base font-semibold text-primary hover:text-accent-blue">
                    {related.episodeNumber
                      ? `Episode ${related.episodeNumber}: `
                      : ''}
                    {related.episodeTitle}
                  </h4>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-mono ${similarityColor(related.similarityScore)}`}
                >
                  {Math.round(related.similarityScore * 100)}%
                </span>
              </div>

              {related.matchedSections.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border-soft">
                  <p className="text-xs text-secondary line-clamp-2">
                    {related.matchedSections[0].content}
                  </p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
