'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileAudio, Link } from 'lucide-react'
import { AlertCard } from '@/components/podbrain/alert-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UploadData } from './upload-wizard'

interface StepUploadProps {
  uploadData: UploadData
  setUploadData: React.Dispatch<React.SetStateAction<UploadData>>
  onContinue: () => void
}

const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'video/mp4']
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4']

export function StepUpload({ uploadData, setUploadData, onContinue }: StepUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const validateFile = (file: File): boolean => {
    // Check file type
    const isValidType = SUPPORTED_FORMATS.some(format => file.type === format)
    const hasValidExtension = SUPPORTED_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!isValidType && !hasValidExtension) {
      setError('Unsupported file format. Please use MP3, WAV, M4A, or MP4.')
      return false
    }

    // Check file size (rough estimate for 4 hours at 256kbps = ~450MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      setError('File too large. Maximum file size is approximately 4 hours of audio.')
      return false
    }

    setError(null)
    return true
  }

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)
    setUploadData(prev => ({ ...prev, uploadProgress: 0 }))

    const formData = new FormData()
    formData.append('file', file)

    return new Promise<{ publicUrl: string; signedUrl: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadData(prev => ({ ...prev, uploadProgress: progress }))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch {
            reject(new Error('Invalid response from server'))
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            reject(new Error(errorResponse.error || 'Upload failed'))
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'))
      })

      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    })
  }, [setUploadData])

  const handleFile = useCallback(async (file: File) => {
    if (validateFile(file)) {
      setUploadData(prev => ({ ...prev, file, rssUrl: '' }))

      try {
        const { publicUrl, signedUrl } = await uploadFile(file)
        setUploadData(prev => ({
          ...prev,
          uploadProgress: 100,
          audioUrl: publicUrl,
          signedUrl: signedUrl
        }))
        setIsUploading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        setUploadData(prev => ({ ...prev, uploadProgress: 0, file: null }))
        setIsUploading(false)
      }
    }
  }, [setUploadData, uploadFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleRssSubmit = () => {
    if (uploadData.rssUrl.trim()) {
      // Validate URL
      try {
        new URL(uploadData.rssUrl)
        setError(null)
        // For RSS imports, mark as complete since no file upload is needed
        setUploadData(prev => ({ ...prev, uploadProgress: 100 }))
      } catch {
        setError('Please enter a valid URL')
      }
    }
  }

  const hasUploadSource = uploadData.file || uploadData.rssUrl.trim()
  const canContinue = hasUploadSource && uploadData.uploadProgress === 100

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Upload Your Audio
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Drop your podcast audio file or import from RSS
        </p>
      </div>

      {/* Drag and Drop Zone with enhanced states */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-[var(--radius-lg)] p-8
          flex flex-col items-center justify-center gap-4
          cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-[var(--accent-blue)] bg-[rgba(0,122,255,0.05)] shadow-[0_0_0_4px_rgba(0,122,255,0.1)]'
            : uploadData.file
              ? 'border-[var(--accent-green)] bg-[rgba(52,199,89,0.05)]'
              : 'border-[var(--border-soft)] bg-[var(--bg-subtle)] hover:border-[var(--accent-blue)] hover:bg-[rgba(0,122,255,0.02)]'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.mp4,audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadData.file ? (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-transform duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(52,199,89,0.15) 0%, rgba(52,199,89,0.05) 100%)'
              }}
            >
              <FileAudio className="w-8 h-8 text-[var(--accent-green)]" />
            </div>
            <div className="text-center">
              <p className="font-medium text-[var(--text-primary)]">
                {uploadData.file.name}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {(uploadData.file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-all duration-200
                ${isDragging ? 'scale-110' : 'scale-100'}
              `}
              style={{
                background: isDragging
                  ? 'linear-gradient(135deg, rgba(0,122,255,0.15) 0%, rgba(0,122,255,0.05) 100%)'
                  : 'linear-gradient(135deg, #F5F5F4 0%, #E5E5E4 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
              }}
            >
              <Upload className={`w-8 h-8 ${isDragging ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`} />
            </div>
            <div className="text-center">
              <p className="font-medium text-[var(--text-primary)]">
                Drop audio file or click to browse
              </p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Supported formats: MP3, WAV, M4A, MP4 - Max 4 hours
              </p>
            </div>
          </>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Uploading...</span>
            <span className="text-[var(--text-primary)] font-medium">
              {uploadData.uploadProgress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--accent-blue)] transition-[width] duration-200"
              style={{ width: `${uploadData.uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-soft)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-[var(--bg-elevated)] text-sm text-[var(--text-tertiary)]">
            OR
          </span>
        </div>
      </div>

      {/* RSS URL Input */}
      <div className="space-y-3">
        <label className="mono">Import from RSS Feed</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <Input
              type="url"
              placeholder="https://feeds.example.com/podcast.rss"
              value={uploadData.rssUrl}
              onChange={(e) => setUploadData(prev => ({ ...prev, rssUrl: e.target.value, file: null }))}
              className="pl-10"
              disabled={isUploading || !!uploadData.file}
            />
          </div>
          <Button
            type="button"
            onClick={handleRssSubmit}
            variant="secondary"
            disabled={!uploadData.rssUrl.trim() || isUploading || !!uploadData.file}
          >
            Import
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <AlertCard
          variant="error"
          title="Upload failed"
          description={error}
        />
      )}

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full justify-center"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
