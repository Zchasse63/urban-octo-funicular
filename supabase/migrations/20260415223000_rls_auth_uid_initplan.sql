-- BUG #26: wrap auth.uid() in scalar subquery to cache per query execution
-- instead of re-evaluating once per row (auth_rls_initplan warning).
-- Generated from pg_policies snapshot 2026-04-15.

BEGIN;

DROP POLICY IF EXISTS "Corrections deletable by owner" ON public.corrections;
CREATE POLICY "Corrections deletable by owner" ON public.corrections
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = corrections.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Corrections insertable by owner" ON public.corrections;
CREATE POLICY "Corrections insertable by owner" ON public.corrections
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = corrections.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Corrections viewable by owner" ON public.corrections;
CREATE POLICY "Corrections viewable by owner" ON public.corrections
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = corrections.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Corrections updatable by owner" ON public.corrections;
CREATE POLICY "Corrections updatable by owner" ON public.corrections
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = corrections.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Episode sections deletable by owner" ON public.episode_sections;
CREATE POLICY "Episode sections deletable by owner" ON public.episode_sections
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = episode_sections.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Episode sections insertable by owner" ON public.episode_sections;
CREATE POLICY "Episode sections insertable by owner" ON public.episode_sections
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = episode_sections.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Episode sections viewable by owner" ON public.episode_sections;
CREATE POLICY "Episode sections viewable by owner" ON public.episode_sections
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = episode_sections.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Episode sections updatable by owner" ON public.episode_sections;
CREATE POLICY "Episode sections updatable by owner" ON public.episode_sections
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = episode_sections.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Episodes deletable by show owner" ON public.episodes;
CREATE POLICY "Episodes deletable by show owner" ON public.episodes
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM shows
  WHERE ((shows.id = episodes.show_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Episodes insertable by show owner" ON public.episodes;
CREATE POLICY "Episodes insertable by show owner" ON public.episodes
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM shows
  WHERE ((shows.id = episodes.show_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Episodes viewable by show owner" ON public.episodes;
CREATE POLICY "Episodes viewable by show owner" ON public.episodes
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM shows
  WHERE ((shows.id = episodes.show_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Episodes updatable by show owner" ON public.episodes;
CREATE POLICY "Episodes updatable by show owner" ON public.episodes
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM shows
  WHERE ((shows.id = episodes.show_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "experts_delete" ON public.experts;
CREATE POLICY "experts_delete" ON public.experts
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((show_id IN ( SELECT shows.id
   FROM shows
  WHERE (shows.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "experts_insert" ON public.experts;
CREATE POLICY "experts_insert" ON public.experts
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((show_id IN ( SELECT shows.id
   FROM shows
  WHERE (shows.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "experts_read" ON public.experts;
CREATE POLICY "experts_read" ON public.experts
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((show_id IN ( SELECT shows.id
   FROM shows
  WHERE (shows.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "experts_update" ON public.experts;
CREATE POLICY "experts_update" ON public.experts
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((show_id IN ( SELECT shows.id
   FROM shows
  WHERE (shows.user_id = (SELECT auth.uid())))));

DROP POLICY IF EXISTS "Generated assets deletable by owner" ON public.generated_assets;
CREATE POLICY "Generated assets deletable by owner" ON public.generated_assets
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = generated_assets.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Generated assets insertable by owner" ON public.generated_assets;
CREATE POLICY "Generated assets insertable by owner" ON public.generated_assets
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = generated_assets.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Generated assets viewable by owner" ON public.generated_assets;
CREATE POLICY "Generated assets viewable by owner" ON public.generated_assets
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = generated_assets.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Generated assets updatable by owner" ON public.generated_assets;
CREATE POLICY "Generated assets updatable by owner" ON public.generated_assets
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (episodes
     JOIN shows ON ((shows.id = episodes.show_id)))
  WHERE ((episodes.id = generated_assets.episode_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Users can delete their guest appearances" ON public.guest_appearances;
CREATE POLICY "Users can delete their guest appearances" ON public.guest_appearances
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert their guest appearances" ON public.guest_appearances;
CREATE POLICY "Users can insert their guest appearances" ON public.guest_appearances
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can read their guest appearances" ON public.guest_appearances;
CREATE POLICY "Users can read their guest appearances" ON public.guest_appearances
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update their guest appearances" ON public.guest_appearances;
CREATE POLICY "Users can update their guest appearances" ON public.guest_appearances
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Hosting connections deletable by owner" ON public.hosting_connections;
CREATE POLICY "Hosting connections deletable by owner" ON public.hosting_connections
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Hosting connections insertable by owner" ON public.hosting_connections;
CREATE POLICY "Hosting connections insertable by owner" ON public.hosting_connections
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Hosting connections viewable by owner" ON public.hosting_connections;
CREATE POLICY "Hosting connections viewable by owner" ON public.hosting_connections
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Hosting connections updatable by owner" ON public.hosting_connections;
CREATE POLICY "Hosting connections updatable by owner" ON public.hosting_connections
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can delete their pre-interview cache" ON public.pre_interview_cache;
CREATE POLICY "Users can delete their pre-interview cache" ON public.pre_interview_cache
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert their pre-interview cache" ON public.pre_interview_cache;
CREATE POLICY "Users can insert their pre-interview cache" ON public.pre_interview_cache
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can read their pre-interview cache" ON public.pre_interview_cache;
CREATE POLICY "Users can read their pre-interview cache" ON public.pre_interview_cache
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update their pre-interview cache" ON public.pre_interview_cache;
CREATE POLICY "Users can update their pre-interview cache" ON public.pre_interview_cache
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Shows are deletable by owner" ON public.shows;
CREATE POLICY "Shows are deletable by owner" ON public.shows
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Shows are insertable by owner" ON public.shows;
CREATE POLICY "Shows are insertable by owner" ON public.shows
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Shows are viewable by owner" ON public.shows;
CREATE POLICY "Shows are viewable by owner" ON public.shows
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Team members access shows" ON public.shows;
CREATE POLICY "Team members access shows" ON public.shows
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM team_members
  WHERE ((team_members.owner_user_id = shows.user_id) AND (team_members.member_user_id = (SELECT auth.uid())) AND (team_members.status = 'active'::text))))));

DROP POLICY IF EXISTS "Shows are updatable by owner" ON public.shows;
CREATE POLICY "Shows are updatable by owner" ON public.shows
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Subscriptions deletable by owner" ON public.subscriptions;
CREATE POLICY "Subscriptions deletable by owner" ON public.subscriptions
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Subscriptions insertable by owner" ON public.subscriptions;
CREATE POLICY "Subscriptions insertable by owner" ON public.subscriptions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Subscriptions viewable by owner" ON public.subscriptions;
CREATE POLICY "Subscriptions viewable by owner" ON public.subscriptions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Subscriptions updatable by owner" ON public.subscriptions;
CREATE POLICY "Subscriptions updatable by owner" ON public.subscriptions
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Owners manage team" ON public.team_members;
CREATE POLICY "Owners manage team" ON public.team_members
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (((SELECT auth.uid()) = owner_user_id))
  WITH CHECK (((SELECT auth.uid()) = owner_user_id));

DROP POLICY IF EXISTS "Members view own membership" ON public.team_members;
CREATE POLICY "Members view own membership" ON public.team_members
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((SELECT auth.uid()) = member_user_id));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((SELECT auth.uid()) = id));

DROP POLICY IF EXISTS "Vocab terms deletable by show owner" ON public.vocabulary_terms;
CREATE POLICY "Vocab terms deletable by show owner" ON public.vocabulary_terms
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM shows
  WHERE ((shows.id = vocabulary_terms.show_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Vocab terms insertable by show owner" ON public.vocabulary_terms;
CREATE POLICY "Vocab terms insertable by show owner" ON public.vocabulary_terms
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM shows
  WHERE ((shows.id = vocabulary_terms.show_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Vocab terms viewable by show owner" ON public.vocabulary_terms;
CREATE POLICY "Vocab terms viewable by show owner" ON public.vocabulary_terms
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM shows
  WHERE ((shows.id = vocabulary_terms.show_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Vocab terms updatable by show owner" ON public.vocabulary_terms;
CREATE POLICY "Vocab terms updatable by show owner" ON public.vocabulary_terms
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM shows
  WHERE ((shows.id = vocabulary_terms.show_id) AND (shows.user_id = (SELECT auth.uid()))))));

DROP POLICY IF EXISTS "Users manage own webhooks" ON public.webhooks;
CREATE POLICY "Users manage own webhooks" ON public.webhooks
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));

COMMIT;
