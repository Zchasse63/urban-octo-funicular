# Bugs Discovered — Supabase Infrastructure

**Feature:** supabase-infra
**Discovered by:** Supabase Management API audit during product-quality audit
**Date:** 2026-04-15
**Project:** `itnzbdojxvbhuxnwqgzg` (PodBrain — Zchasse63's Project)
**Postgres version:** 17.6.1.063
**pgvector version:** 0.8.0

This file tracks database-level and platform-level issues surfaced while
connecting directly to Supabase via the Management API. Many are fixed
inline on 2026-04-15 during the same session; each entry tags its
current fix status at the top.

---

## Bug #21 — Migrations tracking table out of sync with migration files on disk ⭐ FIXED 2026-04-15

**Severity:** MEDIUM (infrastructure debt — future `supabase db push`
or `supabase db diff` calls would report drift and potentially re-apply
or skip migrations)

**Symptom:**

Filesystem had 10 migration files under `supabase/migrations/` but
`supabase_migrations.schema_migrations` only tracked 8 of them:

```
on disk:                          | tracked:
0001_initial_schema               | ✅
20260202_phase6_advanced_features | ✅
20260202000000_phase7_integrations| ✅
20260218000000_schema_alignment   | ✅
20260226000000_auth_rls_policies  | ✅
20260226100000_taddy_cache        | ✅
20260226200000_webhooks           | ✅
20260226300000_team_features      | ✅
20260409000000_episode_status_scheduled   | ❌ MISSING
20260414000000_subscription_state_machine | ❌ MISSING
```

**Root cause:**

Both missing migrations were applied via the Supabase Dashboard SQL
editor (ad-hoc SQL execution) instead of `supabase db push`. The
Dashboard path executes the SQL but does NOT insert a tracking row.
Every time the CI/CD runs `db push`, drift accumulates.

**Fix (applied 2026-04-15):**

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260409000000', 'episode_status_scheduled'),
  ('20260414000000', 'subscription_state_machine'),
  ('20260415000000', 'find_similar_sections_rpc')
ON CONFLICT (version) DO NOTHING
RETURNING version;
```

Returned all 3 versions, confirming they were inserted. Tracking table
is now in sync with disk.

**Status:** ✅ **FIXED 2026-04-15**.

---

## Bug #22 — Function search_path mutable on handle_new_user + update_updated_at_column ⭐ FIXED 2026-04-15

**Severity:** MEDIUM-LOW (security hardening)

**Symptom:**

Supabase security advisor flagged:

> "Function `public.handle_new_user` has a role mutable search_path"
> "Function `public.update_updated_at_column` has a role mutable search_path"

**Root cause:**

Neither function declared a fixed `search_path`, so a malicious user who
can `CREATE FUNCTION` in any schema earlier in the search_path could
shadow built-in or extension functions these functions depend on. The
attack surface is narrow but real: a compromised PostgREST user could
theoretically hijack function resolution.

**Fix (applied 2026-04-15):**

```sql
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
```

Verified via `pg_proc.proconfig`:

```
handle_new_user:           proconfig = [search_path=pg_catalog, public] ✅
update_updated_at_column:  proconfig = [search_path=pg_catalog, public] ✅
```

(There is a second `update_updated_at_column` in the `storage` schema
with NULL proconfig, but that's Supabase Storage's own internal
function — out of scope.)

**Status:** ✅ **FIXED 2026-04-15**.

---

## Bug #23 — Taddy cache tables have permissive `WITH CHECK (true)` RLS policies (cache poisoning vector)

**Severity:** MEDIUM — authenticated users can write arbitrary rows to
`taddy_episode_cache` and `taddy_podcast_cache`. A malicious user could
pollute the cache with bogus podcast metadata that gets served to other
users via cache hits. Impact is limited because the data is display-only
(podcast names, descriptions, images) and has a 7-day TTL, but it's a
real attack surface.

**Symptom:**

Supabase security advisor flags 4 warnings:

> `public.taddy_episode_cache` has an RLS policy
> "Authenticated users can insert episode cache" for INSERT that allows
> unrestricted access (WITH CHECK clause is always true).

Same for `taddy_episode_cache` UPDATE, `taddy_podcast_cache` INSERT, and
`taddy_podcast_cache` UPDATE.

**Root cause:**

`supabase/migrations/20260226100000_taddy_cache.sql` (inferred from file
name — not inspected yet) likely creates policies like:

```sql
CREATE POLICY "Authenticated users can insert episode cache"
ON taddy_episode_cache FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Why not fixed in this session:**

I traced the cache write path in `app/src/lib/taddy/cache.ts` and
confirmed it uses `createClient()` from `@/lib/supabase/server` — which
is the USER-SESSION supabase client, NOT the service_role client.
Scoping the RLS policies to `service_role` only would break the cache
feature because writes come from authenticated user sessions, not
admin-privileged code paths.

The proper fix is one of:

1. **Refactor `lib/taddy/cache.ts` to use an admin (service_role) client
   for all cache writes**, then scope the RLS policies to `service_role`.
   Best long-term fix but touches several call sites and could break in
   subtle ways (e.g., the `cacheEpisodesInBackground` function is
   intentionally fire-and-forget).

2. **Keep the user-session writes but add a validation trigger or check
   constraint** that rejects obviously-malicious rows. Brittle and
   non-exhaustive.

3. **Accept the risk and document it**. Cache data is display-only and
   TTL-limited; the attack impact is minor UI pollution, not privilege
   escalation or data loss.

**Recommended path:** Option 1 during a dedicated refactor pass. Not
blocking launch.

**Status:** DISCOVERED, NOT YET FIXED. Tracked as MEDIUM-severity open
item.

---

## Bug #24 — Leaked password protection disabled (BLOCKED BY PLAN TIER)

**Severity:** LOW — users can register with passwords that have been
exposed in data breaches (e.g., `password123`, `qwerty`). Supabase Auth
can automatically check new passwords against HaveIBeenPwned.org but the
feature is disabled.

**Symptom:**

Supabase security advisor flags:

> `auth_leaked_password_protection`: Leaked password protection is
> currently disabled. Supabase Auth prevents the use of compromised
> passwords by checking against HaveIBeenPwned.org. Enable this feature
> to enhance security.

**Why not fixed in this session:**

Attempted via Management API:

```
PATCH /v1/projects/itnzbdojxvbhuxnwqgzg/config/auth
{"password_hibp_enabled": true}
→ HTTP 402
{"message":"Configuring leaked password protection via HaveIBeenPwned.org
 is available on Pro Plans and up."}
```

**The PodBrain project is currently on a free/team tier that does not
include this feature.** Note that the Supabase advisor still shows the
warning even though the feature is literally locked behind a paywall —
which is misleading but not actionable by us.

**Fix options:**

1. **Upgrade Supabase plan to Pro** ($25/mo or bundled with team
   subscription). This unlocks `password_hibp_enabled` and several other
   Pro-only features (daily backups, 8GB disk, etc.). Best long-term.

2. **Enforce password strength in the application layer** as a
   stopgap — require 12+ chars, 3 character classes, reject a hardcoded
   list of the top 10k breached passwords. Less comprehensive but
   unblocked.

**Status:** DISCOVERED, NOT YET FIXED. Blocked by plan tier — not an
engineering bug.

---

## Bug #25 — Unindexed foreign key columns ⭐ FIXED 2026-04-15

**Severity:** LOW (performance, grows with table size)

**Symptom:**

Supabase performance advisor flagged:

> `public.episode_sections.episode_sections_episode_id_fkey` — foreign
> key without a covering index
> `public.team_members.team_members_member_user_id_fkey` — foreign key
> without a covering index

Every `DELETE FROM episodes` triggers a full scan of `episode_sections`
to check the foreign key constraint. At 604 rows across ~10 episodes
the impact is negligible, but this scales linearly.

**Fix (applied 2026-04-15):**

```sql
CREATE INDEX IF NOT EXISTS idx_episode_sections_episode_id
  ON public.episode_sections(episode_id);

CREATE INDEX IF NOT EXISTS idx_team_members_member_user_id
  ON public.team_members(member_user_id);
```

Verified in `pg_indexes`.

**Status:** ✅ **FIXED 2026-04-15**.

---

## Bug #26 — RLS policies re-evaluate `auth.uid()` per row (auth_rls_initplan)

**Severity:** LOW-MEDIUM (performance, affects every row-level filter
query in the app)

**Symptom:**

Supabase performance advisor flagged ~20 instances across most
user-owned tables (episodes, shows, generated_assets, vocabulary_terms,
corrections, etc.):

> Table `public.X` has a row level security policy that re-evaluates
> `current_setting()` or `auth.<function>()` for each row. This produces
> suboptimal query performance.

**Root cause:**

RLS policies are written like:

```sql
CREATE POLICY "Users own their data" ON public.episodes
FOR ALL USING (user_id = auth.uid());
```

Postgres does not automatically cache the result of `auth.uid()` across
rows, so every row in a result set re-invokes the function. For a table
scan of 10,000 episodes, that's 10,000 function calls instead of 1.

**Fix:**

Wrap the function call in a scalar subquery so Postgres caches it:

```sql
CREATE POLICY "Users own their data" ON public.episodes
FOR ALL USING (user_id = (SELECT auth.uid()));
```

This requires rewriting every affected policy in a new migration. ~20
DROP POLICY + CREATE POLICY statements, carefully preserving the USING
+ WITH CHECK logic for each.

**Why not fixed in this session:**

This is a large, careful refactor that affects security-critical
policies. Getting ANY one of them wrong risks accidentally locking out
real users or exposing data. I'm deferring it to a dedicated focused
pass where I can diff every before/after policy and run regression tests.

**Status:** DISCOVERED, NOT YET FIXED. Tracked as performance debt.

---

## Bug #27 — `find_similar_sections` RPC function missing from database entirely ⭐ FIXED 2026-04-15

**Severity:** HIGH — cross-episode similarity feature has been broken
since day one because the code calls a function that doesn't exist in
the database.

**Symptom:**

`app/src/lib/cross-episode/similarity.ts:22-30` calls:

```ts
const { data: similarSections, error: similarityError } = await supabase.rpc(
  'find_similar_sections',
  { query_embedding, match_threshold, match_count, exclude_episode_id }
);
```

Queried `pg_proc` for the function:

```sql
SELECT proname FROM pg_proc WHERE proname = 'find_similar_sections';
→ [] (empty — function does not exist)
```

Grepped every migration file in `supabase/migrations/`:

```
grep -rn "find_similar_sections" supabase/migrations/
→ (no matches — never written)
```

**Root cause:**

Someone wrote the application code that calls the RPC but never wrote
the corresponding SQL function into any migration. Every call has been
returning an RPC error since the first commit. This triggered the
fallback path in `similarity.ts:32-50` that returned fabricated 50%
similarity matches (see BUG #17 in `episode-detail-bugs.md`).

**Fix (applied 2026-04-15):**

New migration at
`supabase/migrations/20260415000000_find_similar_sections_rpc.sql`
creates the RPC with a cosine-similarity query and an HNSW index:

```sql
CREATE OR REPLACE FUNCTION public.find_similar_sections(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  exclude_episode_id uuid
)
RETURNS TABLE (
  id uuid, episode_id uuid, content text,
  start_time numeric, end_time numeric,
  speaker text, similarity float
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = pg_catalog, public, extensions
AS $$
  SELECT
    es.id, es.episode_id, es.content,
    es.start_time, es.end_time, es.speaker,
    (1 - (es.embedding <=> query_embedding))::float AS similarity
  FROM public.episode_sections es
  WHERE es.embedding IS NOT NULL
    AND query_embedding IS NOT NULL
    AND es.episode_id != exclude_episode_id
    AND (1 - (es.embedding <=> query_embedding)) > match_threshold
  ORDER BY es.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;
```

**Gotcha fixed during implementation:** Initial attempt used
`search_path = pg_catalog, public` and failed with
`operator does not exist: extensions.vector <=> extensions.vector`.
pgvector's `<=>` cosine-distance operator lives in the `extensions`
schema in Supabase's installation, so the function's search_path must
include `extensions` to resolve it.

**Verification (end-to-end):**

After fix + backfilling 604 embeddings (see BUG #6 / BUG #17), ran a
real similarity query using an actual episode's embedding:

```
episode_id                             | similarity
54aa4fbf-d336-423e-a0e6-f304e7b50948  | 1.0000
54aa4fbf-d336-423e-a0e6-f304e7b50948  | 1.0000
54aa4fbf-d336-423e-a0e6-f304e7b50948  | 0.4468
54aa4fbf-d336-423e-a0e6-f304e7b50948  | 0.4468
54aa4fbf-d336-423e-a0e6-f304e7b50948  | 0.3599
```

Real pgvector cosine distance computation, ordered by similarity.

**Status:** ✅ **FIXED 2026-04-15**.

---

## Observation — Several Netlify env vars missing from production

**Severity:** varies — discovered during OPENAI_API_KEY push

**Findings:**

The live Netlify project (site id `7bc7e647-b91c-4fbb-b260-211afe95494d`,
name `podbrain`, account `zchasse63`) has 21 env vars configured. Cross-
referencing against `app/.env.local` (31 vars) surfaced the following
gaps:

| Variable | Priority | Impact in production |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | 🔴 HIGH | RSS Tags feature hardcodes `localhost:3000` in transcript URLs if this isn't set (see BUG #20 in `episode-detail-bugs.md`) |
| `TADDY_API_KEY` + `TADDY_USER_ID` | 🟡 MED | Taddy integration (expert discovery, podcast search) will silently return empty in prod |
| `ASSEMBLYAI_WEBHOOK_SECRET` | 🟡 MED | AssemblyAI webhook auth (HMAC verification) may fail or auto-accept |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 🟡 MED | Newer publishable-key scheme; may be needed after Supabase migrates anon keys |
| `ENCRYPTION_SECRET` | 🟡 MED | Any app-level encryption will fail or use a default (check usage) |
| `OPENAI_API_KEY` | ✅ FIXED | Added 2026-04-15 for cross-episode embeddings |
| `ANTHROPIC_API_KEY` | 🟢 intentionally excluded — audit/grading use only, not a runtime dependency |

**Fix:** audit each of the above, decide which are genuinely required in
prod, and push them via Netlify Management API or `netlify env:set`.
None of these were fixed in this session because the user's directive
was to get Supabase sorted first, not to do a Netlify env audit. Flagged
here for the product-quality audit final report.

**Status:** OBSERVED, NOT ACTIONED.

---
