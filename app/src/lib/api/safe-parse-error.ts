/**
 * Safely extract an error message from a `fetch` Response.
 *
 * Some error responses (gateway timeouts, function-runtime errors, edge
 * proxy 502s) return plain text rather than JSON. Calling `await res.json()`
 * on those responses throws a SyntaxError that masks the real status — the
 * caller sees a meaningless "Unexpected token …" instead of the upstream
 * problem.
 *
 * This helper inspects the Content-Type and falls back to text parsing,
 * always returning a usable string.
 */
export async function safeParseError(
  response: Response,
  fallback = 'Request failed'
): Promise<string> {
  const contentType = response.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as { error?: string; message?: string }
      return body.error || body.message || `${fallback} (${response.status})`
    }

    const text = await response.text()
    if (!text) return `${fallback} (${response.status} ${response.statusText || ''})`.trim()

    // Avoid surfacing huge HTML error pages
    const trimmed = text.length > 280 ? `${text.slice(0, 280)}…` : text
    return `${fallback} (${response.status}): ${trimmed}`
  } catch {
    return `${fallback} (${response.status} ${response.statusText || ''})`.trim()
  }
}
