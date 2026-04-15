'use client'

/**
 * Client-side wrapper for sonner's <Toaster>.
 *
 * Why this exists:
 * When sonner's <Toaster> is imported directly in a server layout under
 * Next.js 16 Turbopack dev, the module's 'use client' directive is picked up
 * at the module level but the component still ships its SSR output into the
 * DOM without hydrating its internal store. Every `toast.error(...)` call
 * then pushes to an orphaned store and nothing ever renders. See
 * `specs/bugs/auth-pages-bugs.md#bug-7` for the full discovery log.
 *
 * Wrapping <Toaster> in a file that itself starts with 'use client' creates
 * an explicit client boundary that Next.js / Turbopack handles correctly,
 * and the Toaster hydrates and subscribes to sonner's store as expected.
 */

import { Toaster } from 'sonner'

export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        className:
          'font-sans bg-card text-card-foreground border border-border shadow-xl',
      }}
    />
  )
}
