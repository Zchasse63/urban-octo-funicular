'use client'

import dynamic from 'next/dynamic'
import { Spinner } from '@/components/LoadingStates'
import { UploadHero } from '@/components/podbrain/backgrounds'

const UploadWizard = dynamic(
  () => import('@/components/upload/upload-wizard').then((mod) => ({ default: mod.UploadWizard })),
  {
    loading: () => (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    ),
  }
)

export default function UploadPage() {
  return (
    <UploadHero title="Transform Your Podcast">
      <main className="min-h-screen py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto animate-in">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <span className="mono text-[var(--accent-blue)] text-xs sm:text-sm">NEW TRANSFORMATION</span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] mt-2">
              Transform Your Podcast Episode
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 max-w-lg mx-auto">
              Upload your audio and let our AI create show notes, social posts, and 30+ content assets.
            </p>
          </div>

          {/* Upload Wizard */}
          <UploadWizard />
        </div>
      </main>
    </UploadHero>
  )
}
