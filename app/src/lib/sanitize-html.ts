/**
 * Browser-safe HTML sanitizer wrapper around isomorphic-dompurify.
 *
 * Use this for any client-rendered raw HTML injection so we have a
 * single allowlist instead of duplicating the config across components.
 *
 * The allowlist matches the tags `lib/buzzsprout/inject` accepts, so HTML
 * round-tripping between the editor, the database, and the hosting platform
 * is consistent.
 */
import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
  'span', 'div', 'hr', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'src', 'alt', 'class']

// Strict URI scheme allowlist. We require an absolute URL with a known scheme
// to avoid (a) protocol-relative URLs like //attacker.com that load with the
// page's protocol and (b) any other surprising scheme. DOMPurify still strips
// `javascript:` and friends regardless, but the explicit allowlist makes the
// security posture obvious.
const ALLOWED_URI_REGEXP = /^(?:https?|mailto|tel):/i

export function sanitizeHtmlForDisplay(html: string | null | undefined): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  })
}
