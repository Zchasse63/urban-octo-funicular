"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Mic2, X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { extractErrorMessage } from '@/lib/errors'
import useShows from '@/hooks/use-shows'
import type { Show } from '@/types/database'

interface CreateShowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (show: Show) => void
}

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
]

export function CreateShowDialog({ open, onOpenChange, onCreated }: CreateShowDialogProps) {
  const { createShow } = useShows()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hostName, setHostName] = useState('')
  const [language, setLanguage] = useState('en')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus name field on open
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(timer)
    }
  }, [open])

  const reset = useCallback(() => {
    setName('')
    setDescription('')
    setHostName('')
    setLanguage('en')
    setIsSubmitting(false)
    setError(null)
  }, [])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (isSubmitting) return
      onOpenChange(next)
      if (!next) setTimeout(reset, 200)
    },
    [isSubmitting, onOpenChange, reset]
  )

  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault()
      const trimmedName = name.trim()
      if (!trimmedName || isSubmitting) return

      setIsSubmitting(true)
      setError(null)

      try {
        const trimmedHostName = hostName.trim()
        const created = await createShow({
          name: trimmedName,
          description: description.trim() || undefined,
          default_language: language,
          // Store host_name inside style_preferences JSONB so the RSS tag
          // generator can emit a correct <podcast:person role="host"> tag
          // instead of falling back to the show name.
          style_preferences: trimmedHostName
            ? { host_name: trimmedHostName }
            : undefined,
        })

        if (!created) {
          throw new Error('Show creation failed')
        }

        onCreated?.(created)
        onOpenChange(false)
        setTimeout(reset, 200)
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to create show'))
        setIsSubmitting(false)
      }
    },
    [name, description, hostName, language, isSubmitting, createShow, onCreated, onOpenChange, reset]
  )

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content data-testid="create-show-dialog" className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
                <Mic2 className="w-4 h-4 text-stone-100" />
              </div>
              <div>
                <Dialog.Title className="font-sans font-bold text-[15px] text-foreground tracking-tight">
                  Create new show
                </Dialog.Title>
                <Dialog.Description className="text-[11.5px] font-serif text-muted-foreground">
                  Shows group your episodes and define vocabulary, branding, and style.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                disabled={isSubmitting}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-2">
              <label htmlFor="show-name" className="text-[12px] font-sans font-semibold text-foreground">
                Show name <span className="text-destructive">*</span>
              </label>
              <Input
                id="show-name"
                ref={inputRef}
                type="text"
                placeholder="The Founder's Notebook"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                maxLength={200}
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="show-description" className="text-[12px] font-sans font-semibold text-foreground">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                id="show-description"
                placeholder="Conversations with founders building the future."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={5000}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="show-host" className="text-[12px] font-sans font-semibold text-foreground">
                Host name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="show-host"
                type="text"
                placeholder="e.g. Alex Morgan"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                disabled={isSubmitting}
                maxLength={200}
                autoComplete="off"
              />
              <p className="text-[10.5px] font-serif text-muted-foreground leading-snug">
                Used for the Podcasting 2.0 <code className="font-mono text-[10px]">&lt;podcast:person role=&quot;host&quot;&gt;</code> tag in RSS exports. Can be edited later in settings.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="show-language" className="text-[12px] font-sans font-semibold text-foreground">
                Primary language
              </label>
              <select
                id="show-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-9 px-3 rounded-lg border border-border bg-card text-sm font-sans text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" size="sm" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                data-testid="create-show-submit"
                size="sm"
                disabled={!name.trim() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create show'
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
