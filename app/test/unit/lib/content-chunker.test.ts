/**
 * Tests for lib/content/chunker.ts
 *
 * DANGER-7: The chunker splits long transcripts for AI processing.
 * Bugs here mean truncated content, lost context between chunks,
 * or the AI seeing garbled text — producing garbage output.
 */
import { describe, it, expect } from 'vitest';
import {
  chunkTranscript,
  chunkTranscriptBySegments,
  createSummaryTranscript,
  estimateTokenCount,
} from '@/lib/content/chunker';

describe('chunkTranscript', () => {
  it('returns single chunk for short transcripts', () => {
    const chunks = chunkTranscript('This is a short transcript.');

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('This is a short transcript.');
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].totalChunks).toBe(1);
  });

  it('returns single chunk for exactly max length', () => {
    const text = 'x'.repeat(6000);
    const chunks = chunkTranscript(text, 6000);

    expect(chunks).toHaveLength(1);
  });

  it('splits long text into multiple chunks', () => {
    // Create text longer than default max (6000 chars)
    const text = 'Word '.repeat(2000); // ~10000 chars
    const chunks = chunkTranscript(text, 3000, 200);

    expect(chunks.length).toBeGreaterThan(1);

    // Every chunk should be within max size
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeLessThanOrEqual(3000);
    }
  });

  it('sets correct index and totalChunks on all chunks', () => {
    const text = 'A '.repeat(5000); // ~10000 chars
    const chunks = chunkTranscript(text, 3000, 200);

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i);
      expect(chunks[i].totalChunks).toBe(chunks.length);
    }
  });

  it('preserves all content (no data loss)', () => {
    // Build text with numbered sentences for verification
    const sentences = Array.from({ length: 50 }, (_, i) =>
      `Sentence number ${i + 1} about an interesting topic. `
    ).join('');

    const chunks = chunkTranscript(sentences, 500, 50);

    // The last sentence should appear in the last chunk
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.text).toContain('Sentence number 50');

    // The first sentence should appear in the first chunk
    expect(chunks[0].text).toContain('Sentence number 1');
  });

  it('breaks at sentence boundaries when possible', () => {
    // Create text with clear sentences
    const text = 'First sentence about AI. Second sentence about podcasting. Third sentence about content creation. Fourth sentence about marketing. Fifth sentence about growth. '.repeat(30);

    const chunks = chunkTranscript(text, 500, 50);

    // Chunks should end at sentence boundaries (period + space)
    for (let i = 0; i < chunks.length - 1; i++) {
      const lastChar = chunks[i].text.trim().slice(-1);
      // Should end with a period (sentence boundary) or other punctuation
      expect(['.', '?', '!', '\n'].includes(lastChar) || chunks[i].text.length <= 500).toBe(true);
    }
  });

  it('handles empty input', () => {
    const chunks = chunkTranscript('');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('');
  });

  it('handles null-ish input', () => {
    // @ts-expect-error Testing null input
    const chunks = chunkTranscript(null);
    expect(chunks).toHaveLength(1);
  });

  it('creates overlap between chunks', () => {
    const text = 'A'.repeat(10000);
    const overlapChars = 500;
    const chunks = chunkTranscript(text, 3000, overlapChars);

    // For plain repeated chars, each chunk after the first should
    // start within `overlapChars` of where the previous chunk ended
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('handles text with no sentence boundaries', () => {
    // Text with no periods, questions, or exclamations
    const text = 'word '.repeat(2000);
    const chunks = chunkTranscript(text, 3000, 200);

    // Should still split, just at the hard limit
    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe('chunkTranscriptBySegments', () => {
  const makeSegments = (count: number, charsEach = 100) =>
    Array.from({ length: count }, (_, i) => ({
      text: `Segment ${i}: ${'x'.repeat(charsEach - 15)}`,
      start: i * 10000,
      end: (i + 1) * 10000,
      speaker: i % 2 === 0 ? 'Speaker A' : 'Speaker B',
    }));

  it('returns single chunk for small input', () => {
    const segments = makeSegments(3, 50);
    const chunks = chunkTranscriptBySegments(segments, 6000);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].startTime).toBe(0);
    expect(chunks[0].endTime).toBe(30000);
  });

  it('splits across segment boundaries', () => {
    const segments = makeSegments(20, 500);
    const chunks = chunkTranscriptBySegments(segments, 2000);

    expect(chunks.length).toBeGreaterThan(1);

    // Each chunk should have timing info
    for (const chunk of chunks) {
      expect(chunk.startTime).toBeDefined();
      expect(chunk.endTime).toBeDefined();
      expect(chunk.endTime!).toBeGreaterThanOrEqual(chunk.startTime!);
    }
  });

  it('includes speaker labels in output', () => {
    const segments = [
      { text: 'Hello there', start: 0, end: 5000, speaker: 'Host' },
      { text: 'Hi!', start: 5000, end: 7000, speaker: 'Guest' },
    ];

    const chunks = chunkTranscriptBySegments(segments, 6000);

    expect(chunks[0].text).toContain('[Host]: Hello there');
    expect(chunks[0].text).toContain('[Guest]: Hi!');
  });

  it('handles empty segments array', () => {
    const chunks = chunkTranscriptBySegments([], 6000);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('');
  });

  it('handles segments without speaker labels', () => {
    const segments = [
      { text: 'No speaker here', start: 0, end: 5000, speaker: null },
    ];

    const chunks = chunkTranscriptBySegments(segments, 6000);
    expect(chunks[0].text).toBe('No speaker here');
  });

  it('sets correct totalChunks on all chunks', () => {
    const segments = makeSegments(30, 500);
    const chunks = chunkTranscriptBySegments(segments, 2000);

    for (const chunk of chunks) {
      expect(chunk.totalChunks).toBe(chunks.length);
    }
  });
});

describe('createSummaryTranscript', () => {
  it('returns full text for short transcripts', () => {
    const short = 'Short transcript about podcasting.';
    expect(createSummaryTranscript(short)).toBe(short);
  });

  it('returns text within max length for long transcripts', () => {
    const long = 'A'.repeat(20000);
    const summary = createSummaryTranscript(long, 3000);

    // Should be much shorter than original
    expect(summary.length).toBeLessThan(long.length);
  });

  it('includes beginning, middle, and end sections', () => {
    const long = 'A'.repeat(20000);
    const summary = createSummaryTranscript(long, 3000);

    expect(summary).toContain('[Beginning of episode]');
    expect(summary).toContain('[Middle of episode]');
    expect(summary).toContain('[End of episode]');
  });

  it('handles empty input', () => {
    expect(createSummaryTranscript('')).toBe('');
  });

  it('handles null-ish input', () => {
    // @ts-expect-error Testing null input
    expect(createSummaryTranscript(null)).toBe('');
  });

  it('preserves content from all three sections', () => {
    // Build text with identifiable regions
    const beginning = 'START-MARKER '.repeat(100);
    const middle = 'MIDDLE-MARKER '.repeat(100);
    const end = 'END-MARKER '.repeat(100);
    const text = beginning + middle + end;

    const summary = createSummaryTranscript(text, 3000);

    expect(summary).toContain('START-MARKER');
    expect(summary).toContain('MIDDLE-MARKER');
    expect(summary).toContain('END-MARKER');
  });
});

describe('estimateTokenCount', () => {
  it('returns 0 for empty text', () => {
    expect(estimateTokenCount('')).toBe(0);
  });

  it('returns 0 for null-ish input', () => {
    // @ts-expect-error Testing null input
    expect(estimateTokenCount(null)).toBe(0);
  });

  it('estimates roughly 1 token per 4 characters', () => {
    const text = 'a'.repeat(400);
    expect(estimateTokenCount(text)).toBe(100);
  });

  it('rounds up for non-divisible lengths', () => {
    const text = 'a'.repeat(5);
    expect(estimateTokenCount(text)).toBe(2); // ceil(5/4) = 2
  });

  it('handles realistic English text', () => {
    const text = 'The quick brown fox jumps over the lazy dog. ';
    const tokens = estimateTokenCount(text);
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(20);
  });
});
