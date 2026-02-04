import Link from 'next/link';
import { InteractiveCard } from '@/components/podbrain';
import { CreditCard, Link as LinkIcon } from 'lucide-react';

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
        <InteractiveCard href="/settings/billing" className="min-h-[120px]">
          <div className="mb-2 flex items-center">
            <CreditCard className="mr-3 h-6 w-6" style={{ color: "var(--accent-blue)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Billing</h3>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage your subscription and payment methods
          </p>
        </InteractiveCard>

        <InteractiveCard href="/settings/connections" className="min-h-[120px]">
          <div className="mb-2 flex items-center">
            <LinkIcon className="mr-3 h-6 w-6" style={{ color: "var(--accent-blue)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Connections</h3>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Connect your podcast hosting platforms
          </p>
        </InteractiveCard>
      </div>
    </div>
  );
}
