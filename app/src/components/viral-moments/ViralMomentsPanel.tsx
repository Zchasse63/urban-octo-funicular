'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ViralMoment } from '@/lib/viral-moments/types';

interface ViralMomentsPanelProps {
  moments: ViralMoment[];
  onPlayMoment: (time: number) => void;
}

const categoryVariants: Record<string, 'error' | 'warning' | 'new' | 'success'> = {
  controversial: 'error',
  emotional: 'warning',
  quotable: 'new',
  surprising: 'success',
  counterintuitive: 'warning',
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm normal-case tracking-normal font-sans">Viral Moments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)]">No viral moments detected yet.</p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm normal-case tracking-normal font-sans">Viral Moments</CardTitle>
        <Badge variant="new">{moments.length} detected</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {moments.map((moment, index) => {
          const scoreStyle = getScoreColor(moment.score);
          return (
            <div
              key={moment.id}
              className="cursor-pointer rounded-[var(--radius-lg)] border border-[var(--border-soft)] p-4 transition-colors hover:border-[var(--accent-blue)]"
              onClick={() => onPlayMoment(moment.startTime)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onPlayMoment(moment.startTime);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>#{index + 1}</span>
                  <Badge variant={categoryVariants[moment.category] || 'default'}>
                    {moment.category}
                  </Badge>
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
                  className="rounded px-2 py-1 text-[var(--accent-blue)] hover:bg-[var(--bg-subtle)]"
                  type="button"
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
      </CardContent>
    </Card>
  );
}
