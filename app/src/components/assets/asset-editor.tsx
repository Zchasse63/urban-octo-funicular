'use client'

import * as React from 'react'
import {
  X,
  RotateCcw,
  Save,
  Copy,
  Check,
  Loader2,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  type AssetTypeDefinition,
  type AssetGenerationStatus,
  ASSET_CATEGORIES,
} from '@/lib/assets/asset-types'

interface AssetEditorProps {
  isOpen: boolean
  assetType: AssetTypeDefinition
  content: string
  status: AssetGenerationStatus
  onClose: () => void
  onSave: (content: string) => void
  onRegenerate: () => void
  onDiscard: () => void
  isSaving?: boolean
  isRegenerating?: boolean
}

export function AssetEditor({
  isOpen,
  assetType,
  content,
  status,
  onClose,
  onSave,
  onRegenerate,
  onDiscard,
  isSaving = false,
  isRegenerating = false,
}: AssetEditorProps) {
  const [editedContent, setEditedContent] = React.useState(content)
  const [copied, setCopied] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Sync content when prop changes
  React.useEffect(() => {
    setEditedContent(content)
    setHasChanges(false)
  }, [content])

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(300, textarea.scrollHeight)}px`
    }
  }, [editedContent])

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      // Escape to close
      if (e.key === 'Escape') {
        if (hasChanges) {
          // Confirm before closing
          if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            onClose()
          }
        } else {
          onClose()
        }
      }

      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasChanges, editedContent])

  const handleContentChange = (value: string) => {
    setEditedContent(value)
    setHasChanges(value !== content)
  }

  const handleSave = () => {
    if (!isSaving && hasChanges) {
      onSave(editedContent)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDiscard = () => {
    if (hasChanges) {
      if (window.confirm('Are you sure you want to discard your changes?')) {
        setEditedContent(content)
        setHasChanges(false)
        onDiscard()
      }
    } else {
      onDiscard()
    }
  }

  // Get word count
  const wordCount = React.useMemo(() => {
    return editedContent.trim().split(/\s+/).filter(Boolean).length
  }, [editedContent])

  // Get character count
  const charCount = editedContent.length

  const Icon = assetType.icon

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (hasChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
              onClose()
            }
          } else {
            onClose()
          }
        }}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] m-4 bg-[var(--bg-elevated)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-soft)]">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
              <Icon className="h-5 w-5 text-[var(--accent-blue)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {assetType.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)] font-mono uppercase">
                  {ASSET_CATEGORIES[assetType.category].label}
                </span>
                <span className="text-[var(--text-tertiary)]">|</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {assetType.typicalLength}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="warning">Unsaved changes</Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (hasChanges) {
                  if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                    onClose()
                  }
                } else {
                  onClose()
                }
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Description */}
          <div className="mb-4 p-4 bg-[var(--bg-subtle)] rounded-lg">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-[var(--text-secondary)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--text-secondary)]">
                {assetType.description}
              </p>
            </div>
          </div>

          {/* Regenerating State */}
          {isRegenerating ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-[var(--accent-blue)] animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-medium text-[var(--text-primary)]">
                  Regenerating content...
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  This may take a few moments
                </p>
              </div>
            </div>
          ) : status === 'failed' ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertCircle className="h-8 w-8 text-[var(--accent-red)]" />
              <div className="text-center">
                <p className="font-medium text-[var(--text-primary)]">
                  Generation failed
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Click regenerate to try again
                </p>
              </div>
              <Button variant="secondary" onClick={onRegenerate}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          ) : (
            /* Editor */
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className={cn(
                  'w-full min-h-[300px] p-4 rounded-lg border border-[var(--border-soft)]',
                  'bg-white text-[var(--text-primary)] text-sm leading-relaxed',
                  'resize-none focus:outline-none focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue)]/20',
                  'font-sans',
                  assetType.format === 'markdown' && 'font-mono text-[13px]'
                )}
                placeholder="Content will appear here after generation..."
              />

              {/* Word/Char count */}
              <div className="absolute bottom-3 right-3 flex items-center gap-3 text-xs text-[var(--text-tertiary)] font-mono">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
              </div>
            </div>
          )}

          {/* Format hint */}
          {assetType.format === 'markdown' && !isRegenerating && status !== 'failed' && (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              This asset supports Markdown formatting
            </p>
          )}
          {assetType.format === 'html' && !isRegenerating && status !== 'failed' && (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              This asset uses HTML formatting
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-soft)] bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!editedContent || isRegenerating}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[var(--accent-green)]" />
                  <span className="ml-1.5">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="ml-1.5">Copy</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating || isSaving}
            >
              <RotateCcw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
              <span className="ml-1.5">Regenerate</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={!hasChanges || isSaving}
            >
              Discard changes
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-1.5">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="ml-1.5">Save changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simpler preview modal for viewing content without editing
interface AssetPreviewProps {
  isOpen: boolean
  assetType: AssetTypeDefinition
  content: string
  onClose: () => void
  onEdit: () => void
}

export function AssetPreview({
  isOpen,
  assetType,
  content,
  onClose,
  onEdit,
}: AssetPreviewProps) {
  const [copied, setCopied] = React.useState(false)
  const Icon = assetType.icon

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] m-4 bg-[var(--bg-elevated)] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-soft)]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
              <Icon className="h-4 w-4 text-[var(--accent-blue)]" />
            </div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              {assetType.name}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none">
            {assetType.format === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--text-primary)]">
                {content}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border-soft)]">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 text-[var(--accent-green)]" />
                <span className="ml-1.5">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="ml-1.5">Copy</span>
              </>
            )}
          </Button>
          <Button size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}
