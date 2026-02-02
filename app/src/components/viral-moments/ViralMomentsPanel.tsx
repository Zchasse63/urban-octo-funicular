'use client';

import React from 'react';
import type { ViralMoment } from '@/lib/viral-moments/types';

interface ViralMomentsPanelProps {
  moments: ViralMoment[];
  onPlayMoment: (time: number) => void;
}

const categoryColors: Record<string, string> = {
  controversial: 'badge-error',
  emotional: 'badge-warning',
  quotable: 'badge-new',
  surprising: 'badge-success',
  counterintuitive: 'badge-warning', // Use warning instead of unsupported purple
};

const getScoreColor = (score: number): { text: string; bg: string } => {
  if (score >= 80) return { text: 'var(--accent-green)', bg: 'rgba(52, 199, 89, 0.1)' };
  if (score >= 60) return { text: 'var(--accent-blue)', bg: 'rgba(0, 122, 255, 0.1)' };
  if (score >= 40) return { text: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.1)' };
  return { text: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)' };
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
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No viral moments detected yet.</p>
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
        {moments.map((moment, index) => {
          const scoreStyle = getScoreColor(moment.score);
          return (
            <div
              key={moment.id}
              className="moment-card p-4 rounded-[var(--radius-lg)] border transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-soft)' }}
              onClick={() => onPlayMoment(moment.startTime)}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-soft)'}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>#{index + 1}</span>
                  <span className={`badge ${categoryColors[moment.category]}`}>
                    {moment.category}
                  </span>
                </div>
                <span
                  className="px-3 py-1 rounded-md text-sm font-semibold"
                  style={{ color: scoreStyle.text, backgroundColor: scoreStyle.bg }}
                >
                  {moment.score}
                </span>
              </div>

              <blockquote className="text-base mb-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
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

              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{moment.reasoning}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
