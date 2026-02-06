'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/settings', label: 'Overview' },
  { href: '/settings/billing', label: 'Billing' },
  { href: '/settings/connections', label: 'Connections' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside className="w-full md:w-64">
            <nav className="space-y-1 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-elevation-1)]">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'block rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-[var(--selected-border)] bg-[var(--selected-bg)] text-[var(--accent-blue)]'
                        : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
