"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Rss, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Radio, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import useShows from '@/hooks/use-shows'
import type { Show } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RssProxySectionProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info', icon?: React.ElementType) => void
}

interface FeedPreviewEpisode {
  id: string
  title: string | null
  published_at: string | null
  created_at: string
  status: string
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RssProxySection({ addToast }: RssProxySectionProps) {
  const { shows } = useShows()
  const [selectedShow, setSelectedShow] = useState<Show | null>(null)
  const [rssEnabled, setRssEnabled] = useState(false)
  const [rssToken, setRssToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewEpisodes, setPreviewEpisodes] = useState<FeedPreviewEpisode[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Auto-select first show
  useEffect(() => {
    if (shows.length > 0 && !selectedShow) {
      setSelectedShow(shows[0])
    }
  }, [shows, selectedShow])

  // Check if RSS is already enabled for this show
  useEffect(() => {
    if (selectedShow) {
      const prefs = selectedShow.style_preferences as Record<string, unknown>
      const token = prefs?.rss_token as string | undefined
      if (token) {
        setRssEnabled(true)
        setRssToken(token)
      } else {
        setRssEnabled(false)
        setRssToken(null)
      }
    }
  }, [selectedShow])

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://getpodbrain.ai'

  const feedUrl = selectedShow && rssToken
    ? `${baseUrl}/api/shows/${selectedShow.id}/rss?token=${rssToken}`
    : null

  const handleToggleRss = async () => {
    if (!selectedShow) return

    try {
      setLoading(true)

      if (rssEnabled) {
        // Disable RSS - remove token
        const res = await fetch(`/api/shows/${selectedShow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style_preferences: {
              ...selectedShow.style_preferences,
              rss_token: null,
            },
          }),
        })

        if (!res.ok) throw new Error('Failed to disable RSS proxy')

        setRssEnabled(false)
        setRssToken(null)
        addToast('RSS proxy feed disabled', 'info')
      } else {
        // Enable RSS - generate token
        const newToken = crypto.randomUUID()
        const res = await fetch(`/api/shows/${selectedShow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style_preferences: {
              ...selectedShow.style_preferences,
              rss_token: newToken,
            },
          }),
        })

        if (!res.ok) throw new Error('Failed to enable RSS proxy')

        setRssEnabled(true)
        setRssToken(newToken)
        addToast('RSS proxy feed enabled', 'success', Check)
      }
    } catch {
      addToast('Failed to update RSS settings', 'error', AlertCircle)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = () => {
    if (feedUrl) {
      navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      addToast('Feed URL copied to clipboard', 'success', Check)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const fetchPreview = useCallback(async () => {
    if (!selectedShow) return

    try {
      const res = await fetch(`/api/episodes?show_id=${selectedShow.id}&per_page=5&status=completed`)
      if (res.ok) {
        const json = await res.json()
        const eps = json.data || []
        setPreviewEpisodes(eps)
      }
    } catch {
      // Preview is non-critical
    }
  }, [selectedShow])

  useEffect(() => {
    if (showPreview && selectedShow) {
      fetchPreview()
    }
  }, [showPreview, selectedShow, fetchPreview])

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
            <Rss className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-[14px] text-foreground tracking-tight">
              RSS Proxy Feed
            </h3>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Podcasting 2.0 Enhanced
            </p>
          </div>
        </div>

        {/* Show selector if multiple shows */}
        {shows.length > 1 && (
          <select
            value={selectedShow?.id || ''}
            onChange={(e) => {
              const show = shows.find((s) => s.id === e.target.value)
              setSelectedShow(show || null)
            }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-sans text-foreground bg-card border border-border focus:outline-none focus:border-stone-400 transition-all"
          >
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[13px] font-medium text-foreground">
              Enable RSS Proxy
            </p>
            <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
              Generate a Podcasting 2.0 compatible RSS feed with chapters, transcripts, soundbites, and person tags.
            </p>
          </div>
          <button
            onClick={handleToggleRss}
            disabled={loading || !selectedShow}
            className={cn(
              'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
              rssEnabled ? 'bg-emerald-500' : 'bg-stone-300',
              loading && 'opacity-50'
            )}
          >
            <motion.div
              animate={{ x: rssEnabled ? 20 : 2 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>

        {/* Feed URL */}
        <AnimatePresence>
          {rssEnabled && feedUrl && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                {/* URL display */}
                <div className="bg-muted/60 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Feed URL
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-[11px] text-foreground/80 bg-card border border-border rounded-md px-3 py-2 overflow-x-auto whitespace-nowrap scrollbar-none select-all">
                      {feedUrl}
                    </code>
                    <button
                      onClick={handleCopyUrl}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-sans font-semibold transition-all border flex-shrink-0',
                        copied
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                          : 'text-muted-foreground hover:text-foreground bg-card border-border hover:bg-accent'
                      )}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-stone-900 text-stone-100 rounded-xl p-4 border border-stone-800/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Radio className="w-4 h-4 text-orange-400" />
                    <h4 className="font-sans font-bold text-[12px] tracking-tight">
                      How to Use Your RSS Proxy Feed
                    </h4>
                  </div>
                  <ol className="space-y-2 font-sans text-[11px] text-stone-300 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold text-orange-400 mt-0.5">1.</span>
                      Copy the feed URL above
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold text-orange-400 mt-0.5">2.</span>
                      Add it as a new podcast in your preferred app (Pocket Casts, Overcast, etc.)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold text-orange-400 mt-0.5">3.</span>
                      Apps supporting Podcasting 2.0 will display chapters, soundbites, transcripts, and person tags
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-[10px] font-bold text-orange-400 mt-0.5">4.</span>
                      The feed updates automatically as you process new episodes
                    </li>
                  </ol>
                </div>

                {/* Preview toggle */}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPreview ? 'Hide' : 'Show'} Feed Preview
                </button>

                {/* Preview */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border border-border rounded-lg overflow-hidden">
                        <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Recent Episodes in Feed
                          </span>
                        </div>
                        <div className="divide-y divide-border/50">
                          {previewEpisodes.length > 0 ? (
                            previewEpisodes.map((ep) => (
                              <div key={ep.id} className="flex items-center gap-3 px-4 py-2.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span className="font-sans text-[12px] text-foreground truncate flex-1">
                                  {ep.title || 'Untitled'}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0">
                                  {new Date(ep.published_at || ep.created_at).toLocaleDateString(
                                    'en-US',
                                    { month: 'short', day: 'numeric' }
                                  )}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center">
                              <p className="font-sans text-[12px] text-muted-foreground">
                                No completed episodes yet. Process an episode to include it in the feed.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disabled state message */}
        {!rssEnabled && (
          <div className="py-3 text-center">
            <p className="font-sans text-[12px] text-muted-foreground">
              Enable the RSS proxy to generate a Podcasting 2.0 enhanced feed for your show.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
