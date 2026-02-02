'use client'

import { useState } from 'react'
import { Lightbulb, ArrowLeft, ArrowRight } from 'lucide-react'
import type { ContextData } from './upload-wizard'

interface StepContextProps {
  contextData: ContextData
  setContextData: React.Dispatch<React.SetStateAction<ContextData>>
  onContinue: (data: ContextData) => void
  onSkip: () => void
  onBack: () => void
}

export function StepContext({
  contextData,
  setContextData,
  onContinue,
  onSkip,
  onBack,
}: StepContextProps) {
  const [localData, setLocalData] = useState<ContextData>(contextData)

  const handleChange = (field: keyof ContextData, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }))
  }

  const handleContinue = () => {
    setContextData(localData)
    onContinue(localData)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Add Context (Optional)
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Help our AI generate better, more targeted content
        </p>
      </div>

      {/* Episode Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="mono">
          Episode Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="e.g., The Future of AI in Podcasting"
          value={localData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="input"
        />
        <div className="flex items-start gap-2 mt-2">
          <Lightbulb className="w-4 h-4 text-[var(--accent-amber)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-tertiary)]">
            A clear title helps generate more relevant show notes and social posts
          </p>
        </div>
      </div>

      {/* Guest Name(s) */}
      <div className="space-y-2">
        <label htmlFor="guests" className="mono">
          Guest Name(s)
        </label>
        <input
          id="guests"
          type="text"
          placeholder="e.g., Jane Smith, John Doe"
          value={localData.guestNames}
          onChange={(e) => handleChange('guestNames', e.target.value)}
          className="input"
        />
        <div className="flex items-start gap-2 mt-2">
          <Lightbulb className="w-4 h-4 text-[var(--accent-amber)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-tertiary)]">
            We will automatically create guest promotion packages and properly attribute quotes
          </p>
        </div>
      </div>

      {/* Target Keywords */}
      <div className="space-y-2">
        <label htmlFor="keywords" className="mono">
          Target Keywords
        </label>
        <input
          id="keywords"
          type="text"
          placeholder="e.g., podcast marketing, content strategy, audience growth"
          value={localData.targetKeywords}
          onChange={(e) => handleChange('targetKeywords', e.target.value)}
          className="input"
        />
        <div className="flex items-start gap-2 mt-2">
          <Lightbulb className="w-4 h-4 text-[var(--accent-amber)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-tertiary)]">
            Keywords help optimize your show notes for search engines and improve discoverability
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onSkip}
          className="btn-secondary flex-1 justify-center"
        >
          Skip
        </button>
        <button
          onClick={handleContinue}
          className="btn-primary flex-1 justify-center"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
