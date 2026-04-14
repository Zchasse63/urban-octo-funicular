/**
 * Live pipeline helpers.
 *
 * Provides functions to drive the full episode pipeline against real services:
 * upload audio → transcribe via AssemblyAI → generate assets via xAI Grok.
 *
 * Bypasses Trigger.dev by calling services directly.
 */
import * as fs from 'fs';
import * as path from 'path';
import { getAdminClient, liveApi, ensureLiveTestUser } from './auth';
import type { AssetType } from '@/types/database';

const AUDIO_FIXTURE = path.resolve(__dirname, '../../fixtures/test-podcast-clip.mp3');

export interface PipelineContext {
  showId: string;
  showName: string;
  episodeId: string;
  episodeTitle: string;
  audioUrl: string;
  transcript: string | null;
  utterances: Array<{ speaker: string; text: string; start: number; end: number }>;
  assets: Map<string, { id: string; content: string; metadata: unknown }>;
}

/**
 * Step 1: Create a test show.
 */
export async function createTestShow(name?: string): Promise<{ id: string; name: string }> {
  const showName = name || `[LIVE-TEST] Podcast ${Date.now()}`;
  const admin = getAdminClient();
  const { userId } = await ensureLiveTestUser();

  const { data, error } = await admin
    .from('shows')
    .insert({
      user_id: userId,
      name: showName,
      description: 'Live integration test show',
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create test show: ${error?.message}`);
  return { id: data.id, name: showName };
}

/**
 * Step 2: Add vocabulary terms to the show (for vocabulary learning testing).
 */
export async function addVocabularyTerms(
  showId: string,
  terms: Array<{ term: string; alternatives?: string[] }>
): Promise<void> {
  const admin = getAdminClient();

  for (const t of terms) {
    await admin.from('vocabulary_terms').insert({
      show_id: showId,
      term: t.term,
      alternatives: t.alternatives || [],
    });
  }
}

/**
 * Step 3: Upload audio to Supabase Storage and create an episode record.
 */
export async function uploadAndCreateEpisode(
  showId: string,
  title?: string,
  guestName?: string
): Promise<{ episodeId: string; audioUrl: string }> {
  const admin = getAdminClient();
  const episodeTitle = title || `[LIVE-TEST] Episode ${Date.now()}`;

  // Read the test audio file
  if (!fs.existsSync(AUDIO_FIXTURE)) {
    throw new Error(`Test audio fixture not found at ${AUDIO_FIXTURE}`);
  }
  const audioBuffer = fs.readFileSync(AUDIO_FIXTURE);
  const fileName = `live-test-${Date.now()}.mp3`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await admin.storage
    .from('episodes')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      cacheControl: '3600',
    });

  if (uploadError) {
    // If bucket doesn't exist, create it
    if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
      await admin.storage.createBucket('episodes', { public: false });
      const retry = await admin.storage
        .from('episodes')
        .upload(fileName, audioBuffer, { contentType: 'audio/mpeg' });
      if (retry.error) throw new Error(`Upload failed after bucket creation: ${retry.error.message}`);
    } else {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
  }

  // Get a signed URL for AssemblyAI to access
  const { data: signedData, error: signedError } = await admin.storage
    .from('episodes')
    .createSignedUrl(fileName, 7200); // 2 hours

  if (signedError || !signedData) {
    throw new Error(`Failed to create signed URL: ${signedError?.message}`);
  }

  const audioUrl = signedData.signedUrl;

  // Create the episode record
  const { userId } = await ensureLiveTestUser();
  const { data: episode, error: episodeError } = await admin
    .from('episodes')
    .insert({
      show_id: showId,
      title: episodeTitle,
      status: 'pending',
      audio_url: audioUrl,
      guest_name: guestName || null,
      metadata: { live_test: true, uploaded_at: new Date().toISOString() },
    })
    .select()
    .single();

  if (episodeError || !episode) {
    throw new Error(`Failed to create episode: ${episodeError?.message}`);
  }

  return { episodeId: episode.id, audioUrl };
}

/**
 * Step 4: Transcribe audio via AssemblyAI (direct call, no Trigger.dev).
 */
export async function transcribeEpisode(
  episodeId: string,
  audioUrl: string,
  customVocabulary: string[] = []
): Promise<{
  text: string;
  utterances: Array<{ speaker: string; text: string; start: number; end: number }>;
}> {
  // Dynamic import to avoid loading AssemblyAI SDK in test setup
  const { transcribeAudio } = await import('@/lib/assemblyai/client');

  console.log(`  ⏳ Transcribing audio via AssemblyAI (this may take 1-3 minutes)...`);
  const startTime = Date.now();

  const result = await transcribeAudio(audioUrl, {
    language: 'en',
    customVocabulary: customVocabulary.length > 0 ? customVocabulary : undefined,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ Transcription complete in ${elapsed}s (${result.text.length} chars)`);

  // Save transcript to the episode
  const admin = getAdminClient();
  const { error: updateError } = await admin
    .from('episodes')
    .update({
      transcript: result.text,
      status: 'processing',
      audio_duration_seconds: result.utterances?.length
        ? Math.ceil(result.utterances[result.utterances.length - 1].end / 1000)
        : null,
      metadata: {
        live_test: true,
        transcription_id: result.id,
        word_count: result.text.split(/\s+/).length,
        speaker_count: result.utterances ? new Set(result.utterances.map(u => u.speaker)).size : 0,
        transcribed_at: new Date().toISOString(),
      },
    })
    .eq('id', episodeId);

  if (updateError) {
    console.error(`  ❌ Failed to save transcript to episode: ${updateError.message}`);
    throw new Error(`Failed to save transcript: ${updateError.message}`);
  }

  // Verify the save worked
  const { data: verify } = await admin
    .from('episodes')
    .select('transcript, status')
    .eq('id', episodeId)
    .single();
  console.log(`  📝 Saved to DB: status=${verify?.status}, transcript=${verify?.transcript ? verify.transcript.length + ' chars' : 'null'}`);

  return {
    text: result.text,
    utterances: result.utterances,
  };
}

/**
 * Step 5: Generate a single asset via the API (uses real xAI Grok).
 */
export async function generateAssetViaApi(
  episodeId: string,
  assetType: AssetType
): Promise<{ id: string; content: string; metadata: unknown } | null> {
  const response = await liveApi<{ data: { id: string; content: string; metadata: unknown } }>(
    `/api/episodes/${episodeId}/assets`,
    {
      method: 'POST',
      body: { assetType, regenerate: true },
    }
  );

  if (!response.ok) {
    console.warn(`  ⚠️  Asset generation failed for ${assetType}: ${JSON.stringify(response.data)}`);
    return null;
  }

  return response.data?.data || null;
}

/**
 * Step 5b: Generate show notes by directly updating the episode.
 * Show notes are stored on the episode record, not as a generated asset.
 */
export async function generateShowNotes(
  episodeId: string
): Promise<string | null> {
  // Dynamic import
  const { generateAsset, buildAssetContext } = await import('@/lib/content');
  const admin = getAdminClient();

  const { data: episode } = await admin
    .from('episodes')
    .select('*, shows(name, style_preferences)')
    .eq('id', episodeId)
    .single();

  if (!episode || !episode.transcript) {
    console.warn(`  ⚠️  generateShowNotes: episode missing or no transcript (transcript=${episode?.transcript ? 'present' : 'null'}, status=${episode?.status})`);
    return null;
  }

  const showData = Array.isArray(episode.shows) ? episode.shows[0] : episode.shows;
  const context = buildAssetContext(episode, showData?.name || 'Test Show', {});

  console.log(`  ⏳ Generating show notes via xAI Grok...`);
  const result = await generateAsset('show_notes', context);

  if (!result.success) {
    console.warn(`  ⚠️  Show notes generation failed: ${result.error}`);
    return null;
  }

  // Save to episode
  const { error: updateError } = await admin
    .from('episodes')
    .update({
      show_notes: result.content,
      status: 'completed',
    })
    .eq('id', episodeId);

  if (updateError) {
    console.error(`  ❌ Failed to save show notes: ${updateError.message}`);
  }

  console.log(`  ✅ Show notes generated (${result.content?.length || 0} chars)`);
  return result.content || null;
}

/**
 * Fetch all generated assets for an episode from the database.
 */
export async function fetchAllAssets(
  episodeId: string
): Promise<Array<{ id: string; asset_type: string; content: string; metadata: unknown }>> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('generated_assets')
    .select('*')
    .eq('episode_id', episodeId);

  if (error) throw new Error(`Failed to fetch assets: ${error.message}`);
  return data || [];
}

/**
 * Get the full episode record with all fields.
 */
export async function getEpisode(episodeId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('episodes')
    .select('*, shows(name)')
    .eq('id', episodeId)
    .single();

  if (error) throw new Error(`Failed to fetch episode: ${error.message}`);
  return data;
}

/**
 * Core asset types to generate during the pipeline test.
 * These are the most important ones that cover all categories.
 */
export const CORE_ASSET_TYPES: AssetType[] = [
  'show_notes',
  'episode_titles',
  'key_takeaways',
  'chapter_markers',
  'blog_post',
  'linkedin_post',
  'twitter_thread',
  'twitter_single',
  'instagram_caption',
  'tiktok_hooks',
  'youtube_description',
  'quote_cards',
  'discussion_questions',
  'guest_bio_short',
  'guest_promo_kit',
  'podcast_teaser',
  'transcript_summary',
  'seo_description',
  'ai_summary_short',
  'ai_summary_detailed',
];

/**
 * All 30+ asset types for exhaustive testing.
 */
export const ALL_ASSET_TYPES: AssetType[] = [
  'show_notes',
  'episode_titles',
  'key_takeaways',
  'chapter_markers',
  'blog_post',
  'newsletter_email',
  'press_release',
  'transcript_summary',
  'seo_description',
  'linkedin_post',
  'linkedin_post_host',
  'linkedin_post_guest',
  'linkedin_article',
  'twitter_thread',
  'twitter_single',
  'instagram_carousel',
  'instagram_caption',
  'instagram_reel_script',
  'tiktok_hooks',
  'tiktok_script',
  'youtube_description',
  'youtube_shorts_script',
  'youtube_title_tags',
  'quote_cards',
  'audiogram_clips',
  'infographic_outline',
  'discussion_questions',
  'poll_ideas',
  'call_to_action',
  'guest_bio_short',
  'guest_promo_kit',
  'podcast_teaser',
  'cross_promo_script',
  'medium_article',
  'substack_post',
  'ai_summary_short',
  'ai_summary_detailed',
  'highlight_reel',
];
