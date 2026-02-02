"use client";

import { EpisodeHeader } from "@/components/episodes/episode-header";
import { MetricsRow } from "@/components/episodes/metrics-row";
import { ShowNotesCard } from "@/components/episodes/show-notes-card";
import { GuestIntelligenceCard } from "@/components/episodes/guest-intelligence-card";
import { ContentHealthCard } from "@/components/episodes/content-health-card";

// Mock data for sample episode
const mockEpisode = {
  id: "ep-142",
  episodeNumber: 142,
  title: "The Future of AI in Content Creation with Sarah Chen",
  processedAt: "2 hours ago",
  metrics: {
    retentionScore: 87,
    retentionTrend: 5,
    keyTakeaways: 8,
    sentiment: {
      label: "Positive",
      score: 82,
    },
  },
  showNotes: {
    summary:
      "In this episode, we dive deep into how artificial intelligence is reshaping the content creation landscape. Sarah Chen, founder of ContentAI Labs, shares her insights on the tools, techniques, and ethical considerations that every creator should know. From automated transcription to AI-powered editing, discover what's possible today and what's coming tomorrow.",
    executiveSummary: [
      {
        timestamp: "00:02:15",
        title: "Introduction to AI Content Tools",
        content:
          "Overview of the current AI landscape and how it's being adopted by content creators worldwide.",
      },
      {
        timestamp: "00:14:30",
        title: "The Ethics of AI-Generated Content",
        content:
          "Discussion on transparency, authenticity, and the responsibility creators have when using AI tools.",
      },
      {
        timestamp: "00:28:45",
        title: "Practical Implementation Strategies",
        content:
          "Step-by-step approaches for integrating AI into your existing content workflow without losing your authentic voice.",
      },
      {
        timestamp: "00:45:00",
        title: "Future Predictions and Trends",
        content:
          "What to expect in the next 5 years and how to prepare your content strategy for upcoming changes.",
      },
    ],
    keyDiscussionPoints: [
      "AI should augment human creativity, not replace it",
      "Transparency with your audience builds trust when using AI tools",
      "Start with low-risk applications like transcription before moving to content generation",
      "The best results come from human-AI collaboration, not full automation",
      "Quality control remains essential regardless of how content is created",
    ],
    actionItems: [
      "Audit your current content workflow to identify AI integration opportunities",
      "Experiment with one AI tool this week (try transcription or grammar checking)",
      "Create a disclosure policy for AI-assisted content",
      "Join the ContentAI Labs community for ongoing resources",
    ],
    resourcesMentioned: [
      { title: "ContentAI Labs", url: "https://contentailabs.com" },
      { title: "The AI Content Playbook (Sarah's book)", url: "https://example.com/book" },
      { title: "OpenAI API Documentation", url: "https://platform.openai.com/docs" },
      { title: "Ethical AI Guidelines for Creators" },
    ],
    guestBio:
      "Sarah Chen is the founder and CEO of ContentAI Labs, a company dedicated to helping creators leverage AI ethically and effectively. With over 15 years of experience in content strategy and machine learning, she bridges the gap between cutting-edge technology and practical application. Sarah has worked with Fortune 500 companies and independent creators alike, and her book 'The AI Content Playbook' has become an industry standard.",
  },
  guest: {
    name: "Sarah Chen",
    title: "Founder & CEO",
    company: "ContentAI Labs",
    topics: ["AI Ethics", "Content Strategy", "Machine Learning", "Automation", "Creator Economy"],
    socialLinks: [
      { platform: "twitter" as const, url: "https://twitter.com/sarahchen" },
      { platform: "linkedin" as const, url: "https://linkedin.com/in/sarahchen" },
      { platform: "website" as const, url: "https://contentailabs.com" },
    ],
  },
  contentHealth: {
    pacingScore: 78,
    clarityMetric: 92,
    recommendation:
      "Consider adding more pauses between topic transitions to improve listener retention. The clarity is excellent, but the pacing could benefit from 2-3 additional breaks around the 30-minute mark.",
  },
};

export default function EpisodeDetailPage() {
  const handleExportPdf = () => {
    console.log("Exporting PDF...");
  };

  const handlePublish = () => {
    console.log("Publishing episode...");
  };

  return (
    <div className="animate-in">
      {/* Episode Header */}
      <EpisodeHeader
        episodeNumber={mockEpisode.episodeNumber}
        processedAt={mockEpisode.processedAt}
        title={mockEpisode.title}
        onExportPdf={handleExportPdf}
        onPublish={handlePublish}
      />

      {/* Metrics Row */}
      <MetricsRow metrics={mockEpisode.metrics} />

      {/* Two-Column Canvas Grid (1.6fr | 1fr) */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        {/* Left Column - Show Notes */}
        <div>
          <ShowNotesCard showNotes={mockEpisode.showNotes} />
        </div>

        {/* Right Column - Sidebar Cards */}
        <div className="space-y-6">
          <GuestIntelligenceCard guest={mockEpisode.guest} />
          <ContentHealthCard health={mockEpisode.contentHealth} />
        </div>
      </div>
    </div>
  );
}
