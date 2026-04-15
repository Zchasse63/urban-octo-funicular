# Bugs Discovered — Auth Pages (login / register / forgot-password)

**Feature:** auth-pages
**Discovered by:** live-walkthrough during product-quality audit
**Date:** 2026-04-15
**Dev server:** `next dev` (Turbopack) against Supabase project `itnzbdojxvbhuxnwqgzg`

---

## Bug #7 — Sonner toasts never render anywhere in the app (CRITICAL UX regression)

**Severity:** CRITICAL — every form in the app that relies on `toast.error()` /
`toast.success()` for feedback fails silently. This was discovered on the auth
pages but affects every surface using sonner (upload wizard, episode detail,
auth flows, etc.).

**Symptom:**

1. Navigate to `/login`
2. Enter any non-existent email + any wrong password
3. Click **Sign in**
4. The network tab shows `POST https://<proj>.supabase.co/auth/v1/token?grant_type=password` returning **401** (correct — invalid credentials)
5. The browser console logs `Failed to load resource: the server responded with a status of 401`
6. Expected: a red toast "Invalid login credentials" appears bottom-right
7. **Actual:** nothing renders. No toast, no banner, no inline error. The form just reverts to its idle state and the user has no idea why it didn't work.

Reproduced on `/register` (bad-email → silent) and `/forgot-password`
(sonner-only feedback, so any error → silent).

**Evidence from DOM inspection:**

```js
// After clicking Sign in with bad credentials:
document.querySelector('section[aria-label*="Notifications"]').outerHTML
// → '<section aria-label="Notifications alt+T" tabindex="-1"
//    aria-live="polite" aria-relevant="additions text"
//    aria-atomic="false"></section>'
```

The `<section>` IS in the DOM (sonner's SSR fallback), but it has **none** of
sonner's runtime attributes:

- No `data-sonner-toaster`
- No `data-position="bottom-right"`
- No `data-styled`, `data-theme`, `data-rich-colors`
- No class names
- Empty innerHTML even 2+ seconds after the fire

Compare with a working sonner mount, which normally produces:

```html
<section aria-label="Notifications alt+T" ...>
  <ol data-sonner-toaster data-theme="system" data-y-position="bottom"
      data-x-position="right" tabindex="-1">...</ol>
</section>
```

This means the `<Toaster>` component is being server-rendered but **never
hydrating**. All `toast.error(...)` calls in the application push to sonner's
internal store, but without a hydrated `<Toaster>` nothing is subscribed, so
nothing gets rendered.

**Environment details:**

- Next.js 16+ App Router with Turbopack (`next dev`)
- sonner `^2.0.7`
- `<Toaster>` is rendered in the **root** `src/app/layout.tsx` at line 69:
  ```tsx
  <body>
    {children}
    <Toaster
      position="bottom-right"
      toastOptions={{
        className: "font-sans bg-card text-card-foreground border border-border shadow-xl",
      }}
    />
  </body>
  ```
- The root layout is a Server Component. Next.js should auto-detect the
  `'use client'` directive at the top of sonner's `dist/index.mjs` and set up
  the client boundary correctly, but it clearly isn't working under Turbopack
  dev.

**Likely root cause (hypothesis, needs verification):**

Possibility A: Turbopack dev mode bug with client components imported directly
in a server root layout. Wrapping `<Toaster>` in an explicit client boundary
should fix it:

```tsx
// src/components/client/Toaster.tsx
'use client'
export { Toaster } from 'sonner'
```

Then in `src/app/layout.tsx`:
```tsx
import { Toaster } from '@/components/client/Toaster'
```

Possibility B: Sonner 2.0.7 bug with the latest React / Turbopack combo.
Possibility C: React 19 hydration error being swallowed silently (dev console
shows only the 401, no hydration warnings).

**Blast radius — every toast call in the app fails silently:**

Files calling `toast.xxx(...)`:
- `src/app/(auth)/login/page.tsx` (4 paths: bad creds, OAuth, magic link, unexpected)
- `src/app/(auth)/register/page.tsx` (4 paths)
- `src/app/(auth)/forgot-password/page.tsx` (3 paths — **100 % toast-driven, zero inline fallback**)
- `src/components/episodes/episode-detail.tsx`
- `src/components/upload/upload-wizard.tsx`

This means the existing E2E suites for show-creation / upload-wizard /
pricing-subscription-refactor that assert toast visibility are almost certainly
already failing against this dev server — worth re-verifying.

**Fix priority:** P0 — the whole feedback loop for every form in the app is
silently broken. Users submitting bad credentials will just assume the form is
stuck.

**Workaround while the real fix is pending:** add inline `<p
className="text-destructive">` error banners to each form (similar to the
"Passwords do not match" hint that's already on `/register`) so at least the
most common error paths have feedback.

**Status:** DISCOVERED, NOT YET FIXED.

---

## Bug #8 — `/register` and `/forgot-password` use the wrong `<title>`

**Severity:** LOW (cosmetic, hurts SEO + browser-tab UX)

**Symptom:**
- `/register` → browser tab reads `Sign In | PodBrain`
- `/forgot-password` → browser tab reads `Sign In | PodBrain`

**Root cause:**
`src/app/(auth)/layout.tsx` declares:

```ts
export const metadata: Metadata = {
  title: {
    default: 'Sign In',
    template: '%s | PodBrain',
  },
}
```

The `default` value `'Sign In'` bleeds into every child page that doesn't
export its own `metadata`. `src/app/(auth)/login/page.tsx` inherits it
correctly, but `register/page.tsx` and `forgot-password/page.tsx` don't
override, so all three use the same title.

**Fix:** Add page-level metadata exports:

```ts
// src/app/(auth)/register/page.tsx
export const metadata = { title: 'Create account' }

// src/app/(auth)/forgot-password/page.tsx
export const metadata = { title: 'Reset password' }
```

**Caveat:** Both files use `'use client'`. Next.js App Router only honors
`export const metadata` from **server components**, so these can't export
metadata directly. The correct pattern is to split each page into a server
wrapper that exports metadata + a client child. Alternative: use `generateMetadata`
in a sibling `layout.tsx` per-route.

**Status:** DISCOVERED, NOT YET FIXED.

---

## Observations (not bugs)

These are working as intended but worth noting for the full audit report:

- **/register inline password-mismatch feedback works.** The `<p>` element
  that renders "Passwords do not match." when `confirmPassword !== password`
  DOES render correctly — confirming React hydration IS running, just the
  sonner `<Toaster>` specifically is not. This narrows Bug #7 to a
  Toaster/Sonner-specific hydration issue, not a global hydration failure.

- **Native HTML5 validation works.** Submitting an empty login form with
  required fields triggers the browser's native "Please fill out this field"
  tooltip. No app-level validation is needed for empty-field case.

- **/forgot-password has no inline error path at all.** Every error state is
  toast-only, which combined with Bug #7 means any failure → silent. This
  page should get inline error banners even after Bug #7 is fixed, as a
  defense in depth.

- **The footer links on all three auth pages are text-only "© 2026
  PodBrain".** No terms/privacy/support links from the auth cards, which is
  fine — the Register page does link to `/terms` and `/privacy` inline as
  part of the "By creating an account..." text.

- **Magic link flow is untested** in this live walk because it requires a
  real inbox. The handler is structured identically to the sign-in flow so
  it presumably has the same toast-silent-failure behavior on error.
