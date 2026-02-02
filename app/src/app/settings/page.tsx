import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Manage your PodBrain account settings and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Link
          href="/settings/billing"
          className="topo-card min-h-[120px] flex flex-col hover:shadow-lg transition-shadow"
          aria-label="Go to billing settings"
        >
          <div className="mb-2 flex items-center">
            <svg
              className="mr-3 h-6 w-6"
              style={{ color: "var(--accent-blue)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Billing</h3>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage your subscription and payment methods
          </p>
        </Link>

        <Link
          href="/settings/connections"
          className="topo-card min-h-[120px] flex flex-col hover:shadow-lg transition-shadow"
          aria-label="Go to connections settings"
        >
          <div className="mb-2 flex items-center">
            <svg
              className="mr-3 h-6 w-6"
              style={{ color: "var(--accent-blue)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Connections</h3>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Connect your podcast hosting platforms
          </p>
        </Link>
      </div>
    </div>
  );
}
