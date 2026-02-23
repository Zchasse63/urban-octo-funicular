"use client"

import {
  Settings as SettingsIcon,
  CreditCard,
  Zap,
  Check,
  ExternalLink,
  Sparkles,
  Crown,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardFeatured, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import useSubscription from "@/hooks/use-subscription"
import { SUBSCRIPTION_TIERS } from "@/lib/constants"

export default function SettingsPage() {
  const { subscription, isLoading, checkout, openPortal } = useSubscription()

  const currentTier = subscription?.tier || "free"

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your subscription and account preferences"
      />

      <div className="space-y-8">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-accent-warm-light)] border border-[var(--color-accent-warm)]/20 flex items-center justify-center shadow-[var(--shadow-button)]">
                    <Zap className="w-5 h-5 text-[var(--color-accent-warm)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-body)] text-[var(--color-text-ink)]">
                        {SUBSCRIPTION_TIERS[currentTier as keyof typeof SUBSCRIPTION_TIERS]?.name || "Free"} Plan
                      </h3>
                      <Badge variant={currentTier === "free" ? "default" : "warm"}>
                        {currentTier === "free" ? "Free" : "Active"}
                      </Badge>
                    </div>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)] mt-0.5">
                      {currentTier === "free"
                        ? "3 episodes/month, 1 show"
                        : currentTier === "pro"
                          ? "Unlimited episodes, 3 shows"
                          : "Unlimited episodes, 20 shows, 5 team seats"}
                    </p>
                  </div>
                </div>
                {subscription?.stripe_subscription_id && (
                  <Button variant="secondary" onClick={openPortal}>
                    <CreditCard className="w-4 h-4" />
                    Manage Billing
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Tiers */}
        <div>
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-h2)] text-[var(--color-text-ink)] mb-1">
            Plans
          </h2>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-secondary)] mb-5">
            Choose the plan that fits your podcast workflow
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(Object.entries(SUBSCRIPTION_TIERS) as [string, typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]][]).map(([key, tier]) => {
              const isCurrent = key === currentTier
              const isPopular = key === "pro"

              const CardWrapper = isPopular ? CardFeatured : Card

              return (
                <CardWrapper
                  key={key}
                  {...(isPopular ? { accentColor: "blue" as const } : {})}
                >
                  <CardContent className="space-y-5">
                    <div>
                      <div className="flex items-center gap-2">
                        {isPopular && (
                          <Crown className="w-4 h-4 text-[var(--color-accent-blue)]" />
                        )}
                        <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-h3)]">
                          {tier.name}
                        </h3>
                        {isPopular && <Badge variant="blue">Popular</Badge>}
                      </div>
                      <div className="mt-3">
                        <span className="font-[family-name:var(--font-display)] font-bold text-[2.25rem] leading-none text-[var(--color-text-ink)]">
                          ${tier.priceMonthly}
                        </span>
                        {tier.priceMonthly > 0 && (
                          <span className="text-[var(--text-body-sm)] text-[var(--color-text-tertiary)] ml-1">/mo</span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2.5">
                      {[
                        `${tier.episodesPerMonth === Infinity ? "Unlimited" : tier.episodesPerMonth} episodes/month`,
                        `${tier.maxShows} show${tier.maxShows > 1 ? "s" : ""}`,
                        `${tier.teamSeats} team seat${tier.teamSeats > 1 ? "s" : ""}`,
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-[var(--text-body-sm)] text-[var(--color-text-secondary)]">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isPopular
                              ? "bg-[var(--color-accent-blue)]/10"
                              : "bg-[var(--color-status-success)]/10"
                          }`}>
                            <Check className={`w-2.5 h-2.5 flex-shrink-0 ${
                              isPopular
                                ? "text-[var(--color-accent-blue)]"
                                : "text-[var(--color-status-success)]"
                            }`} />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button variant="secondary" disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        variant={isPopular ? "primary" : "secondary"}
                        className="w-full"
                        onClick={() => checkout(key)}
                      >
                        {isPopular && <Sparkles className="w-4 h-4" />}
                        {tier.priceMonthly === 0 ? "Downgrade" : "Upgrade"}
                      </Button>
                    )}
                  </CardContent>
                </CardWrapper>
              )
            })}
          </div>
        </div>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Buzzsprout", description: "Podcast hosting platform", connected: false },
                { name: "Stripe", description: "Payment processing", connected: !!subscription?.stripe_subscription_id },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-hover)]/30 hover:bg-[var(--color-bg-hover)] transition-colors duration-[var(--duration-fast)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-[var(--shadow-button)]">
                      <SettingsIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                    </div>
                    <div>
                      <span className="font-[family-name:var(--font-display)] font-medium text-[var(--text-body-sm)] text-[var(--color-text-ink)]">
                        {integration.name}
                      </span>
                      <p className="text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  {integration.connected ? (
                    <Badge variant="success">Connected</Badge>
                  ) : (
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
