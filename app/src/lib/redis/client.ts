import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn('Redis environment variables not set (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN). Redis caching will be unavailable.');
}

export const redis = url && token
  ? new Redis({ url, token })
  : (null as unknown as Redis);

/**
 * Check if Redis is available (env vars configured).
 */
export function isRedisAvailable(): boolean {
  return !!(url && token);
}
