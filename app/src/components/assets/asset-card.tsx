'use client'

import * as React from 'react'
import { Copy, Download, Edit3, RotateCcw, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TopoCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AssetTypeDefinition, AssetGenerationStatus, AssetCategory } from '@/lib/assets/asset-types'
import { ASSET_CATEGORIES } from '@/lib/assets/asset-types'

interface AssetCardProps {
  assetType: AssetTypeDefinition
  content?: string | null
  status: AssetGenerationStatus
  onEdit?: () => void
  onCopy?: () => void
  onDownload?: () => void
  onRegenerate?: () => void
  className?: string
}

const statusConfig: Record<
  AssetGenerationStatus,
  { label: string; variant: 'default' | 'new' | 'success' | 'warning' | 'error' }
> = {
  pending: { label: 'Pending', variant: 'default' },
  generating: { label: 'Generating...', variant: 'new' },
  completed: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
}

const categoryColors: Record<AssetCategory, string> = {
  social: 'text-[var(--accent-blue)]',
  long_form: 'text-[var(--accent-green)]',
  video: 'text-[var(--accent-amber)]',
  visual: 'text-[var(--accent-blue)]',
}

export function AssetCard({
  assetType,
  content,
  status,
  onEdit,
  onCopy,
  onDownload,
  onRegenerate,
  className,
}: AssetCardProps) {
  const [copied, setCopied] = React.useState(false)
  const Icon = assetType.icon

  const handleCopy = async () => {
    if (content && onCopy) {
      onCopy()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const truncateContent = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  const isReady = status === 'completed' && !!content
  const isGenerating = status === 'generating'

  return (
    <TopoCard
      hover={isReady ? true : false}
      className={cn(
        'flex flex-col h-full',
        !isReady && 'opacity-75',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)]',
              categoryColors[assetType.category]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-[var(--text-primary)] truncate">
              {assetType.name}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] font-mono uppercase tracking-wide">
              {ASSET_CATEGORIES[assetType.category].label}
            </p>
          </div>
        </div>
        <Badge variant={statusConfig[status].variant}>
          {isGenerating && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          {statusConfig[status].label}
        </Badge>
      </div>

      {/* Content Preview */}
      <div className="flex-1 mb-4">
        {isReady ? (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {truncateContent(content)}
          </p>
        ) : isGenerating ? (
          <div className="flex items-center justify-center h-20">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
              <span className="text-xs text-[var(--text-tertiary)]">Generating content...</span>
            </div>
          </div>
        ) : status === 'failed' ? (
          <div className="flex items-center justify-center h-20">
            <p className="text-sm text-[var(--accent-red)]">Generation failed. Try again.</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <p className="text-sm text-[var(--text-tertiary)]">Not yet generated</p>
          </div>
        )}
      </div>

      {/* Meta Info */}
      <div className="mb-4 pb-4 border-b border-[var(--border-soft)]">
        <p className="text-xs text-[var(--text-tertiary)]">
          {assetType.typicalLength}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isReady && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="flex-1"
            >
              <Edit3 className="h-4 w-4" />
              <span className="ml-1.5">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="flex-1"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[var(--accent-green)]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="ml-1.5">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="flex-1"
            >
              <Download className="h-4 w-4" />
              <span className="ml-1.5">Save</span>
            </Button>
          </>
        )}
        {(status === 'failed' || status === 'pending') && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRegenerate}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="ml-1.5">
              {status === 'failed' ? 'Retry' : 'Generate'}
            </span>
          </Button>
        )}
      </div>
    </TopoCard>
  )
}

// Compact variant for dense grids
interface AssetCardCompactProps {
  assetType: AssetTypeDefinition
  status: AssetGenerationStatus
  onClick?: () => void
  className?: string
}

export function AssetCardCompact({
  assetType,
  status,
  onClick,
  className,
}: AssetCardCompactProps) {
  const Icon = assetType.icon
  const isReady = status === 'completed'
  const isGenerating = status === 'generating'

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg border border-[var(--border-soft)] bg-[var(--bg-elevated)]',
        'transition-all duration-200 text-left',
        isReady && 'hover:bg-[var(--bg-subtle)] cursor-pointer',
        !isReady && 'opacity-60 cursor-default',
        className
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md bg-[var(--bg-subtle)]',
          categoryColors[assetType.category]
        )}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {assetType.name}
        </p>
      </div>
      <Badge variant={statusConfig[status].variant} className="text-[10px]">
        {statusConfig[status].label}
      </Badge>
    </button>
  )
}
