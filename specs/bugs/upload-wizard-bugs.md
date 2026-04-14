# Bugs Discovered — Upload Wizard

**Feature:** `upload-wizard`
**Discovered by:** qa-healer
**Date:** 2026-04-09

## Bug #1 — `null` fields rejected by CreateEpisodeSchema → 400

**Severity:** HIGH (blocks the entire submit flow when context fields are left empty)

**Evidence from dev server log during E2E run:**
```
POST /api/upload 200 in 1903ms
POST /api/episodes 400 in 644ms
```

**Root cause:**
`app/src/components/upload/upload-wizard.tsx:940-944` posts:
```ts
description: expertContext.description || null,
guest_name: expertContext.guestName || null,
guest_bio: expertContext.guestBio || null,
```

But `CreateEpisodeSchema` in `app/src/lib/validation-schemas.ts:56-64` defines those fields as:
```ts
description: optionalTrimmed(10000),   // z.string().trim().max(10000).optional()
guest_name: optionalTrimmed(200),
guest_bio: optionalTrimmed(5000),
```

`.optional()` accepts `undefined`, NOT `null`. When the user leaves any context field empty, the wizard sends `null`, Zod rejects with 400, and the wizard shows a toast ("Failed to create episode") while leaving the user stuck on Step 3.

**Reproduction:**
1. Sign in as any user with ≥1 show.
2. Go to `/upload`.
3. Attach an audio file.
4. Click through Step 2 without filling any fields.
5. Click "Start Processing Episode" on Step 3.
6. **Expected:** Episode is created, user is navigated to `/episodes/[id]`.
7. **Actual:** Toast "Failed to create episode" appears; user remains on `/upload`.

**Why this wasn't caught earlier:** No E2E coverage of the upload wizard existed. Manual QA may have worked around this by filling in context fields.

**Fix:** Either (a) make the wizard send `undefined` instead of `null`, or (b) widen the schema with `.nullish()`. Option (a) is minimal and matches existing `UpdateEpisodeSchema` conventions. Applied: upload-wizard.tsx will use `|| undefined` instead of `|| null`.

**Status:** FIXED by Healer in iteration 2.
