"use client"

import { useCallback, useState } from "react"
import { Upload, FileAudio, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { SUPPORTED_AUDIO_FORMATS, PROCESSING } from "@/lib/constants"
import { Button } from "@/components/ui/button"

interface DropzoneProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function Dropzone({ onFileSelect, disabled }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!SUPPORTED_AUDIO_FORMATS.includes(file.type as typeof SUPPORTED_AUDIO_FORMATS[number])) {
      return `Unsupported format. Accepted: MP3, M4A, WAV, AAC, OGG, WebM`
    }
    if (file.size > PROCESSING.maxFileSize) {
      return `File too large. Maximum: ${formatFileSize(PROCESSING.maxFileSize)}`
    }
    return null
  }, [])

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }
    setError(null)
    setSelectedFile(file)
    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [disabled, handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
  }, [])

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative rounded-[var(--radius-lg)] p-8",
          "transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]",
          "flex flex-col items-center justify-center gap-3 text-center",
          "cursor-pointer",
          "overflow-hidden",
          disabled && "opacity-50 cursor-not-allowed",
          isDragOver
            ? "border-2 border-[var(--color-accent-blue)] bg-[var(--color-accent-blue-light)] shadow-[inset_0_0_0_1px_var(--color-accent-blue)]"
            : selectedFile
              ? "border-2 border-[var(--color-status-success)] bg-[var(--color-status-success-light)]"
              : "border-2 border-dashed border-[var(--color-border-strong)] hover:border-[var(--color-text-tertiary)] bg-[var(--color-bg-hover)]/50 hover:bg-[var(--color-bg-hover)]"
        )}
      >
        {/* Inner grid pattern */}
        {!selectedFile && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: [
                'radial-gradient(circle, var(--color-text-ink) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '20px 20px',
            }}
          />
        )}

        <input
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />

        {selectedFile ? (
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-[var(--color-status-success)]/10 flex items-center justify-center mx-auto mb-2">
              <FileAudio className="w-6 h-6 text-[var(--color-status-success)]" />
            </div>
            <p className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-body)] text-[var(--color-text-ink)]">
              {selectedFile.name}
            </p>
            <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)] mt-0.5 font-[family-name:var(--font-mono)]">
              {formatFileSize(selectedFile.size)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 relative z-20"
              onClick={(e) => {
                e.preventDefault()
                clearFile()
              }}
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div className={cn(
              "w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-2",
              "border border-[var(--color-border)]",
              "transition-all duration-[var(--duration-normal)]",
              "shadow-[var(--shadow-button)]",
              isDragOver
                ? "bg-[var(--color-accent-blue)]/10 border-[var(--color-accent-blue)]/30"
                : "bg-[var(--color-bg-surface)]"
            )}>
              <Upload className={cn(
                "w-5 h-5 transition-colors",
                isDragOver ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-tertiary)]"
              )} />
            </div>
            <p className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-body)] text-[var(--color-text-ink)]">
              Drop your audio file here
            </p>
            <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)] mt-1">
              or click to browse
            </p>
            <div className="flex items-center gap-2 mt-3 text-[var(--text-label)] font-[family-name:var(--font-mono)] text-[var(--color-text-tertiary)]">
              <span>MP3, M4A, WAV, AAC, OGG</span>
              <span>&middot;</span>
              <span>Up to {formatFileSize(PROCESSING.maxFileSize)}</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-status-error-light)] border border-[var(--color-status-error)]/10 text-[var(--color-status-error)]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-[var(--text-caption)]">{error}</span>
        </div>
      )}
    </div>
  )
}

export { Dropzone }
