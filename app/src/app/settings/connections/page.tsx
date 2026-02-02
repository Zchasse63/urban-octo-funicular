import { BuzzsproutConnect } from '@/components/connections/BuzzsproutConnect';

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Podcast Host Connections
        </h2>
        <p className="mt-2 text-gray-600">
          Connect your podcast hosting platform to push show notes automatically
        </p>
      </div>

      <BuzzsproutConnect />

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Coming Soon
        </h3>
        <p className="text-sm text-gray-600">
          We're working on integrations with more podcast hosting platforms including
          Transistor, Libsyn, and Podbean.
        </p>
      </div>
    </div>
  );
}
