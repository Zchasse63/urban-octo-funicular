"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Mail,
  MessageCircle,
  ExternalLink,
  FileText,
  Headphones,
  Zap,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/podbrain";
import SectionHeading from "@/components/podbrain/section-heading";
import { PrimaryButton, SecondaryButton } from "@/components/podbrain/buttons";
import { staggerContainer, staggerItem, springs } from "@/lib/motion";

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

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border-soft bg-bg-elevated">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-text-primary transition-colors hover:text-accent-blue"
      >
        {question}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springs.snappy}
        >
          <ChevronDown className="h-4 w-4 shrink-0 text-text-tertiary" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.smooth}
            className="overflow-hidden"
          >
            <div className="border-t border-border-soft px-5 py-4 text-sm text-text-secondary">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div>
      <PageHeader
        title="Support"
        description="Get help and find answers to common questions"
      />

      {/* Help Resources */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mb-8 grid gap-4 sm:grid-cols-2"
      >
        {HELP_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <motion.a
              key={section.title}
              variants={staggerItem}
              href={section.link}
              className="group flex items-start gap-4 rounded-xl border border-border-soft bg-bg-elevated p-5 shadow-[var(--shadow-topo)] transition-all hover:border-accent-blue/20 hover:shadow-[var(--shadow-topo-hover)] hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 transition-colors group-hover:bg-accent-blue/15">
                <Icon className="h-5 w-5 text-accent-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
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
            </motion.a>
          );
        })}
      </motion.div>

      {/* FAQ */}
      <div className="mb-8">
        <SectionHeading className="mb-4">
          Frequently Asked Questions
        </SectionHeading>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-border-soft bg-bg-elevated p-6 shadow-[var(--shadow-topo)]">
        <h2 className="text-lg font-semibold text-text-primary">
          Still need help?
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Our team is here to help you get the most out of PodBrain
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="mailto:support@getpodbrain.ai">
            <PrimaryButton>
              <Mail className="mr-2 h-4 w-4" />
              Email Support
            </PrimaryButton>
          </a>
          <a href="#">
            <SecondaryButton>
              <MessageCircle className="mr-2 h-4 w-4" />
              Community Forum
            </SecondaryButton>
          </a>
        </div>
      </div>
    </div>
  );
}
