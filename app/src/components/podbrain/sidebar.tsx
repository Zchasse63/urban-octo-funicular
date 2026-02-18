"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "motion/react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const workspaceNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/episodes", label: "Episodes", icon: Mic2 },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/shows", label: "Shows", icon: Radio },
];

const discoverNav: NavItem[] = [
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/experts", label: "Experts", icon: Users },
];

const bottomNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/support", label: "Support", icon: HelpCircle },
];

function NavSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div>
      <p className="mb-2 px-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60 hover:translate-x-0.5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-bg-elevated shadow-[var(--shadow-topo)]"
                    style={{ zIndex: -1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-accent-line"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent-blue"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors duration-150",
                    isActive
                      ? "text-accent-blue"
                      : "group-hover:text-text-primary"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <LayoutGroup id="sidebar">
      <aside className="flex h-full w-[240px] flex-col border-r border-border-soft bg-bg-subtle/80">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border-soft px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue shadow-[0_0_12px_rgba(0,122,255,0.3)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-text-primary">
            PodBrain
          </span>
          <span className="ml-auto rounded-full bg-accent-blue/10 px-2 py-0.5 font-mono text-[10px] font-medium text-accent-blue">
            AI
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavSection title="Workspace" items={workspaceNav} pathname={pathname} />
          <div className="mx-3 my-4 h-px bg-border-soft" />
          <NavSection title="Discover" items={discoverNav} pathname={pathname} />
        </nav>

        {/* Bottom */}
        <div className="border-t border-border-soft px-3 py-3">
          <ul className="space-y-0.5">
            {bottomNav.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60 hover:translate-x-0.5"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-bottom-active"
                        className="absolute inset-0 rounded-lg bg-bg-elevated shadow-[var(--shadow-topo)]"
                        style={{ zIndex: -1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-bottom-accent"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent-blue"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors duration-150",
                        isActive
                          ? "text-accent-blue"
                          : "group-hover:text-text-primary"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </LayoutGroup>
  );
}
