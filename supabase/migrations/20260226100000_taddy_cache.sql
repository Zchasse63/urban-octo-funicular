-- Taddy API cache tables and guest appearances
-- Migration: 20260226100000_taddy_cache
-- Description: Creates cache tables for Taddy podcast/episode data,
--   guest appearance tracking, and pre-interview intelligence cache.

-- ============================================================================
-- 1. Taddy podcast cache
-- ============================================================================
-- Shared cache of podcast series data from Taddy API.
-- TTL enforced at the application layer (7 days default).

CREATE TABLE IF NOT EXISTS taddy_podcast_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  taddy_uuid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rss_url TEXT,
  itunes_id INTEGER,
  genres TEXT[] DEFAULT '{}',
  language TEXT,
  country TEXT,
  total_episodes INTEGER,
  author_name TEXT,
  website_url TEXT,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Taddy episode cache
-- ============================================================================
-- Shared cache of episode data from Taddy API.
-- The persons column stores the Podcasting 2.0 <podcast:person> data as JSONB.

CREATE TABLE IF NOT EXISTS taddy_episode_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  taddy_uuid TEXT UNIQUE NOT NULL,
  podcast_taddy_uuid TEXT REFERENCES taddy_podcast_cache(taddy_uuid) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  duration INTEGER,
  date_published TIMESTAMPTZ,
  episode_number INTEGER,
  season_number INTEGER,
  persons JSONB DEFAULT '[]',
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Guest appearances
-- ============================================================================
-- User-scoped table tracking guest appearances found via Taddy search.
-- Builds a credits database over time for pre-interview intelligence.

CREATE TABLE IF NOT EXISTS guest_appearances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_name_normalized TEXT NOT NULL,
  guest_image_url TEXT,
  guest_profile_url TEXT,
  role TEXT DEFAULT 'guest',
  episode_taddy_uuid TEXT,
  podcast_taddy_uuid TEXT,
  podcast_name TEXT,
  episode_name TEXT,
  date_published TIMESTAMPTZ,
  duration_seconds INTEGER,
  audio_url TEXT,
  source TEXT DEFAULT 'taddy_search',
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(guest_name_normalized, episode_taddy_uuid)
);

-- ============================================================================
-- 4. Pre-interview intelligence cache
-- ============================================================================
-- Caches assembled pre-interview research for a guest on a specific episode.
-- Avoids re-computing intelligence when revisiting an episode workspace.

CREATE TABLE IF NOT EXISTS pre_interview_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  appearances JSONB NOT NULL DEFAULT '[]',
  common_questions JSONB,
  talking_points JSONB,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. Indexes
-- ============================================================================

-- Podcast cache lookups
CREATE INDEX IF NOT EXISTS idx_taddy_podcast_cache_name
  ON taddy_podcast_cache(name);
CREATE INDEX IF NOT EXISTS idx_taddy_podcast_cache_uuid
  ON taddy_podcast_cache(taddy_uuid);

-- Episode cache lookups
CREATE INDEX IF NOT EXISTS idx_taddy_episode_cache_podcast
  ON taddy_episode_cache(podcast_taddy_uuid);
CREATE INDEX IF NOT EXISTS idx_taddy_episode_cache_uuid
  ON taddy_episode_cache(taddy_uuid);
CREATE INDEX IF NOT EXISTS idx_taddy_episode_cache_date
  ON taddy_episode_cache(date_published DESC);

-- Guest appearance lookups
CREATE INDEX IF NOT EXISTS idx_guest_appearances_name
  ON guest_appearances(guest_name_normalized);
CREATE INDEX IF NOT EXISTS idx_guest_appearances_user
  ON guest_appearances(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_appearances_podcast
  ON guest_appearances(podcast_taddy_uuid);
CREATE INDEX IF NOT EXISTS idx_guest_appearances_episode
  ON guest_appearances(episode_taddy_uuid);

-- Pre-interview cache lookups
CREATE INDEX IF NOT EXISTS idx_pre_interview_cache_episode
  ON pre_interview_cache(episode_id);
CREATE INDEX IF NOT EXISTS idx_pre_interview_cache_user
  ON pre_interview_cache(user_id);

-- ============================================================================
-- 6. Row Level Security
-- ============================================================================

ALTER TABLE taddy_podcast_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE taddy_episode_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_interview_cache ENABLE ROW LEVEL SECURITY;

-- Taddy cache tables are shared: any authenticated user can read and insert.
-- This avoids duplicate API calls across users for the same podcast data.
CREATE POLICY "Authenticated users can read podcast cache"
  ON taddy_podcast_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert podcast cache"
  ON taddy_podcast_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update podcast cache"
  ON taddy_podcast_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read episode cache"
  ON taddy_episode_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert episode cache"
  ON taddy_episode_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update episode cache"
  ON taddy_episode_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Guest appearances and pre-interview cache are user-scoped.
-- Each user can only read/write their own data.
CREATE POLICY "Users can read their guest appearances"
  ON guest_appearances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their guest appearances"
  ON guest_appearances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their guest appearances"
  ON guest_appearances FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their guest appearances"
  ON guest_appearances FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read their pre-interview cache"
  ON pre_interview_cache FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their pre-interview cache"
  ON pre_interview_cache FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pre-interview cache"
  ON pre_interview_cache FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their pre-interview cache"
  ON pre_interview_cache FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
