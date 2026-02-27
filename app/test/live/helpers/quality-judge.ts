/**
 * Grok-as-Judge quality evaluator.
 *
 * Uses xAI Grok to evaluate the quality, relevance, and correctness of
 * generated content. Each evaluation returns a structured score with reasoning.
 *
 * Also provides manual assertion helpers for double-checking AI judgments.
 */

interface QualityScore {
  overall: number;         // 1-10
  relevance: number;       // 1-10: Is the content relevant to the transcript?
  accuracy: number;        // 1-10: Are facts, names, topics correct?
  formatting: number;      // 1-10: Is the format correct for the platform/type?
  usefulness: number;      // 1-10: Would a podcaster actually use this?
  reasoning: string;       // Free-text explanation
  issues: string[];        // Specific problems found
  passed: boolean;         // Overall pass/fail (overall >= 6)
}

interface JudgeContext {
  transcript: string;
  assetType: string;
  assetContent: string;
  showName: string;
  guestName?: string;
}

/**
 * Evaluate a generated asset using xAI Grok as an impartial judge.
 */
export async function evaluateWithGrok(ctx: JudgeContext): Promise<QualityScore> {
  const XAI_API_KEY = process.env.XAI_API_KEY;
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY not set — cannot run Grok quality evaluation');
  }

  const systemPrompt = `You are a strict quality evaluator for AI-generated podcast content.
You will be given:
1. The original podcast transcript
2. The type of content asset that was generated
3. The generated content itself

Evaluate the content on these dimensions (each 1-10):
- relevance: Does the content accurately reflect the transcript's topics, themes, and key points?
- accuracy: Are names, facts, quotes, and claims correct? Are there any hallucinations?
- formatting: Is the content properly formatted for its intended platform/type?
- usefulness: Would a real podcaster find this useful and ready to publish (with minor edits)?

Be STRICT. A score of 7 means "good, minor issues." A score of 5 means "mediocre, needs work."
A score below 5 means "would not use this."

Respond ONLY with valid JSON matching this schema:
{
  "overall": <number 1-10>,
  "relevance": <number 1-10>,
  "accuracy": <number 1-10>,
  "formatting": <number 1-10>,
  "usefulness": <number 1-10>,
  "reasoning": "<1-3 sentences explaining your evaluation>",
  "issues": ["<specific issue 1>", "<specific issue 2>"]
}`;

  const userPrompt = `## Transcript (first 3000 chars)
${ctx.transcript.slice(0, 3000)}

## Asset Type
${ctx.assetType}

## Show Name
${ctx.showName}
${ctx.guestName ? `\n## Guest Name\n${ctx.guestName}` : ''}

## Generated Content
${ctx.assetContent.slice(0, 5000)}

Evaluate this generated content. Be strict and honest.`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temp for consistent judging
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok quality evaluation failed: ${response.status} ${err}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Grok returned empty quality evaluation');
  }

  const parsed = JSON.parse(content) as Omit<QualityScore, 'passed'>;

  return {
    ...parsed,
    issues: parsed.issues || [],
    passed: parsed.overall >= 6,
  };
}

/**
 * Run quality evaluation on multiple assets and return a summary report.
 */
export async function evaluateAssetBatch(
  transcript: string,
  showName: string,
  assets: Array<{ type: string; content: string }>,
  guestName?: string
): Promise<{
  results: Map<string, QualityScore>;
  passRate: number;
  averageScore: number;
  failures: string[];
}> {
  const results = new Map<string, QualityScore>();
  const failures: string[] = [];

  for (const asset of assets) {
    try {
      console.log(`    🔍 Evaluating ${asset.type}...`);
      const score = await evaluateWithGrok({
        transcript,
        assetType: asset.type,
        assetContent: asset.content,
        showName,
        guestName,
      });
      results.set(asset.type, score);

      if (!score.passed) {
        failures.push(`${asset.type}: ${score.overall}/10 — ${score.reasoning}`);
      }

      // Rate limit: avoid hitting xAI too fast
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`    ⚠️  Evaluation failed for ${asset.type}: ${err}`);
      results.set(asset.type, {
        overall: 0,
        relevance: 0,
        accuracy: 0,
        formatting: 0,
        usefulness: 0,
        reasoning: `Evaluation error: ${err}`,
        issues: ['Evaluation failed'],
        passed: false,
      });
      failures.push(`${asset.type}: evaluation error`);
    }
  }

  const scores = [...results.values()].filter(s => s.overall > 0);
  const passCount = scores.filter(s => s.passed).length;

  return {
    results,
    passRate: scores.length > 0 ? passCount / scores.length : 0,
    averageScore: scores.length > 0
      ? scores.reduce((sum, s) => sum + s.overall, 0) / scores.length
      : 0,
    failures,
  };
}

// ─── Manual double-check assertions ──────────────────────────────────

/**
 * Check that the content mentions at least one topic from the transcript.
 */
export function assertContentRelevance(
  content: string,
  transcript: string,
  minKeywordOverlap = 3
): { passed: boolean; matchedKeywords: string[] } {
  // Extract significant words from transcript (4+ chars, not stop words)
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'their',
    'about', 'would', 'could', 'should', 'there', 'where', 'when', 'which',
    'what', 'will', 'just', 'than', 'then', 'also', 'into', 'some', 'like',
    'very', 'only', 'your', 'more', 'know', 'think', 'going', 'really',
  ]);

  const transcriptWords = new Set(
    transcript
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !stopWords.has(w))
  );

  const contentWords = content
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w));

  const matched = [...new Set(contentWords)].filter(w => transcriptWords.has(w));

  return {
    passed: matched.length >= minKeywordOverlap,
    matchedKeywords: matched.slice(0, 20),
  };
}

/**
 * Check that content doesn't contain obvious hallucinations.
 * Looks for made-up multi-word proper nouns (likely person/company names)
 * not present in the transcript.
 *
 * NOTE: Only flags multi-word proper nouns (e.g., "John Smith", "Acme Corp")
 * because single capitalized words are usually just normal sentence starters
 * or generic terms, not hallucinated names.
 */
export function assertNoHallucinations(
  content: string,
  transcript: string
): { passed: boolean; suspiciousTerms: string[] } {
  // Extract MULTI-WORD capitalized proper nouns (2+ words both capitalized)
  // These are far more likely to be actual hallucinated names (people, companies)
  const multiWordProperNouns = new Set(
    (content.match(/[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})+/g) || [])
  );

  const transcriptText = transcript.toLowerCase();

  // Common multi-word proper nouns that AI legitimately uses
  const multiWordExceptions = new Set([
    'Test Guest', 'Job Interview', 'Real Talk', 'First Impressions',
    'Side Hustle', 'Morning Ritual', 'Action Result',
    // Platform/brand terms
    'Google Docs', 'Apple Podcasts', 'Spotify Podcasts',
  ]);

  const suspicious: string[] = [];
  for (const noun of multiWordProperNouns) {
    if (!transcriptText.includes(noun.toLowerCase()) && !multiWordExceptions.has(noun)) {
      suspicious.push(noun);
    }
  }

  return {
    // Allow up to 3 multi-word proper nouns not in transcript
    // (AI may generate section headers, labels, or common phrase names)
    passed: suspicious.length <= 3,
    suspiciousTerms: suspicious,
  };
}

/**
 * Verify character limits for platform-specific content.
 */
export function assertPlatformLimits(
  assetType: string,
  content: string
): { passed: boolean; issue?: string } {
  const limits: Record<string, number> = {
    twitter_single: 280,
    instagram_caption: 2200,
    seo_description: 3000,      // Full SEO package (title, keywords, meta desc, etc.)
    tiktok_hooks: 150,          // Per hook (with hashtags)
  };

  const limit = limits[assetType];
  if (!limit) return { passed: true };

  if (content.length > limit) {
    return {
      passed: false,
      issue: `${assetType} exceeds ${limit} char limit (actual: ${content.length})`,
    };
  }
  return { passed: true };
}

/**
 * Print a formatted quality report to console.
 */
export function printQualityReport(
  results: Map<string, QualityScore>
): void {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              QUALITY EVALUATION REPORT                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');

  const sorted = [...results.entries()].sort((a, b) => b[1].overall - a[1].overall);

  for (const [type, score] of sorted) {
    const emoji = score.passed ? '✅' : '❌';
    const bar = '█'.repeat(score.overall) + '░'.repeat(10 - score.overall);
    console.log(`║ ${emoji} ${type.padEnd(25)} ${bar} ${score.overall}/10 ║`);
    if (score.issues.length > 0) {
      for (const issue of score.issues) {
        console.log(`║    ⚠️  ${issue.slice(0, 50).padEnd(50)} ║`);
      }
    }
  }

  const scores = [...results.values()].filter(s => s.overall > 0);
  const avg = scores.reduce((s, v) => s + v.overall, 0) / scores.length;
  const passRate = (scores.filter(s => s.passed).length / scores.length * 100).toFixed(0);

  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║ Average: ${avg.toFixed(1)}/10  |  Pass rate: ${passRate}%`.padEnd(59) + '║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}
