import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { errorResponse, handleApiError } from '@/lib/api/helpers'

export interface AnalyticsOverview {
  episodeTrends: {
    period: string
    count: number
  }[]
  seoScoreTrend: {
    episodeId: string
    title: string | null
    seoScore: number | null
    createdAt: string
  }[]
  averageSeoScore: number
  popularAssetTypes: {
    type: string
    count: number
  }[]
  processingStats: {
    totalEpisodes: number
    completedEpisodes: number
    averageDurationSeconds: number | null
    minDurationSeconds: number | null
    maxDurationSeconds: number | null
  }
  vocabularyGrowth: {
    totalTerms: number
    newThisMonth: number
  }
}

/**
 * GET /api/analytics/overview?showId=X&range=30
 * Returns aggregated analytics stats for a show
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const showId = searchParams.get('showId')
    const range = parseInt(searchParams.get('range') || '30', 10)

    // Calculate date cutoff
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - range)
    const cutoffISO = cutoffDate.toISOString()

    // Month start for "new this month" calculation
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthStartISO = monthStart.toISOString()

    // Build a query for episodes - if showId specified, filter by it
    let episodesQuery = supabase
      .from('episodes')
      .select('id, title, seo_score, status, audio_duration_seconds, created_at, shows!inner(user_id)')
      .eq('shows.user_id', userId)
      .gte('created_at', cutoffISO)
      .order('created_at', { ascending: true })

    if (showId) {
      episodesQuery = episodesQuery.eq('show_id', showId)
    }

    const { data: episodes, error: episodesError } = await episodesQuery

    if (episodesError) {
      return errorResponse(episodesError.message, 500)
    }

    // 1. Episode processing trends - group by week
    const weekBuckets: Record<string, number> = {}
    for (const ep of episodes || []) {
      const date = new Date(ep.created_at)
      // Use ISO week start (Monday)
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      const key = weekStart.toISOString().split('T')[0]
      weekBuckets[key] = (weekBuckets[key] || 0) + 1
    }
    const episodeTrends = Object.entries(weekBuckets).map(([period, count]) => ({
      period,
      count,
    }))

    // 2. SEO score trend - last 20 episodes with scores
    const seoScoreTrend = (episodes || [])
      .filter((ep) => ep.seo_score != null)
      .slice(-20)
      .map((ep) => ({
        episodeId: ep.id,
        title: ep.title,
        seoScore: ep.seo_score,
        createdAt: ep.created_at,
      }))

    // 3. Average SEO score
    const scoredEpisodes = (episodes || []).filter((ep) => ep.seo_score != null)
    const averageSeoScore =
      scoredEpisodes.length > 0
        ? Math.round(
            scoredEpisodes.reduce((sum, ep) => sum + (ep.seo_score || 0), 0) /
              scoredEpisodes.length
          )
        : 0

    // 4. Most-generated asset types
    let assetsQuery = supabase
      .from('generated_assets')
      .select('type, episodes!inner(show_id, shows!inner(user_id))')
      .eq('episodes.shows.user_id', userId)

    if (showId) {
      assetsQuery = assetsQuery.eq('episodes.show_id', showId)
    }

    const { data: assets } = await assetsQuery

    const assetCounts: Record<string, number> = {}
    for (const asset of assets || []) {
      const t = asset.type || 'unknown'
      assetCounts[t] = (assetCounts[t] || 0) + 1
    }
    const popularAssetTypes = Object.entries(assetCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }))

    // 5. Processing stats
    const completedEpisodes = (episodes || []).filter((ep) => ep.status === 'completed')
    const durations = completedEpisodes
      .map((ep) => ep.audio_duration_seconds)
      .filter((d): d is number => d != null)

    const processingStats = {
      totalEpisodes: (episodes || []).length,
      completedEpisodes: completedEpisodes.length,
      averageDurationSeconds:
        durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : null,
      minDurationSeconds: durations.length > 0 ? Math.min(...durations) : null,
      maxDurationSeconds: durations.length > 0 ? Math.max(...durations) : null,
    }

    // 6. Vocabulary growth
    let vocabTotalQuery = supabase
      .from('vocabulary_terms')
      .select('id', { count: 'exact', head: true })

    let vocabNewQuery = supabase
      .from('vocabulary_terms')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStartISO)

    if (showId) {
      vocabTotalQuery = vocabTotalQuery.eq('show_id', showId)
      vocabNewQuery = vocabNewQuery.eq('show_id', showId)
    }

    const [{ count: totalTerms }, { count: newTerms }] = await Promise.all([
      vocabTotalQuery,
      vocabNewQuery,
    ])

    const vocabularyGrowth = {
      totalTerms: totalTerms || 0,
      newThisMonth: newTerms || 0,
    }

    const overview: AnalyticsOverview = {
      episodeTrends,
      seoScoreTrend,
      averageSeoScore,
      popularAssetTypes,
      processingStats,
      vocabularyGrowth,
    }

    return NextResponse.json(
      { data: overview, error: null },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    return handleApiError(error, 'fetching analytics')
  }
}
