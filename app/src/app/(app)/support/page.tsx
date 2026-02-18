"use client";

import {
  HelpCircle,
  BookOpen,
  Mail,
  MessageCircle,
  ExternalLink,
  FileText,
  Headphones,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/podbrain";

const HELP_SECTIONS = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Comprehensive guides on using PodBrain features",
    link: "#",
    linkText: "Browse Docs",
  },
  {
    icon: Zap,
    title: "Quick Start Guide",
    description: "Get up and running in under 5 minutes",
    link: "#",
    linkText: "Get Started",
  },
  {
    icon: Headphones,
    title: "Audio Upload Guide",
    description: "Supported formats, file sizes, and best practices",
    link: "#",
    linkText: "Learn More",
  },
  {
    icon: FileText,
    title: "API Reference",
    description: "Technical documentation for developers",
    link: "#",
    linkText: "View API Docs",
  },
];

const FAQ = [
  {
    q: "What audio formats are supported?",
    a: "PodBrain supports MP3, WAV, M4A, AAC, OGG, and WebM formats. Maximum file size is 500MB, supporting episodes up to 4 hours.",
  },
  {
    q: "How long does processing take?",
    a: "Transcription typically takes less than 2x the audio duration. Show notes generation completes in under 60 seconds after transcription.",
  },
  {
    q: "What AI models are used?",
    a: "We use AssemblyAI for transcription with speaker diarization, and xAI Grok for content generation including show notes, SEO analysis, and social assets.",
  },
  {
    q: "Can I customize the generated content?",
    a: "Yes! All generated content can be edited. Custom vocabulary terms improve transcription accuracy, and your style preferences are learned over time.",
  },
  {
    q: "How does the vocabulary system work?",
    a: "Add industry-specific terms, proper nouns, and jargon to your show's vocabulary. Terms are used during transcription for keyword boosting and LLM post-processing to improve accuracy.",
  },
  {
    q: "What's included in the free plan?",
    a: "The free plan includes 3 episodes per month, 1 podcast show, basic AI show notes, and community support. Upgrade to Pro for unlimited episodes and advanced features.",
  },
];

export default function SupportPage() {
  return (
    <div>
      <PageHeader
        title="Support"
        description="Get help and find answers to common questions"
      />

      {/* Help Resources */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {HELP_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <a
              key={section.title}
              href={section.link}
              className="group flex items-start gap-4 rounded-xl border border-border-soft bg-bg-elevated p-5 transition-all hover:border-accent-blue/20 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10">
                <Icon className="h-5 w-5 text-accent-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary group-hover:text-accent-blue">
                  {section.title}
                </h3>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {section.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent-blue">
                  {section.linkText}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-border-soft bg-bg-elevated"
            >
              <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-text-primary transition-colors hover:text-accent-blue">
                {item.q}
              </summary>
              <div className="border-t border-border-soft px-5 py-4 text-sm text-text-secondary">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-border-soft bg-bg-elevated p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          Still need help?
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Our team is here to help you get the most out of PodBrain
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="mailto:support@getpodbrain.ai"
            className="inline-flex items-center gap-2 rounded-lg bg-accent-blue px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-blue/90"
          >
            <Mail className="h-4 w-4" />
            Email Support
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-lg border border-border-soft bg-bg-base px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-subtle"
          >
            <MessageCircle className="h-4 w-4" />
            Community Forum
          </a>
        </div>
      </div>
    </div>
  );
}
