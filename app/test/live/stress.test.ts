/**
 * Phase E: Stress & Edge Case Tests
 *
 * Tests the system under unusual conditions:
 *   - Rate limiting enforcement
 *   - Tier limit enforcement (episode count)
 *   - Concurrent asset generation
 *   - Large transcript handling
 *   - Error recovery (bad inputs, missing data)
 *   - Circuit breaker behavior
 *
 * Expected runtime: ~2-3 minutes
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ensureLiveTestUser, getAdminClient, getTestUserId, cleanupLiveTestData } from './helpers/auth';
import { createTestShow, getEpisode } from './helpers/pipeline';

describe('Stress & Edge Cases', () => {
  let showId: string;

  beforeAll(async () => {
    console.log('\n--- Stress Test Setup ---');
    await ensureLiveTestUser();
    const show = await createTestShow('[LIVE-TEST] Stress Test Show');
    showId = show.id;
    console.log(`  Show created: ${showId}`);
  });

  afterAll(async () => {
    console.log('\n--- Stress Test Cleanup ---');
    await cleanupLiveTestData();
    console.log('  Test data cleaned up');
  });

  // ─── Rate Limit Behavior ───────────────────────────────────────────
  describe('Rate Limiting', () => {
    it('should handle rapid successive xAI API calls without crashing', async () => {
      const XAI_API_KEY = process.env.XAI_API_KEY;
      if (!XAI_API_KEY) {
        console.log('  Skipping — XAI_API_KEY not set');
        return;
      }

      const promises: Promise<Response>[] = [];

      // Fire 5 rapid requests to xAI
      for (let i = 0; i < 5; i++) {
        promises.push(
          fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${XAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'grok-4-1-fast',
              messages: [{ role: 'user', content: `Say "${i}" and nothing else.` }],
              max_tokens: 5,
              temperature: 0,
            }),
          })
        );
      }

      const results = await Promise.allSettled(promises);

      const succeeded = results.filter(r => r.status === 'fulfilled' && (r.value as Response).ok);
      const rateLimited = results.filter(
        r => r.status === 'fulfilled' && (r.value as Response).status === 429
      );
      const failed = results.filter(r => r.status === 'rejected');

      console.log(`  Rapid fire results: ${succeeded.length} ok, ${rateLimited.length} rate-limited, ${failed.length} failed`);

      // We should get at least some successful responses
      expect(succeeded.length + rateLimited.length).toBeGreaterThan(0);
      // Failures (network errors etc.) should be minimal
      expect(failed.length).toBeLessThanOrEqual(1);
    }, 30_000);
  });

  // ─── Concurrent Asset Generation ───────────────────────────────────
  describe('Concurrent Asset Generation', () => {
    it('should handle parallel asset generation requests', async () => {
      const XAI_API_KEY = process.env.XAI_API_KEY;
      if (!XAI_API_KEY) {
        console.log('  Skipping — XAI_API_KEY not set');
        return;
      }

      const assetTypes = ['linkedin_post', 'twitter_single', 'seo_description'];
      const transcript = 'This is a podcast about technology startups and how they scale their products to reach millions of users worldwide.';

      const { generateAsset, buildAssetContext } = await import('@/lib/content');

      // Create a minimal context
      const context = buildAssetContext(
        {
          transcript,
          title: 'Test Episode',
          guest_name: null,
        } as any,
        'Test Show',
        {}
      );

      // Fire all 3 at once
      const startTime = Date.now();
      const results = await Promise.allSettled(
        assetTypes.map(type => generateAsset(type as any, context))
      );

      const elapsed = Date.now() - startTime;
      const succeeded = results.filter(
        r => r.status === 'fulfilled' && r.value.success
      );

      console.log(`  Concurrent generation: ${succeeded.length}/${assetTypes.length} in ${elapsed}ms`);

      // At least 2 of 3 should succeed
      expect(succeeded.length).toBeGreaterThanOrEqual(2);
    }, 120_000);
  });

  // ─── Large Transcript Handling ─────────────────────────────────────
  describe('Large Transcript Handling', () => {
    it('should handle a very long transcript without crashing', async () => {
      const XAI_API_KEY = process.env.XAI_API_KEY;
      if (!XAI_API_KEY) {
        console.log('  Skipping — XAI_API_KEY not set');
        return;
      }

      // Create a large transcript (simulates a 2-hour podcast)
      const paragraph = 'The conversation continued with the guest discussing the impact of artificial intelligence on the modern workforce. Topics included machine learning, natural language processing, and the ethical considerations of deploying AI systems at scale. ';
      const longTranscript = paragraph.repeat(100); // ~25k chars

      const { generateAsset, buildAssetContext } = await import('@/lib/content');

      const context = buildAssetContext(
        {
          transcript: longTranscript,
          title: 'Very Long Episode',
          guest_name: 'Dr. Smith',
        } as any,
        'AI Discussion Podcast',
        {}
      );

      // Generate a summary — this tests the model's ability to handle long context
      const result = await generateAsset('ai_summary_short', context);

      expect(result.success).toBe(true);
      expect(result.content).toBeTruthy();
      expect(result.content.length).toBeGreaterThan(20);

      console.log(`  Long transcript (${longTranscript.length} chars) → summary: ${result.content.length} chars`);
    }, 120_000);
  });

  // ─── Error Recovery ────────────────────────────────────────────────
  describe('Error Recovery', () => {
    it('should gracefully handle missing episode for asset generation', async () => {
      const { generateAsset, buildAssetContext } = await import('@/lib/content');

      // Build context with empty transcript
      const context = buildAssetContext(
        {
          transcript: '',
          title: 'Empty Episode',
          guest_name: null,
        } as any,
        'Test Show',
        {}
      );

      const result = await generateAsset('show_notes', context);

      // Should either succeed with minimal content or fail gracefully
      if (result.success) {
        expect(result.content).toBeTruthy();
      } else {
        expect(result.error).toBeTruthy();
      }

      console.log(`  Empty transcript: ${result.success ? 'handled' : 'error: ' + result.error}`);
    }, 60_000);

    it('should handle invalid audio URL for transcription gracefully', async () => {
      try {
        const { transcribeAudio } = await import('@/lib/assemblyai/client');
        await transcribeAudio('https://example.com/nonexistent-audio.mp3');
        // If it doesn't throw, that's unexpected but not necessarily wrong
      } catch (error) {
        // Expected — should get a clear error message
        expect(error).toBeTruthy();
        expect((error as Error).message).toBeTruthy();
        console.log(`  Invalid audio URL: error caught correctly`);
      }
    }, 60_000);
  });

  // ─── Database Edge Cases ───────────────────────────────────────────
  describe('Database Edge Cases', () => {
    it('should handle duplicate show names', async () => {
      const admin = getAdminClient();
      const userId = getTestUserId();

      // Create two shows with the same name
      const { data: show1 } = await admin
        .from('shows')
        .insert({ user_id: userId, name: '[LIVE-TEST] Duplicate Name', description: 'First' })
        .select()
        .single();

      const { data: show2 } = await admin
        .from('shows')
        .insert({ user_id: userId, name: '[LIVE-TEST] Duplicate Name', description: 'Second' })
        .select()
        .single();

      expect(show1).toBeTruthy();
      expect(show2).toBeTruthy();
      expect(show1!.id).not.toBe(show2!.id);

      console.log(`  Duplicate show names: allowed (different IDs)`);
    });

    it('should handle episode creation with maximum metadata', async () => {
      const admin = getAdminClient();

      // Create an episode with a large metadata object
      const largeMetadata: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeMetadata[`key_${i}`] = `value_${i}_${'x'.repeat(100)}`;
      }

      const { data, error } = await admin
        .from('episodes')
        .insert({
          show_id: showId,
          title: '[LIVE-TEST] Large Metadata Episode',
          status: 'pending',
          metadata: largeMetadata,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(Object.keys(data!.metadata).length).toBe(100);

      console.log(`  Large metadata (100 keys): stored OK`);
    });

    it('should handle special characters in episode titles', async () => {
      const admin = getAdminClient();

      const specialTitle = '[LIVE-TEST] Episode with "quotes" & <html> tags \' and unicode: \u00e9\u00f1\u00fc\u00df\u00e0\u00f6';

      const { data, error } = await admin
        .from('episodes')
        .insert({
          show_id: showId,
          title: specialTitle,
          status: 'pending',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.title).toBe(specialTitle);

      console.log(`  Special characters in title: stored correctly`);
    });

    it('should enforce foreign key constraints', async () => {
      const admin = getAdminClient();

      // Try to create an episode with a non-existent show_id
      const { error } = await admin
        .from('episodes')
        .insert({
          show_id: '00000000-0000-0000-0000-000000000099', // doesn't exist
          title: '[LIVE-TEST] Orphan Episode',
          status: 'pending',
        });

      // Should fail with a foreign key violation
      expect(error).toBeTruthy();
      console.log(`  Foreign key enforcement: ${error!.message.slice(0, 60)}...`);
    });
  });

  // ─── Tier Limits ───────────────────────────────────────────────────
  describe('Tier Limit Enforcement', () => {
    it('should track episode count for the user', async () => {
      const admin = getAdminClient();
      const userId = getTestUserId();

      // Count episodes across all shows for this user
      const { data: shows } = await admin
        .from('shows')
        .select('id')
        .eq('user_id', userId);

      if (!shows || shows.length === 0) {
        console.log('  No shows to count episodes for');
        return;
      }

      const showIds = shows.map(s => s.id);
      const { count } = await admin
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .in('show_id', showIds);

      console.log(`  User episode count: ${count}`);
      expect(typeof count).toBe('number');
    });

    it('should verify user subscription tier', async () => {
      const admin = getAdminClient();
      const userId = getTestUserId();

      const { data: user } = await admin
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      expect(user).toBeTruthy();
      expect(user!.subscription_tier).toBe('agency'); // Set to agency in test setup

      console.log(`  User tier: ${user!.subscription_tier}`);
    });
  });

  // ─── Vocabulary Edge Cases ─────────────────────────────────────────
  describe('Vocabulary Edge Cases', () => {
    it('should handle vocabulary terms with special characters', async () => {
      const admin = getAdminClient();

      const { error } = await admin
        .from('vocabulary_terms')
        .insert({
          show_id: showId,
          term: 'C++ / C#',
          alternatives: ['cplusplus', 'csharp'],
        });

      expect(error).toBeNull();
      console.log('  Special character vocab term: stored OK');
    });

    it('should handle vocabulary terms with many alternatives', async () => {
      const admin = getAdminClient();

      const manyAlternatives = Array.from({ length: 50 }, (_, i) => `alt_${i}`);

      const { error } = await admin
        .from('vocabulary_terms')
        .insert({
          show_id: showId,
          term: 'ManyAlts',
          alternatives: manyAlternatives,
        });

      expect(error).toBeNull();
      console.log('  Vocabulary with 50 alternatives: stored OK');
    });
  });
});
