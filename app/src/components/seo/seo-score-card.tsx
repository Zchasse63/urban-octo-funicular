'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TopoCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { SEOFactor } from '@/lib/seo/analyzer'
import { getScoreColor, getScoreLabel } from '@/lib/seo/analyzer'

interface SEOScoreCardProps {
  score: number
  previousScore?: number
  factors: {
    keywordDensity: SEOFactor
    readability: SEOFactor
    headerStructure: SEOFactor
    internalLinks: SEOFactor
  }
  className?: string
}

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = (score / 100) * circumference
  const color = getScoreColor(score)

  const colorClasses = {
    green: 'stroke-[var(--accent-green)]',
    amber: 'stroke-[var(--accent-amber)]',
    red: 'stroke-[var(--accent-red)]',
  }

  const textColorClasses = {
    green: 'text-[var(--accent-green)]',
    amber: 'text-[var(--accent-amber)]',
    red: 'text-[var(--accent-red)]',
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn('transition-all duration-700 ease-out', colorClasses[color])}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-bold', textColorClasses[color])}>
          {score}
        </span>
        <span className="text-xs text-[var(--text-secondary)] font-medium mt-1">
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  )
}

function FactorBar({
  factor,
  className,
}: {
  factor: SEOFactor
  className?: string
}) {
  const percentage = (factor.score / factor.maxScore) * 100
  const color = getScoreColor(factor.score)

  const fillClasses = {
    green: 'bg-[var(--accent-green)]',
    amber: 'bg-[var(--accent-amber)]',
    red: 'bg-[var(--accent-red)]',
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-primary)]">{factor.name}</span>
        <span className="font-mono text-xs font-medium text-[var(--text-secondary)]">
          {factor.score}/{factor.maxScore}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            fillClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-[var(--text-tertiary)]">{factor.description}</p>
    </div>
  )
}

function TrendIndicator({
  current,
  previous,
}: {
  current: number
  previous?: number
}) {
  if (previous === undefined) return null

  const diff = current - previous

  if (diff > 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-[var(--accent-green)]">
        <TrendingUp className="w-3 h-3" />
        <span>+{diff}</span>
      </div>
    )
  }

  if (diff < 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-[var(--accent-red)]">
        <TrendingDown className="w-3 h-3" />
        <span>{diff}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
      <Minus className="w-3 h-3" />
      <span>No change</span>
    </div>
  )
}

export function SEOScoreCard({
  score,
  previousScore,
  factors,
  className,
}: SEOScoreCardProps) {
  return (
    <TopoCard className={cn('', className)} hover={false}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          SEO Score
        </CardTitle>
        <TrendIndicator current={score} previous={previousScore} />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Score Ring */}
          <div className="flex justify-center">
            <ScoreRing score={score} />
          </div>

          {/* Factor Breakdown */}
          <div className="flex-1 space-y-4">
            <FactorBar factor={factors.keywordDensity} />
            <FactorBar factor={factors.readability} />
            <FactorBar factor={factors.headerStructure} />
            <FactorBar factor={factors.internalLinks} />
          </div>
        </div>
      </CardContent>
    </TopoCard>
  )
}

// Export individual components for flexible usage
export { ScoreRing, FactorBar, TrendIndicator }
