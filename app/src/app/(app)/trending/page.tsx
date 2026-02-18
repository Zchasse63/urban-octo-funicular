"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  Sparkles,
  Zap,
  Radio,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { PageHeader, Badge } from "@/components/podbrain";
import { staggerContainer, staggerItem } from "@/lib/motion";

const TRENDING_TOPICS = [
  {
    title: "AI in Content Creation",
    category: "Technology",
    description:
      "How creators are leveraging AI tools for podcast production, editing, and distribution",
    heat: 98,
    icon: Sparkles,
  },
  {
    title: "Creator Economy Shifts",
    category: "Business",
    description:
      "The evolving landscape of independent media and monetization strategies",
    heat: 92,
    icon: Zap,
  },
  {
    title: "Audio-First Social Media",
    category: "Social",
    description:
      "Platforms and formats that prioritize voice and audio content over text and video",
    heat: 85,
    icon: Radio,
  },
  {
    title: "Deep-Dive Storytelling",
    category: "Format",
    description:
      "Long-form investigative and narrative podcast formats gaining listener traction",
    heat: 79,
    icon: BookOpen,
  },
  {
    title: "Sustainable Business Models",
    category: "Business",
    description:
      "Beyond sponsorships: membership, premium content, and community-driven revenue",
    heat: 74,
    icon: Lightbulb,
  },
  {
    title: "Cross-Platform Distribution",
    category: "Strategy",
    description:
      "Repurposing podcast content across YouTube, TikTok, newsletters, and social media",
    heat: 71,
    icon: TrendingUp,
  },
];

function HeatBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-bg-subtle">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            value >= 90
              ? "bg-accent-red"
              : value >= 75
                ? "bg-amber-500"
                : "bg-accent-blue"
          }`}
        />
      </div>
      <span className="w-8 text-right font-mono text-xs text-text-tertiary">
        {value}
      </span>
    </div>
  );
}

export default function TrendingPage() {
  return (
    <div>
      <PageHeader
        title="Trending"
        description="Discover trending topics and content ideas for your podcast"
      />

      {/* Coming Soon Banner */}
      <div className="mb-6 rounded-xl border border-accent-blue/20 bg-accent-blue/5 p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-accent-blue" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              Trending Topics &mdash; Preview
            </p>
            <p className="text-xs text-text-secondary">
              Live trending data and personalized recommendations are coming soon.
              Here&apos;s a preview of the format.
            </p>
          </div>
        </div>
      </div>

      {/* Topic Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {TRENDING_TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <motion.div
              key={topic.title}
              variants={staggerItem}
              className="group rounded-xl border border-border-soft bg-bg-elevated p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10">
                  <Icon className="h-5 w-5 text-accent-blue" />
                </div>
                <Badge>{topic.category}</Badge>
              </div>
              <h3 className="mt-3 font-semibold text-text-primary">
                {topic.title}
              </h3>
              <p className="mt-1.5 text-sm text-text-secondary line-clamp-2">
                {topic.description}
              </p>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-text-tertiary">
                  <span>Interest Level</span>
                </div>
                <HeatBar value={topic.heat} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
