-- Team members table for Agency tier collaboration
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_user_id, member_user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Owners can manage their team
CREATE POLICY "Owners manage team" ON team_members
  FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Members can view their own membership
CREATE POLICY "Members view own membership" ON team_members
  FOR SELECT USING (auth.uid() = member_user_id);

-- Allow team members to access the owner's shows
CREATE POLICY "Team members access shows" ON shows
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.owner_user_id = shows.user_id
      AND team_members.member_user_id = auth.uid()
      AND team_members.status = 'active'
    )
  );
