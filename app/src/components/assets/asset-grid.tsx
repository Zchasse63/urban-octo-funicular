'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { AssetCard } from './asset-card'
import {
  ASSET_TYPE_DEFINITIONS,
  ASSET_CATEGORIES,
  getAssetsByCategory,
  type AssetCategory,
  type AssetGenerationStatus,
  type AssetTypeDefinition,
} from '@/lib/assets/asset-types'
import type { GeneratedAsset } from '@/types/database'

// Asset data type combining definition with generated content
export interface AssetWithContent {
  definition: AssetTypeDefinition
  generatedAsset?: GeneratedAsset
  status: AssetGenerationStatus
}

interface AssetGridProps {
  assets: AssetWithContent[]
  selectedCategory?: AssetCategory | 'all'
  onEditAsset?: (assetId: string) => void
  onCopyAsset?: (assetId: string, content: string) => void
  onDownloadAsset?: (assetId: string) => void
  onRegenerateAsset?: (assetId: string) => void
  className?: string
}

export function AssetGrid({
  assets,
  selectedCategory = 'all',
  onEditAsset,
  onCopyAsset,
  onDownloadAsset,
  onRegenerateAsset,
  className,
}: AssetGridProps) {
  // Filter assets by category
  const filteredAssets = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return assets
    }
    return assets.filter((a) => a.definition.category === selectedCategory)
  }, [assets, selectedCategory])

  // Group assets by category for organized display
  const groupedAssets = React.useMemo(() => {
    const groups: Record<AssetCategory, AssetWithContent[]> = {
      social: [],
      long_form: [],
      video: [],
      visual: [],
    }

    filteredAssets.forEach((asset) => {
      groups[asset.definition.category].push(asset)
    })

    // Sort each group by priority
    Object.keys(groups).forEach((category) => {
      groups[category as AssetCategory].sort(
        (a, b) => b.definition.priority - a.definition.priority
      )
    })

    return groups
  }, [filteredAssets])

  // Calculate stats
  const stats = React.useMemo(() => {
    const total = assets.length
    const completed = assets.filter((a) => a.status === 'completed').length
    const generating = assets.filter((a) => a.status === 'generating').length
    const failed = assets.filter((a) => a.status === 'failed').length
    const pending = assets.filter((a) => a.status === 'pending').length

    return { total, completed, generating, failed, pending }
  }, [assets])

  if (selectedCategory !== 'all') {
    // Single category view
    return (
      <div className={cn('space-y-6', className)}>
        {/* Stats Bar */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--text-secondary)]">
            {filteredAssets.length} assets
          </span>
          <span className="text-[var(--accent-green)]">
            {filteredAssets.filter((a) => a.status === 'completed').length} ready
          </span>
          {filteredAssets.filter((a) => a.status === 'generating').length > 0 && (
            <span className="text-[var(--accent-blue)]">
              {filteredAssets.filter((a) => a.status === 'generating').length} generating
            </span>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.definition.id}
              assetType={asset.definition}
              content={asset.generatedAsset?.content}
              status={asset.status}
              onEdit={() => onEditAsset?.(asset.definition.id)}
              onCopy={() =>
                asset.generatedAsset?.content &&
                onCopyAsset?.(asset.definition.id, asset.generatedAsset.content)
              }
              onDownload={() => onDownloadAsset?.(asset.definition.id)}
              onRegenerate={() => onRegenerateAsset?.(asset.definition.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  // All categories view - grouped sections
  return (
    <div className={cn('space-y-10', className)}>
      {/* Overall Stats */}
      <div className="flex items-center gap-6 text-sm font-mono">
        <span className="text-[var(--text-primary)]">
          {stats.total} total assets
        </span>
        <span className="text-[var(--accent-green)]">
          {stats.completed} ready
        </span>
        {stats.generating > 0 && (
          <span className="text-[var(--accent-blue)]">
            {stats.generating} generating
          </span>
        )}
        {stats.failed > 0 && (
          <span className="text-[var(--accent-red)]">
            {stats.failed} failed
          </span>
        )}
        {stats.pending > 0 && (
          <span className="text-[var(--text-tertiary)]">
            {stats.pending} pending
          </span>
        )}
      </div>

      {/* Category Sections */}
      {(Object.keys(ASSET_CATEGORIES) as AssetCategory[]).map((category) => {
        const categoryAssets = groupedAssets[category]
        if (categoryAssets.length === 0) return null

        return (
          <section key={category}>
            {/* Category Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {ASSET_CATEGORIES[category].label}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {ASSET_CATEGORIES[category].description}
              </p>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryAssets.map((asset) => (
                <AssetCard
                  key={asset.definition.id}
                  assetType={asset.definition}
                  content={asset.generatedAsset?.content}
                  status={asset.status}
                  onEdit={() => onEditAsset?.(asset.definition.id)}
                  onCopy={() =>
                    asset.generatedAsset?.content &&
                    onCopyAsset?.(asset.definition.id, asset.generatedAsset.content)
                  }
                  onDownload={() => onDownloadAsset?.(asset.definition.id)}
                  onRegenerate={() => onRegenerateAsset?.(asset.definition.id)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// Helper function to create AssetWithContent array from definitions and generated assets
export function createAssetList(
  generatedAssets: GeneratedAsset[],
  generatingIds: string[] = []
): AssetWithContent[] {
  const generatedMap = new Map(
    generatedAssets.map((ga) => [ga.asset_type, ga])
  )

  return Object.values(ASSET_TYPE_DEFINITIONS).map((definition) => {
    const generatedAsset = generatedMap.get(definition.id as GeneratedAsset['asset_type'])
    let status: AssetGenerationStatus = 'pending'

    if (generatingIds.includes(definition.id)) {
      status = 'generating'
    } else if (generatedAsset) {
      status = 'completed'
    }

    return {
      definition,
      generatedAsset,
      status,
    }
  })
}

// Helper to get category counts
export function getCategoryCounts(assets: AssetWithContent[]): Record<AssetCategory | 'all', number> {
  const counts: Record<AssetCategory | 'all', number> = {
    all: assets.length,
    social: 0,
    long_form: 0,
    video: 0,
    visual: 0,
  }

  assets.forEach((asset) => {
    counts[asset.definition.category]++
  })

  return counts
}

// Helper to get ready counts by category
export function getReadyCounts(assets: AssetWithContent[]): Record<AssetCategory | 'all', number> {
  const counts: Record<AssetCategory | 'all', number> = {
    all: 0,
    social: 0,
    long_form: 0,
    video: 0,
    visual: 0,
  }

  assets.forEach((asset) => {
    if (asset.status === 'completed') {
      counts.all++
      counts[asset.definition.category]++
    }
  })

  return counts
}
