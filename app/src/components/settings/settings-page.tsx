"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Zap, Download, Check, Copy, RefreshCw, Key, ExternalLink, CheckCircle2, XCircle, AlertCircle, ChevronRight, Wifi, Radio, Youtube, Rss, Slack, Music, TrendingUp, Shield, ArrowUpRight, Package, ChevronDown, Webhook, Bell, AlertTriangle, X, Link2, Construction, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import useSubscription from '@/hooks/use-subscription';
import { useUsage } from '@/hooks/use-usage';
import { PRICING_TIERS, type PricingTier } from '@/lib/stripe/products';
import WebhooksSection from './webhooks-section';
import RssProxySection from './rss-proxy-section';
import { EmbeddedCheckoutModal } from '@/components/stripe/embedded-checkout-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

// Team tab hidden for launch — team collaboration deferred to Phase 2.
// See docs/planning/FUTURE-IMPROVEMENTS.md
type SettingsTab = 'subscription' | 'integrations' | 'api';
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  connected: boolean;
  connectedSince?: string;
  badge?: string;
}
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: React.ElementType;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [{
  id: 'buzzsprout',
  name: 'Buzzsprout',
  description: 'Import episodes and sync show notes with your Buzzsprout podcast',
  icon: Wifi,
  iconBg: 'bg-emerald-50',
  iconColor: 'text-emerald-500',
  connected: false
}, {
  id: 'transistor',
  name: 'Transistor',
  description: 'Sync episodes and push show notes to your Transistor podcast',
  icon: Zap,
  iconBg: 'bg-indigo-50',
  iconColor: 'text-indigo-500',
  connected: false
}, {
  id: 'rss',
  name: 'RSS Feed',
  description: 'Publish Podcasting 2.0 enhanced RSS with chapters, transcripts & more',
  icon: Rss,
  iconBg: 'bg-orange-50',
  iconColor: 'text-orange-500',
  connected: false,
  badge: 'Coming Soon'
}, {
  id: 'spotify',
  name: 'Spotify',
  description: 'Auto-publish episodes to your Spotify podcast feed',
  icon: Music,
  iconBg: 'bg-[#1DB954]/10',
  iconColor: 'text-[#1DB954]',
  connected: false,
  badge: 'Coming Soon'
}, {
  id: 'apple',
  name: 'Apple Podcasts',
  description: 'Sync show notes and chapters with Apple Podcasts Connect',
  icon: Radio,
  iconBg: 'bg-violet-50',
  iconColor: 'text-violet-500',
  connected: false,
  badge: 'Coming Soon'
}, {
  id: 'youtube',
  name: 'YouTube',
  description: 'Upload audiogram clips and full video episodes automatically',
  icon: Youtube,
  iconBg: 'bg-red-50',
  iconColor: 'text-red-500',
  connected: false,
  badge: 'Coming Soon'
}];
const TAB_CONFIG: {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
}[] = [{
  id: 'subscription',
  label: 'Subscription',
  icon: CreditCard
}, {
  id: 'integrations',
  label: 'Integrations',
  icon: Wifi
}, {
  id: 'api',
  label: 'API & Developer',
  icon: Key
}];
// NOTE: Team tab hidden for launch — team collaboration is deferred to Phase 2.
// See docs/planning/FUTURE-IMPROVEMENTS.md for the full Phase 2 scope.

// ─── Toast System ─────────────────────────────────────────────────────────────

const ToastContainer = ({
  toasts,
  onDismiss
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) => <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map(toast => {
      const Icon = toast.icon;
      return <motion.div key={toast.id} initial={{
        opacity: 0,
        y: 16,
        scale: 0.95
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: -8,
        scale: 0.96
      }} transition={{
        duration: 0.22,
        ease: 'easeOut'
      }} className={cn('pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-[12px] font-sans font-medium', toast.type === 'success' && 'bg-stone-900 text-white border-stone-800', toast.type === 'error' && 'bg-red-600 text-white border-red-700', toast.type === 'info' && 'bg-card text-foreground/80 border-border')}>
            {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => onDismiss(toast.id)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </motion.div>;
    })}
    </AnimatePresence>
  </div>;
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast['type'] = 'success', icon?: React.ElementType) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, {
      id,
      message,
      type,
      icon
    }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  return {
    toasts,
    addToast,
    dismissToast
  };
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

const CopyButton = ({
  text,
  onCopied,
  className,
  label
}: {
  text: string;
  onCopied?: () => void;
  className?: string;
  label?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 1800);
  };
  return <button onClick={handleCopy} className={cn('flex items-center gap-1.5 p-1.5 rounded-md transition-all', copied ? 'text-emerald-600 bg-emerald-50' : 'text-muted-foreground hover:text-foreground/80 hover:bg-accent', className)} title={label || 'Copy to clipboard'}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>;
};

// ─── Usage Meter ──────────────────────────────────────────────────────────────

const UsageMeter = ({
  label,
  used,
  total,
  unit,
  color
}: {
  label: string;
  used: number;
  total: number;
  unit: string;
  color: string;
}) => {
  const pct = Math.round(used / total * 100);
  const isHigh = pct >= 80;
  const isCritical = pct >= 95;
  return <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-sans text-[12px] font-medium text-foreground/80">{label}</span>
          {isHigh && <span className={cn('flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider', isCritical ? 'text-red-700 bg-red-50 border border-red-200/60' : 'text-amber-700 bg-amber-50 border border-amber-200/60')}>
              {isCritical ? <AlertTriangle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {isCritical ? 'Critical' : 'High'}
            </span>}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          <span className={cn('font-bold', isHigh ? 'text-amber-600' : 'text-foreground')}>
            {used.toLocaleString()}
          </span>{' '}
          / {total.toLocaleString()} {unit}
        </span>
      </div>
      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div initial={{
        width: 0
      }} animate={{
        width: `${pct}%`
      }} transition={{
        duration: 1.0,
        ease: 'easeOut',
        delay: 0.1
      }} className={cn('h-full rounded-full', color)} style={{
        boxShadow: isHigh ? '0 0 8px rgba(245,158,11,0.4)' : undefined
      }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground">{pct}% used</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {(total - used).toLocaleString()} {unit} remaining
        </span>
      </div>
    </div>;
};

// ─── Subscription Tab ─────────────────────────────────────────────────────────

interface InvoiceRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  description: string | null;
}

const SubscriptionTab = ({
  addToast,
  subscription,
  subLoading,
  onManageStripe,
  onCheckout,
  usage,
  usageLoading,
}: {
  addToast: (msg: string, type?: Toast['type'], icon?: React.ElementType) => void;
  subscription: { id?: string; status: string | null; tier: PricingTier; trialEndsAt?: string | null; pastDueSince?: string | null; stripe_subscription_id?: string; current_period_end?: string } | null;
  subLoading: boolean;
  onManageStripe: () => void;
  onCheckout: (tier: string) => void;
  usage: { tier: string; status: string; trialEndsAt: string; pastDueSince: string | null; billingPeriod: { start: string; end: string }; audioMinutes: { used: number; limit: number; percentage: number }; shows: { used: number; limit: number; percentage: number } } | null;
  usageLoading: boolean;
}) => {
  const [showAllBilling, setShowAllBilling] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  useEffect(() => {
    setInvoicesLoading(true);
    fetch('/api/stripe/invoices')
      .then(r => r.json())
      .then(json => setInvoices(json.data || []))
      .catch(() => {})
      .finally(() => setInvoicesLoading(false));
  }, []);

  // Derive plan details from subscription data. Default to 'pro' since new
  // users start on a 14-day Pro trial (no free tier).
  const tier: PricingTier = subscription?.tier ?? 'pro';
  const tierInfo = PRICING_TIERS[tier];
  const planName = `${tierInfo.name} Plan`;
  const price = tierInfo.price;
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const statusLabel = subscription?.status
    ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
    : 'Active';

  // Format renewal date from current_period_end
  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const visibleRecords = showAllBilling ? invoices : invoices.slice(0, 3);
  return <div className="space-y-5">
      {/* Plan card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 bg-muted/30">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Plan</span>
          {subLoading ? (
            <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full uppercase tracking-wider">Loading…</span>
          ) : (
            <span className={cn(
              'flex items-center gap-1.5 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border',
              isActive
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                : 'text-amber-700 bg-amber-50 border-amber-200/60'
            )}>
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                isActive
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                  : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
              )} />
              {statusLabel}
            </span>
          )}
        </div>

        <div className="px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-stone-800 to-black flex items-center justify-center shadow-md flex-shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="font-sans font-bold text-base sm:text-lg text-foreground tracking-tight leading-none mb-1">{planName}</h2>
                <p className="font-mono text-[11px] text-muted-foreground mb-2.5">
                  {subscription?.status === 'trialing'
                    ? '14-day trial — upgrade to continue'
                    : `Billed monthly${renewalDate ? ` · Renews ${renewalDate}` : ''}`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold text-foreground">${price}</span>
                  <span className="font-sans text-sm text-muted-foreground">/ month</span>
                </div>
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 sm:flex-shrink-0">
              <button
                onClick={() => onCheckout(tier === 'pro' ? 'creator' : tier === 'creator' ? 'agency' : 'agency')}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[12px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                {tier === 'agency' ? 'Manage Plan' : 'Upgrade Plan'}
              </button>
              {price > 0 && (
                <button
                  onClick={onManageStripe}
                  className="flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground hover:text-foreground/80 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Manage in Stripe
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border/50">
            {tierInfo.features.map(f => <span key={f} className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground bg-muted/80 border border-border px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                {f}
              </span>)}
          </div>
        </div>
      </div>

      {/* Nearing limit warning banner */}
      {!usageLoading && usage && (usage.audioMinutes.percentage >= 80 || usage.shows.percentage >= 80) && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200/60 rounded-xl px-4 sm:px-5 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[13px] font-semibold text-amber-800">
              You&apos;re nearing your plan limits
            </p>
            <p className="font-sans text-[11px] text-amber-700/80 mt-0.5">
              {usage.audioMinutes.percentage >= 80 && `${usage.audioMinutes.used} of ${usage.audioMinutes.limit} minutes used. `}
              {usage.shows.percentage >= 80 && `${usage.shows.used} of ${usage.shows.limit} shows used. `}
              Upgrade to avoid interruptions.
            </p>
          </div>
          <button
            onClick={() => onCheckout(tier === 'pro' ? 'creator' : tier === 'creator' ? 'agency' : 'agency')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 text-white rounded-lg text-[11px] font-sans font-semibold hover:bg-amber-700 transition-colors shadow-sm flex-shrink-0"
          >
            <TrendingUp className="w-3 h-3" />
            Upgrade
          </button>
        </div>
      )}

      {/* Usage */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Usage — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-muted-foreground/80" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {usage?.billingPeriod.end
                ? `Resets ${new Date(usage.billingPeriod.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : renewalDate ? `Resets ${renewalDate}` : 'Monthly reset'}
            </span>
          </div>
        </div>
        {usageLoading ? (
          <div className="space-y-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-2 w-full bg-muted rounded-full" />
                <div className="flex justify-between">
                  <div className="h-2.5 w-16 bg-muted rounded" />
                  <div className="h-2.5 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <UsageMeter label="Audio Minutes" used={usage?.audioMinutes.used ?? 0} total={usage?.audioMinutes.limit ?? tierInfo.audioMinutesPerMonth} unit="min" color="bg-gradient-to-r from-amber-400 to-amber-500" />
            <UsageMeter label="Shows" used={usage?.shows.used ?? 0} total={usage?.shows.limit ?? tierInfo.shows} unit="shows" color="bg-gradient-to-r from-sky-400 to-sky-500" />
          </div>
        )}
      </div>

      {/* Billing history — expandable */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 bg-muted/30">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Billing History</span>
          {invoices.length > 3 && (
            <button onClick={() => setShowAllBilling(v => !v)} className="flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground hover:text-foreground/80 transition-colors">
              {showAllBilling ? 'Show less' : `View all ${invoices.length}`}
              <motion.div animate={{
              rotate: showAllBilling ? 180 : 0
            }} transition={{
              duration: 0.2
            }}>
                <ChevronDown className="w-3 h-3" />
              </motion.div>
            </button>
          )}
        </div>
        <div className="divide-y divide-border/50">
          {invoicesLoading ? (
            <div className="px-4 sm:px-6 py-8 text-center">
              <RefreshCw className="w-4 h-4 text-muted-foreground/60 animate-spin mx-auto mb-2" />
              <p className="font-sans text-[11px] text-muted-foreground">Loading billing history...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 text-center">
              <CreditCard className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
              <p className="font-sans text-[12px] text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {visibleRecords.map(record => <motion.div key={record.id} initial={{
              opacity: 0,
              height: 0
            }} animate={{
              opacity: 1,
              height: 'auto'
            }} exit={{
              opacity: 0,
              height: 0
            }} transition={{
              duration: 0.18
            }} className="overflow-hidden">
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 hover:bg-muted/30 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 hidden sm:flex">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-[13px] font-medium text-foreground truncate">{record.description || 'Invoice'}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="font-mono text-[13px] font-bold text-foreground flex-shrink-0">
                      ${record.amount.toFixed(2)}
                    </span>
                    <span className={cn('font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border hidden sm:inline-flex', record.status === 'paid' ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' : 'text-amber-700 bg-amber-50 border-amber-200/60')}>
                      {record.status}
                    </span>
                    {record.pdfUrl ? (
                      <a
                        href={record.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-accent border border-transparent hover:border-border transition-all text-[11px] font-sans font-medium opacity-0 group-hover:opacity-100 hidden sm:flex"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </a>
                    ) : (
                      <button onClick={() => addToast('PDF not available for this invoice', 'info', AlertCircle)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-muted-foreground/50 hover:bg-accent border border-transparent transition-all text-[11px] font-sans font-medium opacity-0 group-hover:opacity-100 hidden sm:flex cursor-not-allowed">
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    )}
                  </div>
                </motion.div>)}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-red-200/60 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="font-sans text-[11px] font-semibold text-red-600">Danger Zone</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-sans text-[13px] font-medium text-foreground/80">Cancel subscription</p>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
              Your data will be retained for 30 days after cancellation.
            </p>
          </div>
          <button onClick={() => addToast('Please contact support to cancel your plan.', 'info', Bell)} className="px-4 py-2 rounded-lg text-[12px] font-sans font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors self-start sm:self-auto flex-shrink-0">
            Cancel Plan
          </button>
        </div>
      </div>
    </div>;
};

// ─── Integration Card ─────────────────────────────────────────────────────────

// TODO: Wire to real API for integration connect/disconnect state
const IntegrationCard = ({
  integration,
  addToast
}: {
  integration: Integration;
  addToast: (msg: string, type?: Toast['type'], icon?: React.ElementType) => void;
}) => {
  const [connected, setConnected] = useState(integration.connected);
  const [toggling, setToggling] = useState(false);
  const Icon = integration.icon;
  // TODO: Wire to real API for toggling integration connection
  const handleToggle = () => {
    if (toggling) return;
    setToggling(true);
    setTimeout(() => {
      const next = !connected;
      setConnected(next);
      setToggling(false);
      addToast(next ? `${integration.name} connected successfully` : `${integration.name} disconnected`, next ? 'success' : 'info', next ? CheckCircle2 : XCircle);
    }, 700);
  };
  return <div className={cn('bg-card border rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200', connected ? 'border-border' : 'border-border opacity-75 hover:opacity-100 hover:border-border')}>
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border border-border', integration.iconBg)}>
            <Icon className={cn('w-5 h-5', integration.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-sans font-semibold text-[13px] text-foreground tracking-tight">{integration.name}</h4>
              {connected && integration.badge && <span className="font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  {integration.badge}
                </span>}
            </div>
            {connected && integration.connectedSince && <p className="font-mono text-[10px] text-muted-foreground mt-0.5">Since {integration.connectedSince}</p>}
          </div>
        </div>

        {/* Toggle */}
        <button onClick={handleToggle} disabled={toggling} aria-label={connected ? `Disconnect ${integration.name}` : `Connect ${integration.name}`} className={cn('relative rounded-full border transition-all duration-300 flex items-center p-0.5 flex-shrink-0', toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer', connected ? 'bg-stone-900 border-stone-800' : 'bg-muted border-border')} style={{
        width: 36,
        height: 20
      }}>
          {toggling ? <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
            </div> : <motion.div animate={{
          x: connected ? 16 : 0
        }} transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }} className="w-4 h-4 rounded-full bg-white shadow-sm" />}
        </button>
      </div>

      <p className="font-sans text-[11.5px] text-muted-foreground leading-relaxed mb-4">{integration.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {connected ? <>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span className="font-mono text-[10px] font-bold text-emerald-600">Connected</span>
            </> : <>
              <XCircle className="w-3 h-3 text-muted-foreground/80" />
              <span className="font-mono text-[10px] font-bold text-muted-foreground">Not connected</span>
            </>}
        </div>
        {connected && <button className="flex items-center gap-1 font-sans text-[10px] text-muted-foreground hover:text-foreground/80 transition-colors">
            <ExternalLink className="w-3 h-3" />
            Configure
          </button>}
        {!connected && <button onClick={handleToggle} className="flex items-center gap-1 font-sans text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-3 h-3" />
            Connect
          </button>}
      </div>
    </div>;
};

// ─── Integrations Tab ─────────────────────────────────────────────────────────

const IntegrationsTab = ({
  addToast
}: {
  addToast: (msg: string, type?: Toast['type'], icon?: React.ElementType) => void;
}) => {
  const connectedCount = INTEGRATIONS.filter(i => i.connected).length;
  return <div className="space-y-5">
      {/* RSS Proxy Feed */}
      <RssProxySection addToast={addToast} />

      {/* Webhooks — real CRUD management */}
      <WebhooksSection addToast={addToast} />

      {/* Connected summary */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1">
          <p className="font-sans text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{connectedCount} of {INTEGRATIONS.length}</span> platforms connected
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[12px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          Browse All Integrations
        </button>
      </div>

      {/* 3-column responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {INTEGRATIONS.map(integration => <IntegrationCard key={integration.id} integration={integration} addToast={addToast} />)}
      </div>
    </div>;
};

// ─── API Tab ──────────────────────────────────────────────────────────────────

// PodBrain does not yet ship a public REST API. This tab is intentionally a
// placeholder until the API ships (see docs/planning/FUTURE-IMPROVEMENTS.md).
// The previous implementation displayed mocked API keys, fake usage meters,
// and a fictional `api.podbrain.io` base URL — that has been removed.
const ApiTab = () => {
  const plannedFeatures = [
    'Programmatic episode upload',
    'Asset retrieval (transcripts, show notes, RSS tags)',
    'Webhook subscriptions for processing events',
    'Per-key rate limiting and audit logs',
  ];
  return <div className="space-y-5">
      {/* Coming soon banner */}
      <div className="bg-stone-900 text-stone-100 rounded-xl p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.18)] border border-stone-800/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
            <Construction className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-sans font-bold text-[13px] tracking-tight">Public API</h4>
              <span className="font-mono text-[9px] font-bold text-amber-200 bg-amber-500/10 border border-amber-400/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <p className="font-sans text-[12px] text-stone-300 leading-relaxed">
              We&apos;re building a developer API for PodBrain. It&apos;s not yet available — the access controls,
              billing, and rate limits ship together so we can hold the experience to the same bar as the rest
              of the studio.
            </p>
          </div>
        </div>
      </div>

      {/* What's planned */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3">
          What&apos;s planned
        </span>
        <ul className="space-y-2">
          {plannedFeatures.map(feature => <li key={feature} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 mt-1.5 flex-shrink-0" />
              <span className="font-sans text-[12px] text-foreground/80 leading-relaxed">{feature}</span>
            </li>)}
        </ul>
      </div>

      {/* In the meantime */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3">
          In the meantime
        </span>
        <p className="font-sans text-[12px] text-foreground/80 leading-relaxed">
          You can already automate a lot through the <strong>Integrations</strong> tab — Buzzsprout sync,
          webhooks for processing events, and the public RSS proxy each cover the most common automations
          podcasters ask for.
        </p>
      </div>
    </div>;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('subscription');
  const {
    toasts,
    addToast,
    dismissToast
  } = useToast();
  const { subscription, isLoading: subLoading, openPortal, startCheckout, checkoutIntent, cancelCheckout } = useSubscription();
  const { usage, isLoading: usageLoading } = useUsage();

  const handleManageStripe = async () => {
    try {
      await openPortal();
    } catch (err) {
      console.error('Failed to open Stripe portal:', err);
      addToast('Failed to open Stripe portal', 'error', AlertCircle);
    }
  };
  return <div className="flex-1 h-full overflow-y-auto relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7">

        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest">Settings</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="font-sans font-bold text-xl sm:text-[22px] text-foreground tracking-tight leading-tight mb-1.5">
                Account & Preferences
              </h1>
              <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                Manage your subscription, connected platforms, and developer access.
              </p>
            </div>
            <div className="sm:flex-shrink-0 bg-card border border-border rounded-xl px-5 py-3 sm:py-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.07)] flex sm:flex-col items-center sm:items-center gap-2 sm:gap-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/80">Account Health</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="font-mono text-[12px] font-bold text-emerald-700">All Systems Nominal</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="relative mb-5">
          <div className="flex items-stretch bg-muted/40 rounded-xl p-1 border border-border gap-1 overflow-x-auto scrollbar-none">
            {TAB_CONFIG.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[12px] font-sans font-medium transition-all duration-150 flex-1 justify-center whitespace-nowrap flex-shrink-0 sm:flex-shrink', isActive ? 'bg-card text-foreground shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,1)_inset] border border-border' : 'text-muted-foreground hover:text-foreground/80 hover:bg-accent/50')}>
                  <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  {isActive && <motion.div layoutId="settingsViewTabIndicator" className="absolute bottom-[5px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-stone-800 rounded-full" />}
                </button>;
          })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{
          opacity: 0,
          y: 6
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -4
        }} transition={{
          duration: 0.18,
          ease: 'easeOut'
        }}>
            {activeTab === 'subscription' && <SubscriptionTab addToast={addToast} subscription={subscription} subLoading={subLoading} onManageStripe={handleManageStripe} onCheckout={startCheckout} usage={usage} usageLoading={usageLoading} />}
            {activeTab === 'integrations' && <IntegrationsTab addToast={addToast} />}
            {activeTab === 'api' && <ApiTab />}
            {/* Team section hidden for launch — team collaboration deferred to Phase 2 */}
          </motion.div>
        </AnimatePresence>

        <div className="h-12" />
      </div>

      {/* ── Toast Layer ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ── Embedded Stripe Checkout (no redirect) ── */}
      <EmbeddedCheckoutModal
        open={!!checkoutIntent}
        onOpenChange={(open) => { if (!open) cancelCheckout(); }}
        tier={checkoutIntent?.tier || 'pro'}
        interval={checkoutIntent?.interval}
      />
    </div>;
};
