/**
 * Rate limiting module
 * Uses in-memory storage for development, Redis for production
 */

import { redis } from './redis';

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = now + windowMs;

  // Try Redis first
  if (redis) {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await redis.incr(redisKey);

      if (count === 1) {
        await redis.pexpire(redisKey, windowMs);
      }

      return {
        success: count <= maxRequests,
        remaining: Math.max(0, maxRequests - count),
        resetAt,
      };
    } catch {
      // Fall through to memory store
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: maxRequests - 1, resetAt };
  }

  entry.count++;
  return {
    success: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIP(
  ip: string,
  maxRequests?: number
): Promise<RateLimitResult> {
  return checkRateLimit(`ip:${ip}`, maxRequests);
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
  userId: string,
  maxRequests?: number
): Promise<RateLimitResult> {
  return checkRateLimit(`user:${userId}`, maxRequests);
}
