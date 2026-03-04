/**
 * API Response Helpers
 * Eliminates duplicated response formatting across API routes.
 */

import { NextResponse } from 'next/server'
import { PAGINATION } from '@/lib/constants'
import type { ApiResponse } from '@/types/database'

/**
 * Return a JSON error response with consistent { data: null, error } shape.
 */
export function errorResponse(message: string, status: number): NextResponse<ApiResponse<null>> {
  return NextResponse.json<ApiResponse<null>>(
    { data: null, error: message },
    { status }
  )
}

/**
 * Return a JSON success response with consistent { data, error: null } shape.
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>(
    { data, error: null },
    { status }
  )
}

/**
 * Handle common catch-block errors in API routes.
 * Recognizes the `requireAuth()` "Unauthorized" throw pattern
 * and falls back to a generic 500 for everything else.
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiResponse<null>> {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return errorResponse('Unauthorized', 401)
  }

  if (context) {
    console.error(`Error in ${context}:`, error)
  } else {
    console.error('API error:', error)
  }

  return errorResponse('Internal server error', 500)
}

/**
 * Parse pagination params from URL search params.
 * Returns page, perPage, and the computed offset for Supabase `.range()`.
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number
  perPage: number
  offset: number
} {
  const page = parseInt(searchParams.get('page') || '1', 10)
  const perPage = Math.min(
    parseInt(searchParams.get('per_page') || String(PAGINATION.defaultPageSize), 10),
    PAGINATION.maxPageSize
  )
  const offset = (page - 1) * perPage

  return { page, perPage, offset }
}
