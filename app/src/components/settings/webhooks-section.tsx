"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Webhook, Plus, Trash2, Check, X, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface WebhookRecord {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { value: 'episode.completed', label: 'Episode Completed', description: 'When an episode finishes processing' },
  { value: 'episode.failed', label: 'Episode Failed', description: 'When episode processing fails' },
  { value: 'asset.generated', label: 'Asset Generated', description: 'When a content asset is created' },
];

// ─── Component ──────────────────────────────────────────────────────────────

interface WebhooksSectionProps {
  addToast?: (message: string, type?: 'success' | 'error' | 'info', icon?: React.ElementType) => void;
}

export const WebhooksSection: React.FC<WebhooksSectionProps> = ({ addToast }) => {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/webhooks');
      if (!res.ok) throw new Error('Failed to fetch webhooks');
      const data = await res.json();
      setWebhooks(data.data?.webhooks || []);
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = async () => {
    if (!formUrl || formEvents.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formUrl,
          events: formEvents,
          secret: formSecret || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create webhook');
      }

      await fetchWebhooks();
      setShowForm(false);
      setFormUrl('');
      setFormSecret('');
      setFormEvents([]);
      addToast?.('Webhook created', 'success', CheckCircle2);
    } catch (err) {
      addToast?.(err instanceof Error ? err.message : 'Failed to create webhook', 'error', AlertCircle);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete webhook');
      await fetchWebhooks();
      addToast?.('Webhook deleted', 'success', CheckCircle2);
    } catch (err) {
      addToast?.(err instanceof Error ? err.message : 'Failed to delete webhook', 'error', AlertCircle);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2.5">
          <Webhook className="w-4 h-4 text-muted-foreground" />
          <span className="font-sans text-[13px] font-semibold text-foreground">Webhooks</span>
          <span className="font-mono text-[9px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full font-bold">
            Zapier / Make / n8n
          </span>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-[11px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" />
            Add Webhook
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Webhook</span>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* URL input */}
                <div>
                  <label className="block font-sans text-[11px] font-medium text-foreground/80 mb-1.5">Endpoint URL</label>
                  <input
                    type="url"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/50 bg-card border border-border focus:outline-none focus:border-ring focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all"
                  />
                </div>

                {/* Secret input */}
                <div>
                  <label className="block font-sans text-[11px] font-medium text-foreground/80 mb-1.5">
                    Signing Secret <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      placeholder="whsec_..."
                      value={formSecret}
                      onChange={(e) => setFormSecret(e.target.value)}
                      className="w-full px-3 py-2 pr-9 rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/50 bg-card border border-border focus:outline-none focus:border-ring focus:shadow-[0_0_0_3px_rgba(120,113,108,0.1)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Events checkboxes */}
                <div>
                  <label className="block font-sans text-[11px] font-medium text-foreground/80 mb-2">Events</label>
                  <div className="space-y-2">
                    {AVAILABLE_EVENTS.map((evt) => (
                      <label
                        key={evt.value}
                        className={cn(
                          'flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
                          formEvents.includes(evt.value)
                            ? 'bg-stone-900/5 border-stone-300'
                            : 'bg-card border-border hover:border-border/80'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formEvents.includes(evt.value)}
                          onChange={() => toggleEvent(evt.value)}
                          className="mt-0.5 rounded border-border"
                        />
                        <div>
                          <span className="font-sans text-[12px] font-medium text-foreground block">{evt.label}</span>
                          <span className="font-sans text-[10px] text-muted-foreground">{evt.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground bg-muted hover:bg-accent text-[11px] font-sans font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isSubmitting || !formUrl || formEvents.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-[11px] font-sans font-semibold hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {isSubmitting ? 'Creating...' : 'Create Webhook'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Webhook list */}
        {!isLoading && webhooks.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Webhook className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-sans text-[13px] font-medium text-muted-foreground">No webhooks configured</p>
              <p className="font-sans text-[11px] text-muted-foreground/70 mt-1">
                Add a webhook to receive notifications when episodes are processed.
              </p>
            </div>
          </div>
        )}

        {!isLoading && webhooks.length > 0 && (
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors group"
              >
                {/* Status dot */}
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  webhook.active
                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                    : 'bg-stone-400'
                )} />

                {/* Webhook details */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[12px] text-foreground truncate">
                    {webhook.url}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {webhook.events.map((evt) => (
                      <span
                        key={evt}
                        className="font-mono text-[9px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                      >
                        {evt}
                      </span>
                    ))}
                    {webhook.secret && (
                      <span className="font-mono text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Signed
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(webhook.id)}
                  disabled={deletingId === webhook.id}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === webhook.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhooksSection;
