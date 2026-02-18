-- Schema alignment migration
-- Fixes: asset_type enum expansion, hosting_connections schema reconciliation

-- ============================================================================
-- 1. Expand asset_type enum to match TypeScript AssetType definition
-- ============================================================================
-- DB already has: show_notes, linkedin_post, twitter_thread, instagram_carousel,
--                 newsletter, blog_post, youtube_description, tiktok_hook, quote_card, audiogram

-- Core Content
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'episode_titles';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'key_takeaways';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'chapter_markers';

-- Long-form Content
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'newsletter_email';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'press_release';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'transcript_summary';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'seo_description';

-- LinkedIn
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'linkedin_post_host';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'linkedin_post_guest';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'linkedin_article';

-- Twitter/X
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'twitter_single';

-- Instagram
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'instagram_caption';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'instagram_reel_script';

-- TikTok
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'tiktok_hooks';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'tiktok_script';

-- YouTube
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'youtube_shorts_script';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'youtube_title_tags';

-- Visual Content
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'quote_cards';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'audiogram_clips';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'infographic_outline';

-- Engagement
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'discussion_questions';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'poll_ideas';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'call_to_action';

-- Guest Content
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'guest_bio_short';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'guest_promo_kit';

-- Distribution
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'podcast_teaser';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'cross_promo_script';

-- Repurposing
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'medium_article';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'substack_post';

-- AI Summaries
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'ai_summary_short';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'ai_summary_detailed';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'highlight_reel';


-- ============================================================================
-- 2. Reconcile hosting_connections table
-- ============================================================================
-- The Phase 7 migration created a competing schema. The API code uses:
--   provider (TEXT), credentials (JSONB), show_id (UUID), status (TEXT)
-- But Phase 1 created:
--   platform (hosting_platform ENUM), access_token (TEXT), refresh_token (TEXT)
--
-- We need to add the Phase 7 columns if they don't exist, since the API relies on them.

-- Add missing columns (idempotent)
DO $$
BEGIN
  -- Add provider column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hosting_connections' AND column_name = 'provider'
  ) THEN
    ALTER TABLE hosting_connections ADD COLUMN provider TEXT;
    -- Backfill from platform enum if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'hosting_connections' AND column_name = 'platform'
    ) THEN
      UPDATE hosting_connections SET provider = platform::TEXT WHERE provider IS NULL;
    END IF;
  END IF;

  -- Add credentials column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hosting_connections' AND column_name = 'credentials'
  ) THEN
    ALTER TABLE hosting_connections ADD COLUMN credentials JSONB DEFAULT '{}';
  END IF;

  -- Add show_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hosting_connections' AND column_name = 'show_id'
  ) THEN
    ALTER TABLE hosting_connections ADD COLUMN show_id UUID;
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hosting_connections' AND column_name = 'status'
  ) THEN
    ALTER TABLE hosting_connections ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
END $$;


-- ============================================================================
-- 3. Add subscription_tier to users table if missing
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;
END $$;
