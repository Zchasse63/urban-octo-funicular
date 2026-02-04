'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TopoCard, CardHeader, CardTitle } from '@/components/ui/card'
import { createAssetList, getCategoryCounts, getReadyCounts, type AssetWithContent } from '@/components/assets/asset-grid'
import { AssetEditor } from '@/components/assets/asset-editor'
import { ListSkeleton } from '@/components/LoadingStates'
import {
  ASSET_TYPE_DEFINITIONS,
  ASSET_CATEGORIES,
  TOTAL_ASSET_TYPES,
  type AssetCategory,
  type AssetGenerationStatus,
  getAssetDefinition,
} from '@/lib/assets/asset-types'
import type { GeneratedAsset } from '@/types/database'

// Lazy load AssetGrid
const AssetGrid = dynamic(
  () => import('@/components/assets/asset-grid').then((mod) => ({ default: mod.AssetGrid })),
  {
    loading: () => <ListSkeleton count={6} />,
  }
)

// Mock data - in real app this would come from the database
const mockGeneratedAssets: GeneratedAsset[] = [
  {
    id: '1',
    episode_id: 'ep-142',
    asset_type: 'show_notes',
    content: `<h2>Episode Summary</h2>
<p>In this episode, we dive deep into how artificial intelligence is reshaping the content creation landscape. Sarah Chen, founder of ContentAI Labs, shares her insights on the tools, techniques, and ethical considerations that every creator should know.</p>

<h3>Key Timestamps</h3>
<ul>
  <li><strong>00:02:15</strong> - Introduction to AI Content Tools</li>
  <li><strong>00:14:30</strong> - The Ethics of AI-Generated Content</li>
  <li><strong>00:28:45</strong> - Practical Implementation Strategies</li>
  <li><strong>00:45:00</strong> - Future Predictions and Trends</li>
</ul>

<h3>Key Takeaways</h3>
<ul>
  <li>AI should augment human creativity, not replace it</li>
  <li>Transparency with your audience builds trust when using AI tools</li>
  <li>Start with low-risk applications like transcription before moving to content generation</li>
</ul>`,
    metadata: {},
    file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    episode_id: 'ep-142',
    asset_type: 'linkedin_post',
    content: `Just wrapped up an incredible conversation with Sarah Chen from ContentAI Labs on the future of AI in content creation.

3 things that blew my mind:

1. AI isn't here to replace creators - it's here to amplify our unique voices
2. The creators winning today are those who treat AI as a collaborative partner, not a shortcut
3. Transparency is the new currency of trust in AI-assisted content

Sarah's approach to ethical AI adoption is refreshing in a world of hype and fear.

Key insight: "Start small. Master transcription before you try content generation. Build the muscle memory."

What's your take on AI in content creation? Are you experimenting with any tools?

#ContentCreation #AI #PodcastMarketing #CreatorEconomy`,
    metadata: {},
    file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    episode_id: 'ep-142',
    asset_type: 'twitter_thread',
    content: JSON.stringify([
      "1/ Just dropped a conversation with @sarahchen on AI in content creation that every creator needs to hear. Here's the thread version:",
      "2/ First up: AI isn't replacing creators. It's amplifying them. Sarah's take: 'The best results come from human-AI collaboration, not full automation.'",
      "3/ The transparency principle: When you use AI tools, your audience deserves to know. Building trust > shortcuts.",
      "4/ Start small, scale smart. Sarah recommends beginning with transcription and grammar tools before jumping into content generation.",
      "5/ The ethics question nobody's asking: What happens when AI can perfectly mimic your voice? Sarah has thoughts. (Spoiler: it's about authenticity)",
      "6/ Prediction for 2025: 'Every content creator will have an AI co-pilot. The question is whether they'll use it ethically.'",
      "7/ Action items from the episode:\n- Audit your workflow\n- Try one AI tool this week\n- Create a disclosure policy\n\nFull episode link in bio."
    ]),
    metadata: {},
    file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    episode_id: 'ep-142',
    asset_type: 'newsletter',
    content: `Subject: The AI conversation every creator needs to have

Hey there,

This week's episode hit different.

I sat down with Sarah Chen, founder of ContentAI Labs, and we went deep on something I've been thinking about a lot lately: how AI is changing the game for content creators.

Not the hype. Not the fear. The reality.

Here's what stuck with me:

**The collaboration mindset**
Sarah doesn't see AI as a replacement for human creativity. She sees it as an amplifier. "The best content I've seen," she told me, "comes from creators who treat AI as a creative partner, not a content factory."

**The trust equation**
Here's the thing nobody's talking about: transparency. Sarah's take? When you use AI in your workflow, your audience deserves to know. It's not about disclosure for disclosure's sake - it's about building the kind of trust that keeps people coming back.

**The starter's path**
If you're AI-curious but overwhelmed, Sarah's advice is dead simple: Start with transcription. Master that before you touch content generation. Build the muscle memory.

This episode is a must-listen if you're thinking about integrating AI into your content workflow (and at this point, who isn't?).

Listen now: [Link]

Talk soon,
[Host Name]

P.S. - Sarah mentioned her book "The AI Content Playbook" is free for our listeners this week. Grab it while you can.`,
    metadata: {},
    file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    episode_id: 'ep-142',
    asset_type: 'show_notes',
    content: `## Key Takeaways from Episode 142

1. **AI augments, it doesn't replace** - The most successful creators use AI as a collaborative partner, not a replacement for their unique voice and perspective.

2. **Transparency builds trust** - When using AI tools in your content creation process, being open with your audience strengthens rather than weakens your relationship with them.

3. **Start small, scale smart** - Begin with low-risk applications like transcription and grammar checking before moving to content generation.

4. **Quality control is non-negotiable** - Regardless of how content is created, human oversight and quality standards must remain high.

5. **The ethical imperative** - As AI becomes more capable, creators have a responsibility to establish and follow ethical guidelines for its use.

6. **Human-AI collaboration wins** - The best results don't come from full automation, but from thoughtful integration of AI capabilities with human creativity.

7. **Prepare for the future** - In 5 years, AI will be ubiquitous in content creation. Building good habits and ethical frameworks now will set you apart.`,
    metadata: {},
    file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    episode_id: 'ep-142',
    asset_type: 'quote_card',
    content: JSON.stringify([
      {
        quote: "AI should augment human creativity, not replace it. The best content comes from collaboration.",
        speaker: "Sarah Chen",
        timestamp: "14:32"
      },
      {
        quote: "Transparency is the new currency of trust. Your audience deserves to know when AI is involved.",
        speaker: "Sarah Chen",
        timestamp: "22:15"
      },
      {
        quote: "Start with transcription. Master that before you touch content generation. Build the muscle memory.",
        speaker: "Sarah Chen",
        timestamp: "31:45"
      },
      {
        quote: "In 5 years, every content creator will have an AI co-pilot. The question is whether they'll use it ethically.",
        speaker: "Sarah Chen",
        timestamp: "48:20"
      }
    ]),
    metadata: {},
    file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    episode_id: 'ep-142',
    asset_type: 'youtube_description',
    content: `The Future of AI in Content Creation with Sarah Chen | Episode 142

In this episode, we sit down with Sarah Chen, founder and CEO of ContentAI Labs, to explore how artificial intelligence is transforming the content creation landscape.

TIMESTAMPS:
00:00 - Introduction
02:15 - Overview of AI content tools
14:30 - The ethics of AI-generated content
28:45 - Practical implementation strategies
45:00 - Future predictions and trends
58:30 - Rapid fire questions

KEY TAKEAWAYS:
- AI augments human creativity, it doesn't replace it
- Transparency with your audience builds trust
- Start with low-risk applications first
- Quality control remains essential

RESOURCES MENTIONED:
- ContentAI Labs: https://contentailabs.com
- Sarah's book "The AI Content Playbook"
- OpenAI API Documentation

CONNECT WITH SARAH:
- Twitter: @sarahchen
- LinkedIn: /in/sarahchen
- Website: contentailabs.com

SUBSCRIBE for weekly episodes on content creation, podcasting, and growing your audience.

#AI #ContentCreation #Podcast #CreatorEconomy #ArtificialIntelligence`,
    metadata: {},
    file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    episode_id: 'ep-142',
    asset_type: 'blog_post',
    content: `# The Future of AI in Content Creation: Insights from Sarah Chen

*How artificial intelligence is reshaping the creator economy and what it means for podcasters*

The conversation around AI in content creation has reached a fever pitch. Between the hype and the fear, it's hard to know what's real and what's noise. That's why our recent conversation with Sarah Chen, founder of ContentAI Labs, was so refreshing.

Sarah has spent 15 years at the intersection of content strategy and machine learning. Her company helps creators leverage AI ethically and effectively, and her insights cut through the noise with practical wisdom.

## The Collaboration Mindset

"AI isn't here to replace creators," Sarah explained early in our conversation. "It's here to amplify them."

This framing is crucial. Rather than viewing AI as a threat or a magic solution, Sarah advocates for treating it as a creative partner. The best content she's seen comes from creators who understand this dynamic.

"Full automation produces generic content," she noted. "Human-AI collaboration produces something that has both efficiency and soul."

## The Trust Equation

Perhaps the most important theme from our discussion was transparency. Sarah is adamant that creators using AI tools have an obligation to their audiences.

"When you use AI in your workflow, your audience deserves to know," she said. "It's not about disclosure for disclosure's sake—it's about building the kind of trust that sustains long-term relationships."

This runs counter to the temptation many creators feel to hide their AI usage. But Sarah argues that transparency actually strengthens audience relationships rather than weakening them.

## The Practical Path Forward

For creators feeling overwhelmed by the AI landscape, Sarah offers a simple framework:

1. **Start with transcription** - This is low-risk and high-reward. Master AI-powered transcription before moving to anything more complex.

2. **Build the muscle memory** - Use AI tools consistently enough to understand their strengths and limitations.

3. **Scale thoughtfully** - Once you're comfortable, gradually expand your AI integration.

4. **Maintain quality control** - No matter how sophisticated the tools become, human oversight remains essential.

## Looking Ahead

Sarah's prediction for the next five years is bold but considered: "Every content creator will have an AI co-pilot. The question is whether they'll use it ethically."

The creators who thrive, she believes, will be those who establish good habits and ethical frameworks now, while the technology is still maturing.

## Action Items

Ready to start integrating AI into your content workflow? Here's Sarah's advice:

- Audit your current workflow to identify integration opportunities
- Experiment with one AI tool this week (transcription is a great starting point)
- Create a disclosure policy for AI-assisted content
- Join communities like ContentAI Labs for ongoing resources and support

---

*This episode is a must-listen for any creator thinking about AI integration. Listen to the full conversation [here].*`,
    metadata: {},
    file_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Category filter tabs
type FilterCategory = AssetCategory | 'all'

const filterTabs: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All Assets' },
  { id: 'social', label: 'Social Posts' },
  { id: 'long_form', label: 'Long-form' },
  { id: 'video', label: 'Video Scripts' },
  { id: 'visual', label: 'Visuals' },
]

export default function AssetsPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<FilterCategory>('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [isGeneratingAll, setIsGeneratingAll] = React.useState(false)
  const [generatingIds, setGeneratingIds] = React.useState<string[]>([])

  // Editor state
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editingAssetId, setEditingAssetId] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRegenerating, setIsRegenerating] = React.useState(false)

  // Create asset list with content
  const assets = React.useMemo(() => {
    return createAssetList(mockGeneratedAssets, generatingIds)
  }, [generatingIds])

  // Get counts
  const categoryCounts = getCategoryCounts(assets)
  const readyCounts = getReadyCounts(assets)

  // Get current editing asset
  const editingAsset = React.useMemo(() => {
    if (!editingAssetId) return null
    return assets.find((a) => a.definition.id === editingAssetId)
  }, [editingAssetId, assets])

  // Handlers
  const handleEditAsset = (assetId: string) => {
    setEditingAssetId(assetId)
    setEditorOpen(true)
  }

  const handleCopyAsset = async (assetId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownloadAsset = (assetId: string) => {
    const asset = assets.find((a) => a.definition.id === assetId)
    if (!asset?.generatedAsset?.content) return

    const content = asset.generatedAsset.content
    const fileName = `${asset.definition.id}-${Date.now()}.txt`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleRegenerateAsset = async (assetId: string) => {
    setGeneratingIds((prev) => [...prev, assetId])

    // Simulate generation
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setGeneratingIds((prev) => prev.filter((id) => id !== assetId))
  }

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true)
    const pendingAssets = assets.filter((a) => a.status === 'pending')
    const batchIds = pendingAssets.map((a) => a.definition.id)

    setGeneratingIds(batchIds)

    // Simulate batch generation
    await new Promise((resolve) => setTimeout(resolve, 5000))

    setGeneratingIds([])
    setIsGeneratingAll(false)
  }

  const [isDownloading, setIsDownloading] = React.useState(false)

  const handleBulkDownload = async () => {
    const readyAssets = assets.filter((a) => a.status === 'completed' && a.generatedAsset?.content)

    if (readyAssets.length === 0) return

    setIsDownloading(true)

    try {
      // Get episode ID from URL
      const pathParts = window.location.pathname.split('/')
      const episodeId = pathParts[pathParts.indexOf('episodes') + 1]

      // Fetch ZIP from API
      const response = await fetch(`/api/episodes/${episodeId}/assets/download`)

      if (!response.ok) {
        throw new Error('Failed to generate download')
      }

      // Get the blob and trigger download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      link.download = filenameMatch?.[1] || `episode-assets-${Date.now()}.zip`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Could add toast notification here
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSaveEdit = async (content: string) => {
    if (!editingAssetId) return

    setIsSaving(true)

    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In real app, update the asset in the database

    setIsSaving(false)
    setEditorOpen(false)
  }

  const handleRegenerateInEditor = async () => {
    if (!editingAssetId) return

    setIsRegenerating(true)

    // Simulate regeneration
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setIsRegenerating(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/episodes/ep-142"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Episode
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Content Multiplication Engine
            </h1>
            <p className="text-[var(--text-secondary)]">
              Generate and manage {TOTAL_ASSET_TYPES}+ content assets from your episode
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleBulkDownload}
              disabled={readyCounts.all === 0 || isDownloading}
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Preparing ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="ml-2">Download All ({readyCounts.all})</span>
                </>
              )}
            </Button>
            <Button
              onClick={handleGenerateAll}
              disabled={isGeneratingAll || assets.every((a) => a.status === 'completed')}
            >
              {isGeneratingAll ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span className="ml-2">Generate All</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <TopoCard hover={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
              <LayoutGrid className="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{TOTAL_ASSET_TYPES}</p>
              <p className="text-xs text-[var(--text-tertiary)] font-mono uppercase">Total Assets</p>
            </div>
          </div>
        </TopoCard>

        <TopoCard hover={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(52,199,89,0.1)]">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent-green)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{readyCounts.all}</p>
              <p className="text-xs text-[var(--text-tertiary)] font-mono uppercase">Ready</p>
            </div>
          </div>
        </TopoCard>

        <TopoCard hover={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(0,122,255,0.1)]">
              <Clock className="h-5 w-5 text-[var(--accent-blue)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{generatingIds.length}</p>
              <p className="text-xs text-[var(--text-tertiary)] font-mono uppercase">Generating</p>
            </div>
          </div>
        </TopoCard>

        <TopoCard hover={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
              <AlertCircle className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {TOTAL_ASSET_TYPES - readyCounts.all - generatingIds.length}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] font-mono uppercase">Pending</p>
            </div>
          </div>
        </TopoCard>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                selectedCategory === tab.id
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-[var(--text-tertiary)]">
                ({tab.id === 'all' ? categoryCounts.all : categoryCounts[tab.id as AssetCategory]})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[var(--bg-subtle)] rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      <AssetGrid
        assets={assets}
        selectedCategory={selectedCategory}
        onEditAsset={handleEditAsset}
        onCopyAsset={handleCopyAsset}
        onDownloadAsset={handleDownloadAsset}
        onRegenerateAsset={handleRegenerateAsset}
      />

      {/* Asset Editor Modal */}
      {editingAsset && (
        <AssetEditor
          isOpen={editorOpen}
          assetType={editingAsset.definition}
          content={editingAsset.generatedAsset?.content || ''}
          status={editingAsset.status}
          onClose={() => {
            setEditorOpen(false)
            setEditingAssetId(null)
          }}
          onSave={handleSaveEdit}
          onRegenerate={handleRegenerateInEditor}
          onDiscard={() => {
            setEditorOpen(false)
            setEditingAssetId(null)
          }}
          isSaving={isSaving}
          isRegenerating={isRegenerating}
        />
      )}
    </div>
  )
}
