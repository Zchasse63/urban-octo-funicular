import { BuzzsproutConnect } from '@/components/connections/BuzzsproutConnect';

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Connections
        </h1>
        <p className="mt-2 text-base sm:text-lg text-[var(--text-secondary)]">
          Connect your podcast hosting platform to push show notes automatically
        </p>
      </div>

      <BuzzsproutConnect />

      <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-4 sm:p-6">
        <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">
          Coming Soon
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          We're working on integrations with more podcast hosting platforms including
          Transistor, Libsyn, and Podbean.
        </p>
      </div>
    </div>
  );
}
