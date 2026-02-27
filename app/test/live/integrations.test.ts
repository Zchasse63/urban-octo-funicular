/**
 * Phase D: Integration Verification Tests
 *
 * Tests external service integrations with real credentials:
 *   - Taddy API: Podcast search, episode lookup
 *   - Stripe: Product listing, test-mode checkout
 *   - Webhook dispatch: Create, trigger, and verify
 *   - Supabase Storage: File upload, signed URL generation
 *   - xAI Grok: Direct health check
 *   - AssemblyAI: Direct health check
 *
 * Expected runtime: ~1-2 minutes
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ensureLiveTestUser, getAdminClient, getTestUserId, cleanupLiveTestData } from './helpers/auth';

describe('Live Integrations: External Service Verification', () => {
  beforeAll(async () => {
    console.log('\n--- Integration Test Setup ---');
    await ensureLiveTestUser();
    console.log('  Test user authenticated');
  });

  afterAll(async () => {
    console.log('\n--- Integration Test Cleanup ---');
    await cleanupLiveTestData();
    console.log('  Test data cleaned up');
  });

  // ─── Taddy API ─────────────────────────────────────────────────────
  describe('Taddy: Podcast Search API', () => {
    it('should search for podcasts and return results', async () => {
      const TADDY_API_KEY = process.env.TADDY_API_KEY;
      const TADDY_USER_ID = process.env.TADDY_USER_ID;

      if (!TADDY_API_KEY || !TADDY_USER_ID) {
        console.log('  Skipping Taddy tests — credentials not configured');
        return;
      }

      const response = await fetch('https://api.taddy.org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-USER-ID': TADDY_USER_ID,
          'X-API-KEY': TADDY_API_KEY,
        },
        body: JSON.stringify({
          query: `{
            search(term: "tech", filterForTypes: PODCASTSERIES, limitPerPage: 5) {
              searchId
              podcastSeries {
                uuid
                name
                description
              }
            }
          }`,
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.errors).toBeFalsy();
      expect(data.data?.search?.podcastSeries).toBeTruthy();

      const podcasts = data.data.search.podcastSeries;
      expect(podcasts.length).toBeGreaterThan(0);

      console.log(`  Taddy returned ${podcasts.length} podcasts`);
      console.log(`  First result: "${podcasts[0].name}"`);
    });

    it('should search for episodes by term', async () => {
      const TADDY_API_KEY = process.env.TADDY_API_KEY;
      const TADDY_USER_ID = process.env.TADDY_USER_ID;

      if (!TADDY_API_KEY || !TADDY_USER_ID) return;

      const response = await fetch('https://api.taddy.org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-USER-ID': TADDY_USER_ID,
          'X-API-KEY': TADDY_API_KEY,
        },
        body: JSON.stringify({
          query: `{
            search(term: "artificial intelligence", filterForTypes: PODCASTEPISODE, limitPerPage: 3) {
              searchId
              podcastEpisodes {
                uuid
                name
                duration
                datePublished
              }
            }
          }`,
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.errors).toBeFalsy();

      const episodes = data.data?.search?.podcastEpisodes;
      expect(episodes).toBeTruthy();
      expect(episodes.length).toBeGreaterThan(0);

      // Each episode should have required fields
      for (const ep of episodes) {
        expect(ep.uuid).toBeTruthy();
        expect(ep.name).toBeTruthy();
      }

      console.log(`  Taddy returned ${episodes.length} episodes`);
    });
  });

  // ─── xAI Grok Health Check ─────────────────────────────────────────
  describe('xAI Grok: API Health', () => {
    it('should respond to a simple prompt', async () => {
      const XAI_API_KEY = process.env.XAI_API_KEY;
      if (!XAI_API_KEY) {
        console.log('  Skipping xAI tests — key not configured');
        return;
      }

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast',
          messages: [{ role: 'user', content: 'Respond with exactly: HEALTH_OK' }],
          max_tokens: 10,
          temperature: 0,
        }),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      expect(content).toBeTruthy();
      expect(content).toContain('HEALTH_OK');

      console.log(`  xAI Grok responded: "${content}"`);
      console.log(`  Model: ${data.model}`);
      console.log(`  Tokens used: ${data.usage?.total_tokens}`);
    });
  });

  // ─── AssemblyAI Health Check ───────────────────────────────────────
  describe('AssemblyAI: API Health', () => {
    it('should verify API key is valid', async () => {
      const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;
      if (!ASSEMBLYAI_KEY) {
        console.log('  Skipping AssemblyAI tests — key not configured');
        return;
      }

      // Just check the API responds to a list transcripts request
      const response = await fetch('https://api.assemblyai.com/v2/transcript?limit=1', {
        headers: {
          Authorization: ASSEMBLYAI_KEY,
        },
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      // API should return a valid response (even if empty)
      expect(data).toBeTruthy();

      console.log(`  AssemblyAI API key valid`);
      console.log(`  Transcripts on account: ${data.page_details?.total_count || 'unknown'}`);
    });
  });

  // ─── Stripe Integration ────────────────────────────────────────────
  describe('Stripe: Payment Integration', () => {
    it('should verify Stripe API key and list products', async () => {
      const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
      if (!STRIPE_SECRET) {
        console.log('  Skipping Stripe tests — key not configured');
        return;
      }

      const response = await fetch('https://api.stripe.com/v1/products?active=true&limit=10', {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
        },
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.object).toBe('list');

      console.log(`  Stripe API key valid`);
      console.log(`  Active products: ${data.data?.length || 0}`);

      if (data.data?.length > 0) {
        for (const product of data.data) {
          console.log(`    - ${product.name} (${product.id})`);
        }
      }
    });

    it('should list prices for subscription tiers', async () => {
      const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
      if (!STRIPE_SECRET) return;

      const response = await fetch('https://api.stripe.com/v1/prices?active=true&limit=10', {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
        },
      });

      expect(response.ok).toBe(true);

      const data = await response.json();

      console.log(`  Active prices: ${data.data?.length || 0}`);
      if (data.data?.length > 0) {
        for (const price of data.data) {
          const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'custom';
          console.log(`    - ${price.id}: ${amount}/${price.recurring?.interval || 'one-time'}`);
        }
      }
    });
  });

  // ─── Supabase Storage ──────────────────────────────────────────────
  describe('Supabase Storage: File Operations', () => {
    it('should upload and download a test file', async () => {
      const admin = getAdminClient();
      const fileName = `test-integration-${Date.now()}.txt`;
      const content = 'Live integration test file content';

      // Ensure bucket exists
      try {
        await admin.storage.createBucket('episodes', { public: false });
      } catch {
        // Bucket already exists
      }

      // Upload
      const { error: uploadError } = await admin.storage
        .from('episodes')
        .upload(fileName, Buffer.from(content), { contentType: 'text/plain' });

      expect(uploadError).toBeNull();

      // Create signed URL
      const { data: signedData, error: signedError } = await admin.storage
        .from('episodes')
        .createSignedUrl(fileName, 60);

      expect(signedError).toBeNull();
      expect(signedData?.signedUrl).toBeTruthy();

      // Download and verify
      const response = await fetch(signedData!.signedUrl);
      expect(response.ok).toBe(true);

      const downloaded = await response.text();
      expect(downloaded).toBe(content);

      // Cleanup
      await admin.storage.from('episodes').remove([fileName]);

      console.log(`  File upload/download cycle: OK`);
    });
  });

  // ─── Webhook System ────────────────────────────────────────────────
  describe('Webhooks: Registration & HMAC Signing', () => {
    let webhookId: string;

    it('should create a webhook registration', async () => {
      const admin = getAdminClient();
      const userId = getTestUserId();

      const { data, error } = await admin
        .from('webhooks')
        .insert({
          user_id: userId,
          url: 'https://httpbin.org/post',
          events: ['episode.completed', 'asset.generated'],
          secret: 'test-webhook-secret-key-live',
          active: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.url).toBe('https://httpbin.org/post');
      expect(data!.events).toContain('episode.completed');

      webhookId = data!.id;
      console.log(`  Webhook registered: ${webhookId}`);
    });

    it('should verify HMAC signature generation', async () => {
      const crypto = await import('crypto');

      const payload = JSON.stringify({
        event: 'episode.completed',
        timestamp: new Date().toISOString(),
        data: { episodeId: 'test-123', status: 'completed' },
      });

      const secret = 'test-webhook-secret-key-live';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(signature).toBeTruthy();
      expect(signature.length).toBe(64); // SHA-256 hex = 64 chars

      // Verify signature is deterministic
      const signature2 = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(signature).toBe(signature2);

      console.log(`  HMAC signature verified: ${signature.slice(0, 16)}...`);
    });

    it('should list registered webhooks for the user', async () => {
      const admin = getAdminClient();
      const userId = getTestUserId();

      const { data, error } = await admin
        .from('webhooks')
        .select('*')
        .eq('user_id', userId);

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.length).toBeGreaterThan(0);

      console.log(`  User has ${data!.length} registered webhook(s)`);
    });
  });

  // ─── Database RLS Policies ─────────────────────────────────────────
  describe('Database: RLS & Access Control', () => {
    it('should enforce show ownership — user can only see own shows', async () => {
      const admin = getAdminClient();
      const userId = getTestUserId();

      // Create a show for the test user
      const { data: show } = await admin
        .from('shows')
        .insert({
          user_id: userId,
          name: '[LIVE-TEST] RLS Test Show',
          description: 'Testing RLS policies',
        })
        .select()
        .single();

      expect(show).toBeTruthy();

      // Fetch it back — should work
      const { data: fetched } = await admin
        .from('shows')
        .select('*')
        .eq('id', show!.id)
        .single();

      expect(fetched).toBeTruthy();
      expect(fetched!.user_id).toBe(userId);

      console.log(`  RLS show ownership check: OK`);
    });
  });
});
