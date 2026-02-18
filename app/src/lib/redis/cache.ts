import { redis, isRedisAvailable } from './client';

export async function get<T>(key: string): Promise<T | null> {
  if (!isRedisAvailable()) return null;
  try {
    const value = await redis.get(key);
    return value as T | null;
  } catch (err) {
    console.warn('Redis get failed:', err);
    return null;
  }
}

export async function set<T>(key: string, value: T, ttl?: number): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    console.warn('Redis set failed:', err);
  }
}

export async function del(key: string): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn('Redis del failed:', err);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn('Redis invalidatePattern failed:', err);
  }
}
