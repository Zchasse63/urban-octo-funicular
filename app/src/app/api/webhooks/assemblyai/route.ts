import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * AssemblyAI Webhook Handler
 *
 * Receives transcription completion callbacks from AssemblyAI.
 * In production, AssemblyAI calls this endpoint when a transcript is ready,
 * eliminating the need to poll for completion (which can time out on long podcasts).
 *
 * Security: Authenticated via ASSEMBLYAI_WEBHOOK_SECRET passed as a
 * query parameter in the callback URL registered with AssemblyAI.
 * AssemblyAI does not natively support HMAC signatures, so token-based
 * auth in the URL is the standard approach.
 *
 * Flow:
 * 1. AssemblyAI POSTs a notification with { transcript_id, status }
 * 2. We verify the webhook token in the URL query parameter
 * 3. We fetch the full transcript from the AssemblyAI API
 * 4. We store the transcript on the episode record
 * 5. We trigger the remaining processing pipeline via Trigger.dev
 */
export async function POST(request: NextRequest) {
  try {
    // ── Authenticate webhook request ──
    // The webhook URL registered with AssemblyAI includes a ?token=<secret>
    // query parameter. We verify it here to prevent unauthorized POSTs.
    const webhookSecret = process.env.ASSEMBLYAI_WEBHOOK_SECRET
    if (webhookSecret) {
      const url = new URL(request.url)
      const token = url.searchParams.get('token')
      if (
        !token ||
        !crypto.timingSafeEqual(
          Buffer.from(token),
          Buffer.from(webhookSecret)
        )
      ) {
        console.error('AssemblyAI webhook: invalid or missing authentication token')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      console.warn(
        'ASSEMBLYAI_WEBHOOK_SECRET not set — webhook endpoint is unauthenticated. ' +
        'Set this variable in production to prevent unauthorized access.'
      )
    }

    const body = await request.json()

    const transcriptId = body.transcript_id
    const status = body.status

    if (!transcriptId) {
      return NextResponse.json({ error: 'Missing transcript_id' }, { status: 400 })
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY
    if (!apiKey) {
      console.error('ASSEMBLYAI_API_KEY not configured for webhook handler')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Fetch the full transcript from AssemblyAI
    const response = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: {
          'Authorization': apiKey,
        },
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch transcript from AssemblyAI:', response.status)
      return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 })
    }

    const transcript = await response.json()

    // Find the episode that has this transcript ID stored in its metadata
    const supabase = createAdminClient()
    const { data: episode, error: lookupError } = await supabase
      .from('episodes')
      .select('id, show_id, metadata, guest_name, guest_bio')
      .eq('status', 'processing')
      .contains('metadata', { assemblyai_transcript_id: transcriptId })
      .single()

    if (lookupError || !episode) {
      console.error('No processing episode found for transcript:', transcriptId, lookupError?.message)
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
    }

    const existingMetadata = (episode.metadata as Record<string, unknown>) || {}

    // Handle transcription errors
    if (status === 'error' || transcript.status === 'error') {
      await supabase
        .from('episodes')
        .update({
          status: 'failed',
          metadata: {
            ...existingMetadata,
            processing_step: 'transcription_failed',
            processing_progress: 0,
            error_message: transcript.error || 'Transcription failed',
            webhook_received_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', episode.id)

      return NextResponse.json({ received: true })
    }

    // Build transcript text and segments from AssemblyAI response
    const transcriptText = transcript.text || ''
    const segments = (transcript.utterances || []).map(
      (u: { speaker: string; text: string; start: number; end: number; confidence: number }) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start, // Keep in ms to match existing segment format
        end: u.end,
        confidence: u.confidence,
      })
    )

    const speakerCount = new Set(segments.map((s: { speaker: string }) => s.speaker)).size

    // Store transcript on the episode record
    const { error: transcriptWriteError } = await supabase
      .from('episodes')
      .update({
        transcript: transcriptText,
        transcript_segments: segments,
        audio_duration_seconds: Math.ceil(transcript.audio_duration || 0),
        metadata: {
          ...existingMetadata,
          processing_step: 'transcription_complete',
          processing_progress: 40,
          transcription_completed_at: new Date().toISOString(),
          word_count: transcript.words?.length || 0,
          speaker_count: speakerCount,
          confidence: transcript.confidence || 0,
          webhook_received_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', episode.id)

    if (transcriptWriteError) {
      console.error(
        'Failed to write transcript to episode:',
        transcriptWriteError.message,
        { episodeId: episode.id, transcriptId }
      )
      // Mark episode as failed so user knows something went wrong
      await supabase
        .from('episodes')
        .update({
          status: 'failed',
          metadata: {
            ...existingMetadata,
            processing_step: 'transcript_write_failed',
            error_message: `Failed to store transcript: ${transcriptWriteError.message}`,
            webhook_received_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', episode.id)

      return NextResponse.json({ error: 'Failed to store transcript' }, { status: 500 })
    }

    // Trigger the remaining processing pipeline (vocabulary -> show notes -> SEO -> assets)
    // Uses dynamic import to avoid circular dependency issues in the webhook context
    const { triggerPostTranscriptionPipeline } = await import('@/lib/trigger/client')
    await triggerPostTranscriptionPipeline({
      episodeId: episode.id,
      showId: episode.show_id,
      transcript: transcriptText,
      segments,
      guestName: episode.guest_name || undefined,
      guestBio: episode.guest_bio || undefined,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('AssemblyAI webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
