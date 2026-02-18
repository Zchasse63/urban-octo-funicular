"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  Mic2,
  FileAudio,
  CheckCircle2,
} from "lucide-react";
import { springs } from "@/lib/motion";
import PageHeader from "@/components/podbrain/page-header";
import { PrimaryButton, SecondaryButton } from "@/components/podbrain/buttons";
import {
  AILoadingOrb,
  ProcessingSteps,
  ProcessingProgressBar,
} from "@/components/podbrain/processing-states";
import useShows from "@/hooks/use-shows";
import usePolling from "@/hooks/use-polling";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_AUDIO_FORMATS, PROCESSING } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_USER_ID } from "@/lib/constants";

type Step = "upload" | "context" | "processing";

interface UploadState {
  file: File | null;
  audioUrl: string;
  title: string;
  guestName: string;
  guestEmail: string;
  keywords: string;
  showId: string;
  language: string;
  episodeId: string;
}

export default function UploadPage() {
  const router = useRouter();
  const toast = useToast();
  const { shows, isLoading: showsLoading } = useShows();

  const [step, setStep] = useState<Step>("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [state, setState] = useState<UploadState>({
    file: null,
    audioUrl: "",
    title: "",
    guestName: "",
    guestEmail: "",
    keywords: "",
    showId: "",
    language: "en",
    episodeId: "",
  });

  // Polling for processing status
  const { data: processingData } = usePolling({
    fetcher: async () => {
      const res = await fetch(`/api/episodes/${state.episodeId}/process`);
      if (!res.ok) throw new Error("Failed to check status");
      return res.json();
    },
    interval: 3000,
    enabled: step === "processing" && !!state.episodeId,
    shouldStop: (data) =>
      data?.data?.status === "COMPLETED" ||
      data?.data?.status === "FAILED",
    onSuccess: (data) => {
      if (data?.data?.status === "COMPLETED") {
        toast.success("Episode processed successfully!");
        router.push(`/episodes/${state.episodeId}`);
      } else if (data?.data?.status === "FAILED") {
        toast.error("Processing failed", data?.data?.error || undefined);
      }
    },
  });

  const handleFileDrop = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate
      if (!SUPPORTED_AUDIO_FORMATS.includes(file.type as typeof SUPPORTED_AUDIO_FORMATS[number])) {
        toast.error("Unsupported format", "Please upload MP3, WAV, M4A, or AAC files");
        return;
      }
      if (file.size > PROCESSING.maxFileSize) {
        toast.error("File too large", "Maximum file size is 500MB");
        return;
      }

      try {
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const result = await response.json();

        setState((prev) => ({
          ...prev,
          file,
          audioUrl: result.publicUrl || result.signedUrl || "",
          title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        }));
        setStep("context");
        toast.success("Audio uploaded successfully");
      } catch (err) {
        toast.error(
          "Upload failed",
          err instanceof Error ? err.message : "Please try again"
        );
      } finally {
        setIsUploading(false);
      }
    },
    [toast]
  );

  const handleCreateEpisode = useCallback(async () => {
    if (!state.audioUrl) {
      toast.error("No audio file uploaded");
      return;
    }
    if (!state.showId && shows.length > 0) {
      toast.error("Please select a show");
      return;
    }

    try {
      setIsCreating(true);

      const supabase = createClient();
      const showId = state.showId || shows[0]?.id;

      // Create episode
      const { data: episode, error } = await supabase
        .from("episodes")
        .insert({
          show_id: showId,
          title: state.title || "Untitled Episode",
          audio_url: state.audioUrl,
          language: state.language,
          guest_name: state.guestName || null,
          guest_email: state.guestEmail || null,
          status: "pending",
          metadata: {
            keywords: state.keywords
              ? state.keywords.split(",").map((k) => k.trim())
              : [],
          },
        })
        .select()
        .single();

      if (error) throw error;

      setState((prev) => ({ ...prev, episodeId: episode.id }));

      // Trigger processing
      const processResponse = await fetch(
        `/api/episodes/${episode.id}/process`,
        { method: "POST" }
      );

      if (!processResponse.ok) {
        toast.warning("Episode created but processing failed to start");
      }

      setStep("processing");
    } catch (err) {
      toast.error(
        "Failed to create episode",
        err instanceof Error ? err.message : "Please try again"
      );
    } finally {
      setIsCreating(false);
    }
  }, [state, shows, toast]);

  return (
    <div>
      <PageHeader
        title="Upload Episode"
        description="Upload audio and let AI transform it into content"
      />

      {/* Step Indicator */}
      <div className="mb-8 flex items-center gap-3">
        {(["upload", "context", "processing"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                step === s
                  ? "bg-accent-blue text-white"
                  : i < ["upload", "context", "processing"].indexOf(step)
                    ? "bg-accent-green text-white"
                    : "bg-bg-subtle text-text-tertiary"
              }`}
            >
              {i < ["upload", "context", "processing"].indexOf(step) ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div className="h-px w-12 bg-border-soft sm:w-24" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.smooth}
          >
            <label
              htmlFor="audio-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-soft bg-bg-elevated p-16 transition-colors hover:border-accent-blue/40 hover:bg-bg-subtle"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-blue/10">
                {isUploading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
                ) : (
                  <Upload className="h-8 w-8 text-accent-blue" />
                )}
              </div>
              <h3 className="text-lg font-medium text-text-primary">
                {isUploading ? "Uploading..." : "Drop your audio file here"}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                MP3, WAV, M4A, AAC · Up to 500MB
              </p>
              <input
                id="audio-upload"
                type="file"
                accept={SUPPORTED_AUDIO_FORMATS.join(",")}
                onChange={handleFileDrop}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </motion.div>
        )}

        {step === "context" && (
          <motion.div
            key="context"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.smooth}
          >
            <div className="mx-auto max-w-xl rounded-2xl border border-border-soft bg-bg-elevated p-8">
              {/* File info */}
              <div className="mb-6 flex items-center gap-3 rounded-lg bg-bg-subtle p-3">
                <FileAudio className="h-5 w-5 text-accent-blue" />
                <span className="truncate text-sm font-medium text-text-primary">
                  {state.file?.name}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Episode Title
                  </label>
                  <input
                    type="text"
                    value={state.title}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Episode title"
                    className="h-10 w-full rounded-lg border border-border-soft bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/15"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={state.guestName}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          guestName: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                      className="h-10 w-full rounded-lg border border-border-soft bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/15"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Guest Email
                    </label>
                    <input
                      type="email"
                      value={state.guestEmail}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          guestEmail: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                      className="h-10 w-full rounded-lg border border-border-soft bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={state.keywords}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        keywords: e.target.value,
                      }))
                    }
                    placeholder="Comma-separated keywords"
                    className="h-10 w-full rounded-lg border border-border-soft bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-accent-blue/15"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Show
                    </label>
                    <select
                      value={state.showId}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          showId: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-border-soft bg-bg-base px-3 text-sm text-text-primary"
                    >
                      <option value="">Select a show</option>
                      {shows.map((show) => (
                        <option key={show.id} value={show.id}>
                          {show.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">
                      Language
                    </label>
                    <select
                      value={state.language}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-border-soft bg-bg-base px-3 text-sm text-text-primary"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <SecondaryButton onClick={() => setStep("upload")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleCreateEpisode}
                  isLoading={isCreating}
                  loadingText="Creating..."
                >
                  Process Episode
                  <ArrowRight className="ml-2 h-4 w-4" />
                </PrimaryButton>
              </div>
            </div>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={springs.smooth}
            className="mx-auto max-w-lg text-center"
          >
            <AILoadingOrb className="mb-8" />
            <h2 className="text-xl font-semibold text-text-primary">
              Processing Your Episode
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              AI is analyzing your audio and generating content
            </p>

            <ProcessingProgressBar
              progress={
                processingData?.data?.status === "COMPLETED"
                  ? 100
                  : processingData?.data?.status === "EXECUTING"
                    ? 50
                    : 10
              }
              label="Overall Progress"
              className="mt-8"
            />

            <ProcessingSteps
              className="mt-6 text-left"
              steps={[
                {
                  id: "1",
                  label: "Uploading audio",
                  status: "completed",
                },
                {
                  id: "2",
                  label: "Transcribing audio",
                  status:
                    processingData?.data?.status === "EXECUTING"
                      ? "active"
                      : processingData?.data?.status === "COMPLETED"
                        ? "completed"
                        : "pending",
                },
                {
                  id: "3",
                  label: "Processing vocabulary",
                  status:
                    processingData?.data?.status === "COMPLETED"
                      ? "completed"
                      : processingData?.data?.status === "EXECUTING"
                        ? "pending"
                        : "pending",
                },
                {
                  id: "4",
                  label: "Generating show notes",
                  status:
                    processingData?.data?.status === "COMPLETED"
                      ? "completed"
                      : "pending",
                },
                {
                  id: "5",
                  label: "SEO analysis & asset generation",
                  status:
                    processingData?.data?.status === "COMPLETED"
                      ? "completed"
                      : "pending",
                },
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
