"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, Mic, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dropzone } from "@/components/upload/dropzone"
import { Progress } from "@/components/ui/progress"
import useShows from "@/hooks/use-shows"
import { useToast } from "@/hooks/use-toast"

type UploadStep = "file" | "details" | "uploading"

export default function UploadPage() {
  const router = useRouter()
  const { shows } = useShows()
  const toast = useToast()

  const [step, setStep] = useState<UploadStep>("file")
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [guestName, setGuestName] = useState("")
  const [selectedShowId, setSelectedShowId] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    // Auto-fill title from filename
    const name = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
    setTitle(name)
  }, [])

  const handleContinue = useCallback(() => {
    if (!file) return
    setStep("details")
    // Auto-select first show if available
    if (shows.length > 0 && !selectedShowId) {
      setSelectedShowId(shows[0].id)
    }
  }, [file, shows, selectedShowId])

  const handleUpload = useCallback(async () => {
    if (!file || !selectedShowId) return

    setStep("uploading")
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Upload file
      setUploadProgress(10)
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || "Upload failed")
      }

      const uploadResult = await uploadResponse.json()
      setUploadProgress(50)

      // Step 2: Create episode record
      const episodeResponse = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          show_id: selectedShowId,
          title: title || "Untitled Episode",
          audio_url: uploadResult.publicUrl || uploadResult.signedUrl,
          guest_name: guestName || null,
        }),
      })

      if (!episodeResponse.ok) {
        throw new Error("Failed to create episode")
      }

      const episodeResult = await episodeResponse.json()
      const episodeId = episodeResult.data?.id || episodeResult.id
      setUploadProgress(80)

      // Step 3: Trigger processing
      if (episodeId) {
        await fetch(`/api/episodes/${episodeId}/process`, {
          method: "POST",
        })
      }
      setUploadProgress(100)

      toast.success("Episode uploaded", "Processing has started automatically.")

      // Navigate to episode workspace
      setTimeout(() => {
        router.push(`/episodes/${episodeId}`)
      }, 500)
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "Something went wrong")
      setStep("details")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [file, selectedShowId, title, guestName, router, toast])

  const steps = [
    { key: "file" as const, label: "Select File", number: 1 },
    { key: "details" as const, label: "Details", number: 2 },
    { key: "uploading" as const, label: "Process", number: 3 },
  ]
  const currentIndex = steps.findIndex(s => s.key === step)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Upload Episode"
        description="Add a new episode to process with AI"
      />
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6">
          {steps.map((s, i) => {
            const isComplete = i < currentIndex
            const isCurrent = s.key === step

            return (
              <div key={s.key} className="flex items-center gap-1">
                {i > 0 && (
                  <div className={`w-10 h-[2px] rounded-full transition-colors ${
                    isComplete ? "bg-[var(--color-accent-warm)]" : "bg-[var(--color-border)]"
                  }`} />
                )}
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-[family-name:var(--font-mono)] font-medium transition-all ${
                    isComplete
                      ? "bg-[var(--color-accent-warm)] text-white shadow-[0_1px_3px_rgba(194,105,61,0.3)]"
                      : isCurrent
                        ? "bg-[var(--color-accent-blue)] text-white shadow-[0_1px_3px_rgba(37,99,235,0.3)]"
                        : "bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)]"
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      s.number
                    )}
                  </div>
                  <span className={`text-[var(--text-label)] font-[family-name:var(--font-mono)] uppercase tracking-wider transition-colors ${
                    isCurrent ? "text-[var(--color-text-ink)]" : "text-[var(--color-text-tertiary)]"
                  }`}>
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Step 1: File Selection */}
        {step === "file" && (
          <Card>
            <CardContent className="space-y-4">
              <Dropzone onFileSelect={handleFileSelect} />
              <div className="flex justify-end">
                <Button onClick={handleContinue} disabled={!file}>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Episode Details */}
        {step === "details" && (
          <Card>
            <CardContent className="space-y-5">
              {/* Selected file summary */}
              {file && (
                <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] border border-[var(--color-border)]">
                  <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-accent-warm-light)] flex items-center justify-center">
                    <Mic className="w-4 h-4 text-[var(--color-accent-warm)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--text-body-sm)] text-[var(--color-text-ink)] font-medium truncate block">
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => { setStep("file"); setFile(null) }}
                    className="text-[var(--text-caption)] text-[var(--color-accent-blue)] hover:underline flex-shrink-0"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Show selector */}
              <div className="space-y-1.5">
                <label className="text-label">Show</label>
                <select
                  value={selectedShowId}
                  onChange={(e) => setSelectedShowId(e.target.value)}
                  className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] ring-1 ring-inset ring-white/30 bg-[var(--color-bg-surface)] text-[var(--text-body-sm)] text-[var(--color-text-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg-base)]"
                >
                  <option value="">Select a show...</option>
                  {shows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {show.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-label">Episode Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Episode title..."
                />
              </div>

              {/* Guest Name */}
              <div className="space-y-1.5">
                <label className="text-label">Guest Name <span className="text-[var(--color-text-tertiary)]">(optional)</span></label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest name for promo package..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep("file")}>
                  Back
                </Button>
                <Button onClick={handleUpload} disabled={!selectedShowId}>
                  <Upload className="w-4 h-4" />
                  Upload & Process
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Uploading/Processing */}
        {step === "uploading" && (
          <Card>
            <CardContent className="space-y-6 py-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--color-accent-blue-light)] border border-[var(--color-accent-blue)]/20 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-[var(--color-accent-blue)] animate-spin" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-h3)] text-[var(--color-text-ink)]">
                    {uploadProgress < 50
                      ? "Uploading audio..."
                      : uploadProgress < 80
                        ? "Creating episode..."
                        : uploadProgress < 100
                          ? "Starting processing..."
                          : "All done!"}
                  </h3>
                  <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)] mt-1">
                    {uploadProgress < 100
                      ? "This may take a moment for large files."
                      : "Redirecting to your episode..."}
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} color="blue" />
                </div>
                <span className="text-mono text-[var(--color-text-tertiary)]">
                  {uploadProgress}%
                </span>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
