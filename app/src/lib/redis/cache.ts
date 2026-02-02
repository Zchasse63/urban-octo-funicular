import { redis } from './client';

export async function get<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value as T | null;
}

export async function set<T>(key: string, value: T, ttl?: number): Promise<void> {
  if (ttl) {
    await redis.setex(key, ttl, JSON.stringify(value));
  } else {
    await redis.set(key, JSON.stringify(value));
  }
}

export async function del(key: string): Promise<void> {
  await redis.del(key);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
