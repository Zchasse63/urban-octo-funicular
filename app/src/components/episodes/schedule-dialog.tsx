"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, X, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduleDialogProps {
  episodeId: string;
  episodeTitle?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

interface ScheduleInfo {
  episodeId: string;
  scheduledAt: string;
  scheduledBy: string;
  status: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLocalDatetime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getMinDatetime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // At least 5 minutes from now
  return formatLocalDatetime(now);
}

function getMaxDatetime(): string {
  const max = new Date();
  max.setDate(max.getDate() + 30);
  return formatLocalDatetime(max);
}

function formatDisplayDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDisplayTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ScheduleDialog({
  episodeId,
  episodeTitle,
  isOpen,
  onClose,
  onScheduled,
}: ScheduleDialogProps) {
  const [selectedDatetime, setSelectedDatetime] = useState(getMinDatetime());
  const [existingSchedule, setExistingSchedule] = useState<ScheduleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingSchedule, setFetchingSchedule] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Fetch existing schedule
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function fetchSchedule() {
      try {
        setFetchingSchedule(true);
        setError(null);
        setSuccess(false);
        const res = await fetch(`/api/episodes/${episodeId}/schedule`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to fetch schedule');
        }
        const json = await res.json();
        if (!cancelled) {
          setExistingSchedule(json.data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load schedule');
        }
      } finally {
        if (!cancelled) {
          setFetchingSchedule(false);
        }
      }
    }

    fetchSchedule();
    return () => { cancelled = true; };
  }, [episodeId, isOpen]);

  const handleSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const scheduledAt = new Date(selectedDatetime).toISOString();
      const res = await fetch(`/api/episodes/${episodeId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to schedule episode');
      }

      const json = await res.json();
      setExistingSchedule(json.data);
      setSuccess(true);
      onScheduled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  }, [episodeId, selectedDatetime, onScheduled]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/schedule`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to cancel schedule');
      }

      setExistingSchedule(null);
      setSuccess(false);
      onScheduled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  }, [episodeId, onScheduled]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden mx-4">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/60 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-sans text-[14px] font-semibold text-foreground tracking-tight">
                      Schedule Processing
                    </h3>
                    {episodeTitle && (
                      <p className="font-sans text-[11px] text-muted-foreground mt-0.5 truncate max-w-[250px]">
                        {episodeTitle}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="px-5 pb-5">
                {/* Loading existing schedule */}
                {fetchingSchedule && (
                  <div className="flex items-center gap-2 py-6 justify-center">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    <span className="font-sans text-[12px] text-muted-foreground">Loading schedule...</span>
                  </div>
                )}

                {/* Existing schedule */}
                {!fetchingSchedule && existingSchedule && !success && (
                  <div className="space-y-4">
                    <div className="bg-sky-50 border border-sky-200/60 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-sky-700">
                          Scheduled
                        </span>
                      </div>
                      <p className="font-sans text-[13px] text-foreground font-medium">
                        {formatDisplayDate(existingSchedule.scheduledAt)}
                      </p>
                      <p className="font-sans text-[12px] text-muted-foreground mt-0.5">
                        {formatDisplayTime(existingSchedule.scheduledAt)}
                      </p>
                    </div>

                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-sans font-semibold transition-colors border',
                        'border-red-200 text-red-700 bg-red-50 hover:bg-red-100',
                        cancelling && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {cancelling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      {cancelling ? 'Cancelling...' : 'Cancel Schedule'}
                    </button>
                  </div>
                )}

                {/* Success state */}
                {!fetchingSchedule && success && existingSchedule && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200/60 rounded-lg p-4 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-sans text-[13px] text-foreground font-semibold">
                        Processing Scheduled
                      </p>
                      <p className="font-sans text-[12px] text-muted-foreground mt-1">
                        {formatDisplayDate(existingSchedule.scheduledAt)} at {formatDisplayTime(existingSchedule.scheduledAt)}
                      </p>
                    </div>

                    <button
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 text-white text-[12px] font-sans font-semibold hover:bg-stone-800 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* New schedule form */}
                {!fetchingSchedule && !existingSchedule && !success && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="schedule-datetime"
                        className="block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2"
                      >
                        Date & Time
                      </label>
                      <input
                        id="schedule-datetime"
                        type="datetime-local"
                        value={selectedDatetime}
                        min={getMinDatetime()}
                        max={getMaxDatetime()}
                        onChange={(e) => setSelectedDatetime(e.target.value)}
                        className={cn(
                          'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground',
                          'font-sans text-[13px]',
                          'focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400',
                          'transition-colors'
                        )}
                      />
                      <p className="font-sans text-[10px] text-muted-foreground mt-1.5">
                        Schedule up to 30 days in advance. Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </p>
                    </div>

                    {/* Preview */}
                    {selectedDatetime && (
                      <div className="bg-muted/30 border border-border rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            Will process at
                          </span>
                        </div>
                        <p className="font-sans text-[12px] text-foreground">
                          {formatDisplayDate(new Date(selectedDatetime).toISOString())} at{' '}
                          {formatDisplayTime(new Date(selectedDatetime).toISOString())}
                        </p>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200/60 rounded-lg px-3 py-2.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="font-sans text-[11px] text-red-700">{error}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground text-[12px] font-sans font-semibold hover:bg-muted/30 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSchedule}
                        disabled={loading || !selectedDatetime}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-sans font-semibold transition-colors',
                          'bg-stone-900 text-white hover:bg-stone-800',
                          (loading || !selectedDatetime) && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {loading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5" />
                        )}
                        {loading ? 'Scheduling...' : 'Schedule'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
