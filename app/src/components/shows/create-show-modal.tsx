'use client'

import * as React from 'react'
import { X, Upload, Podcast } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CreateShowModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: {
    name: string
    description: string
    defaultLanguage: string
    artworkFile: File | null
  }) => void
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
]

export function CreateShowModal({ isOpen, onClose, onCreate }: CreateShowModalProps) {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [defaultLanguage, setDefaultLanguage] = React.useState('en')
  const [artworkFile, setArtworkFile] = React.useState<File | null>(null)
  const [artworkPreview, setArtworkPreview] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArtworkFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setArtworkPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveArtwork = () => {
    setArtworkFile(null)
    setArtworkPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({
      name: name.trim(),
      description: description.trim(),
      defaultLanguage,
      artworkFile,
    })
    // Reset form
    setName('')
    setDescription('')
    setDefaultLanguage('en')
    setArtworkFile(null)
    setArtworkPreview(null)
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setDefaultLanguage('en')
    setArtworkFile(null)
    setArtworkPreview(null)
    onClose()
  }

  // Focus trap and escape key handler
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    // Focus trap: trap Tab key within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = document.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const focusableArray = Array.from(focusableElements).filter((el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })

      const firstElement = focusableArray[0] as HTMLElement
      const lastElement = focusableArray[focusableArray.length - 1] as HTMLElement

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleTab)

    // Focus first input when modal opens
    const firstInput = document.querySelector('#show-name') as HTMLInputElement
    firstInput?.focus()

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-full sm:max-w-lg bg-[var(--bg-elevated)] rounded-xl shadow-2xl animate-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--border-soft)]">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-[var(--text-primary)]"
          >
            Create New Show
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-4 sm:px-6 py-5 space-y-5">
            {/* Artwork Upload */}
            <div>
              <label className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2">
                Artwork
              </label>
              <div className="flex items-start gap-4">
                {artworkPreview ? (
                  <div className="relative">
                    <div
                      className="w-20 h-20 rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--border-soft)]"
                      style={{ backgroundImage: `url(${artworkPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      role="img"
                      aria-label="Show artwork preview"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveArtwork}
                      className="absolute -top-2 -right-2 p-1 bg-[var(--accent-red)] text-white rounded-full hover:opacity-90 min-h-[24px] min-w-[24px]"
                      aria-label="Remove artwork"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--border-soft)] flex items-center justify-center">
                    <Podcast className="h-8 w-8 text-[var(--text-tertiary)]" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="artwork-upload"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px]"
                    aria-label="Upload show artwork"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Upload Image
                  </Button>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    Recommended: 1400x1400px, JPG or PNG
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="show-name"
                className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2"
              >
                Show Name *
              </label>
              <input
                id="show-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your podcast name"
                className={cn(
                  'w-full px-4 py-3 sm:py-2.5',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
                required
                aria-required="true"
                aria-invalid="false"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="show-description"
                className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2"
              >
                Description
              </label>
              <textarea
                id="show-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your podcast"
                rows={3}
                className={cn(
                  'w-full px-4 py-3 sm:py-2.5 resize-none',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
              />
            </div>

            {/* Default Language */}
            <div>
              <label
                htmlFor="show-language"
                className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)] mb-2"
              >
                Default Language
              </label>
              <select
                id="show-language"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 sm:py-2.5',
                  'bg-[var(--bg-elevated)] border border-[var(--border-soft)] rounded-lg',
                  'text-sm text-[var(--text-primary)]',
                  'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
                  'transition-all duration-200'
                )}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-[var(--border-soft)] bg-[var(--bg-subtle)]">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="min-h-[44px] order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[44px] order-1 sm:order-2"
            >
              Create Show
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
