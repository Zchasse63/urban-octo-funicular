"use client"

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Zap, Download, Check, Copy, RefreshCw, Key, Clock, Eye, EyeOff, Plus, Trash2, ExternalLink, CheckCircle2, XCircle, AlertCircle, ChevronRight, Wifi, Radio, Youtube, Rss, Slack, Music, TrendingUp, Shield, ArrowUpRight, Package, ChevronDown, Webhook, Bell, AlertTriangle, X, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

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
interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string;
  created: string;
  status: 'active' | 'expired';
}
interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: 'paid' | 'pending';
}
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: React.ElementType;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [{
  id: 'spotify',
  name: 'Spotify',
  description: 'Auto-publish episodes to your Spotify podcast feed',
  icon: Music,
  iconBg: 'bg-[#1DB954]/10',
  iconColor: 'text-[#1DB954]',
  connected: true,
  connectedSince: 'Mar 2024',
  badge: 'Publishing'
}, {
  id: 'apple',
  name: 'Apple Podcasts',
  description: 'Sync show notes and chapters with Apple Podcasts Connect',
  icon: Radio,
  iconBg: 'bg-violet-50',
  iconColor: 'text-violet-500',
  connected: true,
  connectedSince: 'Mar 2024',
  badge: 'Syncing'
}, {
  id: 'youtube',
  name: 'YouTube',
  description: 'Upload audiogram clips and full video episodes automatically',
  icon: Youtube,
  iconBg: 'bg-red-50',
  iconColor: 'text-red-500',
  connected: false
}, {
  id: 'rss',
  name: 'RSS Feed',
  description: 'Publish to any podcast directory via custom RSS endpoint',
  icon: Rss,
  iconBg: 'bg-orange-50',
  iconColor: 'text-orange-500',
  connected: true,
  connectedSince: 'Feb 2024',
  badge: 'Live'
}, {
  id: 'slack',
  name: 'Slack',
  description: 'Get notified when episodes are processed and assets are ready',
  icon: Slack,
  iconBg: 'bg-sky-50',
  iconColor: 'text-sky-500',
  connected: false
}];
const API_KEYS: ApiKey[] = [{
  id: 'key1',
  name: 'Production Studio',
  key: 'pb_live_sk_a4f8c2e1b9d7f3a0c5e2',
  lastUsed: '2 minutes ago',
  created: 'Mar 15, 2024',
  status: 'active'
}, {
  id: 'key2',
  name: 'Zapier Integration',
  key: 'pb_live_sk_b9e3d7c1a0f4e8b2c6d9',
  lastUsed: '3 hours ago',
  created: 'Feb 2, 2024',
  status: 'active'
}, {
  id: 'key3',
  name: 'Dev / Staging',
  key: 'pb_test_sk_c2a9f1e7b4d0c8e3a7f2',
  lastUsed: '14 days ago',
  created: 'Jan 10, 2024',
  status: 'expired'
}];
const BILLING_HISTORY: BillingRecord[] = [{
  id: 'inv001',
  date: 'May 1, 2024',
  description: 'PodBrain Pro — Monthly',
  amount: '$49.00',
  status: 'paid'
}, {
  id: 'inv002',
  date: 'Apr 1, 2024',
  description: 'PodBrain Pro — Monthly',
  amount: '$49.00',
  status: 'paid'
}, {
  id: 'inv003',
  date: 'Mar 1, 2024',
  description: 'PodBrain Pro — Monthly',
  amount: '$49.00',
  status: 'paid'
}, {
  id: 'inv004',
  date: 'Feb 1, 2024',
  description: 'PodBrain Pro — Monthly',
  amount: '$49.00',
  status: 'paid'
}, {
  id: 'inv005',
  date: 'Jan 1, 2024',
  description: 'PodBrain Pro — Monthly',
  amount: '$49.00',
  status: 'paid'
}, {
  id: 'inv006',
  date: 'Dec 1, 2023',
  description: 'PodBrain Starter — Monthly',
  amount: '$19.00',
  status: 'paid'
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
  return <button onClick={handleCopy} className={cn('flex items-center gap-1.5 p-1.5 rounded-md transition-all', copied ? 'text-emerald-600 bg-emerald-50' : 'text-muted-foreground/70 hover:text-foreground/80 hover:bg-accent', className)} title={label || 'Copy to clipboard'}>
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
        <span className="font-mono text-[10px] text-muted-foreground/70">{pct}% used</span>
        <span className="font-mono text-[10px] text-muted-foreground/70">
          {(total - used).toLocaleString()} {unit} remaining
        </span>
      </div>
    </div>;
};

// ─── Subscription Tab ─────────────────────────────────────────────────────────

const SubscriptionTab = ({
  addToast
}: {
  addToast: (msg: string, type?: Toast['type'], icon?: React.ElementType) => void;
}) => {
  const [showAllBilling, setShowAllBilling] = useState(false);
  const visibleRecords = showAllBilling ? BILLING_HISTORY : BILLING_HISTORY.slice(0, 3);
  return <div className="space-y-5">
      {/* Plan card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Current Plan</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            Active
          </span>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-800 to-black flex items-center justify-center shadow-md flex-shrink-0">
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-lg text-foreground tracking-tight leading-none mb-1">Pro Plan</h3>
                <p className="font-mono text-[11px] text-muted-foreground/70 mb-2.5">Billed monthly · Renews Jun 1, 2024</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold text-foreground">$49</span>
                  <span className="font-sans text-sm text-muted-foreground/70">/ month</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <button className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[12px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm">
                <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                Change Plan
              </button>
              <button className="flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground/70 hover:text-foreground/80 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Manage in Stripe
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border/50">
            {['500 audio minutes / mo', '10 GB storage', 'All asset types', 'Priority processing', 'API access'].map(f => <span key={f} className="flex items-center gap-1.5 font-sans text-[11px] text-muted-foreground bg-muted/80 border border-border px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                {f}
              </span>)}
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Usage — May 2024</span>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-muted-foreground/50" />
            <span className="font-mono text-[10px] text-muted-foreground/70">Resets Jun 1</span>
          </div>
        </div>
        <div className="space-y-5">
          <UsageMeter label="Audio Minutes" used={412} total={500} unit="min" color="bg-gradient-to-r from-amber-400 to-amber-500" />
          <UsageMeter label="Storage" used={6.8} total={10} unit="GB" color="bg-gradient-to-r from-sky-400 to-sky-500" />
          <UsageMeter label="API Calls" used={3240} total={10000} unit="calls" color="bg-gradient-to-r from-emerald-400 to-emerald-500" />
        </div>
      </div>

      {/* Billing history — expandable */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Billing History</span>
          <button onClick={() => setShowAllBilling(v => !v)} className="flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground/70 hover:text-foreground/80 transition-colors">
            {showAllBilling ? 'Show less' : `View all ${BILLING_HISTORY.length}`}
            <motion.div animate={{
            rotate: showAllBilling ? 180 : 0
          }} transition={{
            duration: 0.2
          }}>
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </button>
        </div>
        <div className="divide-y divide-border/50">
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
                <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[13px] font-medium text-foreground">{record.description}</p>
                    <p className="font-mono text-[10px] text-muted-foreground/70">{record.date}</p>
                  </div>
                  <span className="font-mono text-[13px] font-bold text-foreground">{record.amount}</span>
                  <span className={cn('font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', record.status === 'paid' ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' : 'text-amber-700 bg-amber-50 border-amber-200/60')}>
                    {record.status}
                  </span>
                  <button onClick={() => addToast(`Downloading invoice for ${record.date}…`, 'info', Download)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-muted-foreground/70 hover:text-foreground/80 hover:bg-accent border border-transparent hover:border-border transition-all text-[11px] font-sans font-medium opacity-0 group-hover:opacity-100">
                    <Download className="w-3 h-3" />
                    PDF
                  </button>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-red-200/60 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          <span className="font-sans text-[11px] font-semibold text-red-600">Danger Zone</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[13px] font-medium text-foreground/80">Cancel subscription</p>
            <p className="font-sans text-[11px] text-muted-foreground/70 mt-0.5">
              Your data will be retained for 30 days after cancellation.
            </p>
          </div>
          <button onClick={() => addToast('Please contact support to cancel your plan.', 'info', Bell)} className="px-4 py-2 rounded-lg text-[12px] font-sans font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
            Cancel Plan
          </button>
        </div>
      </div>
    </div>;
};

// ─── Integration Card ─────────────────────────────────────────────────────────

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
            {connected && integration.connectedSince && <p className="font-mono text-[10px] text-muted-foreground/70 mt-0.5">Since {integration.connectedSince}</p>}
          </div>
        </div>

        {/* Toggle */}
        <button onClick={handleToggle} disabled={toggling} aria-label={connected ? `Disconnect ${integration.name}` : `Connect ${integration.name}`} className={cn('relative rounded-full border transition-all duration-300 flex items-center p-0.5 flex-shrink-0', toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer', connected ? 'bg-stone-900 border-stone-800' : 'bg-muted border-border')} style={{
        width: 36,
        height: 20
      }}>
          {toggling ? <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-3 h-3 text-muted-foreground/70 animate-spin" />
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
              <XCircle className="w-3 h-3 text-muted-foreground/50" />
              <span className="font-mono text-[10px] font-bold text-muted-foreground/70">Not connected</span>
            </>}
        </div>
        {connected && <button className="flex items-center gap-1 font-sans text-[10px] text-muted-foreground/70 hover:text-foreground/80 transition-colors">
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
  const webhookUrl = 'https://hooks.yourdomain.com/podbrain';
  return <div className="space-y-5">
      {/* Webhook — promoted to top */}
      <div className="bg-stone-900 text-white rounded-xl p-5 border border-stone-800/50 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.18)]">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Webhook className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-sans font-semibold text-[13px]">Webhook Endpoint</span>
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
            <p className="font-sans text-[11px] text-stone-400 mb-3 leading-relaxed">
              Receive real-time events when episodes are processed, assets are generated, or errors occur.
            </p>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
              <Link2 className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
              <code className="font-mono text-[11px] text-stone-300 flex-1 truncate select-all">{webhookUrl}</code>
              <button onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              addToast('Webhook URL copied', 'success', Copy);
            }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-[11px] font-sans font-medium text-stone-200 flex-shrink-0">
                <Copy className="w-3 h-3" />
                Copy
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-[11px] font-sans font-medium text-stone-200 flex-shrink-0">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

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

// ─── API Key Row ──────────────────────────────────────────────────────────────

const ApiKeyRow = ({
  apiKey,
  onDelete,
  addToast
}: {
  apiKey: ApiKey;
  onDelete: (id: string) => void;
  addToast: (msg: string, type?: Toast['type'], icon?: React.ElementType) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const isExpired = apiKey.status === 'expired';

  // Always show partially masked key; reveal full key only when toggled
  const maskedKey = apiKey.key.slice(0, 14) + '••••••••••••';
  const displayKey = visible ? apiKey.key : maskedKey;
  const handleCopy = () => {
    if (isExpired) return;
    navigator.clipboard.writeText(apiKey.key);
    addToast(`Key "${apiKey.name}" copied to clipboard`, 'success', Copy);
  };
  const handleDelete = () => {
    onDelete(apiKey.id);
    addToast(`Key "${apiKey.name}" revoked`, 'info', Trash2);
  };
  return <div className={cn('flex items-center gap-4 px-5 py-4 transition-colors', isExpired ? 'bg-muted/30 opacity-70' : 'hover:bg-muted/30')}>
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isExpired ? 'bg-muted-foreground/50' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]')} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('font-sans text-[13px] font-semibold', isExpired ? 'text-muted-foreground' : 'text-foreground')}>
            {apiKey.name}
          </span>
          {isExpired && <span className="font-mono text-[9px] font-bold text-red-600 bg-red-50 border border-red-200/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Expired
            </span>}
        </div>
        <div className="flex items-center gap-2">
          <code className={cn('font-mono text-[11px] px-2 py-0.5 rounded border tracking-tight select-all', isExpired ? 'text-muted-foreground/70 bg-muted/60 border-border' : 'text-muted-foreground bg-muted border-border')}>
            {displayKey}
          </code>
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
        <div className="flex items-center gap-1 text-muted-foreground/70">
          <Clock className="w-3 h-3" />
          <span className="font-mono text-[10px]">{apiKey.lastUsed}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/50">Created {apiKey.created}</span>
      </div>

      {/* Action buttons — always visible (not only on hover) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!isExpired && <button onClick={() => setVisible(v => !v)} className="p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground/80 hover:bg-accent transition-all" title={visible ? 'Hide key' : 'Reveal full key'}>
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>}
        {!isExpired && <button onClick={handleCopy} className="p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground/80 hover:bg-accent transition-all" title="Copy key">
            <Copy className="w-3.5 h-3.5" />
          </button>}
        <button onClick={handleDelete} className={cn('p-1.5 rounded-md transition-all', isExpired ? 'text-muted-foreground/50 hover:text-red-500 hover:bg-red-50' : 'text-muted-foreground/70 hover:text-red-600 hover:bg-red-50')} title={isExpired ? 'Remove expired key' : 'Revoke key'}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>;
};

// ─── API Tab ──────────────────────────────────────────────────────────────────

const ApiTab = ({
  addToast
}: {
  addToast: (msg: string, type?: Toast['type'], icon?: React.ElementType) => void;
}) => {
  const [keys, setKeys] = useState<ApiKey[]>(API_KEYS);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [baseUrlCopied, setBaseUrlCopied] = useState(false);
  const handleDelete = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
  };
  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    const newKey: ApiKey = {
      id: `key${Date.now()}`,
      name: newKeyName.trim(),
      key: `pb_live_sk_${Math.random().toString(36).slice(2, 22)}`,
      lastUsed: 'Never',
      created: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: 'active'
    };
    setKeys(prev => [newKey, ...prev]);
    setNewKeyName('');
    setCreatingKey(false);
    addToast(`API key "${newKey.name}" created`, 'success', Key);
  };
  const handleCancelCreate = () => {
    setCreatingKey(false);
    setNewKeyName('');
  };
  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText('https://api.podbrain.io/v2');
    setBaseUrlCopied(true);
    addToast('Base URL copied to clipboard', 'success', Copy);
    setTimeout(() => setBaseUrlCopied(false), 1800);
  };
  const activeKeys = keys.filter(k => k.status === 'active');
  const expiredKeys = keys.filter(k => k.status === 'expired');
  return <div className="space-y-5">
      {/* API info banner */}
      <div className="bg-stone-900 text-stone-100 rounded-xl p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.18)] border border-stone-800/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
            <Shield className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1">
            <h4 className="font-sans font-bold text-[13px] tracking-tight mb-1">Studio API — v2</h4>
            <p className="font-sans text-[12px] text-stone-400 leading-relaxed">
              Use API keys to authenticate requests from your apps, automation tools, or integrations. Keys are shown
              partially masked — reveal and copy them securely.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <a href="#" className="flex items-center gap-1.5 font-sans text-[11px] text-stone-300 hover:text-white transition-colors">
                <ExternalLink className="w-3 h-3" />
                API Reference Docs
              </a>
              <span className="w-1 h-1 rounded-full bg-stone-700" />
              <a href="#" className="flex items-center gap-1.5 font-sans text-[11px] text-stone-300 hover:text-white transition-colors">
                <ChevronRight className="w-3 h-3" />
                Rate limits & quotas
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Keys table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              API Keys
            </span>
            <span className="font-mono text-[10px] font-bold text-muted-foreground/70 bg-muted border border-border px-1.5 py-0.5 rounded-full">
              {activeKeys.length} active
            </span>
          </div>
          <button onClick={() => setCreatingKey(true)} disabled={creatingKey} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white text-[11px] font-sans font-semibold hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-sm">
            <Plus className="w-3 h-3" />
            New Key
          </button>
        </div>

        {/* Create key form */}
        <AnimatePresence>
          {creatingKey && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: 'auto',
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} transition={{
          duration: 0.2,
          ease: 'easeOut'
        }} className="overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-muted/50 border-b border-border/50">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <input autoFocus type="text" placeholder="Key name (e.g. Production App)" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') handleCancelCreate();
            }} className="flex-1 px-3 py-2 rounded-lg text-[13px] font-sans text-foreground placeholder:text-muted-foreground bg-card border border-border focus:outline-none focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all" />
                <button onClick={handleCreate} disabled={!newKeyName.trim()} className="px-3 py-2 rounded-lg text-[12px] font-sans font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 transition-colors">
                  Create
                </button>
                <button onClick={handleCancelCreate} className="px-3 py-2 rounded-lg text-[12px] font-sans text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Active keys */}
        <div className="divide-y divide-border/50">
          <AnimatePresence>
            {activeKeys.map(key => <motion.div key={key.id} initial={{
            opacity: 0,
            x: -8
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: 8,
            height: 0
          }} transition={{
            duration: 0.2
          }}>
                <ApiKeyRow apiKey={key} onDelete={handleDelete} addToast={addToast} />
              </motion.div>)}
          </AnimatePresence>

          {/* Expired keys section */}
          {expiredKeys.length > 0 && <>
              <div className="px-5 py-2 bg-muted/30">
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Expired — read only
                </span>
              </div>
              <AnimatePresence>
                {expiredKeys.map(key => <motion.div key={key.id} initial={{
              opacity: 0,
              x: -8
            }} animate={{
              opacity: 1,
              x: 0
            }} exit={{
              opacity: 0,
              x: 8,
              height: 0
            }} transition={{
              duration: 0.2
            }}>
                    <ApiKeyRow apiKey={key} onDelete={handleDelete} addToast={addToast} />
                  </motion.div>)}
              </AnimatePresence>
            </>}

          {/* Empty state */}
          {keys.length === 0 && <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-3">
                <Key className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="font-sans text-[13px] font-medium text-muted-foreground mb-1">No API keys yet</p>
              <p className="font-sans text-[11px] text-muted-foreground/70 mb-4">
                Create a key to start making authenticated requests to the PodBrain API.
              </p>
              <button onClick={() => setCreatingKey(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-sans font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Create your first key
              </button>
            </div>}
        </div>
      </div>

      {/* Base URL */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 block mb-3">Base URL</span>
        <div className="flex items-center gap-3 bg-muted/60 border border-border rounded-lg px-4 py-3">
          <code className="font-mono text-[12px] text-foreground/80 flex-1 select-all">https://api.podbrain.io/v2</code>
          <button onClick={handleCopyBaseUrl} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-sans font-medium transition-all border', baseUrlCopied ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' : 'text-muted-foreground hover:text-foreground/80 bg-muted/60 hover:bg-muted border-border')}>
            {baseUrlCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {baseUrlCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Rate limits — linked to usage */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Rate Limits — Pro Plan
          </span>
          <button className="flex items-center gap-1 font-sans text-[10px] text-muted-foreground/70 hover:text-foreground/80 transition-colors">
            <ArrowUpRight className="w-3 h-3" />
            View current usage
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{
          label: 'Requests / minute',
          value: '120',
          icon: Zap,
          current: 43,
          max: 120
        }, {
          label: 'Requests / day',
          value: '10,000',
          icon: RefreshCw,
          current: 3240,
          max: 10000
        }, {
          label: 'Concurrent jobs',
          value: '5',
          icon: Package,
          current: 2,
          max: 5
        }].map(stat => {
          const StatIcon = stat.icon;
          const pct = Math.round(stat.current / stat.max * 100);
          return <div key={stat.label} className="bg-muted/30 border border-border/50 rounded-lg p-3.5 text-center">
                <StatIcon className="w-4 h-4 text-muted-foreground/50 mx-auto mb-2" />
                <span className="font-mono text-lg font-bold text-foreground block leading-none mb-1">{stat.value}</span>
                <span className="font-sans text-[10px] text-muted-foreground/70 block mb-2">{stat.label}</span>
                {/* Mini usage bar */}
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground rounded-full transition-all" style={{
                width: `${pct}%`
              }} />
                </div>
                <span className="font-mono text-[9px] text-muted-foreground/70 mt-1 block">{pct}% in use</span>
              </div>;
        })}
        </div>
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
  return <div className="flex-1 h-full overflow-y-auto relative bg-background" style={{
    backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.065) 1px, transparent 1px)`,
    backgroundSize: '22px 22px'
  }}>
      <div className="max-w-4xl mx-auto px-6 py-7">

        {/* ── Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">Settings</span>
          </div>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="font-sans font-bold text-[22px] text-foreground tracking-tight leading-tight mb-1.5">
                Account & Preferences
              </h1>
              <p className="font-serif text-sm text-muted-foreground/70 leading-relaxed">
                Manage your subscription, connected platforms, and developer access.
              </p>
            </div>
            <div className="flex-shrink-0 bg-card border border-border rounded-xl px-5 py-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.07)] flex flex-col items-center gap-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Account Health</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="font-mono text-[12px] font-bold text-emerald-700">All Systems Nominal</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="relative mb-5">
          <div className="flex items-stretch bg-muted/40 rounded-xl p-1 border border-border gap-1">
            {TAB_CONFIG.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('relative flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-sans font-medium transition-all duration-150 flex-1 justify-center', isActive ? 'bg-card text-foreground shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,1)_inset] border border-border' : 'text-muted-foreground hover:text-foreground/80 hover:bg-accent/50')}>
                  <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/70')} />
                  <span>{tab.label}</span>
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
            {activeTab === 'subscription' && <SubscriptionTab addToast={addToast} />}
            {activeTab === 'integrations' && <IntegrationsTab addToast={addToast} />}
            {activeTab === 'api' && <ApiTab addToast={addToast} />}
          </motion.div>
        </AnimatePresence>

        <div className="h-12" />
      </div>

      {/* ── Toast Layer ── */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>;
};
