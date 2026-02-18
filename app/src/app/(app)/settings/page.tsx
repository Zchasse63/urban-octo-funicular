"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  CreditCard,
  Puzzle,
  BookOpen,
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  Rss,
  AlertCircle,
} from "lucide-react";
import { PageHeader, Badge, PrimaryButton, SecondaryButton, DangerButton } from "@/components/podbrain";
import { PRICING_TIERS, type PricingTier, type TierFeatures } from "@/lib/stripe/products";
import useSubscription from "@/hooks/use-subscription";
import useShows from "@/hooks/use-shows";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { springs } from "@/lib/motion";

type SettingsTab = "account" | "billing" | "integrations" | "vocabulary";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
];

/* ─── Account Tab ─── */
function AccountTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border-soft bg-bg-elevated p-6">
        <h3 className="text-lg font-semibold text-text-primary">Profile</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Authentication is not yet enabled. The app runs in single-user mode.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              User ID
            </label>
            <p className="mt-1 font-mono text-sm text-text-tertiary">
              {DEFAULT_USER_ID}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Mode
            </label>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="ai">Single User</Badge>
              <span className="text-sm text-text-tertiary">
                Auth will be added pre-launch
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border-soft bg-bg-elevated p-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Usage This Month
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Track your episode processing usage
        </p>
        <div className="mt-4 text-center text-sm text-text-tertiary">
          Usage tracking coming soon
        </div>
      </div>
    </div>
  );
}

/* ─── Billing Tab ─── */
function BillingTab() {
  const { subscription, isLoading, checkout, openPortal } = useSubscription();
  const currentTier = subscription?.tier || "free";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      {subscription?.status === "active" && (
        <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Current Plan: {PRICING_TIERS[currentTier]?.name}
              </h3>
              {subscription.current_period_end && (
                <p className="mt-1 text-sm text-text-secondary">
                  Renews{" "}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <SecondaryButton onClick={openPortal}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Billing
            </SecondaryButton>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.values(PRICING_TIERS) as TierFeatures[]).map((tier) => {
          const isCurrent = currentTier === tier.tier;
          return (
            <div
              key={tier.tier}
              className={`relative rounded-xl border p-6 transition-shadow ${
                isCurrent
                  ? "border-accent-blue bg-accent-blue/5 shadow-md"
                  : "border-border-soft bg-bg-elevated hover:shadow-sm"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-4">
                  <Badge variant="new">Current Plan</Badge>
                </div>
              )}
              <h3 className="text-lg font-semibold text-text-primary">
                {tier.name}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-text-primary">
                  ${tier.price}
                </span>
                <span className="text-sm text-text-secondary">/month</span>
              </div>
              <ul className="mt-4 space-y-2">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-text-secondary"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-green" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <SecondaryButton className="w-full" disabled>
                    Current Plan
                  </SecondaryButton>
                ) : tier.priceId ? (
                  <PrimaryButton
                    className="w-full"
                    onClick={() => checkout(tier.priceId!)}
                  >
                    {tier.price > (PRICING_TIERS[currentTier]?.price || 0)
                      ? "Upgrade"
                      : "Switch"}{" "}
                    to {tier.name}
                  </PrimaryButton>
                ) : (
                  <SecondaryButton className="w-full" disabled>
                    Free Forever
                  </SecondaryButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Integrations Tab ─── */
function IntegrationsTab() {
  const [apiToken, setApiToken] = useState("");
  const [buzzsproutShowId, setBuzzsproutShowId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const toast = useToast();

  const handleConnect = useCallback(async () => {
    if (!apiToken.trim()) return;
    try {
      setIsConnecting(true);
      const response = await fetch("/api/buzzsprout/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_token: apiToken,
          show_id: buzzsproutShowId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to connect");
      }

      const data = await response.json();
      setIsConnected(true);
      setConnectionId(data.id);
      setApiToken("");
      setBuzzsproutShowId("");
      toast.success("Connected to Buzzsprout!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }, [apiToken, buzzsproutShowId, toast]);

  const handleDisconnect = useCallback(async () => {
    try {
      setIsDisconnecting(true);
      const response = await fetch("/api/buzzsprout/connect", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      setIsConnected(false);
      setConnectionId(null);
      toast.success("Disconnected from Buzzsprout");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setIsDisconnecting(false);
    }
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border-soft bg-bg-elevated p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
            <Rss className="h-6 w-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-text-primary">
                Buzzsprout
              </h3>
              {isConnected && <Badge variant="success">Connected</Badge>}
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              Import episodes and publish show notes directly to Buzzsprout
            </p>
          </div>
        </div>

        {isConnected ? (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border-soft bg-bg-subtle px-4 py-3">
            <div className="text-sm">
              <span className="text-text-secondary">Connection ID: </span>
              <span className="font-mono text-text-tertiary">
                {connectionId?.slice(0, 8)}...
              </span>
            </div>
            <DangerButton
              onClick={handleDisconnect}
              isLoading={isDisconnecting}
              loadingText="Disconnecting..."
              size="sm"
            >
              Disconnect
            </DangerButton>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                API Token
              </label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Enter your Buzzsprout API token"
                className="w-full rounded-lg border border-border-soft bg-bg-base px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Show ID{" "}
                <span className="font-normal text-text-tertiary">(optional)</span>
              </label>
              <input
                type="text"
                value={buzzsproutShowId}
                onChange={(e) => setBuzzsproutShowId(e.target.value)}
                placeholder="Specific Buzzsprout show ID"
                className="w-full rounded-lg border border-border-soft bg-bg-base px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </div>
            <PrimaryButton
              onClick={handleConnect}
              disabled={!apiToken.trim()}
              isLoading={isConnecting}
              loadingText="Connecting..."
            >
              <Puzzle className="mr-2 h-4 w-4" />
              Connect Buzzsprout
            </PrimaryButton>
          </div>
        )}
      </div>

      {/* Future Integrations */}
      <div className="rounded-xl border border-dashed border-border-soft bg-bg-subtle/50 p-6 text-center">
        <p className="text-sm text-text-tertiary">
          More integrations coming soon (Transistor, Podbean, Spotify for
          Podcasters)
        </p>
      </div>
    </div>
  );
}

/* ─── Vocabulary Tab ─── */
interface VocabTerm {
  id: string;
  term: string;
  definition: string | null;
  show_id: string;
}

function VocabularyTab() {
  const { shows, isLoading: showsLoading } = useShows();
  const [selectedShowId, setSelectedShowId] = useState("");
  const [terms, setTerms] = useState<VocabTerm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();

  // Fetch vocabulary terms for selected show
  useEffect(() => {
    if (!selectedShowId) {
      setTerms([]);
      return;
    }

    const fetchTerms = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("vocabulary_terms")
          .select("id, term, definition, show_id")
          .eq("show_id", selectedShowId)
          .order("term");

        if (error) throw error;
        setTerms(data || []);
      } catch {
        toast.error("Failed to load vocabulary terms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, [selectedShowId, toast]);

  const handleAdd = useCallback(async () => {
    if (!newTerm.trim() || !selectedShowId) return;

    try {
      setIsAdding(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vocabulary_terms")
        .insert({
          term: newTerm.trim(),
          definition: newDefinition.trim() || null,
          show_id: selectedShowId,
          user_id: DEFAULT_USER_ID,
        })
        .select("id, term, definition, show_id")
        .single();

      if (error) throw error;
      setTerms((prev) => [...prev, data].sort((a, b) => a.term.localeCompare(b.term)));
      setNewTerm("");
      setNewDefinition("");
      toast.success(`Added "${data.term}"`);
    } catch {
      toast.error("Failed to add term");
    } finally {
      setIsAdding(false);
    }
  }, [newTerm, newDefinition, selectedShowId, toast]);

  const handleDelete = useCallback(
    async (termId: string, termName: string) => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("vocabulary_terms")
          .delete()
          .eq("id", termId);

        if (error) throw error;
        setTerms((prev) => prev.filter((t) => t.id !== termId));
        toast.success(`Removed "${termName}"`);
      } catch {
        toast.error("Failed to delete term");
      }
    },
    [toast]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border-soft bg-bg-elevated p-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Custom Vocabulary
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Add industry-specific terms to improve transcription accuracy
        </p>

        {/* Show Selector */}
        <div className="relative mt-4">
          <select
            value={selectedShowId}
            onChange={(e) => setSelectedShowId(e.target.value)}
            disabled={showsLoading}
            className="w-full appearance-none rounded-lg border border-border-soft bg-bg-base px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          >
            <option value="">Select a show...</option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        </div>

        {selectedShowId && (
          <>
            {/* Add Term Form */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Term (e.g., Kubernetes)"
                className="flex-1 rounded-lg border border-border-soft bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <input
                type="text"
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                placeholder="Definition (optional)"
                className="flex-1 rounded-lg border border-border-soft bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <PrimaryButton
                onClick={handleAdd}
                disabled={!newTerm.trim()}
                isLoading={isAdding}
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </PrimaryButton>
            </div>

            {/* Terms List */}
            <div className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
                </div>
              ) : terms.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-soft bg-bg-subtle/50 py-8 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-text-tertiary" />
                  <p className="mt-2 text-sm text-text-tertiary">
                    No vocabulary terms yet. Add terms to improve transcription.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-soft rounded-lg border border-border-soft">
                  <AnimatePresence>
                    {terms.map((term) => (
                      <motion.div
                        key={term.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={springs.snappy}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <span className="font-medium text-text-primary">
                            {term.term}
                          </span>
                          {term.definition && (
                            <span className="ml-2 text-sm text-text-tertiary">
                              &mdash; {term.definition}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(term.id, term.term)}
                          className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-status-error-bg hover:text-status-error-text"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              {terms.length > 0 && (
                <p className="mt-2 text-xs text-text-tertiary">
                  {terms.length} term{terms.length !== 1 ? "s" : ""} configured
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/5 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-accent-blue" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-text-primary">How Vocabulary Works</p>
            <p className="mt-1">
              Custom vocabulary terms are used during transcription to improve
              accuracy for industry jargon, proper nouns, and technical terms.
              Terms with embeddings enable fuzzy matching for similar
              pronunciations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings Page ─── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  // Persist tab in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as SettingsTab;
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleTabChange = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, []);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, billing, integrations, and vocabulary"
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tab Navigation */}
        <nav className="flex gap-1 lg:w-56 lg:shrink-0 lg:flex-col">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-blue/10 text-accent-blue"
                    : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-indicator"
                    className="absolute inset-0 rounded-lg bg-accent-blue/10"
                    transition={springs.snappy}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "account" && <AccountTab />}
              {activeTab === "billing" && <BillingTab />}
              {activeTab === "integrations" && <IntegrationsTab />}
              {activeTab === "vocabulary" && <VocabularyTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
