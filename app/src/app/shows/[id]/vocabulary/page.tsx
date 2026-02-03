'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Book } from 'lucide-react'
import { VocabularyList, type VocabularyTermData } from '@/components/shows/vocabulary-list'

// Mock data for demonstration
const mockVocabularyTerms: VocabularyTermData[] = [
  {
    id: 'vocab-001',
    term: 'SaaS',
    alternatives: ['Software as a Service', 'SAAS', 'software-as-a-service'],
    occurrenceCount: 47,
  },
  {
    id: 'vocab-002',
    term: 'TechCorp Inc.',
    alternatives: ['TechCorp', 'Tech Corp'],
    occurrenceCount: 23,
  },
  {
    id: 'vocab-003',
    term: 'LLM',
    alternatives: ['Large Language Model', 'large language models'],
    occurrenceCount: 31,
  },
  {
    id: 'vocab-004',
    term: 'Dr. Sarah Chen',
    alternatives: ['Sarah Chen', 'Dr. Chen'],
    occurrenceCount: 12,
  },
  {
    id: 'vocab-005',
    term: 'Kubernetes',
    alternatives: ['K8s', 'k8s'],
    occurrenceCount: 19,
  },
  {
    id: 'vocab-006',
    term: 'PostgreSQL',
    alternatives: ['Postgres', 'postgres'],
    occurrenceCount: 15,
  },
  {
    id: 'vocab-007',
    term: 'GPT-4',
    alternatives: ['GPT4', 'gpt-4', 'GPT 4'],
    occurrenceCount: 28,
  },
  {
    id: 'vocab-008',
    term: 'DevOps',
    alternatives: ['devops', 'Dev Ops'],
    occurrenceCount: 22,
  },
  {
    id: 'vocab-009',
    term: 'Y Combinator',
    alternatives: ['YC', 'Y-Combinator'],
    occurrenceCount: 8,
  },
  {
    id: 'vocab-010',
    term: 'API',
    alternatives: ['APIs', 'api'],
    occurrenceCount: 56,
  },
]

// Mock show data
const mockShow = {
  id: 'show-001',
  name: 'The Tech Founders Podcast',
}

export default function VocabularyPage() {
  const params = useParams()
  const showId = params.id as string

  const [terms, setTerms] = React.useState<VocabularyTermData[]>(mockVocabularyTerms)

  const handleAddTerm = (term: string, alternatives: string[]) => {
    const newTerm: VocabularyTermData = {
      id: `vocab-${Date.now()}`,
      term,
      alternatives,
      occurrenceCount: 0,
    }
    setTerms([newTerm, ...terms])
    // In real app: save term to database
  }

  const handleDeleteTerm = (id: string) => {
    setTerms(terms.filter((t) => t.id !== id))
    // In real app: delete term from database
  }

  return (
    <div className="animate-in">
      {/* Back Link */}
        <Link
          href={`/shows/${showId}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {mockShow.name}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[var(--bg-subtle)]">
              <Book className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Vocabulary
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
            Add custom vocabulary terms to improve transcription accuracy. PodBrain learns
            these terms and their alternatives to better recognize names, brands, technical
            jargon, and industry-specific language in your episodes.
          </p>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-xl border border-[var(--accent-blue)]/30 bg-[rgba(0,122,255,0.02)] mb-6">
          <h3 className="font-medium text-[var(--text-primary)] mb-1">
            How vocabulary learning works
          </h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>
              - Terms you add are used to boost transcription accuracy for your show
            </li>
            <li>
              - Alternatives help catch different spellings and pronunciations
            </li>
            <li>
              - Usage counts increase automatically as terms appear in transcripts
            </li>
            <li>
              - PodBrain also suggests new terms found in your episodes
            </li>
          </ul>
        </div>

      {/* Vocabulary List */}
      <VocabularyList
        terms={terms}
        onAddTerm={handleAddTerm}
        onDeleteTerm={handleDeleteTerm}
      />
    </div>
  )
}
