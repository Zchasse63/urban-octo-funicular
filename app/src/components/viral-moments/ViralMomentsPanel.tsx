'use client';

import React from 'react';
import type { ViralMoment } from '@/lib/viral-moments/types';

interface ViralMomentsPanelProps {
  moments: ViralMoment[];
  onPlayMoment: (time: number) => void;
}

const categoryColors: Record<string, string> = {
  controversial: 'bg-red-100 text-red-700 border-red-200',
  emotional: 'bg-amber-100 text-amber-700 border-amber-200',
  quotable: 'bg-blue-100 text-blue-700 border-blue-200',
  surprising: 'bg-green-100 text-green-700 border-green-200',
  counterintuitive: 'bg-purple-100 text-purple-700 border-purple-200',
};

const scoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 60) return 'text-blue-600 bg-blue-50';
  if (score >= 40) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
};

const platformIcons: Record<string, string> = {
  tiktok: '📱',
  instagram: '📸',
  twitter: '🐦',
  linkedin: '💼',
};

export default function ViralMomentsPanel({ moments, onPlayMoment }: ViralMomentsPanelProps) {
  if (!moments || moments.length === 0) {
    return (
      <div className="topo-card">
        <h3 className="mono mb-4">Viral Moments</h3>
        <p className="text-secondary text-sm">No viral moments detected yet.</p>
      </div>
    );
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="topo-card">
      <div className="card-header mb-6">
        <h3 className="mono">Viral Moments</h3>
        <span className="badge badge-new">{moments.length} detected</span>
      </div>

      <div className="space-y-4">
        {moments.map((moment, index) => (
          <div
            key={moment.id}
            className="moment-card p-4 rounded-lg border border-border-soft hover:border-accent-blue transition-colors cursor-pointer"
            onClick={() => onPlayMoment(moment.startTime)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-secondary">#{index + 1}</span>
                <span className={`badge ${categoryColors[moment.category]}`}>
                  {moment.category}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-md text-sm font-semibold ${scoreColor(moment.score)}`}
              >
                {moment.score}
              </span>
            </div>

            <blockquote className="text-base mb-3 leading-relaxed text-primary">
              &ldquo;{moment.quote}&rdquo;
            </blockquote>

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayMoment(moment.startTime);
                }}
                className="timestamp-link"
              >
                {formatTime(moment.startTime)} - {formatTime(moment.endTime)}
              </button>

              <div className="flex items-center gap-1">
                {moment.suggestedPlatforms.map((platform) => (
                  <span key={platform} title={platform} className="text-base">
                    {platformIcons[platform]}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border-soft">
              <p className="text-xs text-secondary leading-relaxed">{moment.reasoning}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
