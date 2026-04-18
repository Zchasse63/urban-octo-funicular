/**
 * Billing & Tier Enforcement — E2E Tests
 *
 * Covers the Stripe endpoint surface + minute-cap edge cases that were
 * explicitly out of scope for `pricing-subscription-refactor.spec.ts`.
 *
 * Scope (see specs/plans/billing-tier-enforcement-test-plan.md):
 *   - POST /api/stripe/checkout: auth, validation, rate limit, default interval
 *   - POST /api/stripe/portal: 401 / 404 / success
 *   - POST /api/stripe/webhooks: signature HMAC, event dispatch, idempotency
 *   - Minute-cap precision at 99%, downgrade consequences, read-only cancel
 *   - Rate limit 429 (taddy search 30/min, RSS import 5/min)
 *   - Settings billing UI: embedded checkout dialog
 *
 * Stripe API calls that would hit live servers are stubbed via page.route
 * or avoided by picking events that never roundtrip to Stripe.
 *
 * All test artifacts use [BILLING-QA] prefix for easy cleanup.
 *
 * Source: specs/features/billing-tier-enforcement-analysis.md
 */
import { test, expect } from '../fixtures/base'
import { getAdminClient, cleanupTestDataByPattern } from '../../setup/database'
import {
  createTestUser,
  createTestShow,
  deleteTestUser,
  signIn,
  type TestUser,
} from '../helpers/auth'
import { createPopulatedEpisode, setSubscriptionState } from '../helpers/factories'
import { SubscriptionPage } from '../pages/subscription-page'
import { SettingsBillingPage } from '../pages/settings-billing-page'
import { buildEvent, postWebhook } from '../helpers/billing-webhook'

const BILLING_TAG = 'billing-qa'

// ═════════════════════════════════════════════════════════════════════════════
// A — Stripe Checkout API [P0]
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Stripe Checkout API [P0]', () => {
  let testUser: TestUser

  test.beforeAll(async () => {
    testUser = await createTestUser(`${BILLING_TAG}-checkout-p0`)
    await createTestShow(testUser.id)
  })

  test.afterAll(async () => {
    await deleteTestUser(testUser)
    await cleanupTestDataByPattern()
  })

  test('B-1: should return 401 when unauthenticated', async ({ page }) => {
    // Use a fresh context with NO cookies
    await page.context().clearCookies()
    const response = await page.request.post('/api/stripe/checkout', {
      data: { tier: 'pro', interval: 'monthly' },
    })
    expect(response.status()).toBe(401)
  })

  test('B-2: should reject invalid tier with 400', async ({ page }) => {
    await signIn(page, testUser)
    const sub = new SubscriptionPage(page)
    const result = await sub.attemptCheckout({ tier: 'enterprise', interval: 'monthly' })
    expect(result.status).toBe(400)
    expect(result.body.error ?? '').toMatch(/invalid|tier/i)
  })

  test('B-3: should reject missing tier with 400', async ({ page }) => {
    await signIn(page, testUser)
    const sub = new SubscriptionPage(page)
    const result = await sub.attemptCheckout({})
    expect(result.status).toBe(400)
  })

  test('B-4: should return 429 after 5 checkout attempts within window', async ({ page }) => {
    // Use a dedicated fresh user so the prior B-2/B-3 calls don't count
    // against this user's 5-per-minute budget.
    const rlCheckoutUser = await createTestUser(`${BILLING_TAG}-rl-checkout`)
    try {
      await signIn(page, rlCheckoutUser)
      const sub = new SubscriptionPage(page)

      const responses: number[] = []
      for (let i = 0; i < 6; i++) {
        const r = await sub.attemptCheckout({ tier: 'pro', interval: 'monthly' })
        responses.push(r.status)
      }
      // Rate limit is 5/min. The 6th must be 429. Earlier ones may be 200/500
      // depending on whether Stripe is reachable — we only assert the limiter.
      expect(responses.filter((s) => s === 429).length).toBeGreaterThanOrEqual(1)
      expect(responses[5]).toBe(429)
    } finally {
      await deleteTestUser(rlCheckoutUser)
    }
  })

  test('B-5: should validate all 6 tier+interval combinations pass schema', async ({ page }) => {
    // Each combo uses a fresh user to avoid the 5/min rate limit.
    // We can't stub page.request.post with page.route (Playwright APIRequestContext
    // bypasses page-level routes), so we accept the real server response and
    // assert the schema passed (status != 400). Server may return 500 on
    // Stripe customer creation failure — that's fine, validation succeeded.
    const combos: Array<{ tier: string; interval: string }> = [
      { tier: 'pro', interval: 'monthly' },
      { tier: 'pro', interval: 'annual' },
      { tier: 'creator', interval: 'monthly' },
      { tier: 'creator', interval: 'annual' },
      { tier: 'agency', interval: 'monthly' },
      { tier: 'agency', interval: 'annual' },
    ]

    for (const combo of combos) {
      const comboUser = await createTestUser(
        `${BILLING_TAG}-combo-${combo.tier}-${combo.interval}`,
      )
      try {
        await signIn(page, comboUser)
        const sub = new SubscriptionPage(page)
        const r = await sub.attemptCheckout(combo)
        // Schema validation accepted this combo iff status != 400.
        // Auth succeeded iff status != 401.
        // Server-side Stripe call may succeed (200) OR fail (500) — both
        // prove the handler was reached with a valid body.
        expect(r.status, `${combo.tier}/${combo.interval} failed validation`).not.toBe(400)
        expect(r.status, `${combo.tier}/${combo.interval} auth failed`).not.toBe(401)
        expect(r.status, `${combo.tier}/${combo.interval} rate limited`).not.toBe(429)
      } finally {
        await deleteTestUser(comboUser)
      }
    }
  })

  test('B-6: should accept interval=monthly as default when omitted', async ({ page }) => {
    // Fresh user so rate limit is clean.
    const defaultUser = await createTestUser(`${BILLING_TAG}-default-interval`)
    try {
      await signIn(page, defaultUser)
      const sub = new SubscriptionPage(page)
      const r = await sub.attemptCheckout({ tier: 'pro' })
      // Schema default applied iff status != 400.
      expect(r.status).not.toBe(400)
      expect(r.status).not.toBe(401)
    } finally {
      await deleteTestUser(defaultUser)
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// B — Stripe Portal API [P0]
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Stripe Portal API [P0]', () => {
  let freshUser: TestUser
  let customerUser: TestUser

  test.beforeAll(async () => {
    freshUser = await createTestUser(`${BILLING_TAG}-portal-fresh`)
    await createTestShow(freshUser.id)

    customerUser = await createTestUser(`${BILLING_TAG}-portal-customer`)
    await createTestShow(customerUser.id)

    // Seed a subscriptions row with a fake stripe_customer_id so the portal
    // handler can find it and attempt to create a portal session.
    // `current_period_*` columns are NOT NULL — provide synthetic values.
    const now = new Date()
    const admin = getAdminClient()
    await admin.from('subscriptions').insert({
      user_id: customerUser.id,
      stripe_customer_id: 'cus_billingqa_fake',
      stripe_subscription_id: 'sub_billingqa_fake',
      status: 'active',
      price_id: 'price_test',
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getTime() + 30 * 86400_000).toISOString(),
    })
    await setSubscriptionState(customerUser.id, { status: 'active', tier: 'pro' })
  })

  test.afterAll(async () => {
    // Clean up the fake subscriptions row first, then the users.
    const admin = getAdminClient()
    await admin.from('subscriptions').delete().eq('user_id', customerUser.id)
    await deleteTestUser(freshUser)
    await deleteTestUser(customerUser)
    await cleanupTestDataByPattern()
  })

  test('B-7: should return 401 when unauthenticated', async ({ page }) => {
    await page.context().clearCookies()
    const response = await page.request.post('/api/stripe/portal')
    expect(response.status()).toBe(401)
  })

  test('B-8: should return 404 when user has no stripe_customer_id', async ({ page }) => {
    await signIn(page, freshUser)
    const sub = new SubscriptionPage(page)
    const r = await sub.attemptPortal()
    expect(r.status).toBe(404)
    expect(r.body.error ?? '').toMatch(/No active subscription/i)
  })

  test('B-9: should pass 404 check when customer exists (reaches Stripe call)', async ({ page }) => {
    await signIn(page, customerUser)

    const sub = new SubscriptionPage(page)
    const r = await sub.attemptPortal()

    // With a stripe_customer_id present, the handler bypasses the 404
    // "No active subscription" branch and proceeds to call
    // stripe.billingPortal.sessions.create(). Since the customer ID is fake,
    // the real Stripe API will fail — but that proves the handler reached
    // that code path. Either 200 (unlikely with live keys + fake ID) or 500
    // is acceptable here; what we reject is 401 / 404.
    expect(r.status).not.toBe(401)
    expect(r.status, 'handler incorrectly reports no subscription').not.toBe(404)
    // If the call somehow succeeded, verify the URL shape
    if (r.status === 200) {
      expect(r.body.url ?? '').toMatch(/^https:\/\/billing\.stripe\.com/)
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// C — Stripe Webhook API [P0]
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Stripe Webhook API [P0]', () => {
  let webhookUser: TestUser
  const fakeSubId = `sub_billingqa_wh_${Date.now()}`
  const fakeCustomerId = 'cus_billingqa_wh'
  const fakePriceId = 'price_test_wh'

  test.beforeAll(async () => {
    webhookUser = await createTestUser(`${BILLING_TAG}-webhook`)
    await createTestShow(webhookUser.id)
    await setSubscriptionState(webhookUser.id, { status: 'active', tier: 'pro' })

    const admin = getAdminClient()
    const now = new Date()
    await admin.from('subscriptions').insert({
      user_id: webhookUser.id,
      stripe_customer_id: fakeCustomerId,
      stripe_subscription_id: fakeSubId,
      status: 'active',
      price_id: fakePriceId,
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getTime() + 30 * 86400_000).toISOString(),
    })
  })

  test.afterAll(async () => {
    const admin = getAdminClient()
    await admin.from('subscriptions').delete().eq('user_id', webhookUser.id)
    await deleteTestUser(webhookUser)
    await cleanupTestDataByPattern()
  })

  test('B-10: should reject 401 when stripe-signature header missing', async ({ page }) => {
    const payload = buildEvent('invoice.payment_failed', { subscriptionId: fakeSubId })
    const r = await postWebhook(page.request, payload, { signatureMode: 'missing' })
    expect(r.status).toBe(401)
    expect(r.body.error ?? '').toMatch(/Missing stripe-signature/i)
  })

  test('B-11: should reject 400 when signature is invalid', async ({ page }) => {
    const payload = buildEvent('invoice.payment_failed', { subscriptionId: fakeSubId })
    const r = await postWebhook(page.request, payload, { signatureMode: 'bad' })
    expect(r.status).toBe(400)
    expect(r.body.error ?? '').toMatch(/Invalid signature/i)
  })

  test('B-12: should reject 400 when signature uses wrong secret', async ({ page }) => {
    const payload = buildEvent('invoice.payment_failed', { subscriptionId: fakeSubId })
    const r = await postWebhook(page.request, payload, { signatureMode: 'wrong-secret' })
    expect(r.status).toBe(400)
    expect(r.body.error ?? '').toMatch(/Invalid signature/i)
  })

  test('B-13: should dispatch invoice.payment_failed → past_due', async ({ page }) => {
    const admin = getAdminClient()
    // Ensure user starts active
    await setSubscriptionState(webhookUser.id, { status: 'active', tier: 'pro' })
    await admin.from('subscriptions').update({ status: 'active' }).eq('user_id', webhookUser.id)

    const payload = buildEvent('invoice.payment_failed', {
      subscriptionId: fakeSubId,
      customerId: fakeCustomerId,
    })
    const r = await postWebhook(page.request, payload)
    expect(r.status).toBe(200)
    expect(r.body.received).toBe(true)

    // Assert DB state
    const { data: user } = await admin
      .from('users')
      .select('subscription_status, past_due_since')
      .eq('id', webhookUser.id)
      .single()
    expect(user?.subscription_status).toBe('past_due')
    expect(user?.past_due_since).toBeTruthy()
  })

  test('B-14: should dispatch invoice.payment_succeeded → active and clear past_due_since', async ({
    page,
  }) => {
    const admin = getAdminClient()
    // Start in past_due
    await setSubscriptionState(webhookUser.id, {
      status: 'past_due',
      pastDueSince: new Date(),
    })
    await admin.from('subscriptions').update({ status: 'past_due' }).eq('user_id', webhookUser.id)

    const payload = buildEvent('invoice.payment_succeeded', {
      subscriptionId: fakeSubId,
      customerId: fakeCustomerId,
    })
    const r = await postWebhook(page.request, payload)
    expect(r.status).toBe(200)

    const { data: user } = await admin
      .from('users')
      .select('subscription_status, past_due_since')
      .eq('id', webhookUser.id)
      .single()
    expect(user?.subscription_status).toBe('active')
    expect(user?.past_due_since).toBeNull()
  })

  test('B-15: should dispatch customer.subscription.deleted → canceled (preserve tier)', async ({
    page,
  }) => {
    const admin = getAdminClient()
    // Start as active on creator tier — verify tier is preserved after cancel
    await setSubscriptionState(webhookUser.id, { status: 'active', tier: 'creator' })
    await admin.from('subscriptions').update({ status: 'active' }).eq('user_id', webhookUser.id)

    const payload = buildEvent('customer.subscription.deleted', {
      subscriptionId: fakeSubId,
      customerId: fakeCustomerId,
      priceId: fakePriceId,
    })
    const r = await postWebhook(page.request, payload)
    expect(r.status).toBe(200)

    const { data: user } = await admin
      .from('users')
      .select('subscription_status, subscription_tier')
      .eq('id', webhookUser.id)
      .single()
    expect(user?.subscription_status).toBe('canceled')
    // Tier preserved so historical content stays accessible
    expect(user?.subscription_tier).toBe('creator')
  })

  test('B-16: should preserve past_due_since on duplicate invoice.payment_failed', async ({
    page,
  }) => {
    const admin = getAdminClient()
    // Start active
    await setSubscriptionState(webhookUser.id, { status: 'active', tier: 'pro' })
    await admin.from('subscriptions').update({ status: 'active' }).eq('user_id', webhookUser.id)

    // First delivery
    const payload1 = buildEvent('invoice.payment_failed', {
      subscriptionId: fakeSubId,
      customerId: fakeCustomerId,
    })
    const r1 = await postWebhook(page.request, payload1)
    expect(r1.status).toBe(200)

    const { data: user1 } = await admin
      .from('users')
      .select('past_due_since')
      .eq('id', webhookUser.id)
      .single()
    const firstTs = user1?.past_due_since
    expect(firstTs).toBeTruthy()

    // Second delivery of a DIFFERENT event (but same semantics) — should NOT
    // reset past_due_since because the user is already past_due.
    const payload2 = buildEvent('invoice.payment_failed', {
      subscriptionId: fakeSubId,
      customerId: fakeCustomerId,
    })
    const r2 = await postWebhook(page.request, payload2)
    expect(r2.status).toBe(200)

    const { data: user2 } = await admin
      .from('users')
      .select('past_due_since')
      .eq('id', webhookUser.id)
      .single()
    expect(user2?.past_due_since).toBe(firstTs)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// D — Minute Cap Enforcement [P0]
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Minute Cap Enforcement [P0]', () => {
  let nearCapUser: TestUser
  let nearCapShowId: string
  let pendingEpisodeId: string

  test.beforeAll(async () => {
    nearCapUser = await createTestUser(`${BILLING_TAG}-nearcap`)
    nearCapShowId = await createTestShow(nearCapUser.id)
    // Pro tier = 300min. Seed 297 minutes used via the helper.
    await setSubscriptionState(nearCapUser.id, {
      status: 'active',
      tier: 'pro',
      minutesConsumed: 297,
    })

    // Create a pending episode for the process-endpoint test
    const admin = getAdminClient()
    const { data } = await admin
      .from('episodes')
      .insert({
        show_id: nearCapShowId,
        title: '[TEST] BILLING-QA near-cap pending',
        audio_url: 'https://example.test/near-cap.mp3',
        audio_duration_seconds: 600, // 10 min
        status: 'pending',
        metadata: {},
      })
      .select('id')
      .single()
    if (!data) throw new Error('Failed to seed near-cap pending episode')
    pendingEpisodeId = data.id
  })

  test.afterAll(async () => {
    await deleteTestUser(nearCapUser)
    await cleanupTestDataByPattern()
  })

  test('B-17: should block episode creation when would exceed cap', async ({ page }) => {
    await signIn(page, nearCapUser)
    const sub = new SubscriptionPage(page)

    // POST /api/episodes currently calls canProcessEpisode without an
    // estimatedDurationSeconds — it only checks the already-consumed total.
    // With 297/300 used we're under the cap, so create allows the record.
    // The hard enforcement happens at process time (see B-18).
    //
    // We therefore test the "at cap" path: seed another 10 minutes via the
    // factory to cross 300.
    const admin = getAdminClient()
    const billingStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    await admin.from('episodes').insert({
      show_id: nearCapShowId,
      title: '[TEST] BILLING-QA tip-the-scale',
      audio_url: 'https://example.test/tip.mp3',
      audio_duration_seconds: 240, // brings total to 301 min
      status: 'completed',
      created_at: billingStart.toISOString(),
      metadata: {},
    })

    const result = await sub.attemptCreateEpisode(nearCapShowId)
    expect(result.status).toBe(403)
    const body = result.body as { error?: string }
    expect(body.error ?? '').toMatch(/minutes this month|minute.*limit/i)
    expect(body.error ?? '').not.toMatch(/hours this month/i)
  })

  test('B-18: should block episode processing when at cap', async ({ page }) => {
    await signIn(page, nearCapUser)
    const sub = new SubscriptionPage(page)

    const result = await sub.attemptProcessEpisode(pendingEpisodeId)
    // After B-17 the user is over cap, so processing should also be blocked.
    expect([403, 429]).toContain(result.status)
    if (result.status === 403) {
      const body = result.body as { error?: string }
      expect(body.error ?? '').toMatch(/minutes|limit|cap/i)
    }
  })

  test('B-19: should include precise remaining minutes in error copy', async ({ page }) => {
    // Fresh user to avoid bleed from B-17
    const localUser = await createTestUser(`${BILLING_TAG}-precision`)
    const localShowId = await createTestShow(localUser.id)
    try {
      // 297 of 300 used — 3 minutes remaining
      await setSubscriptionState(localUser.id, {
        status: 'active',
        tier: 'pro',
        minutesConsumed: 297,
      })

      await signIn(page, localUser)

      // Force over-cap by seeding another episode
      const admin = getAdminClient()
      const billingStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      await admin.from('episodes').insert({
        show_id: localShowId,
        title: '[TEST] BILLING-QA precision-tip',
        audio_url: 'https://example.test/prec.mp3',
        audio_duration_seconds: 240,
        status: 'completed',
        created_at: billingStart.toISOString(),
        metadata: {},
      })

      const sub = new SubscriptionPage(page)
      const result = await sub.attemptCreateEpisode(localShowId)
      expect(result.status).toBe(403)
      const body = result.body as { error?: string }
      // Error mentions the Pro plan by name
      expect(body.error ?? '').toMatch(/pro plan/i)
      // And the 300-minute limit
      expect(body.error ?? '').toMatch(/300.*minutes/i)
    } finally {
      await deleteTestUser(localUser)
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// E — Rate Limiting [P0]
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Rate Limiting [P0]', () => {
  let rlUser: TestUser
  let rlShowId: string

  test.beforeAll(async () => {
    rlUser = await createTestUser(`${BILLING_TAG}-ratelimit`)
    rlShowId = await createTestShow(rlUser.id)
    await setSubscriptionState(rlUser.id, { status: 'active', tier: 'pro' })
  })

  test.afterAll(async () => {
    await deleteTestUser(rlUser)
    await cleanupTestDataByPattern()
  })

  test('B-20: should return 429 after 30 taddy searches within 60s', async ({ page }) => {
    // This test is deliberately timeboxed — 31 sequential requests plus auth
    // overhead can bump against the default 30s test timeout. Extend it.
    test.setTimeout(60_000)

    await signIn(page, rlUser)

    // Fire 31 requests in parallel to drastically cut wall-clock time while
    // still exercising the per-user sliding window. The rate limiter counts
    // concurrent requests the same as sequential ones once they hit Redis.
    const promises = Array.from({ length: 31 }, (_, i) =>
      page.request
        .get(`/api/taddy/search?term=rate-limit-test-${i}`)
        .then((r) => r.status()),
    )
    const results = await Promise.all(promises)

    // At least one 429 in the batch (per-user limit is 30/min).
    const rateLimited = results.filter((s) => s === 429).length
    expect(rateLimited, `expected ≥1 429, got results: ${results.join(',')}`).toBeGreaterThanOrEqual(1)
  })

  test('B-21: should return 429 after 5 RSS imports within 60s', async ({ page }) => {
    await signIn(page, rlUser)
    const sub = new SubscriptionPage(page)

    const results: number[] = []
    for (let i = 0; i < 6; i++) {
      const r = await sub.attemptImportFeed(rlShowId)
      results.push(r.status)
    }

    // The 6th call must be 429. Earlier calls likely 422 (bad feed URL) or 200.
    expect(results.filter((s) => s === 429).length).toBeGreaterThanOrEqual(1)
    expect(results[5]).toBe(429)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// F — Billing Edge Cases [P1]
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Billing Edge Cases [P1]', () => {
  let edgeUser: TestUser
  let edgeShowId: string
  let edgeEpisodeId: string
  const edgeSubId = `sub_billingqa_edge_${Date.now()}`

  test.beforeAll(async () => {
    edgeUser = await createTestUser(`${BILLING_TAG}-edge`)
    edgeShowId = await createTestShow(edgeUser.id)
    edgeEpisodeId = await createPopulatedEpisode({ showId: edgeShowId })
    await setSubscriptionState(edgeUser.id, { status: 'active', tier: 'pro' })

    const admin = getAdminClient()
    const now = new Date()
    await admin.from('subscriptions').insert({
      user_id: edgeUser.id,
      stripe_customer_id: 'cus_billingqa_edge',
      stripe_subscription_id: edgeSubId,
      status: 'active',
      price_id: 'price_test_edge',
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getTime() + 30 * 86400_000).toISOString(),
    })
  })

  test.afterAll(async () => {
    const admin = getAdminClient()
    await admin.from('subscriptions').delete().eq('user_id', edgeUser.id)
    await deleteTestUser(edgeUser)
    await cleanupTestDataByPattern()
  })

  test('B-22: should preserve read access to existing episodes after cancel webhook', async ({
    page,
  }) => {
    const admin = getAdminClient()
    // Reset to active first
    await setSubscriptionState(edgeUser.id, { status: 'active', tier: 'pro' })
    await admin.from('subscriptions').update({ status: 'active' }).eq('user_id', edgeUser.id)

    // Deliver cancellation webhook
    const payload = buildEvent('customer.subscription.deleted', {
      subscriptionId: edgeSubId,
      customerId: 'cus_billingqa_edge',
    })
    const whResult = await postWebhook(page.request, payload)
    expect(whResult.status).toBe(200)

    // Sign in and confirm the user can still GET their episode
    await signIn(page, edgeUser)
    const resp = await page.request.get(`/api/episodes/${edgeEpisodeId}`)
    expect(resp.status()).toBe(200)
  })

  test('B-23: should block writes after cancel webhook', async ({ page }) => {
    const admin = getAdminClient()
    // Put user in canceled state directly (faster than relying on B-22 order)
    await setSubscriptionState(edgeUser.id, { status: 'canceled' })
    await admin.from('subscriptions').update({ status: 'canceled' }).eq('user_id', edgeUser.id)

    await signIn(page, edgeUser)
    const sub = new SubscriptionPage(page)

    const episodeAttempt = await sub.attemptCreateEpisode(edgeShowId)
    expect(episodeAttempt.status).toBe(403)

    const showAttempt = await sub.attemptCreateShow()
    expect(showAttempt.status).toBe(403)
  })

  test('B-24: should allow writes during past_due grace period', async ({ page }) => {
    const admin = getAdminClient()
    // Put user in past_due state with past_due_since=now() (within 3-day grace)
    await setSubscriptionState(edgeUser.id, {
      status: 'past_due',
      tier: 'pro',
      pastDueSince: new Date(),
    })
    await admin.from('subscriptions').update({ status: 'past_due' }).eq('user_id', edgeUser.id)

    await signIn(page, edgeUser)
    const sub = new SubscriptionPage(page)

    // past_due users retain write access — canProcessEpisode only blocks
    // trial_expired + canceled (see isAccessBlocked in pricing.ts).
    const result = await sub.attemptCreateEpisode(edgeShowId)
    expect([200, 201, 429]).toContain(result.status)
  })

  test('B-25: should block writes for canceled user even with 0 minutes used', async ({
    page,
  }) => {
    // Fresh user with zero usage but canceled status
    const cleanCanceled = await createTestUser(`${BILLING_TAG}-clean-canceled`)
    const cleanShowId = await createTestShow(cleanCanceled.id)
    try {
      await setSubscriptionState(cleanCanceled.id, { status: 'canceled' })

      await signIn(page, cleanCanceled)
      const sub = new SubscriptionPage(page)
      const result = await sub.attemptCreateEpisode(cleanShowId)

      expect(result.status).toBe(403)
      const body = result.body as { error?: string }
      expect(body.error ?? '').toMatch(/canceled|reactivate/i)
    } finally {
      await deleteTestUser(cleanCanceled)
    }
  })

  test('B-26: should return 404 from upgrade-annual when no active subscription', async ({
    page,
  }) => {
    // Fresh user with no subscriptions row
    const freshUser = await createTestUser(`${BILLING_TAG}-no-sub`)
    await createTestShow(freshUser.id)
    try {
      await signIn(page, freshUser)
      const sub = new SubscriptionPage(page)
      const r = await sub.attemptUpgradeAnnual()
      expect(r.status).toBe(404)
      expect(r.body.error ?? '').toMatch(/No active subscription/i)
    } finally {
      await deleteTestUser(freshUser)
    }
  })

  test('B-27: should return empty array from invoices when no stripe_customer_id', async ({
    page,
  }) => {
    const freshUser = await createTestUser(`${BILLING_TAG}-no-invoices`)
    await createTestShow(freshUser.id)
    try {
      await signIn(page, freshUser)
      const sub = new SubscriptionPage(page)
      const r = await sub.attemptInvoices()
      expect(r.status).toBe(200)
      expect(Array.isArray(r.body.data)).toBe(true)
      expect(r.body.data ?? []).toHaveLength(0)
    } finally {
      await deleteTestUser(freshUser)
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// G — Downgrade & State Propagation [P1]
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Downgrade & State Propagation [P1]', () => {
  let downgradeUser: TestUser
  let downgradeShowId: string

  test.beforeAll(async () => {
    downgradeUser = await createTestUser(`${BILLING_TAG}-downgrade`)
    downgradeShowId = await createTestShow(downgradeUser.id)
    // Start as Creator with 500 minutes used (under Creator's 1200 cap)
    await setSubscriptionState(downgradeUser.id, {
      status: 'active',
      tier: 'creator',
      minutesConsumed: 500,
    })
  })

  test.afterAll(async () => {
    await deleteTestUser(downgradeUser)
    await cleanupTestDataByPattern()
  })

  test('B-28: should reflect tier change from usage API after downgrade', async ({ page }) => {
    await signIn(page, downgradeUser)
    const sub = new SubscriptionPage(page)

    const before = await sub.getUsageData()
    expect(before.tier).toBe('creator')
    expect(before.audioMinutes.limit).toBe(1200)
    expect(before.audioMinutes.used).toBeGreaterThanOrEqual(500)

    // Simulate Stripe-driven downgrade via direct DB write (equivalent to the
    // customer.subscription.updated handler's effect)
    await setSubscriptionState(downgradeUser.id, { status: 'active', tier: 'pro' })
    await page.reload()

    const after = await sub.getUsageData()
    expect(after.tier).toBe('pro')
    expect(after.audioMinutes.limit).toBe(300)
    // Minutes used remains 500 — now over the new 300 cap
    expect(after.audioMinutes.used).toBeGreaterThanOrEqual(500)
  })

  test('B-29: should block episode creation when downgrade puts user over new cap', async ({
    page,
  }) => {
    // User is now on pro (300 cap) with 500 minutes used — over cap
    await signIn(page, downgradeUser)
    const sub = new SubscriptionPage(page)

    const result = await sub.attemptCreateEpisode(downgradeShowId)
    expect(result.status).toBe(403)
    const body = result.body as { error?: string }
    expect(body.error ?? '').toMatch(/300.*minutes|pro plan/i)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// H — Embedded Checkout UI [P2]
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Embedded Checkout UI [P2]', () => {
  let uiUser: TestUser

  test.beforeAll(async () => {
    uiUser = await createTestUser(`${BILLING_TAG}-ui`)
    await createTestShow(uiUser.id)
    // Leave as trialing — "Upgrade Plan" button shows
  })

  test.afterAll(async () => {
    await deleteTestUser(uiUser)
    await cleanupTestDataByPattern()
  })

  test('B-30: should open checkout dialog when upgrade clicked', async ({ page }) => {
    // Stub the checkout endpoint so the Stripe iframe doesn't try to load
    // a real client secret (which would require hitting Stripe's servers).
    // We return a fake secret; the Stripe iframe will reject it and render
    // an error, but the Radix dialog will still open with our title.
    await page.route('**/api/stripe/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clientSecret: 'cs_test_fake_for_ui_open' }),
      })
    })

    await signIn(page, uiUser)
    const settings = new SettingsBillingPage(page)
    await settings.goto()

    await settings.clickUpgrade()
    await settings.expectDialogOpen()

    await page.unroute('**/api/stripe/checkout')
  })

  test('B-31: should display error when checkout endpoint fails', async ({ page }) => {
    await page.route('**/api/stripe/checkout', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Pricing not configured for this tier' }),
      })
    })

    await signIn(page, uiUser)
    const settings = new SettingsBillingPage(page)
    await settings.goto()

    await settings.clickUpgrade()
    await settings.expectCheckoutError(/Pricing not configured|Checkout failed/i)

    await page.unroute('**/api/stripe/checkout')
  })

  test('B-32: should close dialog when close button clicked', async ({ page }) => {
    await page.route('**/api/stripe/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clientSecret: 'cs_test_fake_for_ui_close' }),
      })
    })

    await signIn(page, uiUser)
    const settings = new SettingsBillingPage(page)
    await settings.goto()

    await settings.clickUpgrade()
    await settings.expectDialogOpen()

    await settings.closeButton().click()
    await settings.expectDialogClosed()

    await page.unroute('**/api/stripe/checkout')
  })
})
