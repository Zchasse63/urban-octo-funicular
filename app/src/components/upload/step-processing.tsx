'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProcessingState as UploadProcessingState } from './upload-wizard'
import { ProcessingState, type ProcessingStep } from '@/components/podbrain/processing-states'

interface StepProcessingProps {
  processingState: UploadProcessingState
}

export function StepProcessing({ processingState }: StepProcessingProps) {
  const [emailNotify, setEmailNotify] = useState(false)
  const [email, setEmail] = useState('')
  const isComplete = processingState.overallProgress === 100

  // Map UploadProcessingState to ProcessingStep[] format
  const steps: ProcessingStep[] = [
    {
      label: 'Audio uploaded',
      status: processingState.audioUploaded ? 'complete' : 'pending',
    },
    {
      label: 'Transcription complete',
      status: processingState.transcriptionComplete
        ? 'complete'
        : processingState.audioUploaded
          ? 'active'
          : 'pending',
    },
    {
      label: 'Running intelligence analysis',
      status: processingState.intelligenceAnalysis,
    },
    {
      label: 'Generating show notes',
      status: processingState.showNotesGeneration,
    },
    {
      label: 'Creating social posts',
      status: processingState.socialPostsCreation,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {isComplete ? 'Transformation Complete!' : 'Processing Your Episode'}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {isComplete
            ? 'Your show notes and content assets are ready'
            : 'Our AI is working its magic. This usually takes a few minutes.'
          }
        </p>
      </div>

      {/* Use ProcessingState component */}
      <ProcessingState
        title={isComplete ? undefined : "Transforming your content"}
        progress={processingState.overallProgress}
        steps={steps}
      />

      {/* Estimated Time */}
      {!isComplete && (
        <div className="text-center py-2">
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium">{processingState.estimatedTimeRemaining}</span>
          </p>
        </div>
      )}

      {/* Email Notification Option */}
      {!isComplete && (
        <div className="border-t border-[var(--border-soft)] pt-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="emailNotify"
              checked={emailNotify}
              onChange={(e) => setEmailNotify(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-[var(--border-soft)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
            />
            <div className="flex-1">
              <label htmlFor="emailNotify" className="text-sm text-[var(--text-primary)] cursor-pointer">
                Notify me when complete
              </label>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Get an email when your transformation is ready
              </p>
              {emailNotify && (
                <div className="mt-3 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Actions */}
      {isComplete && (
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1 justify-center">
            View Show Notes
          </Button>
          <Button type="button" className="flex-1 justify-center">
            View All Assets
          </Button>
        </div>
      )}
    </div>
  )
}
