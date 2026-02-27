/**
 * Podcasting 2.0 Tag Generator Tests
 *
 * Tests generatePersonTags, generateSoundbiteTags, generateChaptersJson,
 * generatePodrollItems, VTT generator, RSS snippet compiler, value tag
 * generator & validator, and XML escaping.
 */

import { describe, it, expect } from 'vitest'
import {
  generatePersonTags,
  generateSoundbiteTags,
  generateChaptersJson,
  generatePodrollItems,
} from '@/lib/podcasting2/tag-generators'
import { generateRSSSnippet } from '@/lib/podcasting2/rss-snippet'
import { generateVTT } from '@/lib/podcasting2/vtt-generator'
import { generateValueTag, validateValueTag, VALUE_METHODS, DEFAULT_SUGGESTED_RATE } from '@/lib/podcasting2/value-tag'

// ─── Person Tags ────────────────────────────────────────────────────────────

describe('generatePersonTags', () => {
  it('generates host tag when hostName provided', () => {
    const tags = generatePersonTags({ hostName: 'Jane Host' })
    expect(tags).toHaveLength(1)
    expect(tags[0]).toEqual({
      name: 'Jane Host',
      role: 'host',
      group: 'cast',
    })
  })

  it('generates guest tag when guestName provided', () => {
    const tags = generatePersonTags({ guestName: 'John Guest' })
    expect(tags).toHaveLength(1)
    expect(tags[0]).toEqual({
      name: 'John Guest',
      role: 'guest',
      group: 'cast',
      img: undefined,
      href: undefined,
    })
  })

  it('includes guest image and profile URL when provided', () => {
    const tags = generatePersonTags({
      guestName: 'John Guest',
      guestImageUrl: 'https://example.com/photo.jpg',
      guestProfileUrl: 'https://example.com/john',
    })
    expect(tags[0].img).toBe('https://example.com/photo.jpg')
    expect(tags[0].href).toBe('https://example.com/john')
  })

  it('generates both host and guest tags', () => {
    const tags = generatePersonTags({
      hostName: 'Jane Host',
      guestName: 'John Guest',
    })
    expect(tags).toHaveLength(2)
    expect(tags[0].role).toBe('host')
    expect(tags[1].role).toBe('guest')
  })

  it('returns empty array when no names provided', () => {
    const tags = generatePersonTags({})
    expect(tags).toEqual([])
  })

  it('ignores null values', () => {
    const tags = generatePersonTags({
      hostName: null,
      guestName: null,
    })
    expect(tags).toEqual([])
  })
})

// ─── Soundbite Tags ─────────────────────────────────────────────────────────

describe('generateSoundbiteTags', () => {
  it('generates soundbite tags from viral moments', () => {
    const tags = generateSoundbiteTags([
      { startTime: 120, endTime: 150, quote: 'Great insight!', score: 0.9 },
    ])
    expect(tags).toHaveLength(1)
    expect(tags[0]).toEqual({
      startTime: 120,
      duration: 30,
      title: 'Great insight!',
    })
  })

  it('filters out moments shorter than 15 seconds', () => {
    const tags = generateSoundbiteTags([
      { startTime: 100, endTime: 110, quote: 'Too short', score: 0.9 },
      { startTime: 200, endTime: 220, quote: 'Just right', score: 0.8 },
    ])
    expect(tags).toHaveLength(1)
    expect(tags[0].title).toBe('Just right')
  })

  it('filters out moments longer than 120 seconds', () => {
    const tags = generateSoundbiteTags([
      { startTime: 100, endTime: 250, quote: 'Too long', score: 0.9 },
      { startTime: 300, endTime: 360, quote: 'Good length', score: 0.8 },
    ])
    expect(tags).toHaveLength(1)
    expect(tags[0].title).toBe('Good length')
  })

  it('sorts by score descending', () => {
    const tags = generateSoundbiteTags([
      { startTime: 100, endTime: 130, quote: 'Lower score', score: 0.5 },
      { startTime: 200, endTime: 230, quote: 'Higher score', score: 0.9 },
      { startTime: 300, endTime: 330, quote: 'Mid score', score: 0.7 },
    ])
    expect(tags[0].title).toBe('Higher score')
    expect(tags[1].title).toBe('Mid score')
    expect(tags[2].title).toBe('Lower score')
  })

  it('limits to 5 soundbites', () => {
    const moments = Array.from({ length: 10 }, (_, i) => ({
      startTime: i * 100,
      endTime: i * 100 + 30,
      quote: `Moment ${i}`,
      score: Math.random(),
    }))
    const tags = generateSoundbiteTags(moments)
    expect(tags).toHaveLength(5)
  })

  it('truncates titles to 128 characters', () => {
    const longQuote = 'A'.repeat(200)
    const tags = generateSoundbiteTags([
      { startTime: 0, endTime: 30, quote: longQuote, score: 0.9 },
    ])
    expect(tags[0].title).toHaveLength(128)
  })

  it('handles missing quote gracefully', () => {
    const tags = generateSoundbiteTags([
      { startTime: 0, endTime: 30, score: 0.9 },
    ])
    expect(tags[0].title).toBeUndefined()
  })

  it('returns empty array for empty input', () => {
    expect(generateSoundbiteTags([])).toEqual([])
  })
})

// ─── Chapters JSON ──────────────────────────────────────────────────────────

describe('generateChaptersJson', () => {
  it('generates valid chapters format', () => {
    const result = generateChaptersJson([
      { title: 'Introduction', startTime: 0 },
      { title: 'Main Topic', startTime: 120 },
      { title: 'Wrap Up', startTime: 600 },
    ])
    expect(result.version).toBe('1.2.0')
    expect(result.chapters).toHaveLength(3)
    expect(result.chapters[0]).toEqual({ startTime: 0, title: 'Introduction' })
    expect(result.chapters[1]).toEqual({ startTime: 120, title: 'Main Topic' })
    expect(result.chapters[2]).toEqual({ startTime: 600, title: 'Wrap Up' })
  })

  it('filters out sections without startTime', () => {
    const result = generateChaptersJson([
      { title: 'Has Time', startTime: 0 },
      { title: 'No Time', startTime: null },
      { title: 'Also No Time' },
    ])
    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].title).toBe('Has Time')
  })

  it('truncates titles to 128 characters', () => {
    const longTitle = 'B'.repeat(200)
    const result = generateChaptersJson([
      { title: longTitle, startTime: 0 },
    ])
    expect(result.chapters[0].title).toHaveLength(128)
  })

  it('floors decimal startTime values', () => {
    const result = generateChaptersJson([
      { title: 'Chapter', startTime: 60.7 },
    ])
    expect(result.chapters[0].startTime).toBe(60)
  })

  it('returns empty chapters for empty input', () => {
    const result = generateChaptersJson([])
    expect(result.version).toBe('1.2.0')
    expect(result.chapters).toEqual([])
  })
})

// ─── Podroll Items ──────────────────────────────────────────────────────────

describe('generatePodrollItems', () => {
  it('generates podroll items from appearances', () => {
    const items = generatePodrollItems([
      {
        podcastName: 'Tech Talk',
        podcastRssUrl: 'https://example.com/rss',
        podcastGuid: 'guid-123',
      },
    ])
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual({
      title: 'Tech Talk',
      feedUrl: 'https://example.com/rss',
      feedGuid: 'guid-123',
    })
  })

  it('deduplicates by podcast name (case-insensitive)', () => {
    const items = generatePodrollItems([
      { podcastName: 'Tech Talk' },
      { podcastName: 'tech talk' },
      { podcastName: 'TECH TALK' },
    ])
    expect(items).toHaveLength(1)
  })

  it('limits to 5 items', () => {
    const appearances = Array.from({ length: 10 }, (_, i) => ({
      podcastName: `Podcast ${i}`,
    }))
    const items = generatePodrollItems(appearances)
    expect(items).toHaveLength(5)
  })

  it('skips entries with empty podcast name', () => {
    const items = generatePodrollItems([
      { podcastName: '' },
      { podcastName: 'Valid Podcast' },
    ])
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('Valid Podcast')
  })

  it('handles missing RSS URL and GUID', () => {
    const items = generatePodrollItems([
      { podcastName: 'Just Name' },
    ])
    expect(items[0].feedUrl).toBeUndefined()
    expect(items[0].feedGuid).toBeUndefined()
  })
})

// ─── VTT Generator ──────────────────────────────────────────────────────────

describe('generateVTT', () => {
  it('generates valid WebVTT output', () => {
    const vtt = generateVTT([
      { text: 'Hello, welcome to the show.', start: 0, end: 3000 },
      { text: 'Today we talk about AI.', start: 3000, end: 6500 },
    ])
    expect(vtt).toContain('WEBVTT')
    expect(vtt).toContain('1\n00:00:00.000 --> 00:00:03.000\nHello, welcome to the show.')
    expect(vtt).toContain('2\n00:00:03.000 --> 00:00:06.500\nToday we talk about AI.')
  })

  it('includes speaker voice tags when speaker is provided', () => {
    const vtt = generateVTT([
      { text: 'I am the host.', start: 0, end: 2000, speaker: 'Speaker A' },
      { text: 'I am the guest.', start: 2000, end: 4000, speaker: 'Speaker B' },
    ])
    expect(vtt).toContain('<v Speaker A>I am the host.')
    expect(vtt).toContain('<v Speaker B>I am the guest.')
  })

  it('omits voice tags when speaker is null', () => {
    const vtt = generateVTT([
      { text: 'No speaker.', start: 0, end: 1000, speaker: null },
    ])
    expect(vtt).not.toContain('<v')
    expect(vtt).toContain('No speaker.')
  })

  it('formats hours correctly', () => {
    const vtt = generateVTT([
      { text: 'Way later.', start: 3661000, end: 3665000 }, // 1h 1m 1s
    ])
    expect(vtt).toContain('01:01:01.000 --> 01:01:05.000')
  })

  it('formats milliseconds correctly', () => {
    const vtt = generateVTT([
      { text: 'Precise.', start: 1234, end: 5678 },
    ])
    expect(vtt).toContain('00:00:01.234 --> 00:00:05.678')
  })

  it('handles empty segments array', () => {
    const vtt = generateVTT([])
    expect(vtt).toBe('WEBVTT\n\n')
  })
})

// ─── RSS Snippet Generator ──────────────────────────────────────────────────

describe('generateRSSSnippet', () => {
  it('generates person tags as item-level', () => {
    const result = generateRSSSnippet({
      persons: [
        { name: 'John Doe', role: 'host', group: 'cast' },
      ],
    })
    expect(result.itemTags).toContain('<podcast:person')
    expect(result.itemTags).toContain('role="host"')
    expect(result.itemTags).toContain('group="cast"')
    expect(result.itemTags).toContain('John Doe</podcast:person>')
    expect(result.channelTags).toBe('')
  })

  it('generates funding tag as channel-level', () => {
    const result = generateRSSSnippet({
      funding: { url: 'https://patreon.com/show', message: 'Support us!' },
    })
    expect(result.channelTags).toContain('<podcast:funding')
    expect(result.channelTags).toContain('url="https://patreon.com/show"')
    expect(result.channelTags).toContain('Support us!</podcast:funding>')
    expect(result.itemTags).toBe('')
  })

  it('generates medium tag as channel-level', () => {
    const result = generateRSSSnippet({
      medium: { value: 'podcast' },
    })
    expect(result.channelTags).toContain('<podcast:medium>podcast</podcast:medium>')
  })

  it('generates soundbite tags as item-level', () => {
    const result = generateRSSSnippet({
      soundbites: [
        { startTime: 120, duration: 30, title: 'Key moment' },
      ],
    })
    expect(result.itemTags).toContain('<podcast:soundbite startTime="120" duration="30">Key moment</podcast:soundbite>')
  })

  it('generates chapters tag as item-level', () => {
    const result = generateRSSSnippet({
      chapters: {
        url: 'https://example.com/chapters.json',
        type: 'application/json+chapters',
      },
    })
    expect(result.itemTags).toContain('<podcast:chapters')
    expect(result.itemTags).toContain('url="https://example.com/chapters.json"')
    expect(result.itemTags).toContain('type="application/json+chapters"')
  })

  it('generates transcript tag as item-level', () => {
    const result = generateRSSSnippet({
      transcript: {
        url: 'https://example.com/transcript.vtt',
        type: 'text/vtt',
        language: 'en',
        rel: 'captions',
      },
    })
    expect(result.itemTags).toContain('<podcast:transcript')
    expect(result.itemTags).toContain('url="https://example.com/transcript.vtt"')
    expect(result.itemTags).toContain('type="text/vtt"')
    expect(result.itemTags).toContain('language="en"')
    expect(result.itemTags).toContain('rel="captions"')
  })

  it('generates podroll as channel-level', () => {
    const result = generateRSSSnippet({
      podroll: [
        { title: 'Other Show', feedUrl: 'https://example.com/rss' },
      ],
    })
    expect(result.channelTags).toContain('<podcast:podroll>')
    expect(result.channelTags).toContain('<podcast:remoteItem')
    expect(result.channelTags).toContain('title="Other Show"')
    expect(result.channelTags).toContain('</podcast:podroll>')
  })

  it('generates location tags as item-level', () => {
    const result = generateRSSSnippet({
      locations: [
        { name: 'New York', geo: 'geo:40.7128,-74.0060' },
      ],
    })
    expect(result.itemTags).toContain('<podcast:location')
    expect(result.itemTags).toContain('geo="geo:40.7128,-74.0060"')
    expect(result.itemTags).toContain('New York</podcast:location>')
  })

  it('generates txt tags as channel-level', () => {
    const result = generateRSSSnippet({
      txt: [{ purpose: 'verify', value: 'abc123' }],
    })
    expect(result.channelTags).toContain('<podcast:txt purpose="verify">abc123</podcast:txt>')
  })

  it('escapes XML special characters', () => {
    const result = generateRSSSnippet({
      persons: [
        { name: 'O\'Brien & <Son>', role: 'guest', group: 'cast' },
      ],
    })
    expect(result.itemTags).toContain('O&apos;Brien &amp; &lt;Son&gt;')
  })

  it('combines channel and item tags in fullSnippet', () => {
    const result = generateRSSSnippet({
      medium: { value: 'podcast' },
      persons: [{ name: 'Host', role: 'host', group: 'cast' }],
    })
    expect(result.fullSnippet).toContain('Channel-level tags')
    expect(result.fullSnippet).toContain('Item-level tags')
    expect(result.fullSnippet).toContain('podcast:medium')
    expect(result.fullSnippet).toContain('podcast:person')
  })

  it('returns empty strings when no params provided', () => {
    const result = generateRSSSnippet({})
    expect(result.channelTags).toBe('')
    expect(result.itemTags).toBe('')
  })
})

// ─── Value Tag Generator ────────────────────────────────────────────────────

describe('generateValueTag', () => {
  it('generates valid XML for Lightning keysend', () => {
    const xml = generateValueTag({
      type: 'lightning',
      method: 'keysend',
      suggested: DEFAULT_SUGGESTED_RATE,
      recipients: [
        { name: 'Host', type: 'wallet', address: '03abc...', split: 90 },
        { name: 'App', type: 'wallet', address: '02xyz...', split: 10, fee: true },
      ],
    })
    expect(xml).toContain('<podcast:value type="lightning" method="keysend"')
    expect(xml).toContain(`suggested="${DEFAULT_SUGGESTED_RATE}"`)
    expect(xml).toContain('<podcast:valueRecipient name="Host"')
    expect(xml).toContain('split="90"')
    expect(xml).toContain('<podcast:valueRecipient name="App"')
    expect(xml).toContain('split="10"')
    expect(xml).toContain('fee="true"')
    expect(xml).toContain('</podcast:value>')
  })

  it('omits suggested when not provided', () => {
    const xml = generateValueTag({
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Host', type: 'wallet', address: '03abc...', split: 100 },
      ],
    })
    expect(xml).not.toContain('suggested=')
  })

  it('escapes XML characters in names and addresses', () => {
    const xml = generateValueTag({
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'O\'Brien & Co', type: 'wallet', address: 'addr<>test', split: 100 },
      ],
    })
    expect(xml).toContain('O&apos;Brien &amp; Co')
    expect(xml).toContain('addr&lt;&gt;test')
  })
})

describe('validateValueTag', () => {
  it('validates correct tag configuration', () => {
    const result = validateValueTag({
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Host', type: 'wallet', address: '03abc', split: 90 },
        { name: 'App', type: 'wallet', address: '02xyz', split: 10 },
      ],
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects when splits do not sum to 100', () => {
    const result = validateValueTag({
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Host', type: 'wallet', address: '03abc', split: 50 },
        { name: 'App', type: 'wallet', address: '02xyz', split: 10 },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Recipient splits must sum to 100 (currently 60)')
  })

  it('rejects when no recipients', () => {
    const result = validateValueTag({
      type: 'lightning',
      method: 'keysend',
      recipients: [],
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one recipient is required')
  })

  it('rejects negative split values', () => {
    const result = validateValueTag({
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Host', type: 'wallet', address: '03abc', split: -10 },
        { name: 'App', type: 'wallet', address: '02xyz', split: 110 },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('invalid split'))).toBe(true)
  })

  it('rejects missing wallet address', () => {
    const result = validateValueTag({
      type: 'lightning',
      method: 'keysend',
      recipients: [
        { name: 'Host', type: 'wallet', address: '', split: 100 },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('missing a wallet address'))).toBe(true)
  })

  it('rejects non-keysend method for lightning type', () => {
    const result = validateValueTag({
      type: 'lightning',
      method: 'something-else',
      recipients: [
        { name: 'Host', type: 'wallet', address: '03abc', split: 100 },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('only supports "keysend"'))).toBe(true)
  })
})

describe('VALUE_METHODS constants', () => {
  it('has correct Lightning keysend method', () => {
    expect(VALUE_METHODS.LIGHTNING_KEYSEND).toBe('keysend')
  })

  it('has correct Web Monetization method', () => {
    expect(VALUE_METHODS.WEB_MONETIZATION).toBe('ILP')
  })
})
