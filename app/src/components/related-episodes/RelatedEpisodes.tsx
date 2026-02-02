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
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No related episodes found yet.</p>
      </div>
    );
  }

  const getSimilarityStyle = (score: number): { color: string; bg: string } => {
    if (score >= 0.9) return { color: 'var(--accent-green)', bg: 'rgba(52, 199, 89, 0.1)' };
    if (score >= 0.8) return { color: 'var(--accent-blue)', bg: 'rgba(0, 122, 255, 0.1)' };
    return { color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.1)' };
  };

  return (
    <div className="topo-card">
      <div className="card-header mb-6">
        <h3 className="mono">Related Episodes</h3>
        <span className="badge">{relatedEpisodes.length} found</span>
      </div>

      <div className="space-y-3">
        {relatedEpisodes.map((related) => {
          const simStyle = getSimilarityStyle(related.similarityScore);
          return (
            <Link
              key={related.episodeId}
              href={`/episodes/${related.episodeId}`}
              className="block"
            >
              <div
                className="related-card p-4 rounded-[var(--radius-lg)] border transition-all"
                style={{ borderColor: 'var(--border-soft)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-soft)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                      You also discussed{' '}
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{related.extractedTopic}</span> in
                    </p>
                    <h4 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {related.episodeNumber
                        ? `Episode ${related.episodeNumber}: `
                        : ''}
                      {related.episodeTitle}
                    </h4>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-mono"
                    style={{ color: simStyle.color, backgroundColor: simStyle.bg }}
                  >
                    {Math.round(related.similarityScore * 100)}%
                  </span>
                </div>

                {related.matchedSections.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {related.matchedSections[0].content}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
