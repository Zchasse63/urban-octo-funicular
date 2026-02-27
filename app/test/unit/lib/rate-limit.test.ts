/**
 * Tests for rate-limit.ts
 *
 * Rate limiting prevents API abuse and controls costs. When it silently
 * fails open (e.g., Redis unavailable), the app has no protection.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Redis module
vi.mock('@/lib/redis', () => {
  const mockRedis = {
    incr: vi.fn(),
    pexpire: vi.fn(),
  };
  return {
    redis: mockRedis,
    __mockRedis: mockRedis,
  };
});

import { checkRateLimit, rateLimitByIP, rateLimitByUser } from '@/lib/rate-limit';

// Get mock reference
const { __mockRedis: mockRedis } = await import('@/lib/redis') as { __mockRedis: { incr: ReturnType<typeof vi.fn>; pexpire: ReturnType<typeof vi.fn> } };

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRateLimit with Redis', () => {
    it('allows requests under the limit', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.pexpire.mockResolvedValue(1);

      const result = await checkRateLimit('test-key', 10);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetAt).toBeGreaterThan(Date.now() - 1000);
    });

    it('blocks requests at the limit', async () => {
      mockRedis.incr.mockResolvedValue(11);

      const result = await checkRateLimit('test-key', 10);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('blocks requests over the limit', async () => {
      mockRedis.incr.mockResolvedValue(15);

      const result = await checkRateLimit('test-key', 10);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('sets expiry on first request (count === 1)', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.pexpire.mockResolvedValue(1);

      await checkRateLimit('new-key', 10, 60000);

      expect(mockRedis.pexpire).toHaveBeenCalledWith(
        'ratelimit:new-key',
        60000
      );
    });

    it('does not reset expiry on subsequent requests', async () => {
      mockRedis.incr.mockResolvedValue(5);

      await checkRateLimit('existing-key', 10);

      expect(mockRedis.pexpire).not.toHaveBeenCalled();
    });

    it('uses correct Redis key prefix', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.pexpire.mockResolvedValue(1);

      await checkRateLimit('my-key');

      expect(mockRedis.incr).toHaveBeenCalledWith('ratelimit:my-key');
    });
  });

  describe('checkRateLimit with in-memory fallback', () => {
    it('falls back to memory when Redis throws', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis unavailable'));

      const result = await checkRateLimit('fallback-key', 10);

      // Should still work via in-memory
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('in-memory tracks requests correctly', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis down'));

      // Use unique key for each test to avoid cross-contamination
      const key = `mem-track-${Date.now()}`;

      // First request
      const r1 = await checkRateLimit(key, 3);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(2);

      // Second request
      const r2 = await checkRateLimit(key, 3);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      // Third request
      const r3 = await checkRateLimit(key, 3);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);

      // Fourth request - should be blocked
      const r4 = await checkRateLimit(key, 3);
      expect(r4.success).toBe(false);
      expect(r4.remaining).toBe(0);
    });
  });

  describe('rateLimitByIP', () => {
    it('prefixes key with ip:', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.pexpire.mockResolvedValue(1);

      await rateLimitByIP('192.168.1.1', 100);

      expect(mockRedis.incr).toHaveBeenCalledWith('ratelimit:ip:192.168.1.1');
    });

    it('applies custom max requests', async () => {
      mockRedis.incr.mockResolvedValue(21);

      const result = await rateLimitByIP('1.2.3.4', 20);
      expect(result.success).toBe(false);
    });
  });

  describe('rateLimitByUser', () => {
    it('prefixes key with user:', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.pexpire.mockResolvedValue(1);

      await rateLimitByUser('user-123', 50);

      expect(mockRedis.incr).toHaveBeenCalledWith('ratelimit:user:user-123');
    });
  });

  describe('edge cases', () => {
    it('handles exactly at the limit (boundary)', async () => {
      mockRedis.incr.mockResolvedValue(10);

      const result = await checkRateLimit('boundary-key', 10);
      // 10 <= 10, so this should pass
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('handles limit of 1 (strictest)', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.pexpire.mockResolvedValue(1);

      const r1 = await checkRateLimit('strict-key', 1);
      expect(r1.success).toBe(true);

      mockRedis.incr.mockResolvedValue(2);
      const r2 = await checkRateLimit('strict-key', 1);
      expect(r2.success).toBe(false);
    });
  });
});
