"use client"

import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UsageMeter } from "@/components/ui/usage-meter"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, Zap, CheckCircle, XCircle } from "lucide-react"
import useSubscription from "@/hooks/use-subscription"
import { PRICING_TIERS } from "@/lib/stripe/products"

function SubscriptionTab() {
  const { subscription, isLoading, openPortal, checkout } = useSubscription()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full rounded-[var(--radius-md)]" />
        <Skeleton className="h-32 w-full rounded-[var(--radius-md)]" />
      </div>
    )
  }

  const tier = subscription?.tier || "free"
  const tierInfo = PRICING_TIERS[tier]

  return (
    <div className="flex flex-col gap-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>{tierInfo.name} Plan</CardTitle>
              <Badge variant="success">ACTIVE</Badge>
            </div>
            <span className="font-[family-name:var(--font-mono)] text-[var(--text-h2)] font-bold text-[var(--color-text-ink)]">
              ${tierInfo.price}
              <span className="text-[var(--text-caption)] font-normal text-[var(--color-text-secondary)]">
                /mo
              </span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {tierInfo.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-[var(--color-status-success)]" />
                <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                  {feature}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {tier !== "agency" && (
              <Button
                size="sm"
                onClick={() => checkout(tier === "free" ? "pro" : "agency")}
              >
                <Zap className="h-3.5 w-3.5" />
                {tier === "free" ? "Upgrade to Pro" : "Upgrade to Agency"}
              </Button>
            )}
            {tier !== "free" && (
              <Button size="sm" variant="secondary" onClick={openPortal}>
                <ExternalLink className="h-3.5 w-3.5" />
                Manage in Stripe
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <UsageMeter
              label="Audio Minutes"
              current={412}
              max={500}
              unit="min"
            />
            <UsageMeter
              label="Storage"
              current={6.8}
              max={10}
              unit="GB"
              warningThreshold={90}
            />
            <UsageMeter
              label="API Calls"
              current={3240}
              max={10000}
              unit="calls"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IntegrationsTab() {
  const integrations = [
    { name: "Spotify", status: "connected", color: "#1DB954", since: "Jan 2026" },
    { name: "Apple Podcasts", status: "connected", color: "#A34EBE", since: "Jan 2026" },
    { name: "YouTube", status: "not_connected", color: "#DC143C" },
    { name: "RSS Feed", status: "connected", color: "#F4A600", since: "Dec 2025" },
    { name: "Slack", status: "not_connected", color: "#36C5F0" },
  ]

  return (
    <div className="flex flex-col gap-3">
      {integrations.map((integration) => (
        <div
          key={integration.name}
          className={cn(
            "flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] sm:flex-row sm:items-center sm:justify-between",
            "bg-[var(--color-bg-surface)] px-4 py-3"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-[var(--radius-sm)]"
              style={{ backgroundColor: integration.color + "20" }}
            >
              <div
                className="flex h-full w-full items-center justify-center rounded-[var(--radius-sm)]"
              >
                <span
                  className="text-[11px] font-bold"
                  style={{ color: integration.color }}
                >
                  {integration.name[0]}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
                {integration.name}
              </span>
              {integration.since && (
                <span className="text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
                  Connected since {integration.since}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {integration.status === "connected" ? (
              <>
                <Badge variant="success">Connected</Badge>
                <Button size="sm" variant="ghost">
                  <XCircle className="h-3.5 w-3.5" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary">
                Connect
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ApiDeveloperTab() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "mb-4 rounded-[var(--radius-md)] bg-[var(--color-accent-blue-light)] p-3",
              "text-[var(--text-caption)] text-[var(--color-accent-blue)]"
            )}
          >
            API access is available on Pro and Agency plans. Your keys allow programmatic access to all PodBrain features.
          </div>
          <div className="flex flex-col gap-2">
            <div
              className={cn(
                "flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)]",
                "bg-[var(--color-bg-hover)] px-3 py-2"
              )}
            >
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-display)] text-[var(--text-caption)] font-medium text-[var(--color-text-ink)]">
                  Production Key
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-text-tertiary)]">
                  pb_live_••••••••••••
                </span>
              </div>
              <Button size="sm" variant="ghost">
                Copy
              </Button>
            </div>
          </div>
          <Button size="sm" className="mt-3">
            Create New Key
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
            <div>
              <span className="block font-[family-name:var(--font-mono)] text-[var(--text-h2)] font-bold text-[var(--color-text-ink)]">
                120
              </span>
              <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                req/min
              </span>
            </div>
            <div>
              <span className="block font-[family-name:var(--font-mono)] text-[var(--text-h2)] font-bold text-[var(--color-text-ink)]">
                10K
              </span>
              <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                req/day
              </span>
            </div>
            <div>
              <span className="block font-[family-name:var(--font-mono)] text-[var(--text-h2)] font-bold text-[var(--color-text-ink)]">
                5
              </span>
              <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                concurrent
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Account & Preferences"
        badge={{ label: "ALL SYSTEMS NOMINAL", variant: "success" }}
      />

      <Tabs defaultValue="subscription">
        <TabList>
          <TabTrigger value="subscription">Subscription</TabTrigger>
          <TabTrigger value="integrations">Integrations</TabTrigger>
          <TabTrigger value="api">API & Developer</TabTrigger>
        </TabList>

        <TabContent value="subscription">
          <SubscriptionTab />
        </TabContent>
        <TabContent value="integrations">
          <IntegrationsTab />
        </TabContent>
        <TabContent value="api">
          <ApiDeveloperTab />
        </TabContent>
      </Tabs>
    </div>
  )
}

export { SettingsPage }
