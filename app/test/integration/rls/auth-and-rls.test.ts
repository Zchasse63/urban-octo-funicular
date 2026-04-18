// @vitest-environment node
/**
 * Row-Level Security Integration Tests — T-015 through T-024 from
 * specs/plans/auth-and-rls-test-plan.md
 *
 * Verifies that every user-scoped table's RLS policies correctly isolate
 * data across users, that the service_role client bypasses RLS (required
 * for background jobs / webhooks), and that BUG #23 (taddy cache write
 * hardening) and the team-shared-shows policy behave as documented.
 *
 * Runs against the REAL Supabase project configured in .env.local. Test
 * data is prefixed with `[AUTH-QA]` and fully cleaned up in afterAll.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { getAdminClient } from '../../setup/database'

// ── Types ────────────────────────────────────────────────────────────────

interface TestUserBundle {
  email: string
  password: string
  user: User
  client: SupabaseClient
  /** Chain of owned IDs used in per-table cross-user tests. */
  showId: string
  episodeId: string
  episodeSectionId: string
  generatedAssetId: string
  correctionId: string
  vocabularyTermId: string
  hostingConnectionId: string
  subscriptionId: string
  webhookId: string
  guestAppearanceId: string
  preInterviewCacheId: string
  expertId: string
}

// ── Helpers ──────────────────────────────────────────────────────────────

function makeAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function signInAnonClient(
  client: SupabaseClient,
  email: string,
  password: string
): Promise<void> {
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`signInWithPassword for ${email} failed: ${error.message}`)
  }
}

async function provisionUser(tag: string): Promise<TestUserBundle> {
  const admin = getAdminClient()
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  // Supabase rejects emails containing `[` or `]`. Keep the visible tag in
  // the DB `name` and show titles; the email itself uses only URL-safe chars.
  const email = `auth-qa-${tag}-${uid}@test.local`.toLowerCase()
  const password = `TestPass-${uid}!`

  // 1. Auth user
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError || !created?.user) {
    throw new Error(`createUser(${email}) failed: ${authError?.message ?? 'no user'}`)
  }
  const user = created.user

  // 2. Ensure public.users row exists. The auth trigger should have inserted
  //    it, but we upsert to be safe.
  await admin
    .from('users')
    .upsert({ id: user.id, email, name: `[AUTH-QA] ${tag}` }, { onConflict: 'id' })

  // 3. Own ownership chain: show → episode → section + asset + correction;
  //    plus vocabulary + hosting + subscription + webhook + guest + preinterview + expert.
  const { data: show, error: showErr } = await admin
    .from('shows')
    .insert({
      user_id: user.id,
      name: `[AUTH-QA] Show ${tag} ${uid}`,
      default_language: 'en',
    })
    .select('id')
    .single()
  if (showErr || !show) {
    throw new Error(`insert show failed: ${showErr?.message}`)
  }
  const showId = show.id

  const { data: episode, error: episodeErr } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: `[AUTH-QA] Episode ${tag}`,
      status: 'completed',
    })
    .select('id')
    .single()
  if (episodeErr || !episode) {
    throw new Error(`insert episode failed: ${episodeErr?.message}`)
  }
  const episodeId = episode.id

  const { data: section } = await admin
    .from('episode_sections')
    .insert({ episode_id: episodeId, content: `[AUTH-QA] Section ${tag}` })
    .select('id')
    .single()

  const { data: asset } = await admin
    .from('generated_assets')
    .insert({
      episode_id: episodeId,
      asset_type: 'show_notes',
      content: `[AUTH-QA] Asset ${tag}`,
    })
    .select('id')
    .single()

  const { data: correction } = await admin
    .from('corrections')
    .insert({
      episode_id: episodeId,
      original_text: `[AUTH-QA] original ${tag}`,
      corrected_text: `[AUTH-QA] corrected ${tag}`,
    })
    .select('id')
    .single()

  const { data: vocab } = await admin
    .from('vocabulary_terms')
    .insert({ show_id: showId, term: `[AUTH-QA] term ${tag} ${uid}` })
    .select('id')
    .single()

  const { data: hosting } = await admin
    .from('hosting_connections')
    .insert({
      user_id: user.id,
      provider: 'buzzsprout',
      credentials: { api_key: `[AUTH-QA]-${tag}` },
      status: 'active',
    })
    .select('id')
    .single()

  const { data: subscription } = await admin
    .from('subscriptions')
    .insert({
      user_id: user.id,
      stripe_customer_id: `cus_AUTH_QA_${tag}_${uid}`,
      stripe_subscription_id: `sub_AUTH_QA_${tag}_${uid}`,
      status: 'active',
      price_id: `price_AUTH_QA_${tag}`,
      current_period_start: new Date(Date.now() - 86_400_000).toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })
    .select('id')
    .single()

  const { data: webhook } = await admin
    .from('webhooks')
    .insert({
      user_id: user.id,
      url: `https://webhook.test/${tag}/${uid}`,
      events: ['episode.completed'],
      active: true,
    })
    .select('id')
    .single()

  const { data: guest } = await admin
    .from('guest_appearances')
    .insert({
      user_id: user.id,
      guest_name: `[AUTH-QA] Guest ${tag}`,
      guest_name_normalized: `auth-qa-guest-${tag}-${uid}`,
      episode_taddy_uuid: `taddy_${tag}_${uid}`,
      source: 'test',
    })
    .select('id')
    .single()

  const { data: preInterview } = await admin
    .from('pre_interview_cache')
    .insert({
      user_id: user.id,
      episode_id: episodeId,
      guest_name: `[AUTH-QA] Guest ${tag}`,
      appearances: [],
    })
    .select('id')
    .single()

  const { data: expert } = await admin
    .from('experts')
    .insert({
      show_id: showId,
      name: `[AUTH-QA] Expert ${tag}`,
      category: 'fresh',
      freshness_score: 50,
    })
    .select('id')
    .single()

  // 4. Anon client signed in as this user (for cross-user read/write attempts)
  const client = makeAnonClient()
  await signInAnonClient(client, email, password)

  return {
    email,
    password,
    user,
    client,
    showId,
    episodeId,
    episodeSectionId: section?.id ?? '',
    generatedAssetId: asset?.id ?? '',
    correctionId: correction?.id ?? '',
    vocabularyTermId: vocab?.id ?? '',
    hostingConnectionId: hosting?.id ?? '',
    subscriptionId: subscription?.id ?? '',
    webhookId: webhook?.id ?? '',
    guestAppearanceId: guest?.id ?? '',
    preInterviewCacheId: preInterview?.id ?? '',
    expertId: expert?.id ?? '',
  }
}

async function cleanupUser(user: TestUserBundle): Promise<void> {
  const admin = getAdminClient()
  try {
    await user.client.auth.signOut()
  } catch {
    // ignore
  }
  // ON DELETE CASCADE handles shows → episodes → sections/assets/corrections/vocab,
  // plus guest/preinterview/webhook/hosting which reference auth.users, and the
  // subscriptions row (user_id FK — direct delete below).
  await admin.from('subscriptions').delete().eq('user_id', user.user.id)
  await admin.from('shows').delete().eq('user_id', user.user.id)
  await admin.from('users').delete().eq('id', user.user.id)
  await admin.auth.admin.deleteUser(user.user.id)
}

// ── Test State ───────────────────────────────────────────────────────────

let A: TestUserBundle
let B: TestUserBundle

// Skip the whole suite if env vars aren't present (e.g. in CI without secrets).
const SKIP =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

describe.skipIf(SKIP)('Auth & RLS — cross-user isolation (T-015 to T-024)', () => {
  beforeAll(async () => {
    A = await provisionUser('user-a')
    B = await provisionUser('user-b')
  }, 60_000)

  afterAll(async () => {
    if (A) await cleanupUser(A)
    if (B) await cleanupUser(B)
  }, 60_000)

  // ── T-015: SELECT isolation across user-scoped tables ──────────────────

  describe('T-015: RLS SELECT blocks cross-user reads', () => {
    it('shows: A cannot SELECT B.show', async () => {
      const { data } = await A.client.from('shows').select('*').eq('id', B.showId)
      expect(data ?? []).toHaveLength(0)
    })

    it('episodes: A cannot SELECT B.episode', async () => {
      const { data } = await A.client
        .from('episodes')
        .select('*')
        .eq('id', B.episodeId)
      expect(data ?? []).toHaveLength(0)
    })

    it('episode_sections: A cannot SELECT B.section', async () => {
      const { data } = await A.client
        .from('episode_sections')
        .select('*')
        .eq('id', B.episodeSectionId)
      expect(data ?? []).toHaveLength(0)
    })

    it('generated_assets: A cannot SELECT B.asset', async () => {
      const { data } = await A.client
        .from('generated_assets')
        .select('*')
        .eq('id', B.generatedAssetId)
      expect(data ?? []).toHaveLength(0)
    })

    it('corrections: A cannot SELECT B.correction', async () => {
      const { data } = await A.client
        .from('corrections')
        .select('*')
        .eq('id', B.correctionId)
      expect(data ?? []).toHaveLength(0)
    })

    it('vocabulary_terms: A cannot SELECT B.term', async () => {
      const { data } = await A.client
        .from('vocabulary_terms')
        .select('*')
        .eq('id', B.vocabularyTermId)
      expect(data ?? []).toHaveLength(0)
    })

    it('hosting_connections: A cannot SELECT B.hosting', async () => {
      const { data } = await A.client
        .from('hosting_connections')
        .select('*')
        .eq('id', B.hostingConnectionId)
      expect(data ?? []).toHaveLength(0)
    })

    it('subscriptions: A cannot SELECT B.subscription', async () => {
      const { data } = await A.client
        .from('subscriptions')
        .select('*')
        .eq('id', B.subscriptionId)
      expect(data ?? []).toHaveLength(0)
    })

    it('webhooks: A cannot SELECT B.webhook', async () => {
      const { data } = await A.client
        .from('webhooks')
        .select('*')
        .eq('id', B.webhookId)
      expect(data ?? []).toHaveLength(0)
    })

    it('guest_appearances: A cannot SELECT B.guest', async () => {
      const { data } = await A.client
        .from('guest_appearances')
        .select('*')
        .eq('id', B.guestAppearanceId)
      expect(data ?? []).toHaveLength(0)
    })

    it('pre_interview_cache: A cannot SELECT B.preinterview', async () => {
      const { data } = await A.client
        .from('pre_interview_cache')
        .select('*')
        .eq('id', B.preInterviewCacheId)
      expect(data ?? []).toHaveLength(0)
    })

    it('experts: A cannot SELECT B.expert', async () => {
      const { data } = await A.client
        .from('experts')
        .select('*')
        .eq('id', B.expertId)
      expect(data ?? []).toHaveLength(0)
    })

    it('users: A cannot SELECT B.user row', async () => {
      const { data } = await A.client.from('users').select('*').eq('id', B.user.id)
      expect(data ?? []).toHaveLength(0)
    })

    it('team_members: A cannot SELECT B.team row (A is neither owner nor member)', async () => {
      // Seed an unrelated team row owned by B, member is also B.
      const admin = getAdminClient()
      const { data: tm } = await admin
        .from('team_members')
        .insert({
          owner_user_id: B.user.id,
          member_user_id: B.user.id,
          role: 'editor',
          status: 'active',
          invited_email: B.email,
        })
        .select('id')
        .single()
      try {
        const { data } = await A.client
          .from('team_members')
          .select('*')
          .eq('id', tm?.id ?? '00000000-0000-0000-0000-000000000000')
        expect(data ?? []).toHaveLength(0)
      } finally {
        if (tm?.id) await admin.from('team_members').delete().eq('id', tm.id)
      }
    })
  })

  // ── T-016: INSERT isolation across user-scoped tables ──────────────────

  describe('T-016: RLS INSERT blocks cross-user writes', () => {
    it('shows: A cannot INSERT a show tied to B.user_id', async () => {
      const { error } = await A.client
        .from('shows')
        .insert({ user_id: B.user.id, name: '[AUTH-QA] forbidden', default_language: 'en' })
      expect(error).not.toBeNull()
    })

    it('episodes: A cannot INSERT an episode into B.show', async () => {
      const { error } = await A.client
        .from('episodes')
        .insert({ show_id: B.showId, title: '[AUTH-QA] forbidden episode' })
      expect(error).not.toBeNull()
    })

    it('webhooks: A cannot INSERT a webhook tied to B.user_id', async () => {
      const { error } = await A.client.from('webhooks').insert({
        user_id: B.user.id,
        url: 'https://webhook.test/forbidden',
        events: ['episode.completed'],
      })
      expect(error).not.toBeNull()
    })

    it('subscriptions: A cannot INSERT a subscription tied to B.user_id', async () => {
      const { error } = await A.client.from('subscriptions').insert({
        user_id: B.user.id,
        stripe_customer_id: 'cus_AUTH_QA_forbidden',
        stripe_subscription_id: 'sub_AUTH_QA_forbidden',
        status: 'active',
        price_id: 'price_forbidden',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      })
      expect(error).not.toBeNull()
    })

    it('team_members: A cannot INSERT a team row naming B as owner', async () => {
      const { error } = await A.client.from('team_members').insert({
        owner_user_id: B.user.id,
        member_user_id: A.user.id,
        role: 'editor',
        status: 'active',
        invited_email: A.email,
      })
      expect(error).not.toBeNull()
    })
  })

  // ── T-017: UPDATE isolation ────────────────────────────────────────────

  describe('T-017: RLS UPDATE blocks cross-user updates', () => {
    it('shows: A.UPDATE B.show affects 0 rows', async () => {
      const admin = getAdminClient()
      const { data: before } = await admin
        .from('shows')
        .select('name')
        .eq('id', B.showId)
        .single()

      const { data: updated } = await A.client
        .from('shows')
        .update({ name: '[AUTH-QA] HIJACKED' })
        .eq('id', B.showId)
        .select('id')

      // Either no rows returned, or the row is unchanged when re-read as admin.
      expect((updated ?? []).length).toBe(0)
      const { data: after } = await admin
        .from('shows')
        .select('name')
        .eq('id', B.showId)
        .single()
      expect(after?.name).toBe(before?.name)
    })

    it('webhooks: A.UPDATE B.webhook affects 0 rows', async () => {
      const { data: updated } = await A.client
        .from('webhooks')
        .update({ url: 'https://hijacked.test/' })
        .eq('id', B.webhookId)
        .select('id')
      expect((updated ?? []).length).toBe(0)
    })
  })

  // ── T-018: DELETE isolation ────────────────────────────────────────────

  describe('T-018: RLS DELETE blocks cross-user deletes', () => {
    it("shows: A.DELETE B.show leaves B's row intact", async () => {
      const admin = getAdminClient()
      await A.client.from('shows').delete().eq('id', B.showId)
      const { data, error } = await admin
        .from('shows')
        .select('id')
        .eq('id', B.showId)
        .single()
      expect(error).toBeNull()
      expect(data?.id).toBe(B.showId)
    })
  })

  // ── T-019 & T-020: BUG #23 regression — taddy cache write hardening ──

  describe('T-019/T-020: taddy cache tables reject authenticated-user writes', () => {
    it('taddy_podcast_cache INSERT by user A is rejected', async () => {
      const taddyUuid = `test-taddy-pc-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { error } = await A.client.from('taddy_podcast_cache').insert({
        taddy_uuid: taddyUuid,
        name: '[AUTH-QA] Forbidden Cache Write',
      })
      expect(error).not.toBeNull()
    })

    it('taddy_episode_cache UPDATE by user A is rejected', async () => {
      const admin = getAdminClient()
      const taddyUuid = `test-taddy-ec-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data: seeded } = await admin
        .from('taddy_episode_cache')
        .insert({ taddy_uuid: taddyUuid, name: '[AUTH-QA] admin-seeded' })
        .select('id')
        .single()
      try {
        const { data: updated } = await A.client
          .from('taddy_episode_cache')
          .update({ name: '[AUTH-QA] HIJACKED' })
          .eq('id', seeded!.id)
          .select('id')
        expect((updated ?? []).length).toBe(0)
      } finally {
        if (seeded?.id) {
          await admin.from('taddy_episode_cache').delete().eq('id', seeded.id)
        }
      }
    })

    it('taddy_podcast_cache SELECT is still allowed for authenticated users (shared read cache)', async () => {
      const { data, error } = await A.client.from('taddy_podcast_cache').select('id').limit(1)
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  // ── T-021: service_role bypass ─────────────────────────────────────────

  describe('T-021: service_role admin client bypasses RLS', () => {
    const tables = [
      'shows',
      'episodes',
      'episode_sections',
      'generated_assets',
      'corrections',
      'vocabulary_terms',
      'hosting_connections',
      'subscriptions',
      'webhooks',
      'guest_appearances',
      'pre_interview_cache',
      'experts',
    ] as const

    it.each(tables)('admin can SELECT from %s regardless of user_id', async (table) => {
      const admin = getAdminClient()
      const { error } = await admin.from(table).select('id').limit(1)
      expect(error).toBeNull()
    })

    it('admin can SELECT both A and B ownership chains at the top level', async () => {
      const admin = getAdminClient()
      const { data } = await admin
        .from('shows')
        .select('id,user_id')
        .in('id', [A.showId, B.showId])
      expect(data?.length).toBe(2)
      const userIds = new Set((data ?? []).map((r) => r.user_id))
      expect(userIds.has(A.user.id)).toBe(true)
      expect(userIds.has(B.user.id)).toBe(true)
    })
  })

  // ── T-023: team_members shared-shows policy ────────────────────────────

  describe('T-023: team_members active-member gets SELECT on owner shows', () => {
    it('active member sees owner shows; pending member does not', async () => {
      const admin = getAdminClient()
      // Add A as an ACTIVE member of B's team
      const { data: tm } = await admin
        .from('team_members')
        .insert({
          owner_user_id: B.user.id,
          member_user_id: A.user.id,
          role: 'editor',
          status: 'active',
          invited_email: A.email,
        })
        .select('id')
        .single()
      try {
        const { data: seen } = await A.client
          .from('shows')
          .select('id')
          .eq('id', B.showId)
        expect((seen ?? []).length).toBe(1)

        // Flip to pending — A should lose access
        await admin
          .from('team_members')
          .update({ status: 'pending' })
          .eq('id', tm!.id)

        const { data: unseen } = await A.client
          .from('shows')
          .select('id')
          .eq('id', B.showId)
        expect((unseen ?? []).length).toBe(0)
      } finally {
        if (tm?.id) await admin.from('team_members').delete().eq('id', tm.id)
      }
    })
  })

  // ── T-024: policy initplan-wrapping check (optional P2) ──────────────
  // This is a best-effort check: it asserts that the on-disk migration file
  // uses `(SELECT auth.uid())` wrapping (initplan caching). If the DB ever
  // drifts from the migration, this catches it at least at the source level.

  describe('T-024: auth.uid() wrapped in (SELECT auth.uid()) in initplan migration', () => {
    it('migration 20260415223000_rls_auth_uid_initplan.sql uses the SELECT wrapping', async () => {
      const { readFile } = await import('node:fs/promises')
      const { resolve } = await import('node:path')
      const p = resolve(__dirname, '../../../../supabase/migrations/20260415223000_rls_auth_uid_initplan.sql')
      const raw = await readFile(p, 'utf8')
      // Strip SQL `-- ...` line comments so the scan ignores explanatory text
      // like "wrap auth.uid() in scalar subquery". Only scan real SQL.
      const sql = raw.replace(/--[^\n]*/g, '')
      // Every remaining auth.uid() in real SQL must be wrapped as (SELECT auth.uid()).
      const unwrapped = sql.match(/(?<!\(SELECT\s)auth\.uid\(\)/g)
      expect(
        unwrapped,
        'migration still contains unwrapped auth.uid() calls — wrap as (SELECT auth.uid()) for initplan caching'
      ).toBeNull()
    })
  })
})
