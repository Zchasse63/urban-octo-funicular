import { Mic2, TrendingUp, Sparkles, Users, FileText, Share2, Check } from "lucide-react";
import Link from "next/link";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import { ContentCard } from "@/components/podbrain/content-card";
import { PrimaryButton, SecondaryButton } from "@/components/podbrain/buttons";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Transform Your Podcast Audio Into 30+ Content Assets
        </h1>
        <p
          className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 max-w-3xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          AI-powered platform that converts your podcast episodes into SEO-optimized show notes,
          promotional content, and guest packages. Let AI learn your show&apos;s vocabulary for
          unmatched accuracy.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href="/upload">
            <PrimaryButton className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] w-full sm:w-auto justify-center inline-flex gap-2">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              Get Started Free
            </PrimaryButton>
          </Link>
          <Link href="#pricing">
            <SecondaryButton className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] w-full sm:w-auto justify-center inline-flex gap-2">
              View Pricing
            </SecondaryButton>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2
          className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12"
          style={{ color: "var(--text-primary)" }}
        >
          Everything You Need to Amplify Your Podcast
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Feature 1: Transcription */}
          <ContentCard title="AI Transcription" className="text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <Mic2 className="w-8 h-8" style={{ color: "var(--accent-blue)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Powered by AssemblyAI with speaker diarization and custom vocabulary learning for
              perfect accuracy on industry terms.
            </p>
          </ContentCard>

          {/* Feature 2: SEO Optimization */}
          <ContentCard title="SEO Optimization" className="text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <TrendingUp className="w-8 h-8" style={{ color: "var(--accent-green)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Automatic keyword analysis, schema markup generation, and SEO scoring to maximize your
              podcast&apos;s discoverability.
            </p>
          </ContentCard>

          {/* Feature 3: Content Multiplication */}
          <ContentCard title="30+ Content Assets" className="text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <FileText className="w-8 h-8" style={{ color: "var(--accent-amber)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Generate LinkedIn posts, Twitter threads, blog posts, newsletters, quote cards, and
              more—all from a single episode.
            </p>
          </ContentCard>

          {/* Feature 4: Guest Packages */}
          <ContentCard title="Guest Promotion Packages" className="text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <Share2 className="w-8 h-8" style={{ color: "var(--accent-blue)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Automatically create shareable promo packages for guests with audiograms, quote cards,
              and pre-written social posts.
            </p>
          </ContentCard>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2
          className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Simple, Transparent Pricing
        </h2>
        <p className="text-center mb-8 sm:mb-12 text-base sm:text-lg" style={{ color: "var(--text-secondary)" }}>
          Start free. Upgrade as you grow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Free Tier */}
          <ContentCard title="Free">
            <div className="mb-4">
              <p className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {SUBSCRIPTION_TIERS.free.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                  ${SUBSCRIPTION_TIERS.free.priceMonthly}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {SUBSCRIPTION_TIERS.free.episodesPerMonth} episodes per month
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {SUBSCRIPTION_TIERS.free.maxShows} show
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>All AI features</span>
              </li>
            </ul>
            <Link href="/upload" className="w-full">
              <SecondaryButton className="w-full justify-center min-h-[44px]">
                Start Free
              </SecondaryButton>
            </Link>
          </ContentCard>

          {/* Pro Tier */}
          <ContentCard title="Pro" style={{ borderColor: "var(--accent-blue)", borderWidth: "2px" }}>
            <div className="mb-4">
              <Badge variant="new" className="mb-3">Most Popular</Badge>
              <p className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {SUBSCRIPTION_TIERS.pro.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                  ${SUBSCRIPTION_TIERS.pro.priceMonthly}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Unlimited episodes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {SUBSCRIPTION_TIERS.pro.maxShows} shows
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Priority processing</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Advanced analytics</span>
              </li>
            </ul>
            <Link href="/upload" className="w-full">
              <PrimaryButton className="w-full justify-center min-h-[44px]">
                Start Pro Trial
              </PrimaryButton>
            </Link>
          </ContentCard>

          {/* Agency Tier */}
          <ContentCard title="Agency">
            <div className="mb-4">
              <p className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                {SUBSCRIPTION_TIERS.agency.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                  ${SUBSCRIPTION_TIERS.agency.priceMonthly}
                </span>
                <span style={{ color: "var(--text-secondary)" }}>/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Unlimited episodes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {SUBSCRIPTION_TIERS.agency.maxShows} shows
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {SUBSCRIPTION_TIERS.agency.teamSeats} team seats
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 mt-0.5" style={{ color: "var(--accent-green)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Dedicated support</span>
              </li>
            </ul>
            <Link href="/upload" className="w-full">
              <SecondaryButton className="w-full justify-center min-h-[44px]">
                Start Agency Trial
              </SecondaryButton>
            </Link>
          </ContentCard>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2
          className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12"
          style={{ color: "var(--text-primary)" }}
        >
          Loved by Podcasters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Testimonial 1 */}
          <ContentCard title="Sarah Chen" subtitle="Tech Talk Daily">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}
              >
                <Users className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              &quot;PodBrain cut my post-production time by 80%. The AI actually understands technical
              jargon and gets the transcriptions perfect. Game changer.&quot;
            </p>
          </ContentCard>

          {/* Testimonial 2 */}
          <ContentCard title="Marcus Johnson" subtitle="The Marketing Show">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}
              >
                <Users className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              &quot;I used to spend hours creating social posts. Now I get 30+ assets instantly. My
              LinkedIn engagement has tripled since using PodBrain.&quot;
            </p>
          </ContentCard>

          {/* Testimonial 3 */}
          <ContentCard title="Emily Rodriguez" subtitle="Wellness Wisdom">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}
              >
                <Users className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              &quot;The guest promo packages are incredible. My guests love sharing their episodes
              because everything is ready to go. Worth every penny.&quot;
            </p>
          </ContentCard>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t mt-12 sm:mt-16 md:mt-20 py-8 sm:py-12"
        style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--bg-subtle)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <div className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                PodBrain
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                AI-powered podcast content platform
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Product
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" style={{ color: "var(--text-secondary)" }}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" style={{ color: "var(--text-secondary)" }}>
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Legal
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" style={{ color: "var(--text-secondary)" }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" style={{ color: "var(--text-secondary)" }}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" style={{ color: "var(--text-secondary)" }}>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Contact
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                support@getpodbrain.ai
              </p>
            </div>
          </div>
          <div
            className="pt-8 border-t text-center text-sm"
            style={{ borderColor: "var(--border-soft)", color: "var(--text-tertiary)" }}
          >
            © 2026 PodBrain Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
