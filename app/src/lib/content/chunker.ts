/**
 * Transcript Chunking Utility for PodBrain
 *
 * Splits long transcripts into manageable chunks for AI processing.
 * Long-form podcasts (2-4 hours) can produce transcripts far too large for
 * a single LLM context window. This utility breaks them into overlapping
 * chunks that preserve sentence boundaries and provide context continuity.
 *
 * Used by the content generator when passing transcripts to xAI Grok for
 * show notes, asset generation, and other AI-powered features.
 */

export interface TranscriptChunk {
  /** The text content of this chunk */
  text: string
  /** Zero-based index of this chunk */
  index: number
  /** Total number of chunks the transcript was split into */
  totalChunks: number
  /** Start time in ms (if segments are available) */
  startTime?: number
  /** End time in ms (if segments are available) */
  endTime?: number
}

export interface TranscriptSegmentInput {
  text: string
  start: number
  end: number
  speaker?: string | null
}

/** Default maximum characters per chunk (~1500 tokens, well within context limits) */
const MAX_CHUNK_CHARS = 6000

/** Overlap between consecutive chunks for context continuity */
const OVERLAP_CHARS = 500

/**
 * Split a transcript into chunks suitable for AI processing.
 *
 * Tries to break at sentence boundaries (period, question mark, exclamation
 * mark, or newline) to avoid cutting mid-sentence. Falls back to the hard
 * character limit if no good break point is found in the second half of
 * the chunk.
 *
 * @param transcript - Full transcript text
 * @param maxChunkChars - Maximum characters per chunk (default: 6000)
 * @param overlapChars - Characters of overlap between chunks (default: 500)
 * @returns Array of transcript chunks
 */
export function chunkTranscript(
  transcript: string,
  maxChunkChars: number = MAX_CHUNK_CHARS,
  overlapChars: number = OVERLAP_CHARS
): TranscriptChunk[] {
  if (!transcript || transcript.length <= maxChunkChars) {
    return [{
      text: transcript || '',
      index: 0,
      totalChunks: 1,
    }]
  }

  const chunks: TranscriptChunk[] = []
  let position = 0

  while (position < transcript.length) {
    let end = Math.min(position + maxChunkChars, transcript.length)

    // Try to break at a sentence boundary if we're not at the end
    if (end < transcript.length) {
      const searchRegion = transcript.slice(position, end)
      const lastPeriod = searchRegion.lastIndexOf('. ')
      const lastQuestion = searchRegion.lastIndexOf('? ')
      const lastExclaim = searchRegion.lastIndexOf('! ')
      const lastNewline = searchRegion.lastIndexOf('\n')

      // Find the latest sentence boundary in the second half of the chunk
      // (to avoid creating very small chunks)
      const minBreakPoint = maxChunkChars * 0.5
      const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclaim, lastNewline)

      if (breakPoint > minBreakPoint) {
        end = position + breakPoint + 1 // Include the punctuation
      }
    }

    chunks.push({
      text: transcript.slice(position, end),
      index: chunks.length,
      totalChunks: 0, // Updated after the loop
    })

    // Move position forward, accounting for overlap on non-final chunks
    if (end < transcript.length) {
      position = end - overlapChars
    } else {
      position = end
    }
  }

  // Set the correct totalChunks count on all chunks
  for (const chunk of chunks) {
    chunk.totalChunks = chunks.length
  }

  return chunks
}

/**
 * Split a transcript into chunks using segment boundaries.
 *
 * When transcript segments (with speaker labels and timestamps) are available,
 * this function groups segments into chunks that respect speaker turns and
 * natural conversation breaks. Each chunk includes timing metadata.
 *
 * @param segments - Array of transcript segments with timing info
 * @param maxChunkChars - Maximum characters per chunk (default: 6000)
 * @returns Array of transcript chunks with timing metadata
 */
export function chunkTranscriptBySegments(
  segments: TranscriptSegmentInput[],
  maxChunkChars: number = MAX_CHUNK_CHARS
): TranscriptChunk[] {
  if (!segments || segments.length === 0) {
    return [{
      text: '',
      index: 0,
      totalChunks: 1,
    }]
  }

  const chunks: TranscriptChunk[] = []
  let currentTexts: string[] = []
  let currentLength = 0
  let chunkStartTime = segments[0].start
  let chunkEndTime = segments[0].end

  for (const segment of segments) {
    const segmentText = segment.speaker
      ? `[${segment.speaker}]: ${segment.text}`
      : segment.text

    // If adding this segment would exceed the limit, finalize the current chunk
    if (currentLength + segmentText.length > maxChunkChars && currentTexts.length > 0) {
      chunks.push({
        text: currentTexts.join('\n'),
        index: chunks.length,
        totalChunks: 0,
        startTime: chunkStartTime,
        endTime: chunkEndTime,
      })

      currentTexts = []
      currentLength = 0
      chunkStartTime = segment.start
    }

    currentTexts.push(segmentText)
    currentLength += segmentText.length + 1 // +1 for newline
    chunkEndTime = segment.end
  }

  // Don't forget the last chunk
  if (currentTexts.length > 0) {
    chunks.push({
      text: currentTexts.join('\n'),
      index: chunks.length,
      totalChunks: 0,
      startTime: chunkStartTime,
      endTime: chunkEndTime,
    })
  }

  // Set the correct totalChunks count on all chunks
  for (const chunk of chunks) {
    chunk.totalChunks = chunks.length
  }

  return chunks
}

/**
 * Create a summary-ready transcript by extracting key segments.
 *
 * For very long transcripts that need a high-level overview (e.g., for
 * generating episode titles or summaries), this function extracts the
 * beginning, middle, and end portions. This keeps the AI focused on
 * the overall arc of the conversation rather than getting lost in details.
 *
 * @param transcript - Full transcript text
 * @param maxLength - Maximum total length of the summary transcript (default: 8000)
 * @returns Condensed transcript with labeled sections
 */
export function createSummaryTranscript(
  transcript: string,
  maxLength: number = 8000
): string {
  if (!transcript || transcript.length <= maxLength) {
    return transcript || ''
  }

  const thirdLength = Math.floor(maxLength / 3)

  // Extract beginning
  let startEnd = thirdLength
  const startBreak = transcript.lastIndexOf('. ', thirdLength)
  if (startBreak > thirdLength * 0.5) {
    startEnd = startBreak + 1
  }
  const start = transcript.slice(0, startEnd)

  // Extract middle
  const middleStart = Math.floor(transcript.length / 2) - Math.floor(thirdLength / 2)
  let middleEnd = middleStart + thirdLength
  const middleBreak = transcript.lastIndexOf('. ', middleEnd)
  if (middleBreak > middleStart + thirdLength * 0.5) {
    middleEnd = middleBreak + 1
  }
  const middle = transcript.slice(middleStart, middleEnd)

  // Extract end
  let endStart = transcript.length - thirdLength
  const endBreak = transcript.indexOf('. ', endStart)
  if (endBreak !== -1 && endBreak < endStart + thirdLength * 0.5) {
    endStart = endBreak + 2 // Skip the ". "
  }
  const end = transcript.slice(endStart)

  return `[Beginning of episode]\n${start}\n\n[Middle of episode]\n${middle}\n\n[End of episode]\n${end}`
}

/**
 * Estimate the number of tokens in a text string.
 * Uses a rough heuristic of ~4 characters per token for English text.
 *
 * @param text - Input text
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}
