// SEO Analysis Utilities for PodBrain
// Analyzes show notes for SEO score and provides suggestions

export interface SEOFactor {
  name: string
  score: number
  maxScore: number
  description: string
}

export interface SEOSuggestion {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  autoFixable: boolean
  fixAction?: () => string
}

export interface SEOAnalysisResult {
  overallScore: number
  factors: {
    keywordDensity: SEOFactor
    readability: SEOFactor
    headerStructure: SEOFactor
    internalLinks: SEOFactor
  }
  suggestions: SEOSuggestion[]
  keywordDensityMap: Record<string, number>
}

/**
 * Calculate Flesch-Kincaid Reading Ease score (approximation)
 * Higher scores = easier to read
 * 90-100: Very easy
 * 80-89: Easy
 * 70-79: Fairly easy
 * 60-69: Standard
 * 50-59: Fairly difficult
 * 30-49: Difficult
 * 0-29: Very confusing
 */
function calculateFleschKincaid(text: string): number {
  if (!text || text.trim().length === 0) return 0

  // Count sentences (roughly by punctuation)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = Math.max(sentences.length, 1)

  // Count words
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const wordCount = Math.max(words.length, 1)

  // Count syllables (simple approximation: count vowel groups)
  const syllableCount = words.reduce((count, word) => {
    const syllables = word.toLowerCase().replace(/[^a-z]/g, '')
      .replace(/[aeiou]+/g, 'a')
      .replace(/[^a]/g, '').length
    return count + Math.max(syllables, 1)
  }, 0)

  // Flesch-Kincaid formula
  const avgWordsPerSentence = wordCount / sentenceCount
  const avgSyllablesPerWord = syllableCount / wordCount

  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Analyze keyword density in the text
 */
function analyzeKeywordDensity(text: string): Record<string, number> {
  if (!text) return {}

  // Clean and tokenize
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3) // Filter short words

  const wordCount = words.length
  if (wordCount === 0) return {}

  // Count occurrences
  const counts: Record<string, number> = {}
  words.forEach(word => {
    counts[word] = (counts[word] || 0) + 1
  })

  // Calculate density (percentage)
  const density: Record<string, number> = {}
  Object.entries(counts)
    .filter(([, count]) => count >= 2) // Only words appearing 2+ times
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) // Top 20 keywords
    .forEach(([word, count]) => {
      density[word] = Number(((count / wordCount) * 100).toFixed(2))
    })

  return density
}

/**
 * Check header structure in HTML content
 */
function analyzeHeaderStructure(html: string): { valid: boolean; issues: string[] } {
  if (!html) return { valid: false, issues: ['No content provided'] }

  const issues: string[] = []

  // Check for H1
  const h1Matches = html.match(/<h1[^>]*>/gi) || []
  if (h1Matches.length === 0) {
    issues.push('Missing H1 heading - add a main title')
  } else if (h1Matches.length > 1) {
    issues.push('Multiple H1 headings found - use only one H1 per page')
  }

  // Check for H2s
  const h2Matches = html.match(/<h2[^>]*>/gi) || []
  if (h2Matches.length === 0) {
    issues.push('No H2 subheadings - break content into sections')
  }

  // Check for proper nesting (H3 should follow H2)
  const headerOrder = html.match(/<h[1-6][^>]*>/gi) || []
  let lastLevel = 0
  for (const header of headerOrder) {
    const level = parseInt(header.match(/<h([1-6])/i)?.[1] || '0')
    if (level > lastLevel + 1 && lastLevel !== 0) {
      issues.push(`Skipped heading level: H${lastLevel} to H${level}`)
      break
    }
    lastLevel = level
  }

  return { valid: issues.length === 0, issues }
}

/**
 * Count internal links in HTML content
 */
function countInternalLinks(html: string): number {
  if (!html) return 0

  // Match anchor tags with href
  const linkMatches = html.match(/<a[^>]+href=[^>]+>/gi) || []
  return linkMatches.length
}

/**
 * Calculate optimal keyword density score
 * Ideal: 1-3% for primary keywords
 */
function calculateKeywordDensityScore(density: Record<string, number>): number {
  const values = Object.values(density)
  if (values.length === 0) return 30 // Low score for no keywords

  // Check if any keywords are in the optimal range (1-3%)
  const optimalKeywords = values.filter(d => d >= 1 && d <= 3).length
  const overOptimized = values.filter(d => d > 5).length

  let score = 50 // Base score
  score += optimalKeywords * 10 // Bonus for optimal keywords
  score -= overOptimized * 15 // Penalty for keyword stuffing

  return Math.max(0, Math.min(100, score))
}

/**
 * Main SEO analysis function
 */
export function analyzeSEO(content: string, htmlContent?: string): SEOAnalysisResult {
  const text = content || ''
  const html = htmlContent || content || ''

  // Calculate individual factors
  const keywordDensityMap = analyzeKeywordDensity(text)
  const keywordScore = calculateKeywordDensityScore(keywordDensityMap)

  const readabilityRaw = calculateFleschKincaid(text)
  // Convert to 0-100 where higher = better for SEO (target 60-70 readability)
  const readabilityScore = readabilityRaw >= 60 && readabilityRaw <= 80
    ? 100
    : readabilityRaw > 80
      ? Math.max(60, 100 - (readabilityRaw - 80) * 2)
      : Math.max(0, readabilityRaw * 1.5)

  const headerAnalysis = analyzeHeaderStructure(html)
  const headerScore = headerAnalysis.valid ? 100 : Math.max(0, 100 - headerAnalysis.issues.length * 25)

  const linkCount = countInternalLinks(html)
  // Score based on link count (2-5 links is ideal)
  const linkScore = linkCount === 0
    ? 30
    : linkCount >= 2 && linkCount <= 5
      ? 100
      : linkCount < 2
        ? 60
        : Math.max(50, 100 - (linkCount - 5) * 5)

  // Build factors
  const factors = {
    keywordDensity: {
      name: 'Keyword Density',
      score: keywordScore,
      maxScore: 100,
      description: 'Optimal keyword usage without stuffing'
    },
    readability: {
      name: 'Readability',
      score: Math.round(readabilityScore),
      maxScore: 100,
      description: `Flesch-Kincaid score: ${readabilityRaw}`
    },
    headerStructure: {
      name: 'Header Structure',
      score: headerScore,
      maxScore: 100,
      description: headerAnalysis.valid ? 'Well-structured headers' : headerAnalysis.issues.join('; ')
    },
    internalLinks: {
      name: 'Internal Links',
      score: linkScore,
      maxScore: 100,
      description: `${linkCount} links found`
    }
  }

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (factors.keywordDensity.score * 0.3) +
    (factors.readability.score * 0.25) +
    (factors.headerStructure.score * 0.25) +
    (factors.internalLinks.score * 0.2)
  )

  // Generate suggestions
  const suggestions: SEOSuggestion[] = []

  if (keywordScore < 60) {
    suggestions.push({
      id: 'keyword-optimization',
      priority: 'high',
      title: 'Optimize keyword usage',
      description: 'Ensure your main keywords appear 2-3 times naturally throughout the content.',
      autoFixable: false
    })
  }

  if (Object.values(keywordDensityMap).some(d => d > 5)) {
    suggestions.push({
      id: 'keyword-stuffing',
      priority: 'high',
      title: 'Reduce keyword repetition',
      description: 'Some keywords appear too frequently. Aim for 1-3% density to avoid keyword stuffing penalties.',
      autoFixable: false
    })
  }

  if (readabilityRaw < 50) {
    suggestions.push({
      id: 'improve-readability',
      priority: 'high',
      title: 'Improve readability',
      description: 'Use shorter sentences and simpler words to make content easier to read.',
      autoFixable: false
    })
  }

  if (readabilityRaw > 85) {
    suggestions.push({
      id: 'content-depth',
      priority: 'low',
      title: 'Add more depth',
      description: 'Content may be too simplistic. Consider adding more detailed explanations.',
      autoFixable: false
    })
  }

  headerAnalysis.issues.forEach((issue, index) => {
    suggestions.push({
      id: `header-issue-${index}`,
      priority: index === 0 ? 'high' : 'medium',
      title: 'Fix header structure',
      description: issue,
      autoFixable: issue.includes('Missing H1'),
      fixAction: issue.includes('Missing H1')
        ? () => '<h1>Episode Title</h1>\n' + html
        : undefined
    })
  })

  if (linkCount === 0) {
    suggestions.push({
      id: 'add-links',
      priority: 'medium',
      title: 'Add internal links',
      description: 'Include 2-5 relevant links to other episodes or resources.',
      autoFixable: false
    })
  }

  if (text.length < 300) {
    suggestions.push({
      id: 'content-length',
      priority: 'high',
      title: 'Increase content length',
      description: 'Show notes should be at least 300 words for better SEO performance.',
      autoFixable: false
    })
  }

  // Sort suggestions by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return {
    overallScore,
    factors,
    suggestions,
    keywordDensityMap
  }
}

/**
 * Get color class based on score
 */
export function getScoreColor(score: number): 'green' | 'amber' | 'red' {
  if (score >= 80) return 'green'
  if (score >= 60) return 'amber'
  return 'red'
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Good'
  if (score >= 70) return 'Fair'
  if (score >= 60) return 'Needs Work'
  return 'Poor'
}
