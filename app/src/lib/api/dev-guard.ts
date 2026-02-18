import { NextResponse } from 'next/server';

/**
 * Returns a 404 response if the current environment is production.
 * Use this to gate test/debug routes.
 */
export function devGuard(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }
  return null;
}
