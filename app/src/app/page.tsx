import Link from "next/link"
import {
  FileText,
  Layers,
  Search,
  Gift,
  BookOpen,
  Radio,
  Upload,
  Sparkles,
  Rocket,
  Clock,
  Brain,
  PenLine,
  Check,
  ArrowRight,
  ChevronRight,
  Mic,
  Twitter,
  Github,
  Linkedin,
} from "lucide-react"
import { PRICING_TIERS } from "@/lib/stripe/products"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] dark:bg-[#3B82F6]">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">
              PodBrain
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#1D4ED8] active:shadow-none dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-32">
          {/* Subtle gradient backdrop */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#2563EB]/[0.04] blur-3xl dark:bg-[#3B82F6]/[0.06]" />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-75 dark:bg-[#3B82F6]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
              </span>
              AI-Powered Podcast Content Platform
            </div>

            <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Transform Your Podcast
              <br />
              Into{" "}
              <span className="bg-gradient-to-r from-[#2563EB] to-[#C2693D] bg-clip-text text-transparent dark:from-[#3B82F6] dark:to-[#D97A4A]">
                Content Gold
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
              AI-powered show notes, 12+ content assets, and guest promotion
              packages — generated in minutes, not hours.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#2563EB] px-7 text-base font-semibold text-white shadow-md transition-all hover:bg-[#1D4ED8] hover:shadow-lg active:shadow-sm dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
              >
                Start 14-Day Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-7 text-base font-medium shadow-sm transition-all hover:bg-accent active:shadow-none"
              >
                See how it works
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>

            {/* Social proof nudge */}
            <p className="mt-10 text-xs font-medium tracking-wide text-muted-foreground/70">
              14-DAY PRO TRIAL &middot; NO CREDIT CARD REQUIRED
            </p>
          </div>
        </section>

        {/* ── Problem / Solution Section ── */}
        <section className="border-y border-border bg-card px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C2693D] dark:text-[#D97A4A]">
                The Problem
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Hours of Manual Work After Every Episode
              </h2>
              <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
                PodBrain does it all in minutes with AI that learns your show.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {[
                {
                  icon: Clock,
                  title: "Time-Consuming Show Notes",
                  description:
                    "Writing detailed show notes, timestamps, and summaries eats hours you could spend creating.",
                },
                {
                  icon: PenLine,
                  title: "Manual Content Repurposing",
                  description:
                    "Turning one episode into social posts, blog articles, and newsletters is tedious and repetitive.",
                },
                {
                  icon: Brain,
                  title: "Inconsistent Quality",
                  description:
                    "Rushed notes and content lead to missed SEO opportunities and weaker audience engagement.",
                },
              ].map((pain) => (
                <div
                  key={pain.title}
                  className="group rounded-xl border border-border bg-background p-6 transition-all hover:border-[#2563EB]/30 hover:shadow-md dark:hover:border-[#3B82F6]/30"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#C2693D]/10 dark:bg-[#D97A4A]/10">
                    <pain.icon className="h-5 w-5 text-[#C2693D] dark:text-[#D97A4A]" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">
                    {pain.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pain.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section
          id="features"
          className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] dark:text-[#3B82F6]">
                Features
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need to Grow Your Podcast
              </h2>
              <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
                From transcription to content multiplication, PodBrain handles
                the heavy lifting so you can focus on creating.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: FileText,
                  title: "AI Show Notes",
                  description:
                    "Polished, structured show notes with timestamps, key takeaways, and chapter markers generated automatically.",
                },
                {
                  icon: Layers,
                  title: "12+ Content Assets",
                  description:
                    "Social posts, blog drafts, email newsletters, pull quotes, and more from a single episode.",
                },
                {
                  icon: Search,
                  title: "SEO Intelligence",
                  description:
                    "Keyword analysis, meta descriptions, and schema markup to maximize your podcast's discoverability.",
                },
                {
                  icon: Gift,
                  title: "Guest Promo Packages",
                  description:
                    "Ready-to-send guest promotion kits with branded assets, social copy, and shareable quotes.",
                },
                {
                  icon: BookOpen,
                  title: "Custom Vocabulary",
                  description:
                    "AI that learns your show's unique terms, names, and jargon for increasingly accurate transcriptions.",
                },
                {
                  icon: Radio,
                  title: "Podcast 2.0 Ready",
                  description:
                    "Full support for modern podcast standards including transcripts, chapters, and enhanced feeds.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-[#2563EB]/30 hover:shadow-md dark:hover:border-[#3B82F6]/30"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#2563EB]/10 dark:bg-[#3B82F6]/10">
                    <feature.icon className="h-5 w-5 text-[#2563EB] dark:text-[#3B82F6]" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="border-y border-border bg-card px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] dark:text-[#3B82F6]">
                How It Works
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Three Steps to Better Content
              </h2>
            </div>

            <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
              {[
                {
                  step: "01",
                  icon: Upload,
                  title: "Upload Your Episode",
                  description:
                    "Drag and drop your audio file or connect your Buzzsprout feed for automatic imports.",
                },
                {
                  step: "02",
                  icon: Sparkles,
                  title: "AI Processes Everything",
                  description:
                    "PodBrain transcribes, analyzes, and generates show notes plus 12+ content assets in minutes.",
                },
                {
                  step: "03",
                  icon: Rocket,
                  title: "Review and Publish",
                  description:
                    "Edit, customize, and distribute your content everywhere — blog, social, email, and more.",
                },
              ].map((step) => (
                <div key={step.step} className="relative text-center">
                  {/* Step number */}
                  <div className="mb-6 inline-flex">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                        <step.icon className="h-7 w-7 text-[#2563EB] dark:text-[#3B82F6]" />
                      </div>
                      <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] font-mono text-xs font-bold text-white dark:bg-[#3B82F6]">
                        {step.step.replace("0", "")}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing Section ── */}
        <section
          id="pricing"
          className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] dark:text-[#3B82F6]">
                Pricing
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
                All plans start with a free 14-day Pro trial. No credit card required.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  {
                    tier: PRICING_TIERS.pro,
                    cta: "Start 14-day Trial",
                    href: "/register?plan=pro",
                  },
                  {
                    tier: PRICING_TIERS.creator,
                    cta: "Start 14-day Trial",
                    href: "/register?plan=creator",
                  },
                  {
                    tier: PRICING_TIERS.agency,
                    cta: "Start 14-day Trial",
                    href: "/register?plan=agency",
                  },
                ] as const
              ).map(({ tier, cta, href }) => (
                <div
                  key={tier.tier}
                  className={`relative flex flex-col rounded-xl border p-6 transition-all sm:p-8 ${
                    tier.highlighted
                      ? "border-[#2563EB] shadow-lg shadow-[#2563EB]/10 dark:border-[#3B82F6] dark:shadow-[#3B82F6]/10"
                      : "border-border bg-card"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white dark:bg-[#3B82F6]">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-heading text-lg font-semibold">
                      {tier.name}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-heading text-4xl font-bold tracking-tight">
                        ${tier.price}
                      </span>
                      {tier.price > 0 && (
                        <span className="text-sm text-muted-foreground">
                          /month
                        </span>
                      )}
                    </div>
                    {tier.priceAnnual > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        or ${tier.priceAnnual}/yr (2 months free)
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tier.audioMinutesPerMonth.toLocaleString()} min/mo &middot;{" "}
                      {tier.shows >= 999
                        ? "Unlimited shows"
                        : `${tier.shows} show${tier.shows > 1 ? "s" : ""}`}
                    </p>
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB] dark:text-[#3B82F6]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={href}
                    className={`inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                      tier.highlighted
                        ? "bg-[#2563EB] text-white shadow-sm hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
                        : "border border-border bg-background text-foreground shadow-sm hover:bg-accent"
                    }`}
                  >
                    {cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="border-t border-border bg-card px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Podcast Workflow?
            </h2>
            <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
              Join podcasters who are saving hours every week with AI-powered
              content generation.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#2563EB] px-8 text-base font-semibold text-white shadow-md transition-all hover:bg-[#1D4ED8] hover:shadow-lg active:shadow-sm dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
              >
                Start 14-Day Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2563EB] dark:bg-[#3B82F6]">
                <Mic className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-heading text-sm font-bold tracking-tight">
                PodBrain
              </span>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/support"
                className="transition-colors hover:text-foreground"
              >
                Support
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/cookies"
                className="transition-colors hover:text-foreground"
              >
                Cookies
              </Link>
            </nav>

            {/* Social */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                aria-label="Twitter"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-8 text-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} PodBrain. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
