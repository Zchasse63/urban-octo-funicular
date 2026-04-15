#!/usr/bin/env node
/**
 * Grade a PodBrain episode's generated artifacts using claude-sonnet-4-5
 * as an LLM judge. Reads snapshots from /tmp/podbrain-quality/ (produced
 * by scripts/quality-snapshot-episode.mjs) so the grader is fully offline
 * from Supabase.
 *
 * Grading rubric (per artifact, 1–10):
 *   1. Factual accuracy   — does it match the transcript?
 *   2. Specificity        — does it reference concrete details or vague filler?
 *   3. Actionability      — can a reader/host use this as-is, or does it need rework?
 *   4. Tone fit           — does the voice match the asset's platform/intent?
 *   5. Length discipline  — is it the right size (brief where brief, detailed where detailed)?
 *
 * Overall score = arithmetic mean of the five criteria.
 *
 * Requires ANTHROPIC_API_KEY in .env.local. Fails fast with a clear error
 * message if missing.
 *
 * Usage:
 *   node --env-file=.env.local scripts/quality-grade-episode.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- env loader (so the script runs either with --env-file or via plain node) ---
const envPath = resolve(__dirname, '..', '.env.local')
if (existsSync(envPath) && !process.env.ANTHROPIC_API_KEY) {
  const envText = readFileSync(envPath, 'utf8')
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) process.env[m[1]] = m[2]
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    'ERROR: ANTHROPIC_API_KEY not set in .env.local or environment.\n' +
    'Add it to /Users/zach/urban-octo-funicular/app/.env.local and re-run.'
  )
  process.exit(2)
}

const SNAPSHOT = '/tmp/podbrain-quality'
if (!existsSync(`${SNAPSHOT}/episode.json`)) {
  console.error(
    `ERROR: No snapshot found at ${SNAPSHOT}/episode.json.\n` +
    'Run scripts/quality-snapshot-episode.mjs first to dump the episode artifacts.'
  )
  process.exit(2)
}

const episode = JSON.parse(readFileSync(`${SNAPSHOT}/episode.json`, 'utf8'))
const transcript = readFileSync(`${SNAPSHOT}/transcript.txt`, 'utf8')
const showNotes = readFileSync(`${SNAPSHOT}/show-notes.md`, 'utf8')
const assets = JSON.parse(readFileSync(`${SNAPSHOT}/assets.json`, 'utf8'))

console.log(
  `Grading episode "${episode.title}" (${transcript.length} char transcript, ${assets.length} assets)\n`
)

const MODEL = 'claude-sonnet-4-5'
const API_URL = 'https://api.anthropic.com/v1/messages'

/**
 * Send a single grading request to Claude and return the parsed JSON rubric.
 * Retries once on transient network failure. Throws on unrecoverable errors
 * (4xx status, malformed JSON, etc.).
 */
async function grade(name, artifact, transcriptExcerpt) {
  const systemPrompt =
    'You are a strict but fair content quality judge. You evaluate podcast-derived content ' +
    'by comparing it against the ground-truth transcript. Return ONLY valid JSON matching the ' +
    'schema in the user prompt — no prose, no markdown, no code fences.'

  const userPrompt = [
    `# Grading task: ${name}`,
    '',
    'Rate each criterion from 1 (worst) to 10 (best). Return this exact JSON shape:',
    '',
    '```json',
    '{',
    '  "accuracy": <number 1-10>,',
    '  "specificity": <number 1-10>,',
    '  "actionability": <number 1-10>,',
    '  "toneFit": <number 1-10>,',
    '  "lengthDiscipline": <number 1-10>,',
    '  "overall": <number 1-10>,',
    '  "critique": "<2-3 sentence honest critique>",',
    '  "topProblem": "<the single biggest issue, or \\"none\\" if excellent>"',
    '}',
    '```',
    '',
    '## Criteria guidance',
    '- **accuracy**: Does every specific claim trace back to the transcript?',
    '- **specificity**: References to concrete people/places/numbers beat vague filler.',
    '- **actionability**: Would a podcaster ship this as-is, or rewrite it?',
    '- **toneFit**: Does the voice match the target platform/intent?',
    '- **lengthDiscipline**: Right-sized — not padded, not truncated.',
    '',
    '## Ground truth transcript (first 8000 chars)',
    '',
    transcriptExcerpt.slice(0, 8000),
    '',
    `## Artifact to grade (${name})`,
    '',
    artifact,
  ].join('\n')

  const body = {
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 400)}`)
      }

      const data = await response.json()
      const text = data.content?.[0]?.text ?? ''

      // Strip any code fences the model slipped in despite instructions
      const cleaned = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim()

      return JSON.parse(cleaned)
    } catch (err) {
      if (attempt === 2) throw err
      console.warn(`  retry ${attempt}/2 after error: ${err.message}`)
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
}

const results = []

// Grade the show notes as a single artifact
console.log('→ grading show_notes...')
try {
  const grade1 = await grade('show_notes', showNotes, transcript)
  results.push({ name: 'show_notes', ...grade1 })
  console.log(`  overall=${grade1.overall}/10 — ${grade1.critique}`)
} catch (err) {
  console.error(`  FAILED: ${err.message}`)
  results.push({ name: 'show_notes', error: err.message })
}

// Grade each generated asset
for (const asset of assets) {
  const name = `asset_${asset.asset_type}`
  console.log(`→ grading ${name}...`)
  try {
    const grade1 = await grade(name, asset.content, transcript)
    results.push({ name, assetType: asset.asset_type, ...grade1 })
    console.log(`  overall=${grade1.overall}/10 — ${grade1.critique}`)
  } catch (err) {
    console.error(`  FAILED: ${err.message}`)
    results.push({ name, assetType: asset.asset_type, error: err.message })
  }
}

// Aggregate
const validGrades = results.filter((r) => typeof r.overall === 'number')
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length
const avgOverall = mean(validGrades.map((r) => r.overall))
const avgAccuracy = mean(validGrades.map((r) => r.accuracy))
const avgSpecificity = mean(validGrades.map((r) => r.specificity))
const avgActionability = mean(validGrades.map((r) => r.actionability))
const avgToneFit = mean(validGrades.map((r) => r.toneFit))
const avgLength = mean(validGrades.map((r) => r.lengthDiscipline))

const worst = [...validGrades].sort((a, b) => a.overall - b.overall).slice(0, 3)
const best = [...validGrades].sort((a, b) => b.overall - a.overall).slice(0, 3)

const summary = {
  episode: episode.title,
  gradedAt: new Date().toISOString(),
  judge: MODEL,
  artifacts: results.length,
  graded: validGrades.length,
  failed: results.length - validGrades.length,
  averages: {
    overall: Number(avgOverall.toFixed(2)),
    accuracy: Number(avgAccuracy.toFixed(2)),
    specificity: Number(avgSpecificity.toFixed(2)),
    actionability: Number(avgActionability.toFixed(2)),
    toneFit: Number(avgToneFit.toFixed(2)),
    lengthDiscipline: Number(avgLength.toFixed(2)),
  },
  best: best.map((b) => ({ name: b.name, overall: b.overall, topProblem: b.topProblem })),
  worst: worst.map((w) => ({ name: w.name, overall: w.overall, topProblem: w.topProblem })),
  results,
}

writeFileSync(`${SNAPSHOT}/grades.json`, JSON.stringify(summary, null, 2))

console.log('\n=== Summary ===')
console.log(`Episode:          ${summary.episode}`)
console.log(`Artifacts graded: ${summary.graded}/${summary.artifacts}`)
console.log(`Avg overall:      ${summary.averages.overall}/10`)
console.log(`Avg accuracy:     ${summary.averages.accuracy}/10`)
console.log(`Avg specificity:  ${summary.averages.specificity}/10`)
console.log(`Avg actionability:${summary.averages.actionability}/10`)
console.log(`Avg toneFit:      ${summary.averages.toneFit}/10`)
console.log(`Avg length:       ${summary.averages.lengthDiscipline}/10`)
console.log(`\nBest 3:`)
summary.best.forEach((b) => console.log(`  ${b.name}: ${b.overall}/10`))
console.log(`\nWorst 3:`)
summary.worst.forEach((w) => console.log(`  ${w.name}: ${w.overall}/10 (${w.topProblem})`))
console.log(`\nFull results: ${SNAPSHOT}/grades.json`)
