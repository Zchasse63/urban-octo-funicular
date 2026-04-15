/**
 * BUG #11 regression test — Show Notes timestamps were rendered as broken
 * markdown link syntax `[0:53](53)` and `[2:10](130)` because Grok was
 * pre-rendering them inside `show_notes_markdown`.
 *
 * The fix lives in `app/src/trigger/jobs/generate-show-notes.ts` — three
 * pure helpers strip Grok's broken section and replace it with a clean
 * server-rendered version built from the structured `timestamps` array.
 *
 * The audit doc for the bug is at:
 *   specs/bugs/episode-detail-bugs.md  (lines 12-113)
 */

import { describe, it, expect } from 'vitest'
import {
  _stripTimestampsSection,
  _renderTimestampsMarkdown,
  _formatSecondsToTime,
} from '@/trigger/jobs/generate-show-notes'

describe('BUG #11 — show notes timestamp helpers', () => {
  describe('_formatSecondsToTime', () => {
    it('formats 0 seconds as 0:00', () => {
      expect(_formatSecondsToTime(0)).toBe('0:00')
    })

    it('formats sub-minute seconds with a leading 0:', () => {
      expect(_formatSecondsToTime(53)).toBe('0:53')
    })

    it('formats minutes-only times', () => {
      expect(_formatSecondsToTime(312)).toBe('5:12')
    })

    it('formats hour-spanning times with H:MM:SS', () => {
      expect(_formatSecondsToTime(3725)).toBe('1:02:05')
    })

    it('handles negative input by clamping to 0', () => {
      expect(_formatSecondsToTime(-10)).toBe('0:00')
    })

    it('truncates fractional seconds', () => {
      expect(_formatSecondsToTime(312.9)).toBe('5:12')
    })
  })

  describe('_stripTimestampsSection', () => {
    it('removes a "## Timestamps" section', () => {
      const input = `## Summary\nGreat episode.\n\n## Timestamps\n- [0:53](53) Intro\n- [2:10](130) Main\n\n## Resources\n- Book A`
      const result = _stripTimestampsSection(input)
      expect(result).toContain('## Summary')
      expect(result).toContain('## Resources')
      expect(result).not.toContain('Timestamps')
      expect(result).not.toContain('[0:53]')
    })

    it('removes a "## TIMESTAMPS" all-caps section', () => {
      const input = `## TIMESTAMPS\n- [0:53](53) Intro\n\n## Resources\n- Link A`
      const result = _stripTimestampsSection(input)
      expect(result).not.toContain('TIMESTAMPS')
      expect(result).not.toContain('[0:53]')
      expect(result).toContain('## Resources')
    })

    it('removes a "## Chapter Markers" section variant', () => {
      const input = `## Chapter Markers\n- [0:53](53) Intro\n\n## Resources\n- Link`
      const result = _stripTimestampsSection(input)
      expect(result).not.toContain('Chapter Markers')
      expect(result).toContain('## Resources')
    })

    it('removes inline broken [MM:SS](N) lines as a backstop', () => {
      const input = `Some intro paragraph.\n[0:53](53) Stray timestamp\n- [2:10](130) Another stray\nMore content.`
      const result = _stripTimestampsSection(input)
      expect(result).toContain('Some intro paragraph')
      expect(result).toContain('More content')
      expect(result).not.toContain('[0:53]')
      expect(result).not.toContain('[2:10]')
    })

    it('removes [H:MM:SS](N) hour-format broken lines', () => {
      const input = `Intro.\n[1:23:45](5025) Long episode timestamp\nOutro.`
      const result = _stripTimestampsSection(input)
      expect(result).not.toContain('[1:23:45]')
    })

    it('returns the markdown unchanged when no timestamps section exists', () => {
      const input = `## Summary\nGreat episode.\n\n## Resources\n- Book A`
      const result = _stripTimestampsSection(input)
      expect(result).toContain('## Summary')
      expect(result).toContain('## Resources')
      expect(result).toContain('Great episode')
    })

    it('collapses 3+ consecutive blank lines left by a removal', () => {
      const input = `## Summary\nGreat.\n\n## Timestamps\n- [0:53](53) Intro\n\n\n## Resources\n- Link`
      const result = _stripTimestampsSection(input)
      // Result should not have triple-newlines anywhere
      expect(result).not.toMatch(/\n{3,}/)
    })

    it('removes a Timestamps section sitting at the very end of the document', () => {
      // Regression for code-reviewer finding: the previous version used `\z`
      // as the end-of-string anchor, which is invalid in JavaScript regex
      // and only matched the literal character `z`. As a result, a Timestamps
      // section at the end of the document with no following heading was
      // never stripped.
      const input = `## Summary\nGreat episode.\n\n## Timestamps\n- [0:53](53) Intro\n- [2:10](130) Main`
      const result = _stripTimestampsSection(input)
      expect(result).toContain('## Summary')
      expect(result).toContain('Great episode')
      expect(result).not.toContain('Timestamps')
      expect(result).not.toContain('[0:53]')
      expect(result).not.toContain('[2:10]')
    })
  })

  describe('_renderTimestampsMarkdown', () => {
    it('returns an empty string when there are no timestamps', () => {
      expect(_renderTimestampsMarkdown([])).toBe('')
    })

    it('renders a clean ## Timestamps section with bold time labels', () => {
      const input = [
        { time: '0:53', time_seconds: 53, topic: 'Introduction' },
        { time: '5:12', time_seconds: 312, topic: 'Main discussion' },
      ]
      const result = _renderTimestampsMarkdown(input)
      expect(result).toContain('## Timestamps')
      expect(result).toContain('- **0:53** — Introduction')
      expect(result).toContain('- **5:12** — Main discussion')
    })

    it('falls back to time_seconds when time string is malformed', () => {
      const input = [{ time: 'oops', time_seconds: 312, topic: 'Topic' }]
      const result = _renderTimestampsMarkdown(input)
      expect(result).toContain('- **5:12** — Topic')
    })

    it('accepts H:MM:SS time strings as-is', () => {
      const input = [{ time: '1:23:45', time_seconds: 5025, topic: 'Long ep' }]
      const result = _renderTimestampsMarkdown(input)
      expect(result).toContain('- **1:23:45** — Long ep')
    })

    it('skips entries with empty topic or empty time', () => {
      const input = [
        { time: '', time_seconds: 0, topic: 'No time' },
        { time: '5:00', time_seconds: 300, topic: '' },
        { time: '6:00', time_seconds: 360, topic: 'Valid' },
      ]
      const result = _renderTimestampsMarkdown(input)
      expect(result).toContain('## Timestamps')
      expect(result).toContain('Valid')
      expect(result).not.toContain('No time')
    })

    it('returns empty string when every entry is filtered out', () => {
      const input = [{ time: '', time_seconds: 0, topic: '' }]
      const result = _renderTimestampsMarkdown(input)
      expect(result).toBe('')
    })

    it('does NOT contain the broken markdown link syntax that BUG #11 reported', () => {
      const input = [
        { time: '0:53', time_seconds: 53, topic: 'Intro' },
        { time: '2:10', time_seconds: 130, topic: 'KKR buyout' },
      ]
      const result = _renderTimestampsMarkdown(input)
      // The original bug rendered `[0:53](0:53)` and `[2:10](130)` — make
      // sure the new rendering produces neither pattern.
      expect(result).not.toMatch(/\[\d+:\d+\]\(/)
    })
  })

  describe('end-to-end strip + render flow', () => {
    it('produces clean markdown with bold timestamps from a broken Grok response', () => {
      const grokMarkdown = `## Summary\nThis episode covers the KKR private-equity buyout of Capital Safety.\n\n## Key Topics\n- Private equity\n- Worker ownership\n\n## Timestamps\n[0:53](0:53) Introduction to Cindy Cordes at Capital Safety\n[2:10](130) Workers' fears over KKR private equity buyout\n[3:50](230) Pete Stavros' backstory\n\n## Resources\n- Planet Money episode page`

      const grokTimestamps = [
        { time: '0:53', time_seconds: 53, topic: 'Introduction to Cindy Cordes at Capital Safety' },
        { time: '2:10', time_seconds: 130, topic: 'Workers fears over KKR private equity buyout' },
        { time: '3:50', time_seconds: 230, topic: 'Pete Stavros backstory' },
      ]

      const stripped = _stripTimestampsSection(grokMarkdown)
      const block = _renderTimestampsMarkdown(grokTimestamps)
      const final = `${stripped}\n\n${block}`

      // Original sections preserved
      expect(final).toContain('## Summary')
      expect(final).toContain('## Key Topics')
      expect(final).toContain('## Resources')

      // Broken timestamp link syntax fully gone
      expect(final).not.toMatch(/\[\d+:\d+\]\(\d+\)/)

      // New clean timestamps present
      expect(final).toContain('## Timestamps')
      expect(final).toContain('- **0:53** — Introduction to Cindy Cordes at Capital Safety')
      expect(final).toContain('- **2:10** — Workers fears over KKR private equity buyout')
      expect(final).toContain('- **3:50** — Pete Stavros backstory')

      // Should be exactly one Timestamps section, not two
      const timestampsHeaderCount = (final.match(/## Timestamps/g) || []).length
      expect(timestampsHeaderCount).toBe(1)
    })
  })
})
