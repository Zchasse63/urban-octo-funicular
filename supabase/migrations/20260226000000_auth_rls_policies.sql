-- ============================================================================
-- Migration: 20260226000000_auth_rls_policies
-- Description: Replace permissive RLS policies with proper auth.uid()-based
--              ownership policies. Add auth user signup trigger.
-- ============================================================================

-- ============================================================================
-- 1. DROP ALL EXISTING PERMISSIVE RLS POLICIES
-- ============================================================================

-- Users table (from 0001_initial_schema)
DROP POLICY IF EXISTS "Users are viewable by owner" ON users;
DROP POLICY IF EXISTS "Users are insertable by authenticated" ON users;
DROP POLICY IF EXISTS "Users are updatable by owner" ON users;
-- Users table (from phase7_integrations)
DROP POLICY IF EXISTS "Allow all operations for default user on users" ON users;

-- Shows table (from 0001_initial_schema)
DROP POLICY IF EXISTS "Shows are viewable by owner" ON shows;
DROP POLICY IF EXISTS "Shows are insertable by authenticated" ON shows;
DROP POLICY IF EXISTS "Shows are updatable by owner" ON shows;
DROP POLICY IF EXISTS "Shows are deletable by owner" ON shows;

-- Vocabulary terms table (from 0001_initial_schema)
DROP POLICY IF EXISTS "Vocabulary terms are viewable by show owner" ON vocabulary_terms;
DROP POLICY IF EXISTS "Vocabulary terms are insertable by show owner" ON vocabulary_terms;
DROP POLICY IF EXISTS "Vocabulary terms are updatable by show owner" ON vocabulary_terms;
DROP POLICY IF EXISTS "Vocabulary terms are deletable by show owner" ON vocabulary_terms;

-- Episodes table (from 0001_initial_schema)
DROP POLICY IF EXISTS "Episodes are viewable by show owner" ON episodes;
DROP POLICY IF EXISTS "Episodes are insertable by show owner" ON episodes;
DROP POLICY IF EXISTS "Episodes are updatable by show owner" ON episodes;
DROP POLICY IF EXISTS "Episodes are deletable by show owner" ON episodes;

-- Episode sections table (from 0001_initial_schema)
DROP POLICY IF EXISTS "Episode sections are viewable by episode owner" ON episode_sections;
DROP POLICY IF EXISTS "Episode sections are insertable by episode owner" ON episode_sections;
DROP POLICY IF EXISTS "Episode sections are updatable by episode owner" ON episode_sections;
DROP POLICY IF EXISTS "Episode sections are deletable by episode owner" ON episode_sections;

-- Generated assets table (from 0001_initial_schema)
DROP POLICY IF EXISTS "Generated assets are viewable by episode owner" ON generated_assets;
DROP POLICY IF EXISTS "Generated assets are insertable by episode owner" ON generated_assets;
DROP POLICY IF EXISTS "Generated assets are updatable by episode owner" ON generated_assets;
DROP POLICY IF EXISTS "Generated assets are deletable by episode owner" ON generated_assets;

-- Corrections table (from 0001_initial_schema)
DROP POLICY IF EXISTS "Corrections are viewable by episode owner" ON corrections;
DROP POLICY IF EXISTS "Corrections are insertable by episode owner" ON corrections;
DROP POLICY IF EXISTS "Corrections are updatable by episode owner" ON corrections;
DROP POLICY IF EXISTS "Corrections are deletable by episode owner" ON corrections;

-- Hosting connections table (from 0001_initial_schema and phase7_integrations)
DROP POLICY IF EXISTS "Hosting connections are viewable by owner" ON hosting_connections;
DROP POLICY IF EXISTS "Hosting connections are insertable by owner" ON hosting_connections;
DROP POLICY IF EXISTS "Hosting connections are updatable by owner" ON hosting_connections;
DROP POLICY IF EXISTS "Hosting connections are deletable by owner" ON hosting_connections;
DROP POLICY IF EXISTS "Allow all operations for default user on hosting_connections" ON hosting_connections;

-- Subscriptions table (from phase7_integrations)
DROP POLICY IF EXISTS "Allow all operations for default user on subscriptions" ON subscriptions;

-- Note: experts table policies (from phase6_advanced_features) already use auth.uid()
-- properly, so we leave them in place.


-- ============================================================================
-- 2. CREATE PROPER auth.uid()-BASED RLS POLICIES
-- ============================================================================

-- --------------------------------------------------------------------------
-- USERS table
-- Users can only read/update their own record
-- --------------------------------------------------------------------------

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow new user creation during signup (service role handles this, but also
-- allow auth.uid match for client-side inserts)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);


-- --------------------------------------------------------------------------
-- SHOWS table
-- Shows belong to users via user_id
-- --------------------------------------------------------------------------

CREATE POLICY "Shows are viewable by owner" ON shows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Shows are insertable by owner" ON shows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shows are updatable by owner" ON shows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Shows are deletable by owner" ON shows
  FOR DELETE USING (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- VOCABULARY_TERMS table
-- Ownership through shows (vocabulary_terms.show_id -> shows.user_id)
-- --------------------------------------------------------------------------

CREATE POLICY "Vocab terms viewable by show owner" ON vocabulary_terms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = vocabulary_terms.show_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Vocab terms insertable by show owner" ON vocabulary_terms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = vocabulary_terms.show_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Vocab terms updatable by show owner" ON vocabulary_terms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = vocabulary_terms.show_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Vocab terms deletable by show owner" ON vocabulary_terms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = vocabulary_terms.show_id
        AND shows.user_id = auth.uid()
    )
  );


-- --------------------------------------------------------------------------
-- EPISODES table
-- Ownership through shows (episodes.show_id -> shows.user_id)
-- --------------------------------------------------------------------------

CREATE POLICY "Episodes viewable by show owner" ON episodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = episodes.show_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Episodes insertable by show owner" ON episodes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = episodes.show_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Episodes updatable by show owner" ON episodes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = episodes.show_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Episodes deletable by show owner" ON episodes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM shows
      WHERE shows.id = episodes.show_id
        AND shows.user_id = auth.uid()
    )
  );


-- --------------------------------------------------------------------------
-- EPISODE_SECTIONS table
-- Ownership chain: episode_sections -> episodes -> shows -> users
-- --------------------------------------------------------------------------

CREATE POLICY "Episode sections viewable by owner" ON episode_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = episode_sections.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Episode sections insertable by owner" ON episode_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = episode_sections.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Episode sections updatable by owner" ON episode_sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = episode_sections.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Episode sections deletable by owner" ON episode_sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = episode_sections.episode_id
        AND shows.user_id = auth.uid()
    )
  );


-- --------------------------------------------------------------------------
-- GENERATED_ASSETS table
-- Ownership chain: generated_assets -> episodes -> shows -> users
-- --------------------------------------------------------------------------

CREATE POLICY "Generated assets viewable by owner" ON generated_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = generated_assets.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Generated assets insertable by owner" ON generated_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = generated_assets.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Generated assets updatable by owner" ON generated_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = generated_assets.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Generated assets deletable by owner" ON generated_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = generated_assets.episode_id
        AND shows.user_id = auth.uid()
    )
  );


-- --------------------------------------------------------------------------
-- CORRECTIONS table
-- Ownership chain: corrections -> episodes -> shows -> users
-- --------------------------------------------------------------------------

CREATE POLICY "Corrections viewable by owner" ON corrections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = corrections.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Corrections insertable by owner" ON corrections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = corrections.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Corrections updatable by owner" ON corrections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = corrections.episode_id
        AND shows.user_id = auth.uid()
    )
  );

CREATE POLICY "Corrections deletable by owner" ON corrections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM episodes
      JOIN shows ON shows.id = episodes.show_id
      WHERE episodes.id = corrections.episode_id
        AND shows.user_id = auth.uid()
    )
  );


-- --------------------------------------------------------------------------
-- HOSTING_CONNECTIONS table
-- Direct user_id ownership
-- --------------------------------------------------------------------------

CREATE POLICY "Hosting connections viewable by owner" ON hosting_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Hosting connections insertable by owner" ON hosting_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosting connections updatable by owner" ON hosting_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Hosting connections deletable by owner" ON hosting_connections
  FOR DELETE USING (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- SUBSCRIPTIONS table
-- Direct user_id ownership
-- --------------------------------------------------------------------------

CREATE POLICY "Subscriptions viewable by owner" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions insertable by owner" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Subscriptions updatable by owner" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions deletable by owner" ON subscriptions
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================================
-- 3. AUTH USER SIGNUP TRIGGER
-- ============================================================================

-- Function to handle new user signup by creating a corresponding row in
-- public.users when a new auth.users record is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users fires after a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a public.users row when a new auth user signs up via Supabase Auth';
