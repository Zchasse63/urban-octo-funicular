'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Track pageview on route change
    analytics.pageview(pathname);
  }, [pathname]);

  // Passthrough component - render children without wrapper
  return <>{children}</>;
}
