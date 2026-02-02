import { redis } from './client';

const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

export async function rateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW * 1000;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  const currentCount = await redis.zcard(key);

  if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  // Add current request
  await redis.zadd(key, { score: now, member: `${now}:${Math.random()}` });
  await redis.expire(key, RATE_LIMIT_WINDOW);

  return {
    success: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - (currentCount + 1),
  };
}

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowSeconds: number = RATE_LIMIT_WINDOW
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  await redis.zremrangebyscore(key, 0, windowStart);
  const currentCount = await redis.zcard(key);

  if (currentCount >= maxRequests) {
    const oldestEntry = await redis.zrange<{ score: number; member: string }[]>(key, 0, 0, { withScores: true });
    const resetIn = oldestEntry.length > 0 && typeof oldestEntry[0] === 'object' && oldestEntry[0] !== null
      ? Math.ceil(((oldestEntry[0] as { score: number }).score + windowSeconds * 1000 - now) / 1000)
      : windowSeconds;

    return { allowed: false, remaining: 0, resetIn };
  }

  await redis.zadd(key, { score: now, member: `${now}:${Math.random()}` });
  await redis.expire(key, windowSeconds);

  return {
    allowed: true,
    remaining: maxRequests - (currentCount + 1),
    resetIn: windowSeconds,
  };
}
