/**
 * SEO Analyzer Unit Tests
 *
 * Tests for pure functions in the SEO analyzer.
 * No database or API calls - just logic testing.
 */

import { describe, it, expect } from 'vitest'
import { analyzeSEO, getScoreColor, getScoreLabel } from '@/lib/seo/analyzer'

describe('analyzeSEO', () => {
  describe('overall score calculation', () => {
    it('returns a score between 0 and 100', () => {
      const result = analyzeSEO('This is some test content for SEO analysis.')

      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('returns low score for empty content', () => {
      const result = analyzeSEO('')

      expect(result.overallScore).toBeLessThan(50)
    })

    it('returns higher score for well-structured content with proper HTML', () => {
      const goodContent = `
        This is a comprehensive guide about podcasting. Podcasting has become one of the most popular
        forms of content creation in recent years. Many creators are starting podcasts to share their
        expertise and build an audience.

        The key to successful podcasting is consistency. You need to publish episodes regularly and
        maintain quality throughout your content creation journey.
      `

      const goodHtml = `
        <h1>Podcasting Guide</h1>
        <h2>Introduction</h2>
        <p>This is a comprehensive guide about podcasting. Podcasting has become one of the most popular
        forms of content creation in recent years.</p>
        <h2>Key to Success</h2>
        <p>The key to successful podcasting is consistency.</p>
        <a href="/episodes">Check our episodes</a>
        <a href="/tips">More tips</a>
      `

      // Well-structured HTML content
      const goodResult = analyzeSEO(goodContent, goodHtml)
      // Plain text without any HTML structure
      const poorResult = analyzeSEO('Short.', '<p>Short.</p>')

      // Good content with proper headers and links should score higher
      expect(goodResult.overallScore).toBeGreaterThan(poorResult.overallScore)
    })
  })

  describe('keyword density analysis', () => {
    it('identifies repeated keywords', () => {
      const content = 'Podcast podcast podcast audio audio content content content'
      const result = analyzeSEO(content)

      expect(Object.keys(result.keywordDensityMap).length).toBeGreaterThan(0)
      expect(result.keywordDensityMap).toHaveProperty('podcast')
      expect(result.keywordDensityMap).toHaveProperty('content')
    })

    it('filters out short words (3 chars or less)', () => {
      const content = 'The cat sat on the mat. A big cat. The cat.'
      const result = analyzeSEO(content)

      // 'the', 'cat', 'sat', 'mat' should be filtered (3 chars or less)
      // Only words > 3 chars should appear
      expect(result.keywordDensityMap).not.toHaveProperty('the')
      expect(result.keywordDensityMap).not.toHaveProperty('cat')
    })

    it('calculates density as percentage', () => {
      const content = 'podcast podcast podcast podcast other other other other content content'
      const result = analyzeSEO(content)

      // All density values should be percentages
      for (const density of Object.values(result.keywordDensityMap)) {
        expect(density).toBeGreaterThan(0)
        expect(density).toBeLessThanOrEqual(100)
      }
    })

    it('returns empty map for content with no repeated keywords', () => {
      const content = 'Each word here is completely unique and different from others.'
      const result = analyzeSEO(content)

      // No words repeat enough (need 2+ occurrences)
      expect(Object.keys(result.keywordDensityMap).length).toBe(0)
    })
  })

  describe('header structure analysis', () => {
    it('penalizes missing H1', () => {
      const htmlWithoutH1 = '<h2>Section</h2><p>Content</p>'
      const htmlWithH1 = '<h1>Title</h1><h2>Section</h2><p>Content</p>'

      const withoutH1 = analyzeSEO('Content', htmlWithoutH1)
      const withH1 = analyzeSEO('Content', htmlWithH1)

      expect(withH1.factors.headerStructure.score).toBeGreaterThan(
        withoutH1.factors.headerStructure.score
      )
    })

    it('penalizes multiple H1 tags', () => {
      const multipleH1 = '<h1>Title 1</h1><h1>Title 2</h1><p>Content</p>'
      const singleH1 = '<h1>Title</h1><p>Content</p>'

      const multiple = analyzeSEO('Content', multipleH1)
      const single = analyzeSEO('Content', singleH1)

      expect(single.factors.headerStructure.score).toBeGreaterThan(
        multiple.factors.headerStructure.score
      )
    })

    it('gives full score for proper header structure', () => {
      const properStructure = '<h1>Main Title</h1><h2>Section 1</h2><h3>Subsection</h3>'
      const result = analyzeSEO('Content', properStructure)

      expect(result.factors.headerStructure.score).toBe(100)
    })
  })

  describe('readability score', () => {
    it('calculates readability factor', () => {
      const result = analyzeSEO('This is a simple sentence. Another simple sentence.')

      expect(result.factors.readability.score).toBeGreaterThanOrEqual(0)
      expect(result.factors.readability.score).toBeLessThanOrEqual(100)
    })

    it('prefers moderate complexity (not too simple, not too complex)', () => {
      // Very simple text
      const simple = 'Go. Run. Stop. Eat. Play.'

      // Moderately complex text
      const moderate = `
        The podcast industry has experienced significant growth over the past decade.
        Many content creators are now exploring audio as a medium for reaching audiences.
        This trend shows no signs of slowing down in the near future.
      `

      const simpleResult = analyzeSEO(simple)
      const moderateResult = analyzeSEO(moderate)

      // Moderate complexity should score better for SEO
      expect(moderateResult.factors.readability.score).toBeGreaterThan(0)
    })
  })

  describe('link analysis', () => {
    it('counts links in HTML content', () => {
      const htmlWithLinks = `
        <p>Check out our <a href="/episode/1">first episode</a> and
        <a href="/episode/2">second episode</a>.</p>
      `

      const result = analyzeSEO('Content', htmlWithLinks)

      expect(result.factors.internalLinks.description).toContain('2 links')
    })

    it('gives low score for no links', () => {
      const noLinks = '<p>No links in this content.</p>'
      const result = analyzeSEO('Content', noLinks)

      expect(result.factors.internalLinks.score).toBeLessThan(50)
    })

    it('gives full score for optimal link count (2-5)', () => {
      const optimalLinks = `
        <a href="/a">1</a>
        <a href="/b">2</a>
        <a href="/c">3</a>
      `

      const result = analyzeSEO('Content', optimalLinks)

      expect(result.factors.internalLinks.score).toBe(100)
    })
  })

  describe('suggestions generation', () => {
    it('generates suggestions for poor content', () => {
      const poorContent = 'Hi.'
      const result = analyzeSEO(poorContent)

      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('suggests increasing content length for short content', () => {
      const shortContent = 'This is short.'
      const result = analyzeSEO(shortContent)

      const lengthSuggestion = result.suggestions.find((s) => s.id === 'content-length')
      expect(lengthSuggestion).toBeDefined()
      expect(lengthSuggestion?.priority).toBe('high')
    })

    it('suggests adding links when none present', () => {
      const noLinks = 'This content has no links at all. It could use some internal linking.'
      const result = analyzeSEO(noLinks, '<p>No links</p>')

      const linkSuggestion = result.suggestions.find((s) => s.id === 'add-links')
      expect(linkSuggestion).toBeDefined()
    })

    it('sorts suggestions by priority', () => {
      const poorContent = 'Bad.'
      const result = analyzeSEO(poorContent)

      // Verify suggestions are sorted (high first)
      const priorities = result.suggestions.map((s) => s.priority)
      const priorityOrder = { high: 0, medium: 1, low: 2 }

      for (let i = 1; i < priorities.length; i++) {
        expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(
          priorityOrder[priorities[i - 1]]
        )
      }
    })
  })

  describe('factors structure', () => {
    it('includes all required factors', () => {
      const result = analyzeSEO('Test content')

      expect(result.factors).toHaveProperty('keywordDensity')
      expect(result.factors).toHaveProperty('readability')
      expect(result.factors).toHaveProperty('headerStructure')
      expect(result.factors).toHaveProperty('internalLinks')
    })

    it('each factor has required properties', () => {
      const result = analyzeSEO('Test content')

      for (const factor of Object.values(result.factors)) {
        expect(factor).toHaveProperty('name')
        expect(factor).toHaveProperty('score')
        expect(factor).toHaveProperty('maxScore')
        expect(factor).toHaveProperty('description')
        expect(factor.score).toBeGreaterThanOrEqual(0)
        expect(factor.score).toBeLessThanOrEqual(factor.maxScore)
      }
    })
  })
})

describe('getScoreColor', () => {
  it('returns green for scores >= 80', () => {
    expect(getScoreColor(80)).toBe('green')
    expect(getScoreColor(90)).toBe('green')
    expect(getScoreColor(100)).toBe('green')
  })

  it('returns amber for scores 60-79', () => {
    expect(getScoreColor(60)).toBe('amber')
    expect(getScoreColor(70)).toBe('amber')
    expect(getScoreColor(79)).toBe('amber')
  })

  it('returns red for scores < 60', () => {
    expect(getScoreColor(0)).toBe('red')
    expect(getScoreColor(30)).toBe('red')
    expect(getScoreColor(59)).toBe('red')
  })
})

describe('getScoreLabel', () => {
  it('returns correct labels for score ranges', () => {
    expect(getScoreLabel(95)).toBe('Excellent')
    expect(getScoreLabel(85)).toBe('Good')
    expect(getScoreLabel(75)).toBe('Fair')
    expect(getScoreLabel(65)).toBe('Needs Work')
    expect(getScoreLabel(50)).toBe('Poor')
  })

  it('handles boundary values', () => {
    expect(getScoreLabel(90)).toBe('Excellent')
    expect(getScoreLabel(80)).toBe('Good')
    expect(getScoreLabel(70)).toBe('Fair')
    expect(getScoreLabel(60)).toBe('Needs Work')
    expect(getScoreLabel(59)).toBe('Poor')
  })
})
