'use client'

import * as React from 'react'
import { Mail, Send, Edit2, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmailTemplateProps {
  guestName: string
  guestEmail?: string
  subject: string
  body: string
  onSubjectChange?: (subject: string) => void
  onBodyChange?: (body: string) => void
  onSend?: () => void
}

export function EmailTemplate({
  guestName,
  guestEmail,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  onSend,
}: EmailTemplateProps) {
  const [editableSubject, setEditableSubject] = React.useState(subject)
  const [editableBody, setEditableBody] = React.useState(body)
  const [isEditingSubject, setIsEditingSubject] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const subjectInputRef = React.useRef<HTMLInputElement>(null)

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubject = e.target.value
    setEditableSubject(newSubject)
    onSubjectChange?.(newSubject)
  }

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBody = e.target.value
    setEditableBody(newBody)
    onBodyChange?.(newBody)
  }

  const handleSend = async () => {
    setIsSending(true)
    try {
      await onSend?.()
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } finally {
      setIsSending(false)
    }
  }

  React.useEffect(() => {
    if (isEditingSubject && subjectInputRef.current) {
      subjectInputRef.current.focus()
    }
  }, [isEditingSubject])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--accent-blue)]/10">
            <Mail className="h-5 w-5 text-[var(--accent-blue)]" />
          </div>
          <div>
            <CardTitle className="text-sm normal-case tracking-normal font-sans font-semibold text-[var(--text-primary)]">
              Guest Notification Email
            </CardTitle>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {guestEmail ? `To: ${guestEmail}` : 'Email address not provided'}
            </p>
          </div>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleSend}
          disabled={!guestEmail || isSending || sent}
          className="shrink-0"
        >
          {sent ? (
            <>
              <Check className="h-4 w-4" />
              Sent
            </>
          ) : isSending ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Email
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recipient Info */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-soft)]">
          <span className="text-xs font-medium text-[var(--text-secondary)]">To:</span>
          <span className="text-sm text-[var(--text-primary)]">{guestName}</span>
          {guestEmail && (
            <span className="text-sm text-[var(--text-tertiary)]">&lt;{guestEmail}&gt;</span>
          )}
          {!guestEmail && (
            <span className="text-xs text-[var(--accent-amber)]">No email on file</span>
          )}
        </div>

        {/* Subject Line */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Subject
            </label>
            <button
              onClick={() => setIsEditingSubject(!isEditingSubject)}
              className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1"
            >
              <Edit2 className="h-3 w-3" />
              {isEditingSubject ? 'Done' : 'Edit'}
            </button>
          </div>
          {isEditingSubject ? (
            <input
              ref={subjectInputRef}
              type="text"
              value={editableSubject}
              onChange={handleSubjectChange}
              className={cn(
                'w-full p-3 rounded-lg border',
                'bg-[var(--bg-elevated)] border-[var(--border-soft)]',
                'text-sm text-[var(--text-primary)]',
                'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]'
              )}
            />
          ) : (
            <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-soft)]">
              <p className="text-sm text-[var(--text-primary)]">{editableSubject}</p>
            </div>
          )}
        </div>

        {/* Email Body */}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">
            Message
          </label>
          <textarea
            value={editableBody}
            onChange={handleBodyChange}
            rows={16}
            className={cn(
              'w-full p-4 rounded-lg border resize-none',
              'bg-[var(--bg-elevated)] border-[var(--border-soft)]',
              'text-sm text-[var(--text-primary)] leading-relaxed',
              'focus:outline-none focus:border-[var(--accent-blue)] focus:shadow-[var(--shadow-focus)]',
              'font-sans whitespace-pre-wrap'
            )}
          />
        </div>

        {/* Email Preview Note */}
        <div className="p-3 rounded-lg bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/20">
          <p className="text-xs text-[var(--accent-blue)]">
            <strong>Note:</strong> This email will be sent via your connected email provider.
            The social posts from this package will be included as formatted content.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
