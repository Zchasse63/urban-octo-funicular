import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Account Overview
        </h2>
        <p className="text-gray-600">
          Manage your PodBrain account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/settings/billing"
          className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-2 flex items-center">
            <svg
              className="mr-3 h-6 w-6 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Billing</h3>
          </div>
          <p className="text-sm text-gray-600">
            Manage your subscription and payment methods
          </p>
        </Link>

        <Link
          href="/settings/connections"
          className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-2 flex items-center">
            <svg
              className="mr-3 h-6 w-6 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Connections</h3>
          </div>
          <p className="text-sm text-gray-600">
            Connect your podcast hosting platforms
          </p>
        </Link>
      </div>
    </div>
  );
}
