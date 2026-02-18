"use client";

import { use, useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import {
  Gift,
  Copy,
  Check,
  Mail,
  Download,
  Loader2,
  Linkedin,
  Twitter,
  Instagram,
  Quote,
  ArrowLeft,
  Send,
} from "lucide-react";
import Link from "next/link";
import { PageHeader, PrimaryButton, SecondaryButton } from "@/components/podbrain";
import useEpisode from "@/hooks/use-episode";
import { useToast } from "@/hooks/use-toast";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { SocialPostVariant, QuoteCard, GuestPackageContent } from "@/lib/guest-package/generator";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  instagram: Instagram,
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-600/10 text-blue-600",
  twitter: "bg-sky-500/10 text-sky-500",
  instagram: "bg-pink-500/10 text-pink-500",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-accent-green" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

function SocialPostCard({ post }: { post: SocialPostVariant }) {
  const Icon = PLATFORM_ICONS[post.platform] || Mail;
  const colorClass = PLATFORM_COLORS[post.platform] || "bg-bg-subtle text-text-secondary";

  return (
    <motion.div
      variants={staggerItem}
      className="rounded-xl border border-border-soft bg-bg-elevated p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold capitalize text-text-primary">
            {post.platform}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-text-tertiary">
            {post.characterCount}/{post.maxCharacters}
          </span>
          <CopyButton text={post.content} />
        </div>
      </div>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-text-secondary leading-relaxed">
        {post.content}
      </pre>
    </motion.div>
  );
}

function QuoteCardComponent({ card }: { card: QuoteCard }) {
  return (
    <motion.div
      variants={staggerItem}
      className="relative rounded-xl border border-border-soft bg-gradient-to-br from-bg-elevated to-bg-subtle p-5"
    >
      <Quote className="absolute right-4 top-4 h-8 w-8 text-accent-blue/10" />
      <blockquote className="text-sm italic text-text-primary leading-relaxed">
        &ldquo;{card.quote}&rdquo;
      </blockquote>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-text-secondary">
          <span className="font-medium">{card.attribution}</span>
          <span className="mx-1.5 text-text-tertiary">&middot;</span>
          <span className="text-text-tertiary">{card.episodeTitle}</span>
        </div>
        <CopyButton text={`"${card.quote}" - ${card.attribution}`} />
      </div>
    </motion.div>
  );
}

export default function GuestPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { episode, isLoading: episodeLoading } = useEpisode(id);
  const [guestPackage, setGuestPackage] = useState<GuestPackageContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const toast = useToast();

  const fetchPackage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/episodes/${id}/guest-package`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load guest package");
      }

      const data = await response.json();
      setGuestPackage(data.package);
      if (data.episode?.guest_email) {
        setGuestEmail(data.episode.guest_email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load package");
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [id]);

  // Fetch when episode is ready
  useEffect(() => {
    if (!episodeLoading && episode?.status === "completed" && !hasFetched) {
      fetchPackage();
    }
  }, [episodeLoading, episode?.status, hasFetched, fetchPackage]);

  const handleSendEmail = useCallback(async () => {
    if (!guestEmail.trim()) return;

    try {
      setIsSending(true);
      const response = await fetch(`/api/episodes/${id}/guest-package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail: guestEmail.trim(),
          customMessage: customMessage.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      toast.success("Guest package email sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  }, [id, guestEmail, customMessage, toast]);

  if (episodeLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="py-24 text-center">
        <p className="text-text-secondary">Episode not found</p>
        <Link
          href="/episodes"
          className="mt-2 inline-flex items-center gap-1 text-sm text-accent-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to episodes
        </Link>
      </div>
    );
  }

  if (episode.status !== "completed") {
    return (
      <div className="py-24 text-center">
        <Gift className="mx-auto h-12 w-12 text-text-tertiary" />
        <h2 className="mt-4 text-lg font-semibold text-text-primary">
          Episode Not Ready
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          The guest package will be available once the episode is fully processed.
        </p>
        <Link
          href={`/episodes/${id}`}
          className="mt-4 inline-flex items-center gap-1 text-sm text-accent-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to episode
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href={`/episodes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to episode
        </Link>
      </div>

      <PageHeader
        title="Guest Package"
        description={`Promotion materials for ${episode.guest_name || "your guest"} — ${episode.title || "Untitled Episode"}`}
        actions={
          <SecondaryButton
            onClick={() =>
              window.open(`/api/episodes/${id}/guest-package/download`, "_blank")
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Download ZIP
          </SecondaryButton>
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
          <p className="mt-3 text-sm text-text-secondary">
            Generating guest package...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-status-error-bg bg-status-error-bg/30 p-6 text-center">
          <p className="text-sm text-status-error-text">{error}</p>
          <button
            onClick={fetchPackage}
            className="mt-2 text-sm text-accent-blue hover:underline"
          >
            Try again
          </button>
        </div>
      ) : guestPackage ? (
        <div className="space-y-8">
          {/* Guest Info */}
          {episode.guest_name && (
            <div className="rounded-xl border border-border-soft bg-bg-elevated p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue/10 text-lg font-semibold text-accent-blue">
                  {episode.guest_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {episode.guest_name}
                  </h3>
                  {episode.guest_bio && (
                    <p className="text-sm text-text-secondary line-clamp-1">
                      {episode.guest_bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Social Posts */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              Social Posts
            </h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {guestPackage.socialPosts.map((post) => (
                <SocialPostCard key={post.platform} post={post} />
              ))}
            </motion.div>
          </div>

          {/* Quote Cards */}
          {guestPackage.quoteCards.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                Quote Cards
              </h2>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2"
              >
                {guestPackage.quoteCards.map((card) => (
                  <QuoteCardComponent key={card.id} card={card} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Email Template */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              Email Template
            </h2>
            <div className="rounded-xl border border-border-soft bg-bg-elevated p-5">
              <div className="flex items-center justify-between border-b border-border-soft pb-3">
                <div>
                  <div className="text-xs text-text-tertiary">Subject</div>
                  <div className="text-sm font-medium text-text-primary">
                    {guestPackage.emailSubject}
                  </div>
                </div>
                <CopyButton text={guestPackage.emailBody} />
              </div>
              <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap font-sans text-sm text-text-secondary leading-relaxed">
                {guestPackage.emailBody}
              </pre>
            </div>
          </div>

          {/* Send Email */}
          <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-accent-blue" />
              <h3 className="font-semibold text-text-primary">
                Send to Guest
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Guest Email
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full rounded-lg border border-border-soft bg-bg-elevated px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Custom Message{" "}
                  <span className="font-normal text-text-tertiary">(optional)</span>
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal note..."
                  rows={3}
                  className="w-full rounded-lg border border-border-soft bg-bg-elevated px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20 resize-none"
                />
              </div>
              <PrimaryButton
                onClick={handleSendEmail}
                disabled={!guestEmail.trim()}
                isLoading={isSending}
                loadingText="Sending..."
              >
                <Send className="mr-2 h-4 w-4" />
                Send Guest Package
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
