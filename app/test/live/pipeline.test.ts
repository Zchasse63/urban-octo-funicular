/**
 * Phase B: Live Pipeline Test
 *
 * End-to-end test of the complete episode processing pipeline
 * using REAL services:
 *   1. Create a show in Supabase
 *   2. Add vocabulary terms for learning
 *   3. Upload real audio to Supabase Storage
 *   4. Transcribe via AssemblyAI (real API)
 *   5. Generate show notes via xAI Grok (real API)
 *   6. Generate all core assets via xAI Grok (real API)
 *   7. Structural validation of every generated asset
 *   8. Verify database state is consistent
 *
 * Expected runtime: ~5-10 minutes (mostly transcription + generation)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestShow,
  addVocabularyTerms,
  uploadAndCreateEpisode,
  transcribeEpisode,
  generateShowNotes,
  generateAssetViaApi,
  fetchAllAssets,
  getEpisode,
  CORE_ASSET_TYPES,
  type PipelineContext,
} from './helpers/pipeline';
import { ensureLiveTestUser, getAdminClient, cleanupLiveTestData } from './helpers/auth';
import { validateAsset, validateAllAssets, assertAssetCoverage } from './helpers/asset-validators';

// Shared context across all tests in this file
const ctx: PipelineContext = {
  showId: '',
  showName: '',
  episodeId: '',
  episodeTitle: '',
  audioUrl: '',
  transcript: null,
  utterances: [],
  assets: new Map(),
};

describe('Live Pipeline: Full Episode Processing', () => {
  // ─── Setup ───────────────────────────────────────────────────────────
  beforeAll(async () => {
    console.log('\n--- Pipeline Test Setup ---');
    await ensureLiveTestUser();
    console.log('  Test user authenticated');
  });

  afterAll(async () => {
    console.log('\n--- Pipeline Test Cleanup ---');
    await cleanupLiveTestData();
    console.log('  Test data cleaned up');
  });

  // ─── Step 1: Create Show ─────────────────────────────────────────────
  describe('Step 1: Show Creation', () => {
    it('should create a test show in Supabase', async () => {
      const show = await createTestShow('[LIVE-TEST] Interview Podcast');
      ctx.showId = show.id;
      ctx.showName = show.name;

      expect(show.id).toBeTruthy();
      expect(show.name).toContain('[LIVE-TEST]');

      // Verify it's in the DB
      const admin = getAdminClient();
      const { data } = await admin.from('shows').select('*').eq('id', show.id).single();
      expect(data).toBeTruthy();
      expect(data!.name).toBe(show.name);

      console.log(`  Show created: ${show.id}`);
    });

    it('should add vocabulary terms for the show', async () => {
      await addVocabularyTerms(ctx.showId, [
        { term: 'PodBrain', alternatives: ['Pod Brain', 'podbrain'] },
        { term: 'show notes', alternatives: ['shownotes'] },
        { term: 'audiogram', alternatives: ['audio gram'] },
      ]);

      // Verify vocabulary was saved
      const admin = getAdminClient();
      const { data } = await admin
        .from('vocabulary_terms')
        .select('*')
        .eq('show_id', ctx.showId);

      expect(data).toHaveLength(3);
      console.log(`  ${data!.length} vocabulary terms added`);
    });
  });

  // ─── Step 2: Upload Audio ────────────────────────────────────────────
  describe('Step 2: Audio Upload', () => {
    it('should upload audio and create episode record', async () => {
      const result = await uploadAndCreateEpisode(
        ctx.showId,
        '[LIVE-TEST] Job Interview Discussion',
        'Test Guest'
      );

      ctx.episodeId = result.episodeId;
      ctx.audioUrl = result.audioUrl;

      expect(result.episodeId).toBeTruthy();
      expect(result.audioUrl).toContain('supabase');

      // Verify episode record
      const episode = await getEpisode(result.episodeId);
      expect(episode.status).toBe('pending');
      expect(episode.audio_url).toBeTruthy();
      expect(episode.guest_name).toBe('Test Guest');

      console.log(`  Episode created: ${result.episodeId}`);
      console.log(`  Audio URL: ${result.audioUrl.slice(0, 60)}...`);
    });
  });

  // ─── Step 3: Transcription ───────────────────────────────────────────
  describe('Step 3: AssemblyAI Transcription', () => {
    it('should transcribe audio via real AssemblyAI API', async () => {
      const result = await transcribeEpisode(ctx.episodeId, ctx.audioUrl, [
        'interview', 'job', 'career',
      ]);

      ctx.transcript = result.text;
      ctx.utterances = result.utterances;

      // Transcript should be non-empty and reasonable length
      expect(result.text).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(50);

      // Should have detected speakers (the clip is multi-speaker)
      expect(result.utterances.length).toBeGreaterThan(0);

      // Verify the transcript was saved to the episode
      const episode = await getEpisode(ctx.episodeId);
      expect(episode.transcript).toBeTruthy();
      expect(episode.status).toBe('processing');

      console.log(`  Transcript length: ${result.text.length} chars`);
      console.log(`  Utterances: ${result.utterances.length}`);
      console.log(`  Speakers: ${new Set(result.utterances.map(u => u.speaker)).size}`);
      console.log(`  Preview: "${result.text.slice(0, 100)}..."`);
    }, 180_000); // 3 min timeout for transcription
  });

  // ─── Step 4: Show Notes Generation ───────────────────────────────────
  describe('Step 4: Show Notes (xAI Grok)', () => {
    it('should generate show notes from the transcript', async () => {
      const showNotes = await generateShowNotes(ctx.episodeId);

      expect(showNotes).toBeTruthy();
      expect(showNotes!.length).toBeGreaterThan(100);

      // Verify it was saved to episode
      const episode = await getEpisode(ctx.episodeId);
      expect(episode.show_notes).toBeTruthy();
      expect(episode.status).toBe('completed');

      // Structural validation
      const validation = validateAsset('show_notes', showNotes!);
      expect(validation.passed).toBe(true);
      if (!validation.passed) {
        console.warn('  Show notes validation issues:', validation.issues);
      }

      console.log(`  Show notes: ${showNotes!.length} chars`);
    }, 120_000); // 2 min timeout
  });

  // ─── Step 5: Asset Generation ────────────────────────────────────────
  describe('Step 5: Content Asset Generation (xAI Grok)', () => {
    // Generate assets directly via content lib (bypasses API route which needs a running server)
    it('should generate all core asset types', async () => {
      const { generateAsset, buildAssetContext, formatAssetForStorage } = await import('@/lib/content');

      const episode = await getEpisode(ctx.episodeId);
      const showData = Array.isArray(episode.shows) ? episode.shows[0] : episode.shows;
      const context = buildAssetContext(episode, showData?.name || ctx.showName, {
        guestName: 'Test Guest',
      });

      const admin = getAdminClient();
      const generated: Array<{ asset_type: string; content: string; metadata: unknown }> = [];
      const failed: string[] = [];

      // Generate assets sequentially to avoid rate limiting
      for (const assetType of CORE_ASSET_TYPES) {
        // Skip show_notes — already generated in Step 4
        if (assetType === 'show_notes') continue;

        try {
          console.log(`    Generating ${assetType}...`);
          const result = await generateAsset(assetType, context);

          if (result.success) {
            const formatted = formatAssetForStorage(ctx.episodeId, result);

            // Save to database
            await admin.from('generated_assets').insert(formatted);

            generated.push({
              asset_type: assetType,
              content: formatted.content,
              metadata: formatted.metadata,
            });

            ctx.assets.set(assetType, {
              id: assetType, // Will get real ID from DB
              content: formatted.content,
              metadata: formatted.metadata,
            });

            console.log(`    \u2713 ${assetType} (${formatted.content.length} chars)`);
          } else {
            failed.push(`${assetType}: ${result.error}`);
            console.warn(`    \u2717 ${assetType}: ${result.error}`);
          }

          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 300));
        } catch (err) {
          failed.push(`${assetType}: ${err}`);
          console.warn(`    \u2717 ${assetType}: ${err}`);
        }
      }

      // At least 80% of assets should succeed
      const successRate = generated.length / (CORE_ASSET_TYPES.length - 1); // -1 for show_notes
      console.log(`\n  Generated ${generated.length}/${CORE_ASSET_TYPES.length - 1} assets (${(successRate * 100).toFixed(0)}%)`);

      if (failed.length > 0) {
        console.warn(`  Failed assets:`, failed);
      }

      expect(successRate).toBeGreaterThanOrEqual(0.8);
    }, 600_000); // 10 min timeout for generating all assets
  });

  // ─── Step 6: Structural Validation ───────────────────────────────────
  describe('Step 6: Structural Validation', () => {
    it('should validate all generated assets pass structural checks', async () => {
      const assets = await fetchAllAssets(ctx.episodeId);

      expect(assets.length).toBeGreaterThan(0);

      const validation = validateAllAssets(assets);

      console.log(`\n  Structural validation: ${validation.passCount} passed, ${validation.failCount} failed`);

      if (validation.failures.length > 0) {
        console.warn('  Failures:');
        for (const f of validation.failures) {
          console.warn(`    - ${f}`);
        }
      }

      // Allow up to 20% structural failures (some platform limits may be borderline)
      const failRate = validation.failCount / validation.results.length;
      expect(failRate).toBeLessThanOrEqual(0.2);
    });
  });

  // ─── Step 7: Database Consistency ────────────────────────────────────
  describe('Step 7: Database Consistency', () => {
    it('should have consistent episode state after pipeline', async () => {
      const episode = await getEpisode(ctx.episodeId);

      // Episode should be in completed state
      expect(episode.status).toBe('completed');
      expect(episode.transcript).toBeTruthy();
      expect(episode.show_notes).toBeTruthy();
      expect(episode.audio_url).toBeTruthy();

      // Metadata should have been populated
      expect(episode.metadata).toBeTruthy();
      expect(episode.metadata.live_test).toBe(true);
    });

    it('should have all generated assets linked to the episode', async () => {
      const assets = await fetchAllAssets(ctx.episodeId);

      // Every asset should reference the correct episode
      for (const asset of assets) {
        expect(asset.episode_id).toBe(ctx.episodeId);
        expect(asset.content).toBeTruthy();
        expect(asset.asset_type).toBeTruthy();
      }

      console.log(`  Total assets in DB: ${assets.length}`);
    });

    it('should have vocabulary terms still intact', async () => {
      const admin = getAdminClient();
      const { data } = await admin
        .from('vocabulary_terms')
        .select('*')
        .eq('show_id', ctx.showId);

      expect(data).toHaveLength(3);
    });
  });
});
