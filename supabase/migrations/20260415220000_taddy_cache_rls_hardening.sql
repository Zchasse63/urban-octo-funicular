-- BUG #23: Taddy cache tables had `WITH CHECK (true)` INSERT/UPDATE policies
-- that let any authenticated user pollute the shared cache with arbitrary
-- data (cache poisoning vector). The underlying code (lib/taddy/cache.ts)
-- now uses the admin (service_role) client for all cache writes, so these
-- user-scoped policies are no longer needed and are actively harmful.
--
-- service_role bypasses RLS entirely, so dropping the permissive INSERT/UPDATE
-- policies does NOT break the cache feature. Reads remain open to
-- authenticated users (the existing SELECT policies are intentionally
-- unrestricted — reading cached podcast metadata is not a security issue).
--
-- After this migration the Supabase security advisor warnings
-- `taddy_episode_cache_insert_with_check_true`,
-- `taddy_episode_cache_update_with_check_true`,
-- `taddy_podcast_cache_insert_with_check_true`,
-- `taddy_podcast_cache_update_with_check_true`
-- should all be gone.

-- ─── taddy_episode_cache ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert episode cache" ON taddy_episode_cache;
DROP POLICY IF EXISTS "Authenticated users can update episode cache" ON taddy_episode_cache;

-- ─── taddy_podcast_cache ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert podcast cache" ON taddy_podcast_cache;
DROP POLICY IF EXISTS "Authenticated users can update podcast cache" ON taddy_podcast_cache;

-- SELECT policies are left in place intentionally — see file header comment.
