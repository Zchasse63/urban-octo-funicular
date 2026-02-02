import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DetectionResponseSchema } from './detector';

describe('Viral Moments Detector', () => {
  it('validates detection response schema', () => {
    const validResponse = {
      viralMoments: [
        {
          id: 'moment-1',
          quote: 'This is a test quote',
          startTime: 10,
          endTime: 20,
          score: 85,
          category: 'quotable',
          reasoning: 'Concise and impactful statement',
          suggestedPlatforms: ['twitter', 'linkedin'],
        },
      ],
      topMoment: {
        id: 'moment-1',
        quote: 'This is a test quote',
        startTime: 10,
        endTime: 20,
        score: 85,
        category: 'quotable',
        reasoning: 'Concise and impactful statement',
        suggestedPlatforms: ['twitter', 'linkedin'],
      },
    };

    const result = DetectionResponseSchema.safeParse(validResponse);
    assert.strictEqual(result.success, true, 'Valid response should pass validation');
  });

  it('rejects invalid time ordering', () => {
    const invalidResponse = {
      viralMoments: [
        {
          id: 'moment-1',
          quote: 'Test',
          startTime: 20,
          endTime: 10,
          score: 85,
          category: 'quotable',
          reasoning: 'Test',
          suggestedPlatforms: ['twitter'],
        },
      ],
      topMoment: {
        id: 'moment-1',
        quote: 'Test',
        startTime: 20,
        endTime: 10,
        score: 85,
        category: 'quotable',
        reasoning: 'Test',
        suggestedPlatforms: ['twitter'],
      },
    };

    const result = DetectionResponseSchema.safeParse(invalidResponse);
    assert.strictEqual(result.success, false, 'Invalid time ordering should fail');
  });

  it('rejects empty arrays', () => {
    const invalidResponse = {
      viralMoments: [
        {
          id: 'moment-1',
          quote: 'Test',
          startTime: 10,
          endTime: 20,
          score: 85,
          category: 'quotable',
          reasoning: 'Test',
          suggestedPlatforms: [],
        },
      ],
      topMoment: {
        id: 'moment-1',
        quote: 'Test',
        startTime: 10,
        endTime: 20,
        score: 85,
        category: 'quotable',
        reasoning: 'Test',
        suggestedPlatforms: [],
      },
    };

    const result = DetectionResponseSchema.safeParse(invalidResponse);
    assert.strictEqual(result.success, false, 'Empty platform array should fail');
  });
});
