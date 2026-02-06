'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StepUpload } from './step-upload'
import { StepContext } from './step-context'
import { StepProcessing } from './step-processing'

export interface UploadData {
  file: File | null
  rssUrl: string
  uploadProgress: number
  audioUrl?: string
  signedUrl?: string
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
      {/* Enhanced Step Indicator with progress line */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress line background */}
          <div className="absolute top-5 left-0 right-0 h-[2px] bg-[var(--border-soft)]" style={{ zIndex: 0 }} />
          {/* Filled progress line */}
          <div
            className="absolute top-5 left-0 h-[2px] bg-[var(--accent-green)] transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              zIndex: 0
            }}
          />

          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1" style={{ zIndex: 1 }}>
              <div className="flex flex-col items-center relative">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-medium text-sm transition-all duration-300
                    ${currentStep > step.id
                      ? 'bg-[var(--accent-green)] border-[var(--accent-green)] text-white shadow-[0_2px_8px_rgba(52,199,89,0.3)]'
                      : currentStep === step.id
                        ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
                        : 'bg-white border-[var(--border-soft)] text-[var(--text-tertiary)] border'
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
                <div className="flex-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
    </div>
  )
}
