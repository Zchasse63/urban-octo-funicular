'use client'

import { useState } from 'react'
import { Lightbulb, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
        <label
          htmlFor="title"
          className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)]"
        >
          Episode Title
        </label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., The Future of AI in Podcasting"
          value={localData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          aria-label="Episode title"
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
        <label
          htmlFor="guests"
          className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)]"
        >
          Guest Name(s)
        </label>
        <Input
          id="guests"
          type="text"
          placeholder="e.g., Jane Smith, John Doe"
          value={localData.guestNames}
          onChange={(e) => handleChange('guestNames', e.target.value)}
          aria-label="Guest names"
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
        <label
          htmlFor="keywords"
          className="block font-mono text-xs font-medium uppercase tracking-[0.05em] text-[var(--text-secondary)]"
        >
          Target Keywords
        </label>
        <Input
          id="keywords"
          type="text"
          placeholder="e.g., podcast marketing, content strategy, audience growth"
          value={localData.targetKeywords}
          onChange={(e) => handleChange('targetKeywords', e.target.value)}
          aria-label="Target keywords for SEO"
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
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onSkip}
          className="flex-1 justify-center"
        >
          Skip
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          className="flex-1 justify-center"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
