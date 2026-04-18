/**
 * API Helpers for the Core Paid Flow
 *
 * Thin wrappers around the Playwright APIRequestContext used by the
 * core-paid-flow spec. These helpers keep the spec focused on behavior
 * while the mechanics of cookie/session forwarding, baseURL resolution,
 * and response shape extraction live here.
 */
import type { APIRequestContext, APIResponse, Page } from '@playwright/test'

/**
 * Forward the browser's session cookies to a fresh APIRequestContext
 * so tests can exercise authenticated API routes without re-doing the
 * sign-in flow. Returns the shared context attached to the page.
 */
export function apiFromPage(page: Page): APIRequestContext {
  return page.request
}

export interface AssetsDownloadResult {
  status: number
  contentType: string | null
  contentDisposition: string | null
  byteLength: number
  errorBody?: { error?: string }
}

/**
 * GET /api/episodes/:id/assets/download — returns the response metadata
 * AND (on non-200) the parsed error body. For 200 responses, we only
 * capture the byte length and headers — the ZIP body itself is binary
 * and not something tests should inspect here.
 */
export async function downloadAssetsZip(
  request: APIRequestContext,
  episodeId: string
): Promise<AssetsDownloadResult> {
  const res: APIResponse = await request.get(`/api/episodes/${episodeId}/assets/download`)
  const status = res.status()
  const contentType = res.headers()['content-type'] ?? null
  const contentDisposition = res.headers()['content-disposition'] ?? null

  if (status === 200) {
    const buf = await res.body()
    return { status, contentType, contentDisposition, byteLength: buf.length }
  }

  let errorBody: { error?: string } | undefined
  try {
    errorBody = (await res.json()) as { error?: string }
  } catch {
    errorBody = undefined
  }
  return { status, contentType, contentDisposition, byteLength: 0, errorBody }
}

export interface GuestPackageGetResult {
  status: number
  data?: {
    episode: { id: string; guest_name: string | null; title: string | null }
    show: { id: string; name: string }
    package: {
      socialPosts: Array<{ platform: string; characterCount: number; maxCharacters: number }>
      quoteCards: unknown[]
      emailSubject: string
      emailBody: string
    }
  }
  error?: string
}

export async function fetchGuestPackage(
  request: APIRequestContext,
  episodeId: string
): Promise<GuestPackageGetResult> {
  const res = await request.get(`/api/episodes/${episodeId}/guest-package`)
  const status = res.status()
  // The API wraps success payloads in `{ data, error: null }` via
  // `successResponse<T>()` (see src/lib/api/helpers.ts). Unwrap here so
  // tests can assert against the real response shape without having to
  // know about the envelope.
  const body = (await res.json().catch(() => null)) as
    | { data: GuestPackageGetResult['data']; error: null }
    | { data: null; error: string }
    | null
  if (status >= 400) {
    return { status, error: (body as { error?: string } | null)?.error }
  }
  return { status, data: (body?.data ?? undefined) as GuestPackageGetResult['data'] }
}

export async function sendGuestPackageEmail(
  request: APIRequestContext,
  episodeId: string,
  guestEmail: string,
  customMessage?: string
): Promise<{ status: number; body: unknown }> {
  const res = await request.post(`/api/episodes/${episodeId}/guest-package`, {
    data: { guestEmail, customMessage },
    headers: { 'Content-Type': 'application/json' },
  })
  return { status: res.status(), body: await res.json().catch(() => null) }
}

export async function processEpisode(
  request: APIRequestContext,
  episodeId: string
): Promise<{ status: number; body: unknown }> {
  const res = await request.post(`/api/episodes/${episodeId}/process`, {
    data: {},
    headers: { 'Content-Type': 'application/json' },
  })
  return { status: res.status(), body: await res.json().catch(() => null) }
}

export async function getEpisode(
  request: APIRequestContext,
  episodeId: string
): Promise<{ status: number; body: unknown }> {
  const res = await request.get(`/api/episodes/${episodeId}`)
  return { status: res.status(), body: await res.json().catch(() => null) }
}

export async function getProcessStatus(
  request: APIRequestContext,
  episodeId: string
): Promise<{ status: number; body: unknown }> {
  const res = await request.get(`/api/episodes/${episodeId}/process`)
  return { status: res.status(), body: await res.json().catch(() => null) }
}

/**
 * POST to the AssemblyAI webhook with or without an auth token. Uses an
 * unauthenticated `request` context (the webhook is session-less; it's
 * authenticated via the `?token=` query parameter).
 *
 * Pass `undefined` for no token, `null` for empty token, or a string.
 */
export async function postAssemblyaiWebhook(
  request: APIRequestContext,
  token: string | null | undefined,
  body: Record<string, unknown>
): Promise<{ status: number; body: unknown }> {
  const qs =
    token === undefined
      ? ''
      : `?token=${encodeURIComponent(token ?? '')}`
  const res = await request.post(`/api/webhooks/assemblyai${qs}`, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  })
  return { status: res.status(), body: await res.json().catch(() => null) }
}

/**
 * Posts a file to the pre-signed-URL endpoint to validate input shape.
 * Used by T-020 to assert 400 on invalid MIME types.
 */
export async function requestSignedUploadUrl(
  request: APIRequestContext,
  payload: { fileName: string; fileSize: number; mimeType: string }
): Promise<{ status: number; body: unknown }> {
  const res = await request.post('/api/upload', {
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  })
  return { status: res.status(), body: await res.json().catch(() => null) }
}
