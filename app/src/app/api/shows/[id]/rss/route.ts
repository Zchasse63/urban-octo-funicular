import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/auth'
import {
  generatePersonTags,
  generateSoundbiteTags,
  generateChaptersJson,
} from '@/lib/podcasting2/tag-generators'
import { generateRSSSnippet } from '@/lib/podcasting2/rss-snippet'

/**
 * GET /api/shows/[id]/rss?token=<rss_token>
 *
 * Generate a complete RSS 2.0 feed with Podcasting 2.0 namespace tags.
 * This endpoint is publicly accessible (no auth required) — validated by token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!isValidUUID(showId)) {
      return new NextResponse('Invalid show ID', { status: 400 })
    }

    if (!token) {
      return new NextResponse('Missing token parameter', { status: 401 })
    }

    const supabase = await createClient()

    // Fetch the show and validate the RSS token
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single()

    if (showError || !show) {
      return new NextResponse('Show not found', { status: 404 })
    }

    // Validate the RSS token from show style_preferences
    const rssToken = show.style_preferences?.rss_token
    if (!rssToken || rssToken !== token) {
      return new NextResponse('Invalid token', { status: 403 })
    }

    // Fetch all completed episodes for this show
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('show_id', showId)
      .eq('status', 'completed')
      .order('published_at', { ascending: false })

    if (episodesError) {
      return new NextResponse('Failed to fetch episodes', { status: 500 })
    }

    // Fetch episode sections for chapter markers
    const episodeIds = (episodes || []).map((ep) => ep.id)
    let sectionsMap: Record<string, Array<{ title: string; startTime: number | null; content?: string }>> = {}

    if (episodeIds.length > 0) {
      const { data: sections } = await supabase
        .from('episode_sections')
        .select('episode_id, content, start_time, end_time, metadata')
        .in('episode_id', episodeIds)
        .order('start_time', { ascending: true })

      if (sections) {
        for (const section of sections) {
          if (!sectionsMap[section.episode_id]) {
            sectionsMap[section.episode_id] = []
          }
          sectionsMap[section.episode_id].push({
            title: (section.metadata as Record<string, string>)?.title || section.content?.slice(0, 80) || 'Section',
            startTime: section.start_time,
            content: section.content || undefined,
          })
        }
      }
    }

    // Build the RSS XML feed
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getpodbrain.ai'
    const rssXml = buildRSSFeed(show, episodes || [], sectionsMap, baseUrl)

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// ─── RSS Feed Builder ─────────────────────────────────────────────────────────

interface ShowRecord {
  id: string
  name: string
  description: string | null
  artwork_url: string | null
  default_language: string
  style_preferences: Record<string, unknown>
}

interface EpisodeRecord {
  id: string
  title: string | null
  description: string | null
  audio_url: string
  audio_duration_seconds: number | null
  show_notes: string | null
  show_notes_html: string | null
  guest_name: string | null
  guest_bio: string | null
  viral_moments: Array<{
    start_time: number
    end_time: number
    text: string
    score: number
    reason: string
  }> | null
  seo_score: number | null
  published_at: string | null
  created_at: string
  metadata: Record<string, unknown>
}

function buildRSSFeed(
  show: ShowRecord,
  episodes: EpisodeRecord[],
  sectionsMap: Record<string, Array<{ title: string; startTime: number | null; content?: string }>>,
  baseUrl: string
): string {
  const hostName = (show.style_preferences as Record<string, string>)?.host_name || null
  const feedUrl = `${baseUrl}/api/shows/${show.id}/rss`

  // Generate channel-level Podcasting 2.0 tags
  const channelSnippet = generateRSSSnippet({
    medium: { value: 'podcast' },
    funding: (show.style_preferences as Record<string, string>)?.funding_url
      ? {
          url: (show.style_preferences as Record<string, string>).funding_url,
          message: (show.style_preferences as Record<string, string>).funding_message || 'Support the show',
        }
      : undefined,
  })

  const items = episodes.map((ep) => buildItemXml(ep, sectionsMap[ep.id] || [], hostName, baseUrl))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(show.name)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(show.description || '')}</description>
    <language>${escapeXml(show.default_language || 'en')}</language>
    <generator>PodBrain AI Studio</generator>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${show.artwork_url ? `    <itunes:image href="${escapeXml(show.artwork_url)}" />
    <image>
      <url>${escapeXml(show.artwork_url)}</url>
      <title>${escapeXml(show.name)}</title>
      <link>${escapeXml(baseUrl)}</link>
    </image>` : ''}
${channelSnippet.channelTags ? channelSnippet.channelTags.split('\n').map((line) => `    ${line}`).join('\n') : ''}
${items.join('\n')}
  </channel>
</rss>`

  return xml
}

function buildItemXml(
  episode: EpisodeRecord,
  sections: Array<{ title: string; startTime: number | null; content?: string }>,
  hostName: string | null,
  baseUrl: string
): string {
  const pubDate = episode.published_at
    ? new Date(episode.published_at).toUTCString()
    : new Date(episode.created_at).toUTCString()

  const guid = episode.id
  const description = episode.show_notes || episode.description || ''

  // Generate Podcasting 2.0 item-level tags
  const personTags = generatePersonTags({
    guestName: episode.guest_name,
    hostName,
  })

  const soundbiteTags = episode.viral_moments
    ? generateSoundbiteTags(
        episode.viral_moments.map((vm) => ({
          startTime: vm.start_time,
          endTime: vm.end_time,
          quote: vm.text,
          score: vm.score,
        }))
      )
    : []

  // Generate chapters if sections exist with timestamps
  const chaptersJson = sections.length > 0 ? generateChaptersJson(sections) : null
  const chaptersUrl = chaptersJson
    ? `${baseUrl}/api/episodes/${episode.id}/chapters.json`
    : null

  const itemSnippet = generateRSSSnippet({
    persons: personTags.length > 0 ? personTags : undefined,
    soundbites: soundbiteTags.length > 0 ? soundbiteTags : undefined,
    chapters: chaptersUrl
      ? { url: chaptersUrl, type: 'application/json+chapters' }
      : undefined,
  })

  const durationSeconds = episode.audio_duration_seconds || 0
  const hours = Math.floor(durationSeconds / 3600)
  const minutes = Math.floor((durationSeconds % 3600) / 60)
  const seconds = Math.floor(durationSeconds % 60)
  const duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return `    <item>
      <title>${escapeXml(episode.title || 'Untitled Episode')}</title>
      <description><![CDATA[${description}]]></description>
${episode.show_notes_html ? `      <content:encoded><![CDATA[${episode.show_notes_html}]]></content:encoded>` : ''}
      <enclosure url="${escapeXml(episode.audio_url)}" type="audio/mpeg" />
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <itunes:duration>${duration}</itunes:duration>
${episode.description ? `      <itunes:summary>${escapeXml(episode.description)}</itunes:summary>` : ''}
${episode.guest_name ? `      <itunes:author>${escapeXml(episode.guest_name)}</itunes:author>` : ''}
${itemSnippet.itemTags ? itemSnippet.itemTags.split('\n').map((line) => `      ${line}`).join('\n') : ''}
    </item>`
}

// ─── XML Escape Utility ──────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
