"use client"

import {
  HelpCircle,
  MessageSquare,
  BookOpen,
  Zap,
  ExternalLink,
  Mail,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"

const resources = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Learn how to get the most out of PodBrain with our guides and tutorials.",
    action: "Read Docs",
    href: "#",
  },
  {
    icon: Zap,
    title: "Quick Start Guide",
    description: "Upload your first episode and generate AI-powered content in minutes.",
    action: "Get Started",
    href: "#",
  },
  {
    icon: MessageSquare,
    title: "Feature Requests",
    description: "Have an idea? We'd love to hear what features would help your workflow.",
    action: "Submit Idea",
    href: "#",
  },
  {
    icon: Mail,
    title: "Contact Support",
    description: "Need help with something? Our team is here to assist.",
    action: "Email Us",
    href: "mailto:support@getpodbrain.ai",
  },
]

const faqs = [
  {
    question: "How long does episode processing take?",
    answer: "Most episodes are fully processed within 5-10 minutes. Longer episodes (3-4 hours) may take up to 20 minutes.",
  },
  {
    question: "What audio formats are supported?",
    answer: "We support MP3, M4A, WAV, AAC, OGG, and WebM formats, up to 500MB per file.",
  },
  {
    question: "How does the vocabulary feature work?",
    answer: "Add custom terms that are unique to your show. The AI uses these during transcription and content generation for improved accuracy.",
  },
  {
    question: "Can I export my content?",
    answer: "Yes — all generated content can be copied to clipboard or downloaded. Guest packages can be shared via a unique link.",
  },
  {
    question: "How accurate is the transcription?",
    answer: "Our AI transcription achieves 95%+ accuracy for clear audio. Custom vocabulary further improves accuracy for domain-specific terms.",
  },
]

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Support"
        description="Get help, learn the platform, and share feedback"
      />

      <div className="space-y-8">
        {/* Resource cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resources.map((resource) => {
            const Icon = resource.icon
            return (
              <a
                key={resource.title}
                href={resource.href}
                className="group"
              >
                <Card className="h-full hover:shadow-[var(--shadow-card-hover)] transition-shadow">
                  <CardContent className="space-y-3">
                    <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-[var(--color-accent-blue)]/10 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-[var(--color-accent-blue)]" />
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-body)] text-[var(--color-text-ink)]">
                        {resource.title}
                      </h3>
                      <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)] mt-0.5">
                        {resource.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[var(--text-caption)] text-[var(--color-accent-blue)] group-hover:underline">
                      {resource.action}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-h3)] text-[var(--color-text-ink)] mb-4">
            Frequently Asked Questions
          </h2>
          <Card>
            <CardContent className="p-0">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="px-5 py-4 border-b border-[var(--color-border)] last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-4 h-4 text-[var(--color-accent-warm)] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] font-medium text-[var(--text-body-sm)] text-[var(--color-text-ink)]">
                        {faq.question}
                      </h3>
                      <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
