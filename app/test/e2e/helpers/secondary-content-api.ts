/**
 * API helpers for the secondary-content-features suite.
 *
 * Thin wrappers over the authenticated Playwright `APIRequestContext`
 * keyed to each endpoint under test. All helpers return `{status, body}`
 * so the spec can assert both HTTP code and payload shape without
 * repeating fetch/parse boilerplate.
 */
import type { APIRequestContext } from '@playwright/test'

export interface JsonResult<T = unknown> {
  status: number
  body: T | null
  raw: string
}

async function readJson<T>(res: {
  status: () => number
  text: () => Promise<string>
}): Promise<JsonResult<T>> {
  const status = res.status()
  const raw = await res.text()
  let body: T | null = null
  try {
    body = raw ? (JSON.parse(raw) as T) : null
  } catch {
    body = null
  }
  return { status, body, raw }
}

// ─── Viral Moments ────────────────────────────────────────────────────────

export async function getViralMoments<T = unknown>(
  request: APIRequestContext,
  episodeId: string
): Promise<JsonResult<T>> {
  const res = await request.get(`/api/episodes/${episodeId}/viral-moments`)
  return readJson<T>(res)
}

// ─── SEO ───────────────────────────────────────────────────────────────────

export async function getSeo<T = unknown>(
  request: APIRequestContext,
  episodeId: string
): Promise<JsonResult<T>> {
  const res = await request.get(`/api/episodes/${episodeId}/seo`)
  return readJson<T>(res)
}

export async function postSeoFix<T = unknown>(
  request: APIRequestContext,
  episodeId: string,
  body: {
    fixId: string
    title?: string
    description?: string
    showNotes?: string
    showNotesHtml?: string
  }
): Promise<JsonResult<T>> {
  const res = await request.post(`/api/episodes/${episodeId}/seo`, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  })
  return readJson<T>(res)
}

// ─── RSS Tags ──────────────────────────────────────────────────────────────

export async function getRssTags<T = unknown>(
  request: APIRequestContext,
  episodeId: string
): Promise<JsonResult<T>> {
  const res = await request.get(`/api/episodes/${episodeId}/rss-tags`)
  return readJson<T>(res)
}

// ─── Pre-Interview ─────────────────────────────────────────────────────────

export async function getPreInterview<T = unknown>(
  request: APIRequestContext,
  episodeId: string
): Promise<JsonResult<T>> {
  const res = await request.get(`/api/episodes/${episodeId}/pre-interview`)
  return readJson<T>(res)
}

// ─── Related Episodes ──────────────────────────────────────────────────────

export async function getRelatedEpisodes<T = unknown>(
  request: APIRequestContext,
  episodeId: string
): Promise<JsonResult<T>> {
  const res = await request.get(`/api/episodes/${episodeId}/related`)
  return readJson<T>(res)
}

// ─── A/B Test ──────────────────────────────────────────────────────────────

export async function postAbTest<T = unknown>(
  request: APIRequestContext,
  episodeId: string,
  body: { field: 'title' | 'description' | string; variantCount?: number }
): Promise<JsonResult<T>> {
  const res = await request.post(`/api/episodes/${episodeId}/ab-test`, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  })
  return readJson<T>(res)
}

export async function getAbTest<T = unknown>(
  request: APIRequestContext,
  episodeId: string
): Promise<JsonResult<T>> {
  const res = await request.get(`/api/episodes/${episodeId}/ab-test`)
  return readJson<T>(res)
}

// ─── Schedule ──────────────────────────────────────────────────────────────

export async function postSchedule<T = unknown>(
  request: APIRequestContext,
  episodeId: string,
  scheduledAt: string
): Promise<JsonResult<T>> {
  const res = await request.post(`/api/episodes/${episodeId}/schedule`, {
    data: { scheduledAt },
    headers: { 'Content-Type': 'application/json' },
  })
  return readJson<T>(res)
}

export async function deleteSchedule<T = unknown>(
  request: APIRequestContext,
  episodeId: string
): Promise<JsonResult<T>> {
  const res = await request.delete(`/api/episodes/${episodeId}/schedule`)
  return readJson<T>(res)
}

// ─── Learnings ─────────────────────────────────────────────────────────────

export async function getLearnings<T = unknown>(
  request: APIRequestContext,
  episodeId: string
): Promise<JsonResult<T>> {
  const res = await request.get(`/api/episodes/${episodeId}/learnings`)
  return readJson<T>(res)
}

// ─── Vocabulary ────────────────────────────────────────────────────────────

export async function getVocabulary<T = unknown>(
  request: APIRequestContext,
  showId: string
): Promise<JsonResult<T>> {
  const res = await request.get(`/api/shows/${showId}/vocabulary`)
  return readJson<T>(res)
}

export async function postVocabulary<T = unknown>(
  request: APIRequestContext,
  showId: string,
  body: { term: string; alternatives?: string[] }
): Promise<JsonResult<T>> {
  const res = await request.post(`/api/shows/${showId}/vocabulary`, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  })
  return readJson<T>(res)
}

export async function deleteVocabulary<T = unknown>(
  request: APIRequestContext,
  showId: string,
  termId: string
): Promise<JsonResult<T>> {
  const res = await request.delete(
    `/api/shows/${showId}/vocabulary?term_id=${termId}`
  )
  return readJson<T>(res)
}

// ─── Analytics ─────────────────────────────────────────────────────────────

export async function getAnalyticsOverview<T = unknown>(
  request: APIRequestContext,
  opts: { showId?: string; range?: number } = {}
): Promise<JsonResult<T>> {
  const params = new URLSearchParams()
  if (opts.showId) params.set('showId', opts.showId)
  if (opts.range != null) params.set('range', String(opts.range))
  const qs = params.toString()
  const url = `/api/analytics/overview${qs ? `?${qs}` : ''}`
  const res = await request.get(url)
  return readJson<T>(res)
}
