"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Shortcut {
  key: string;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export default function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const shortcuts: Shortcut[] = [
      {
        key: "k",
        meta: true,
        description: "Focus search",
        handler: () => {
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="text"][placeholder*="Search"], input[type="search"]'
          );
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        },
      },
      {
        key: "n",
        meta: true,
        description: "New upload",
        handler: () => {
          router.push("/upload");
        },
      },
      {
        key: "e",
        meta: true,
        description: "Export",
        handler: () => {
          const exportBtn = document.querySelector<HTMLButtonElement>(
            'button:has(.lucide-download), [data-export-button]'
          );
          if (exportBtn) {
            exportBtn.click();
          }
        },
      },
      {
        key: "1",
        meta: true,
        description: "Go to Dashboard",
        handler: () => {
          router.push("/");
        },
      },
      {
        key: "2",
        meta: true,
        description: "Go to Episodes",
        handler: () => {
          router.push("/episodes");
        },
      },
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow meta shortcuts through
        if (!e.metaKey && !e.ctrlKey) return;
      }

      const metaKey = e.metaKey || e.ctrlKey;

      for (const shortcut of shortcuts) {
        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!shortcut.meta === metaKey &&
          !!shortcut.shift === e.shiftKey
        ) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
