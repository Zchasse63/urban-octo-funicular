"use client";

import React, { useState, useCallback } from "react";
import {
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
  Type,
  AlignLeft,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ABVariant {
  id: string;
  text: string;
  charCount: number;
  seoHints: string[];
}

interface ABTestData {
  field: "title" | "description";
  variants: ABVariant[];
  current: string | null;
  generatedAt: string;
}

interface ABTestPanelProps {
  episodeId: string;
  currentTitle: string | null;
  currentDescription: string | null;
  onApply?: (field: "title" | "description", value: string) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ABTestPanel({
  episodeId,
  currentTitle,
  currentDescription,
  onApply,
}: ABTestPanelProps) {
  const [field, setField] = useState<"title" | "description">("title");
  const [data, setData] = useState<ABTestData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const generateVariants = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setData(null);
    setSelectedVariant(null);
    setApplied(false);

    try {
      const res = await fetch(`/api/episodes/${episodeId}/ab-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, variantCount: 4 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Generation failed (${res.status})`);
      }

      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate variants");
    } finally {
      setIsGenerating(false);
    }
  }, [episodeId, field]);

  const applyVariant = useCallback(async () => {
    if (!selectedVariant || !data) return;

    const variant = data.variants.find((v) => v.id === selectedVariant);
    if (!variant) return;

    setIsApplying(true);
    setError(null);

    try {
      // Update episode via the main episode API
      const updateBody: Record<string, string> = {};
      if (field === "title") {
        updateBody.title = variant.text;
      } else {
        updateBody.description = variant.text;
      }

      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to apply variant (${res.status})`);
      }

      setApplied(true);
      onApply?.(field, variant.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply variant");
    } finally {
      setIsApplying(false);
    }
  }, [selectedVariant, data, field, episodeId, onApply]);

  const currentValue = field === "title" ? currentTitle : currentDescription;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center">
            <BarChart2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            A/B Testing
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Field Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setField("title");
              setData(null);
              setSelectedVariant(null);
              setApplied(false);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium transition-all border",
              field === "title"
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            <Type className="w-3.5 h-3.5" />
            Title
          </button>
          <button
            onClick={() => {
              setField("description");
              setData(null);
              setSelectedVariant(null);
              setApplied(false);
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium transition-all border",
              field === "description"
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Description
          </button>
        </div>

        {/* Current Value */}
        {currentValue && (
          <div className="p-3 bg-muted/30 rounded-md border border-border">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Current {field}
            </span>
            <p className="text-[12px] text-foreground/80 leading-relaxed">
              {currentValue}
            </p>
            <span className="text-[10px] text-muted-foreground mt-1 block font-mono">
              {currentValue.length} chars
            </span>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateVariants}
          disabled={isGenerating}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all",
            isGenerating
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating variants...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate {field === "title" ? "Title" : "Description"} Variants
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Variants List */}
        {data && data.variants.length > 0 && (
          <div className="space-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Variants
            </span>
            {data.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                className={cn(
                  "w-full text-left p-3 rounded-md border transition-all",
                  selectedVariant === variant.id
                    ? "border-violet-400 bg-violet-50 ring-1 ring-violet-200"
                    : "border-border bg-card hover:bg-muted/30"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Radio indicator */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                      selectedVariant === variant.id
                        ? "border-violet-500 bg-violet-500"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {selectedVariant === variant.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-foreground leading-relaxed">
                      {variant.text}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {variant.charCount} chars
                      </span>
                      {variant.seoHints.map((hint, i) => (
                        <span
                          key={i}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                            hint.includes("Good") || hint.includes("Ideal") || hint.includes("good")
                              ? "bg-emerald-50 text-emerald-700"
                              : hint.includes("Over") || hint.includes("Short") || hint.includes("short")
                                ? "bg-amber-50 text-amber-700"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {hint}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Apply Button */}
        {data && selectedVariant && !applied && (
          <button
            onClick={applyVariant}
            disabled={isApplying}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-medium transition-all",
              isApplying
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            )}
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Apply Selected {field === "title" ? "Title" : "Description"}
              </>
            )}
          </button>
        )}

        {/* Applied Confirmation */}
        {applied && (
          <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-[12px] text-emerald-700 font-medium">
              {field === "title" ? "Title" : "Description"} updated successfully.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
