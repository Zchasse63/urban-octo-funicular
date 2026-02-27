"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Copy, Pencil, X, Undo2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Character limits per platform ──────────────────────────────────────────

const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  twitter_single: 280,
  twitter_thread: 280,
  linkedin_post: 3000,
  linkedin_post_host: 3000,
  linkedin_post_guest: 3000,
  linkedin_article: 40000,
  instagram_caption: 2200,
  instagram_carousel: 2200,
  tiktok_hooks: 300,
  tiktok_hook: 300,
  tiktok_script: 1000,
  youtube_description: 5000,
  youtube_title_tags: 500,
  seo_description: 320,
  guest_bio_short: 500,
  podcast_teaser: 500,
  ai_summary_short: 500,
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AssetEditorProps {
  episodeId: string;
  assetId: string;
  assetType: string;
  initialContent: string;
  onSave?: (content: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const AssetEditor: React.FC<AssetEditorProps> = ({
  episodeId,
  assetId,
  assetType,
  initialContent,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [editDraft, setEditDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charLimit = PLATFORM_CHAR_LIMITS[assetType] ?? null;

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = 'auto';
      ta.style.height = `${Math.max(120, ta.scrollHeight)}px`;
    }
  }, [isEditing, editDraft]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const startEditing = useCallback(() => {
    setEditDraft(content);
    setIsEditing(true);
    setSaveStatus('idle');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [content]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditDraft('');
    setSaveStatus('idle');
  }, []);

  const revertToOriginal = useCallback(() => {
    setEditDraft(initialContent);
  }, [initialContent]);

  const saveContent = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const res = await fetch(`/api/episodes/${episodeId}/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editDraft }),
      });

      if (!res.ok) {
        throw new Error('Failed to save asset');
      }

      setContent(editDraft);
      setIsEditing(false);
      setSaveStatus('saved');
      onSave?.(editDraft);

      // Reset saved indicator after a brief delay
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2500);
    } catch (err) {
      console.error('Failed to save asset:', err);
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  }, [editDraft, episodeId, assetId, isSaving, onSave]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [content]);

  const isOverLimit = charLimit !== null && editDraft.length > charLimit;
  const hasChanges = editDraft !== content;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          {/* Save status indicator */}
          <AnimatePresence mode="wait">
            {saveStatus === 'saved' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              >
                <Check className="w-2.5 h-2.5" />
                Saved
              </motion.span>
            )}
            {saveStatus === 'saving' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 font-mono text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              >
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Saving
              </motion.span>
            )}
          </AnimatePresence>

          {isEditing && charLimit !== null && (
            <span
              className={cn(
                'font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full border',
                isOverLimit
                  ? 'text-red-600 bg-red-50 border-red-200/60'
                  : 'text-muted-foreground bg-muted border-border'
              )}
            >
              {editDraft.length}/{charLimit}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isEditing ? (
            <>
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-accent border border-transparent hover:border-border transition-all text-[11px] font-sans font-medium"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-transparent transition-all text-[11px] font-sans font-medium',
                  copied
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200/60'
                    : 'text-muted-foreground hover:text-foreground/80 hover:bg-accent hover:border-border'
                )}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          ) : (
            <>
              {editDraft !== initialContent && (
                <button
                  onClick={revertToOriginal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-accent border border-transparent hover:border-border transition-all text-[11px] font-sans font-medium"
                  title="Revert to original AI-generated content"
                >
                  <Undo2 className="w-3 h-3" />
                  Revert
                </button>
              )}
              <button
                onClick={cancelEditing}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-accent border border-transparent hover:border-border transition-all text-[11px] font-sans font-medium disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onClick={saveContent}
                disabled={isSaving || !hasChanges || isOverLimit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white hover:bg-stone-800 transition-colors text-[11px] font-sans font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            className={cn(
              'w-full min-h-[120px] font-mono text-[13px] leading-relaxed bg-transparent border-0 rounded-none resize-none focus:outline-none focus:ring-0 text-foreground/80 placeholder:text-muted-foreground/50',
              isOverLimit && 'text-red-600'
            )}
            placeholder="Enter asset content..."
            spellCheck={false}
          />
        ) : (
          <div className="whitespace-pre-wrap font-serif text-[13.5px] text-foreground/80 leading-[1.75]">
            {content || 'No content yet.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetEditor;
