"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Mic2,
  Upload,
  Radio,
  TrendingUp,
  Users,
  Settings,
  HelpCircle,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const allNavItems: { section: string; items: NavItem[] }[] = [
  {
    section: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/episodes", label: "Episodes", icon: Mic2 },
      { href: "/upload", label: "Upload", icon: Upload },
      { href: "/shows", label: "Shows", icon: Radio },
    ],
  },
  {
    section: "Discover",
    items: [
      { href: "/trending", label: "Trending", icon: TrendingUp },
      { href: "/experts", label: "Experts", icon: Users },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/support", label: "Support", icon: HelpCircle },
    ],
  },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border-soft bg-bg-base px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight text-text-primary">
            PodBrain
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-subtle"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Overlay + Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={springs.snappy}
              className="absolute left-0 right-0 z-50 mx-3 mt-2 rounded-xl border border-border-soft bg-bg-elevated p-3 shadow-[var(--shadow-topo)]"
            >
              {allNavItems.map((group) => (
                <div key={group.section} className="mb-3 last:mb-0">
                  <p className="mb-1.5 px-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                    {group.section}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-accent-blue/10 text-accent-blue"
                                : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
