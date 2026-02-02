-- PodBrain Initial Database Schema
-- Migration: 0001_initial_schema
-- Description: Sets up core tables, enums, indexes, and RLS policies

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable pgvector for embedding storage and similarity search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Episode processing status
CREATE TYPE episode_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- Types of generated content assets
CREATE TYPE asset_type AS ENUM (
  'show_notes',
  'linkedin_post',
  'twitter_thread',
  'instagram_carousel',
  'newsletter',
  'blog_post',
  'youtube_description',
  'tiktok_hook',
  'quote_card',
  'audiogram'
);

-- Supported podcast hosting platforms
CREATE TYPE hosting_platform AS ENUM (
  'buzzsprout',
  'transistor',
  'podbean'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table
-- Stores user accounts. Initially operates in single-user mode with a default user.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shows table
-- Represents a podcast show/series owned by a user
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_language TEXT DEFAULT 'en',
  style_preferences JSONB DEFAULT '{}',
  artwork_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vocabulary terms table
-- Custom vocabulary for each show to improve transcription accuracy
CREATE TABLE vocabulary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  alternatives TEXT[] DEFAULT '{}',
  embedding vector(1536),
  occurrence_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (show_id, term)
);

-- Episodes table
-- Core entity representing a single podcast episode
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  language TEXT DEFAULT 'en',
  status episode_status NOT NULL DEFAULT 'pending',
  transcript TEXT,
  transcript_segments JSONB DEFAULT '[]',
  show_notes TEXT,
  show_notes_html TEXT,
  schema_markup JSONB,
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  seo_analysis JSONB,
  guest_name TEXT,
  guest_bio TEXT,
  guest_email TEXT,
  viral_moments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Episode sections table
-- Semantic segments of episode content with embeddings for search
CREATE TABLE episode_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  start_time NUMERIC,
  end_time NUMERIC,
  speaker TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated assets table
-- AI-generated content assets for each episode
CREATE TABLE generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  asset_type asset_type NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Corrections table
-- User corrections to transcriptions for vocabulary learning
CREATE TABLE corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  applied_to_vocabulary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hosting connections table
-- OAuth connections to podcast hosting platforms
CREATE TABLE hosting_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform hosting_platform NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- HNSW indexes for vector similarity search on embeddings
-- Using cosine distance operator for semantic similarity
CREATE INDEX vocabulary_terms_embedding_idx ON vocabulary_terms
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX episode_sections_embedding_idx ON episode_sections
  USING hnsw (embedding vector_cosine_ops);

-- Episode query indexes for common access patterns
CREATE INDEX episodes_show_id_status_idx ON episodes (show_id, status);
CREATE INDEX episodes_show_id_created_at_idx ON episodes (show_id, created_at DESC);

-- Additional useful indexes
CREATE INDEX shows_user_id_idx ON shows (user_id);
CREATE INDEX vocabulary_terms_show_id_idx ON vocabulary_terms (show_id);
CREATE INDEX generated_assets_episode_id_idx ON generated_assets (episode_id);
CREATE INDEX corrections_episode_id_idx ON corrections (episode_id);
CREATE INDEX hosting_connections_user_id_idx ON hosting_connections (user_id);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON shows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vocabulary_terms_updated_at
  BEFORE UPDATE ON vocabulary_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_assets_updated_at
  BEFORE UPDATE ON generated_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosting_connections_updated_at
  BEFORE UPDATE ON hosting_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT USER FOR SINGLE-USER MODE
-- ============================================================================

-- Insert placeholder user for initial single-user mode
-- This will be the default user until authentication is implemented
INSERT INTO users (id, email, name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'default@podbrain.local',
  'Default User'
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_connections ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for single-user mode
-- These allow all operations for the service role and authenticated users
-- Will be expanded with proper user-based policies when auth is added

-- Users policies
CREATE POLICY "Users are viewable by owner" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users are insertable by authenticated" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users are updatable by owner" ON users
  FOR UPDATE USING (true);

-- Shows policies
CREATE POLICY "Shows are viewable by owner" ON shows
  FOR SELECT USING (true);

CREATE POLICY "Shows are insertable by authenticated" ON shows
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Shows are updatable by owner" ON shows
  FOR UPDATE USING (true);

CREATE POLICY "Shows are deletable by owner" ON shows
  FOR DELETE USING (true);

-- Vocabulary terms policies
CREATE POLICY "Vocabulary terms are viewable by show owner" ON vocabulary_terms
  FOR SELECT USING (true);

CREATE POLICY "Vocabulary terms are insertable by show owner" ON vocabulary_terms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Vocabulary terms are updatable by show owner" ON vocabulary_terms
  FOR UPDATE USING (true);

CREATE POLICY "Vocabulary terms are deletable by show owner" ON vocabulary_terms
  FOR DELETE USING (true);

-- Episodes policies
CREATE POLICY "Episodes are viewable by show owner" ON episodes
  FOR SELECT USING (true);

CREATE POLICY "Episodes are insertable by show owner" ON episodes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Episodes are updatable by show owner" ON episodes
  FOR UPDATE USING (true);

CREATE POLICY "Episodes are deletable by show owner" ON episodes
  FOR DELETE USING (true);

-- Episode sections policies
CREATE POLICY "Episode sections are viewable by episode owner" ON episode_sections
  FOR SELECT USING (true);

CREATE POLICY "Episode sections are insertable by episode owner" ON episode_sections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Episode sections are updatable by episode owner" ON episode_sections
  FOR UPDATE USING (true);

CREATE POLICY "Episode sections are deletable by episode owner" ON episode_sections
  FOR DELETE USING (true);

-- Generated assets policies
CREATE POLICY "Generated assets are viewable by episode owner" ON generated_assets
  FOR SELECT USING (true);

CREATE POLICY "Generated assets are insertable by episode owner" ON generated_assets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Generated assets are updatable by episode owner" ON generated_assets
  FOR UPDATE USING (true);

CREATE POLICY "Generated assets are deletable by episode owner" ON generated_assets
  FOR DELETE USING (true);

-- Corrections policies
CREATE POLICY "Corrections are viewable by episode owner" ON corrections
  FOR SELECT USING (true);

CREATE POLICY "Corrections are insertable by episode owner" ON corrections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Corrections are updatable by episode owner" ON corrections
  FOR UPDATE USING (true);

CREATE POLICY "Corrections are deletable by episode owner" ON corrections
  FOR DELETE USING (true);

-- Hosting connections policies
CREATE POLICY "Hosting connections are viewable by owner" ON hosting_connections
  FOR SELECT USING (true);

CREATE POLICY "Hosting connections are insertable by owner" ON hosting_connections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Hosting connections are updatable by owner" ON hosting_connections
  FOR UPDATE USING (true);

CREATE POLICY "Hosting connections are deletable by owner" ON hosting_connections
  FOR DELETE USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts - initially in single-user mode';
COMMENT ON TABLE shows IS 'Podcast shows/series owned by users';
COMMENT ON TABLE vocabulary_terms IS 'Custom vocabulary terms for improved transcription accuracy';
COMMENT ON TABLE episodes IS 'Individual podcast episodes with transcripts and generated content';
COMMENT ON TABLE episode_sections IS 'Semantic segments of episodes for search and analysis';
COMMENT ON TABLE generated_assets IS 'AI-generated content assets (social posts, show notes, etc.)';
COMMENT ON TABLE corrections IS 'User corrections to transcripts for vocabulary learning';
COMMENT ON TABLE hosting_connections IS 'OAuth connections to podcast hosting platforms';

COMMENT ON COLUMN vocabulary_terms.embedding IS 'Vector embedding (1536 dimensions) for semantic similarity matching';
COMMENT ON COLUMN vocabulary_terms.alternatives IS 'Alternative spellings or forms of the term';
COMMENT ON COLUMN episodes.transcript_segments IS 'Timestamped transcript segments with speaker diarization';
COMMENT ON COLUMN episodes.viral_moments IS 'AI-identified viral/highlight moments in the episode';
COMMENT ON COLUMN episode_sections.embedding IS 'Vector embedding (1536 dimensions) for semantic search';
