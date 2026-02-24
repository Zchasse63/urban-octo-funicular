"use client"

import { cn } from "@/lib/utils"
import { Upload, FileAudio } from "lucide-react"
import { useState, useCallback, useRef } from "react"

interface DropzoneProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  className?: string
}

function Dropzone({
  onFileSelect,
  accept = "audio/*",
  maxSize = 500 * 1024 * 1024,
  className,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      if (!file.type.startsWith("audio/")) {
        setError("Please select an audio file")
        return
      }

      if (file.size > maxSize) {
        setError(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`)
        return
      }

      setSelectedFile(file)
      onFileSelect(file)
    },
    [onFileSelect, maxSize]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        "rounded-[var(--radius-lg)] border-2 border-dashed",
        "px-6 py-12 text-center",
        "transition-all duration-[var(--duration-fast)]",
        "cursor-pointer",
        isDragging
          ? "border-[var(--color-accent-blue)] bg-[var(--color-accent-blue-light)]"
          : "border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-strong)]",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {selectedFile ? (
        <>
          <FileAudio className="mb-3 h-10 w-10 text-[var(--color-accent-blue)]" />
          <span className="font-[family-name:var(--font-display)] text-[var(--text-body)] font-semibold text-[var(--color-text-ink)]">
            {selectedFile.name}
          </span>
          <span className="mt-1 font-[family-name:var(--font-mono)] text-[var(--text-caption)] text-[var(--color-text-secondary)]">
            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
          </span>
        </>
      ) : (
        <>
          <Upload
            className={cn(
              "mb-3 h-10 w-10",
              isDragging ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-tertiary)]"
            )}
          />
          <span className="font-[family-name:var(--font-display)] text-[var(--text-body)] font-semibold text-[var(--color-text-ink)]">
            Drop audio file here
          </span>
          <span className="mt-1 text-[var(--text-caption)] text-[var(--color-text-secondary)]">
            or click to browse — MP3, WAV, M4A up to 500MB
          </span>
        </>
      )}

      {error && (
        <span className="mt-2 text-[var(--text-caption)] text-[var(--color-status-error)]">
          {error}
        </span>
      )}
    </div>
  )
}

export { Dropzone }
