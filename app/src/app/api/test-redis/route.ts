import { NextResponse } from 'next/server';
import { redis, set, get, del } from '@/lib/redis';
import { checkRateLimit } from '@/lib/rate-limit';
import { devGuard } from '@/lib/api/dev-guard';

export async function GET() {
  const guard = devGuard();
  if (guard) return guard;

  try {
    const testKey = `test:${Date.now()}`;
    const testValue = { message: 'Redis is working!', timestamp: Date.now() };

    // Test basic set/get
    await set(testKey, testValue, 60);
    const retrieved = await get<typeof testValue>(testKey);

    // Test rate limiting
    const rateLimitResult = await checkRateLimit('test-endpoint', 10, 60);

    // Clean up
    await del(testKey);

    // Ping Redis
    const pingResult = await redis.ping();

    return NextResponse.json({
      success: true,
      message: 'Redis connection successful',
      data: {
        pingResult,
        setGetTest: {
          original: testValue,
          retrieved,
          match: JSON.stringify(testValue) === JSON.stringify(retrieved),
        },
        rateLimit: rateLimitResult,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Redis connection failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
