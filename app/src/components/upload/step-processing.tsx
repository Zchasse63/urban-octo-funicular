'use client'

import { useState } from 'react'
import { Check, Circle, Loader2, Mail } from 'lucide-react'
import type { ProcessingState } from './upload-wizard'

interface StepProcessingProps {
  processingState: ProcessingState
}

type StepStatus = 'pending' | 'active' | 'complete'

interface ProcessingStep {
  label: string
  getStatus: (state: ProcessingState) => StepStatus
}

const processingSteps: ProcessingStep[] = [
  {
    label: 'Audio uploaded',
    getStatus: (state) => state.audioUploaded ? 'complete' : 'pending',
  },
  {
    label: 'Transcription complete',
    getStatus: (state) => state.transcriptionComplete ? 'complete' :
      state.audioUploaded ? 'active' : 'pending',
  },
  {
    label: 'Running intelligence analysis',
    getStatus: (state) => state.intelligenceAnalysis,
  },
  {
    label: 'Generating show notes',
    getStatus: (state) => state.showNotesGeneration,
  },
  {
    label: 'Creating social posts',
    getStatus: (state) => state.socialPostsCreation,
  },
]

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'complete':
      return (
        <div className="w-6 h-6 rounded-full bg-[var(--accent-green)] flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )
    case 'active':
      return (
        <div className="w-6 h-6 rounded-full bg-[var(--accent-blue)] flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      )
    case 'pending':
    default:
      return (
        <div className="w-6 h-6 rounded-full border-2 border-[var(--border-soft)] flex items-center justify-center">
          <Circle className="w-3 h-3 text-[var(--text-tertiary)]" />
        </div>
      )
  }
}

export function StepProcessing({ processingState }: StepProcessingProps) {
  const [emailNotify, setEmailNotify] = useState(false)
  const [email, setEmail] = useState('')
  const isComplete = processingState.overallProgress === 100

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

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Overall Progress</span>
          <span className="text-[var(--text-primary)] font-semibold">
            {processingState.overallProgress}%
          </span>
        </div>
        <div className="progress-track h-3">
          <div
            className={`progress-fill h-full ${isComplete ? 'success' : ''}`}
            style={{ width: `${processingState.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Processing Checklist */}
      <div className="space-y-3 py-4">
        {processingSteps.map((step, index) => {
          const status = step.getStatus(processingState)
          return (
            <div
              key={index}
              className={`
                flex items-center gap-3 p-3 rounded-[var(--radius-lg)]
                ${status === 'active' ? 'bg-[rgba(0,122,255,0.05)]' : ''}
                ${status === 'complete' ? 'bg-[rgba(52,199,89,0.05)]' : ''}
              `}
            >
              <StatusIcon status={status} />
              <span
                className={`
                  text-sm
                  ${status === 'complete' ? 'text-[var(--text-primary)]' : ''}
                  ${status === 'active' ? 'text-[var(--accent-blue)] font-medium' : ''}
                  ${status === 'pending' ? 'text-[var(--text-tertiary)]' : ''}
                `}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

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
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
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
          <button className="btn-secondary flex-1 justify-center">
            View Show Notes
          </button>
          <button className="btn-primary flex-1 justify-center">
            View All Assets
          </button>
        </div>
      )}
    </div>
  )
}
