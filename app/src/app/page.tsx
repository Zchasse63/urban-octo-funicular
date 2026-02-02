import { Mic2, TrendingUp, Sparkles, Users, FileText, Share2, Check } from "lucide-react";
import Link from "next/link";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="animate-in max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
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
          promotional content, and guest packages. Let AI learn your show's vocabulary for
          unmatched accuracy.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href="/upload" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] justify-center">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
            Get Started Free
          </Link>
          <Link href="#pricing" className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 min-h-[44px] justify-center">
            View Pricing
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
          <div className="topo-card text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <Mic2 className="w-8 h-8" style={{ color: "var(--accent-blue)" }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              AI Transcription
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Powered by AssemblyAI with speaker diarization and custom vocabulary learning for
              perfect accuracy on industry terms.
            </p>
          </div>

          {/* Feature 2: SEO Optimization */}
          <div className="topo-card text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <TrendingUp className="w-8 h-8" style={{ color: "var(--accent-green)" }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              SEO Optimization
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Automatic keyword analysis, schema markup generation, and SEO scoring to maximize your
              podcast's discoverability.
            </p>
          </div>

          {/* Feature 3: Content Multiplication */}
          <div className="topo-card text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <FileText className="w-8 h-8" style={{ color: "var(--accent-amber)" }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              30+ Content Assets
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Generate LinkedIn posts, Twitter threads, blog posts, newsletters, quote cards, and
              more—all from a single episode.
            </p>
          </div>

          {/* Feature 4: Guest Packages */}
          <div className="topo-card text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}
            >
              <Share2 className="w-8 h-8" style={{ color: "var(--accent-blue)" }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Guest Promotion Packages
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Automatically create shareable promo packages for guests with audiograms, quote cards,
              and pre-written social posts.
            </p>
          </div>
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
          <div className="topo-card">
            <h3 className="sr-only">Free Plan Details</h3>
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
            <Link href="/upload" className="btn-secondary w-full justify-center min-h-[44px]">
              Start Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="topo-card" style={{ borderColor: "var(--accent-blue)", borderWidth: "2px" }}>
            <h3 className="sr-only">Pro Plan Details</h3>
            <div className="mb-4">
              <div className="badge-new mb-3">Most Popular</div>
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
            <Link href="/upload" className="btn-primary w-full justify-center min-h-[44px]">
              Start Pro Trial
            </Link>
          </div>

          {/* Agency Tier */}
          <div className="topo-card">
            <h3 className="sr-only">Agency Plan Details</h3>
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
            <Link href="/upload" className="btn-secondary w-full justify-center min-h-[44px]">
              Start Agency Trial
            </Link>
          </div>
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
          <div className="topo-card">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-subtle)" }}
                >
                  <Users className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    Sarah Chen
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Tech Talk Daily
                  </div>
                </div>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              "PodBrain cut my post-production time by 80%. The AI actually understands technical
              jargon and gets the transcriptions perfect. Game changer."
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="topo-card">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-subtle)" }}
                >
                  <Users className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    Marcus Johnson
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    The Marketing Show
                  </div>
                </div>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              "I used to spend hours creating social posts. Now I get 30+ assets instantly. My
              LinkedIn engagement has tripled since using PodBrain."
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="topo-card">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-subtle)" }}
                >
                  <Users className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    Emily Rodriguez
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Wellness Wisdom
                  </div>
                </div>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)" }}>
              "The guest promo packages are incredible. My guests love sharing their episodes
              because everything is ready to go. Worth every penny."
            </p>
          </div>
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
