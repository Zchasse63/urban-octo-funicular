"use client"

import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/input"
import { HelpCircle, MessageSquare, BookOpen, ExternalLink } from "lucide-react"
import { useState } from "react"

const faqs = [
  {
    q: "How long does transcription take?",
    a: "Transcription typically takes about 2x the audio duration. A 1-hour episode will take approximately 2 hours to transcribe.",
  },
  {
    q: "What audio formats are supported?",
    a: "We support MP3, WAV, M4A, AAC, OGG, and WebM formats, up to 500MB per file.",
  },
  {
    q: "How does custom vocabulary work?",
    a: "Add terms unique to your show (guest names, technical jargon, brand names). Our AI uses these to improve transcription accuracy and generate more relevant content.",
  },
  {
    q: "Can I edit generated content?",
    a: "Yes — all generated show notes, assets, and content can be edited directly. You can also regenerate any asset with updated context.",
  },
  {
    q: "How do I upgrade my plan?",
    a: "Go to Settings → Subscription and click 'Upgrade'. You can manage your billing through our Stripe portal.",
  },
]

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support"
        description="Get help with PodBrain"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* FAQ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--color-accent-blue)]" />
              <CardTitle>Frequently Asked Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-[var(--color-border)]">
              {faqs.map((faq, i) => (
                <div key={i} className="py-3">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className={cn(
                      "w-full text-left font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-medium",
                      "text-[var(--color-text-ink)] transition-colors hover:text-[var(--color-accent-blue)]"
                    )}
                  >
                    {faq.q}
                  </button>
                  {expandedFaq === i && (
                    <p className="mt-2 text-[var(--text-caption)] text-[var(--color-text-secondary)]">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[var(--color-accent-warm)]" />
              <CardTitle>Send Feedback</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Textarea
                placeholder="Describe your issue or suggestion…"
                rows={5}
              />
              <Button>Send Message</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm">
          <HelpCircle className="h-3.5 w-3.5" />
          Documentation
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button variant="secondary" size="sm">
          <MessageSquare className="h-3.5 w-3.5" />
          Community
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
