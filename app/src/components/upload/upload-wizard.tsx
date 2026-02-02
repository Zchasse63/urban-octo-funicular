'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { StepUpload } from './step-upload'
import { StepContext } from './step-context'
import { StepProcessing } from './step-processing'

export interface UploadData {
  file: File | null
  rssUrl: string
  uploadProgress: number
}

export interface ContextData {
  title: string
  guestNames: string
  targetKeywords: string
}

export interface ProcessingState {
  audioUploaded: boolean
  transcriptionComplete: boolean
  intelligenceAnalysis: 'pending' | 'active' | 'complete'
  showNotesGeneration: 'pending' | 'active' | 'complete'
  socialPostsCreation: 'pending' | 'active' | 'complete'
  overallProgress: number
  estimatedTimeRemaining: string
}

const steps = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Context' },
  { id: 3, label: 'Processing' },
]

export function UploadWizard() {
  const [currentStep, setCurrentStep] = useState(1)

  const [uploadData, setUploadData] = useState<UploadData>({
    file: null,
    rssUrl: '',
    uploadProgress: 0,
  })

  const [contextData, setContextData] = useState<ContextData>({
    title: '',
    guestNames: '',
    targetKeywords: '',
  })

  const [processingState, setProcessingState] = useState<ProcessingState>({
    audioUploaded: false,
    transcriptionComplete: false,
    intelligenceAnalysis: 'pending',
    showNotesGeneration: 'pending',
    socialPostsCreation: 'pending',
    overallProgress: 0,
    estimatedTimeRemaining: 'Calculating...',
  })

  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleUploadComplete = () => {
    setUploadData(prev => ({ ...prev, uploadProgress: 100 }))
    goToNextStep()
  }

  const handleContextSubmit = (data: ContextData) => {
    setContextData(data)
    goToNextStep()
    // Start processing simulation
    simulateProcessing()
  }

  const handleContextSkip = () => {
    goToNextStep()
    simulateProcessing()
  }

  const simulateProcessing = () => {
    // Simulate processing steps for demo purposes
    setProcessingState(prev => ({ ...prev, audioUploaded: true, overallProgress: 20 }))

    setTimeout(() => {
      setProcessingState(prev => ({
        ...prev,
        transcriptionComplete: true,
        intelligenceAnalysis: 'active',
        overallProgress: 40,
        estimatedTimeRemaining: '2 minutes remaining'
      }))
    }, 2000)

    setTimeout(() => {
      setProcessingState(prev => ({
        ...prev,
        intelligenceAnalysis: 'complete',
        showNotesGeneration: 'active',
        overallProgress: 60,
        estimatedTimeRemaining: '1 minute remaining'
      }))
    }, 4000)

    setTimeout(() => {
      setProcessingState(prev => ({
        ...prev,
        showNotesGeneration: 'complete',
        socialPostsCreation: 'active',
        overallProgress: 80,
        estimatedTimeRemaining: '30 seconds remaining'
      }))
    }, 6000)

    setTimeout(() => {
      setProcessingState(prev => ({
        ...prev,
        socialPostsCreation: 'complete',
        overallProgress: 100,
        estimatedTimeRemaining: 'Complete!'
      }))
    }, 8000)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-medium text-sm transition-all duration-300
                    ${currentStep > step.id
                      ? 'bg-[var(--accent-green)] text-white'
                      : currentStep === step.id
                        ? 'bg-[var(--text-primary)] text-white'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-soft)]'
                    }
                  `}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${currentStep >= step.id
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)]'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-[2px] mx-4 mt-[-20px]
                    ${currentStep > step.id
                      ? 'bg-[var(--accent-green)]'
                      : 'bg-[var(--border-soft)]'
                    }
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="topo-card">
        {currentStep === 1 && (
          <StepUpload
            uploadData={uploadData}
            setUploadData={setUploadData}
            onContinue={handleUploadComplete}
          />
        )}
        {currentStep === 2 && (
          <StepContext
            contextData={contextData}
            setContextData={setContextData}
            onContinue={handleContextSubmit}
            onSkip={handleContextSkip}
            onBack={goToPreviousStep}
          />
        )}
        {currentStep === 3 && (
          <StepProcessing processingState={processingState} />
        )}
      </div>
    </div>
  )
}
