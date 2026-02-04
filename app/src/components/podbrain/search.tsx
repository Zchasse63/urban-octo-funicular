"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import useDebounce from "@/hooks/use-debounce";
import ActionSearchBar from "@/components/kokonutui/action-search-bar";

interface EpisodeSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function EpisodeSearch({
  placeholder = "Search episodes...",
  onSearch,
  value,
  onChange,
  className,
}: EpisodeSearchProps) {
  return (
    <ActionSearchBar
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onSearch={onSearch}
      className={className}
      actions={[]}
    />
  );
}

interface GlobalSearchProps {
  onSearch: (query: string) => void;
  recentSearches?: string[];
  className?: string;
}

export function GlobalSearch({
  onSearch,
  recentSearches = [],
  className,
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const prefersReducedMotion = useReducedMotion();

  // ⌘K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Close on Escape
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Call onSearch when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleRecentSearchClick = useCallback(
    (search: string) => {
      setSearchQuery(search);
      onSearch(search);
      setIsOpen(false);
    },
    [onSearch]
  );

  return (
    <div className={className}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20"
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
          >
            <motion.div
              initial={{ scale: 0.95, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -10 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="w-full max-w-2xl px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-black">
                <div className="p-4">
                  <label
                    className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400"
                    htmlFor="global-search"
                  >
                    Search Commands
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="global-search"
                      type="text"
                      placeholder="What's up?"
                      value={searchQuery}
                      onChange={handleInputChange}
                      autoFocus
                      className="pl-9 pr-3"
                    />
                  </div>
                </div>

                {recentSearches.length > 0 && (
                  <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                    <h3 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Recent Searches
                    </h3>
                    <ul className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <li key={index}>
                          <button
                            onClick={() => handleRecentSearchClick(search)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                          >
                            <Search className="h-4 w-4 text-gray-400" />
                            <span>{search}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-800">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Press ⌘K to open commands</span>
                    <span>ESC to cancel</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut hint trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-black dark:text-gray-400 dark:hover:bg-gray-900"
        aria-expanded={isOpen}
        aria-controls="global-search"
        aria-label="Open global search"
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
        <kbd className="ml-auto rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
