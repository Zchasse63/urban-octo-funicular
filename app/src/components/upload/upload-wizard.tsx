"use client"

import { cn } from "@/lib/utils"
import { useState, useCallback } from "react"
import { StepIndicator } from "./step-indicator"
import { Dropzone } from "./dropzone"
import { Input, Textarea } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs"
import { Upload, Link as LinkIcon, Shield, Clock, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const WIZARD_STEPS = ["Select Audio", "Expert Context", "Style & Assets"]

function UploadWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Audio
  const [file, setFile] = useState<File | null>(null)
  const [urlInput, setUrlInput] = useState("")
  const [episodeTitle, setEpisodeTitle] = useState("")

  // Step 2: Expert Context
  const [guestName, setGuestName] = useState("")
  const [guestBio, setGuestBio] = useState("")
  const [contextNotes, setContextNotes] = useState("")

  // Step 3: Style & Assets
  const [contentStyle, setContentStyle] = useState("professional")

  const canProceed =
    step === 0
      ? file !== null || urlInput.trim() !== ""
      : step === 1
      ? true
      : true

  const handleSubmit = useCallback(async () => {
    if (!file && !urlInput) return

    setIsSubmitting(true)
    try {
      // Upload file
      let audioUrl = urlInput
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
        if (!uploadRes.ok) throw new Error("Upload failed")
        const uploadData = await uploadRes.json()
        audioUrl = uploadData.publicUrl
      }

      if (!audioUrl) throw new Error("No audio URL available")

      // Create episode
      const episodeRes = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: episodeTitle || undefined,
          audio_url: audioUrl,
          guest_name: guestName || undefined,
          guest_bio: guestBio || undefined,
          metadata: {
            context_notes: contextNotes || undefined,
            content_style: contentStyle,
          },
        }),
      })

      if (!episodeRes.ok) throw new Error("Failed to create episode")
      const episodeData = await episodeRes.json()
      const episodeId = episodeData.data?.id || episodeData.id

      // Trigger processing
      await fetch(`/api/episodes/${episodeId}/process`, { method: "POST" })

      toast.success("Episode uploaded! Processing has started.")
      router.push(`/episodes/${episodeId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      toast.error(`Upload failed: ${message}`)
      setIsSubmitting(false)
    }
  }, [file, urlInput, episodeTitle, guestName, guestBio, contextNotes, contentStyle, router])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <StepIndicator currentStep={step} steps={WIZARD_STEPS} />

      {/* Step 1: Select Audio */}
      {step === 0 && (
        <div className="animate-enter flex flex-col gap-6">
          <div>
            <label htmlFor="episode-title" className="mb-1.5 block text-label text-[var(--color-text-secondary)]">
              EPISODE TITLE
            </label>
            <Input
              id="episode-title"
              placeholder="e.g., The Future of AI with Dr. Sarah Chen"
              value={episodeTitle}
              onChange={(e) => setEpisodeTitle(e.target.value)}
            />
            <p className="mt-1 text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
              Optional — you can add or change this later
            </p>
          </div>

          <Tabs defaultValue="file">
            <TabList>
              <TabTrigger value="file">
                <Upload className="mr-1.5 inline h-3.5 w-3.5" />
                File Upload
              </TabTrigger>
              <TabTrigger value="url">
                <LinkIcon className="mr-1.5 inline h-3.5 w-3.5" />
                URL Import
              </TabTrigger>
            </TabList>

            <TabContent value="file">
              <Dropzone onFileSelect={setFile} className="mt-4" />
            </TabContent>

            <TabContent value="url">
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  placeholder="Paste YouTube URL, RSS feed, or direct audio link…"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <p className="text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
                  Supports YouTube, RSS feeds, and direct audio file URLs
                </p>
              </div>
            </TabContent>
          </Tabs>

          {/* Transcription info */}
          <div
            className={cn(
              "flex items-start gap-3 rounded-[var(--radius-md)]",
              "bg-[var(--color-accent-blue-light)] p-4"
            )}
          >
            <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-accent-blue)]" />
            <div className="flex flex-col gap-1">
              <span className="font-[family-name:var(--font-display)] text-[var(--text-caption)] font-semibold text-[var(--color-text-ink)]">
                Powered by Whisper v3
              </span>
              <div className="flex flex-wrap gap-3 text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> ~2x real-time
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> End-to-end encrypted
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Expert Context */}
      {step === 1 && (
        <div className="animate-enter flex flex-col gap-4">
          <div>
            <label htmlFor="guest-name" className="mb-1.5 block text-label text-[var(--color-text-secondary)]">
              GUEST NAME
            </label>
            <Input
              id="guest-name"
              placeholder="e.g., Dr. Sarah Chen"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="guest-bio" className="mb-1.5 block text-label text-[var(--color-text-secondary)]">
              GUEST BIO
            </label>
            <Textarea
              id="guest-bio"
              placeholder="Brief bio for AI context — helps generate better show notes and guest packages"
              value={guestBio}
              onChange={(e) => setGuestBio(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="context-notes" className="mb-1.5 block text-label text-[var(--color-text-secondary)]">
              CONTEXT NOTES
            </label>
            <Textarea
              id="context-notes"
              placeholder="Any additional context — topic themes, key points to highlight, target audience…"
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              rows={3}
            />
          </div>
          <p className="text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
            All fields are optional — the AI will work with whatever context you provide.
          </p>
        </div>
      )}

      {/* Step 3: Style & Assets */}
      {step === 2 && (
        <div className="animate-enter flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 block text-label text-[var(--color-text-secondary)]">
              CONTENT STYLE
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Content style">
              {["professional", "casual", "educational", "storytelling"].map((style) => (
                <button
                  key={style}
                  type="button"
                  role="radio"
                  aria-checked={contentStyle === style}
                  onClick={() => setContentStyle(style)}
                  className={cn(
                    "rounded-[var(--radius-md)] border px-3 py-2",
                    "font-[family-name:var(--font-display)] text-[var(--text-caption)] font-medium",
                    "transition-all duration-[var(--duration-fast)]",
                    contentStyle === style
                      ? "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue-light)] text-[var(--color-accent-blue)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                  )}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>

          <div
            className={cn(
              "rounded-[var(--radius-md)] border border-[var(--color-border)]",
              "bg-[var(--color-bg-surface)] p-4"
            )}
          >
            <span className="mb-2 block font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-semibold text-[var(--color-text-ink)]">
              Assets to Generate
            </span>
            <div className="flex flex-wrap gap-2">
              {["Show Notes", "Blog Post", "Social Posts", "Newsletter", "SEO Analysis", "Quote Cards", "Guest Package"].map(
                (asset) => (
                  <Badge key={asset} variant="blue">
                    {asset}
                  </Badge>
                )
              )}
            </div>
            <p className="mt-2 text-[var(--text-caption)] text-[var(--color-text-tertiary)]">
              All available assets for your plan will be generated
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </Button>

        {step < WIZARD_STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed}
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canProceed}
          >
            {isSubmitting ? "Processing…" : "Process Episode"}
          </Button>
        )}
      </div>
    </div>
  )
}

export { UploadWizard }
