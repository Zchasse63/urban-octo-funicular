/**
 * REAL API CLIENT FOR TESTING
 *
 * Makes actual HTTP requests to your API routes.
 * No fetch mocking - we test the real endpoints.
 */

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  searchParams?: Record<string, string | number | boolean>
}

export interface ApiResponse<T> {
  status: number
  data: T
  headers: Headers
  ok: boolean
}

/**
 * Make a real HTTP request to an API endpoint
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, searchParams } = options

  // Build URL with search params
  let url = `${BASE_URL}${path}`
  if (searchParams) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      params.set(key, String(value))
    }
    url += `?${params.toString()}`
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => null)

  return {
    status: response.status,
    data,
    headers: response.headers,
    ok: response.ok,
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(path: string, searchParams?: Record<string, string | number | boolean>) =>
    apiRequest<T>(path, { method: 'GET', searchParams }),

  /**
   * POST request
   */
  post: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'POST', body }),

  /**
   * PUT request
   */
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PUT', body }),

  /**
   * PATCH request
   */
  patch: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),

  /**
   * DELETE request
   */
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
}

/**
 * Wait for server to be ready
 */
export async function waitForServer(
  maxAttempts = 30,
  delayMs = 1000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/test-db`)
      if (response.ok) {
        return true
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return false
}
