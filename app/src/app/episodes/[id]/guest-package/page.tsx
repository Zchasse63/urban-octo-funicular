'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { Download, Mail, ArrowLeft, User, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TopoCard, CardContent } from '@/components/ui/card'
import { SocialPostCard, QuoteCardsGrid, EmailTemplate } from '@/components/guest-package'
import { useToast } from '@/components/ui/toast'
import type { SocialPostVariant, QuoteCard } from '@/lib/guest-package/generator'

interface GuestPackageData {
  socialPosts: SocialPostVariant[]
  quoteCards: QuoteCard[]
  emailSubject: string
  emailBody: string
  episodeUrl: string
  episodeTitle: string | null
  guestName: string | null
  guestBio: string | null
  guestEmail: string | null
  showName: string
}

export default function GuestPackagePage() {
  const params = useParams()
  const episodeId = params?.id as string
  const { addToast } = useToast()

  const [data, setData] = React.useState<GuestPackageData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [isSendingEmail, setIsSendingEmail] = React.useState(false)

  const [socialPosts, setSocialPosts] = React.useState<SocialPostVariant[]>([])
  const [emailSubject, setEmailSubject] = React.useState('')
  const [emailBody, setEmailBody] = React.useState('')

  // Fetch guest package data on mount
  React.useEffect(() => {
    async function fetchGuestPackage() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/episodes/${episodeId}/guest-package`)
        const result = await response.json()

        if (!response.ok || result.error) {
          setError(result.error || 'Failed to load guest package')
          return
        }

        const { episode, show, package: packageContent } = result.data
        const packageData: GuestPackageData = {
          socialPosts: packageContent.socialPosts,
          quoteCards: packageContent.quoteCards,
          emailSubject: packageContent.emailSubject,
          emailBody: packageContent.emailBody,
          episodeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://getpodbrain.ai'}/episodes/${episodeId}`,
          episodeTitle: episode.title,
          guestName: episode.guest_name,
          guestBio: episode.guest_bio,
          guestEmail: episode.guest_email,
          showName: show.name,
        }

        setData(packageData)
        setSocialPosts(packageContent.socialPosts)
        setEmailSubject(packageContent.emailSubject)
        setEmailBody(packageContent.emailBody)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guest package')
      } finally {
        setIsLoading(false)
      }
    }

    if (episodeId) {
      fetchGuestPackage()
    }
  }, [episodeId])

  const handleDownloadAll = async () => {
    if (!data) return

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/episodes/${episodeId}/guest-package/download`, {
        method: 'GET',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to download ZIP')
      }

      // Trigger browser download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `guest-package-${data.guestName?.replace(/\s+/g, '-').toLowerCase() || 'guest'}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addToast({
        variant: 'success',
        description: 'Guest package ZIP downloaded successfully',
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to download package'
      addToast({
        variant: 'error',
        description: errorMsg,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadQuote = (quote: QuoteCard) => {
    // In production, this would generate an image
    const content = `"${quote.quote}"\n\n- ${quote.attribution}\n${quote.episodeTitle}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quote-${quote.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSendEmail = async () => {
    if (!data || !data.guestEmail) {
      addToast({
        variant: 'error',
        description: 'Guest email not found',
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch(`/api/episodes/${episodeId}/guest-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestEmail: data.guestEmail,
          customMessage: emailBody,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to send email')
      }

      addToast({
        variant: 'success',
        title: 'Email sent',
        description: `Guest package sent to ${data.guestEmail}`,
      })
    } catch (err) {
      addToast({
        variant: 'error',
        description: err instanceof Error ? err.message : 'Failed to send email',
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleSocialPostChange = (platform: string, content: string) => {
    setSocialPosts((prev) =>
      prev.map((post) =>
        post.platform === platform
          ? { ...post, content, characterCount: content.length }
          : post
      )
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)]">Loading guest package...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href={`/episodes/${episodeId}`}>
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back to Episode
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // No data state
  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="border-b border-[var(--border-soft)] bg-[var(--bg-elevated)]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link
            href={`/episodes/${episodeId}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Episode
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
                Guest Promotion Package
              </h1>
              <p className="text-[var(--text-secondary)]">
                for <span className="font-medium text-[var(--text-primary)]">{data.guestName || 'Guest'}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleDownloadAll}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4" />
                {isDownloading ? 'Preparing...' : 'Download All as ZIP'}
              </Button>
              <Button
                onClick={() => {
                  const emailSection = document.getElementById('email-section')
                  emailSection?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Mail className="h-4 w-4" />
                Email to Guest
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Guest Info Card */}
        <TopoCard hover={false}>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--border-soft)] flex items-center justify-center">
                <User className="h-8 w-8 text-[var(--text-tertiary)]" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {data.guestName || 'Guest'}
                </h2>
                {data.guestBio && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {data.guestBio}
                  </p>
                )}
                {data.guestEmail && (
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    {data.guestEmail}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-[var(--text-tertiary)] uppercase tracking-wider">
                  Episode
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
                  {data.episodeTitle}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {data.showName}
                </p>
              </div>
            </div>
          </CardContent>
        </TopoCard>

        {/* Social Posts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Social Media Posts
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Ready-to-share posts for each platform
              </p>
            </div>
          </div>
          <div className="grid gap-6">
            {socialPosts.map((post) => (
              <SocialPostCard
                key={post.platform}
                post={post}
                onContentChange={(content) => handleSocialPostChange(post.platform, content)}
              />
            ))}
          </div>
        </section>

        {/* Quote Cards Section */}
        <section>
          <QuoteCardsGrid
            quotes={data.quoteCards}
            onDownloadAll={handleDownloadAll}
            onDownloadSingle={handleDownloadQuote}
          />
        </section>

        {/* Email Template Section */}
        <section id="email-section">
          <EmailTemplate
            guestName={data.guestName || 'Guest'}
            guestEmail={data.guestEmail || undefined}
            subject={emailSubject}
            body={emailBody}
            onSubjectChange={setEmailSubject}
            onBodyChange={setEmailBody}
            onSend={handleSendEmail}
          />
        </section>

        {/* Quick Actions Footer */}
        <TopoCard hover={false} className="bg-[var(--bg-subtle)]">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">
                  Need more assets?
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Generate additional content types from this episode
                </p>
              </div>
              <Link href={`/episodes/${episodeId}`}>
                <Button variant="secondary">
                  <ExternalLink className="h-4 w-4" />
                  View All Assets
                </Button>
              </Link>
            </div>
          </CardContent>
        </TopoCard>
      </div>
    </div>
  )
}
