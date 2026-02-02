'use client'

import * as React from 'react'
import { Download, Quote } from 'lucide-react'
import { TopoCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { QuoteCard } from '@/lib/guest-package/generator'

interface QuoteCardPreviewProps {
  quote: QuoteCard
  onDownload?: () => void
}

function QuoteCardPreview({ quote, onDownload }: QuoteCardPreviewProps) {
  return (
    <div
      className={cn(
        'relative p-6 rounded-xl',
        'bg-gradient-to-br from-[var(--bg-subtle)] to-white',
        'border border-[var(--border-soft)]',
        'group hover:shadow-[var(--shadow-topo)] transition-shadow duration-300'
      )}
    >
      {/* Quote Icon */}
      <Quote className="h-6 w-6 text-[var(--accent-blue)]/30 mb-3" />

      {/* Quote Text */}
      <blockquote className="text-[var(--text-primary)] text-sm leading-relaxed mb-4 min-h-[60px]">
        &ldquo;{quote.quote}&rdquo;
      </blockquote>

      {/* Attribution */}
      <div className="border-t border-[var(--border-soft)] pt-3">
        <p className="font-medium text-sm text-[var(--text-primary)]">
          {quote.attribution}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {quote.episodeTitle}
        </p>
      </div>

      {/* Download Button - shows on hover */}
      <button
        onClick={onDownload}
        className={cn(
          'absolute top-3 right-3 p-2 rounded-lg',
          'bg-white/80 backdrop-blur-sm border border-[var(--border-soft)]',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'hover:bg-[var(--bg-subtle)]'
        )}
        title="Download quote card"
      >
        <Download className="h-4 w-4 text-[var(--text-secondary)]" />
      </button>
    </div>
  )
}

interface QuoteCardsGridProps {
  quotes: QuoteCard[]
  onDownloadAll?: () => void
  onDownloadSingle?: (quote: QuoteCard) => void
}

export function QuoteCardsGrid({
  quotes,
  onDownloadAll,
  onDownloadSingle,
}: QuoteCardsGridProps) {
  return (
    <TopoCard hover={false}>
      <CardHeader>
        <div>
          <CardTitle className="text-sm normal-case tracking-normal font-sans font-semibold text-[var(--text-primary)]">
            Quote Cards
          </CardTitle>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Share these visual quote cards on social media
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownloadAll}
          className="shrink-0"
        >
          <Download className="h-4 w-4" />
          Download All
        </Button>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => (
            <QuoteCardPreview
              key={quote.id}
              quote={quote}
              onDownload={() => onDownloadSingle?.(quote)}
            />
          ))}
        </div>

        {quotes.length === 0 && (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            <Quote className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No quote cards available yet</p>
          </div>
        )}
      </CardContent>
    </TopoCard>
  )
}

export { QuoteCardPreview }
