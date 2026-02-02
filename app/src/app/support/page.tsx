'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  ExternalLink,
  ChevronRight,
  Mic2,
  Upload,
  Zap,
  BarChart3,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I upload my first podcast episode?',
    answer:
      'Click the "+ New Upload" button in the sidebar or navigate to the Upload page. You can drag and drop your audio file (MP3, WAV, M4A, or FLAC) or click to browse. Files up to 4 hours in length are supported.',
  },
  {
    question: 'How long does transcription take?',
    answer:
      'Transcription typically takes 10-20% of your audio duration. A 60-minute episode usually processes in 6-12 minutes. You\'ll receive a notification when processing is complete.',
  },
  {
    question: 'Can I edit the generated show notes?',
    answer:
      'Yes! All generated content is fully editable. Click on any text section to make changes, and use the editor toolbar for formatting. Your edits are saved automatically.',
  },
  {
    question: 'How does the health score work?',
    answer:
      'The health score (0-100) measures your episode\'s SEO optimization, content quality, and discoverability. It factors in keyword usage, readability, schema markup completeness, and more. Higher scores indicate better optimization.',
  },
  {
    question: 'What languages are supported?',
    answer:
      'PodBrain currently supports English, Spanish, and Portuguese for transcription and content generation. Content is always generated in the source language without forced translation.',
  },
  {
    question: 'How do I connect my podcast hosting platform?',
    answer:
      'Go to Settings > Connections and click "Connect" next to your hosting platform. We currently support Buzzsprout with more platforms coming soon. Once connected, you can push show notes directly to your episodes.',
  },
];

const guides = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of PodBrain and upload your first episode',
    icon: Mic2,
    href: '#',
  },
  {
    title: 'Upload & Processing',
    description: 'Best practices for audio files and understanding the processing pipeline',
    icon: Upload,
    href: '#',
  },
  {
    title: 'SEO Optimization',
    description: 'Maximize your episode discoverability with our SEO tools',
    icon: Zap,
    href: '#',
  },
  {
    title: 'Analytics & Insights',
    description: 'Understanding your content health scores and metrics',
    icon: BarChart3,
    href: '#',
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {item.question}
        </span>
        <ChevronRight
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          style={{ color: 'var(--text-tertiary)' }}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-in">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <HelpCircle className="w-8 h-8" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            How can we help?
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Find answers to common questions or get in touch with our team
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 sm:mb-12">
          <a
            href="mailto:support@podbrain.ai"
            className="topo-card flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <Mail className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Email Support
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                support@podbrain.ai
              </div>
            </div>
          </a>

          <a
            href="#"
            className="topo-card flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Community
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Join our Discord
              </div>
            </div>
          </a>

          <a
            href="#"
            className="topo-card flex items-center gap-3 hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <Book className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Documentation
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Read the docs
              </div>
            </div>
          </a>
        </div>

        {/* Guides Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="mono mb-4">Quick Start Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guides.map((guide) => (
              <a
                key={guide.title}
                href={guide.href}
                className="topo-card flex items-start gap-3 hover:bg-[var(--bg-subtle)] transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                >
                  <guide.icon className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {guide.title}
                    </span>
                    <ExternalLink
                      className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--text-tertiary)' }}
                    />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {guide.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-8 sm:mb-12">
          <h2 className="mono mb-4">Frequently Asked Questions</h2>
          <div className="topo-card">
            {faqs.map((faq, index) => (
              <FAQAccordion key={index} item={faq} />
            ))}
          </div>
        </div>

        {/* Still Need Help */}
        <div className="topo-card text-center">
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Still need help?
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Our support team typically responds within 24 hours
          </p>
          <a href="mailto:support@podbrain.ai" className="btn-primary inline-flex">
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
}
