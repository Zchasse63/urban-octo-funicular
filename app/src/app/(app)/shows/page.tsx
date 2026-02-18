"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Radio, Plus, X, Mic2, ChevronDown } from "lucide-react";
import { staggerContainer, staggerItem, springs } from "@/lib/motion";
import { formatRelativeTime } from "@/lib/utils";
import PageHeader from "@/components/podbrain/page-header";
import EmptyState from "@/components/podbrain/empty-state";
import { PrimaryButton, SecondaryButton } from "@/components/podbrain/buttons";
import useShows from "@/hooks/use-shows";
import { useToast } from "@/hooks/use-toast";

export default function ShowsPage() {
  const { shows, isLoading, createShow } = useShows();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    default_language: "en",
    artwork_url: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Show name is required");
      return;
    }

    setIsCreating(true);
    const result = await createShow(formData);
    setIsCreating(false);

    if (result) {
      toast.success("Show created successfully");
      setShowModal(false);
      setFormData({ name: "", description: "", default_language: "en", artwork_url: "" });
    } else {
      toast.error("Failed to create show");
    }
  };

  return (
    <div>
      <PageHeader
        title="Shows"
        description={`${shows.length} show${shows.length !== 1 ? "s" : ""}`}
        actions={
          <PrimaryButton onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Show
          </PrimaryButton>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-border-soft" />
          ))}
        </div>
      ) : shows.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No shows yet"
          description="Create your first show to start organizing episodes"
          actionLabel="Create Show"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {shows.map((show) => (
            <motion.div key={show.id} variants={staggerItem}>
              <Link href={`/episodes?show_id=${show.id}`}>
                <div className="group rounded-xl border border-border-soft bg-bg-elevated p-6 shadow-[var(--shadow-topo)] transition-all hover:shadow-[var(--shadow-topo-hover)] hover:border-border-focus/20 hover:-translate-y-0.5">
                  {/* Artwork / Placeholder */}
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20">
                    {show.artwork_url ? (
                      <img
                        src={show.artwork_url}
                        alt={show.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <Radio className="h-8 w-8 text-accent-blue" />
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                    {show.name}
                  </h3>
                  {show.description && (
                    <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                      {show.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
                    <span>Created {formatRelativeTime(show.created_at)}</span>
                    <span>·</span>
                    <span>{show.default_language?.toUpperCase()}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Show Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={springs.smooth}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-soft bg-bg-elevated p-6 shadow-[var(--shadow-glass)]"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">
                  Create Show
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-subtle"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Show Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="My Awesome Podcast"
                    className="h-9 w-full rounded-lg border border-border-soft bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="What's your show about?"
                    rows={3}
                    className="w-full rounded-lg border border-border-soft bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Language
                    </label>
                    <div className="relative">
                      <select
                        value={formData.default_language}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            default_language: e.target.value,
                          }))
                        }
                        className="h-9 w-full appearance-none rounded-lg border border-border-soft bg-bg-base pl-3 pr-8 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Artwork URL
                    </label>
                    <input
                      type="url"
                      value={formData.artwork_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          artwork_url: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="h-9 w-full rounded-lg border border-border-soft bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <SecondaryButton onClick={() => setShowModal(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleCreate}
                  isLoading={isCreating}
                  loadingText="Creating..."
                >
                  Create Show
                </PrimaryButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
