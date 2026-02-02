"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic2,
  Upload,
  Users,
  TrendingUp,
  Search,
  Trophy,
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-3 md:py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all duration-[var(--duration-normal)]",
        "min-h-[44px] md:min-h-0",
        isActive
          ? "bg-[var(--text-primary)] text-white"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
      <span>{label}</span>
    </Link>
  );
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <span className="mono px-3 mb-2 block">{title}</span>
      <nav className="flex flex-col gap-1">{children}</nav>
    </div>
  );
}

function PodBrainLogo() {
  return (
    <div className="flex items-center gap-3 px-3 mb-8">
      <div
        className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center"
        style={{
          background: "var(--text-primary)",
        }}
      >
        {/* Audio waveform icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          <rect x="2" y="8" width="2" height="4" rx="1" fill="currentColor" />
          <rect x="6" y="5" width="2" height="10" rx="1" fill="currentColor" />
          <rect x="10" y="3" width="2" height="14" rx="1" fill="currentColor" />
          <rect x="14" y="6" width="2" height="8" rx="1" fill="currentColor" />
        </svg>
      </div>
      <span className="text-[var(--text-primary)] font-semibold text-lg tracking-tight">
        PodBrain
      </span>
    </div>
  );
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const workspaceItems = [
    { href: "/episodes", icon: Mic2, label: "Episodes" },
    { href: "/upload", icon: Upload, label: "+ New Upload" },
    { href: "/guests", icon: Users, label: "Guests" },
  ];

  const discoverItems = [
    { href: "/trending", icon: TrendingUp, label: "Trending" },
    { href: "/expert-finder", icon: Search, label: "Expert Finder" },
    { href: "/competitors", icon: Trophy, label: "Competitors" },
  ];

  const bottomItems = [
    { href: "/settings", icon: Settings, label: "Settings" },
    { href: "/support", icon: HelpCircle, label: "Support" },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-[280px] md:w-[240px] flex flex-col py-6 border-r z-50",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-soft)",
        }}
        aria-label="Main navigation"
      >
        <PodBrainLogo />

        <div className="flex-1 overflow-y-auto px-3">
          <NavSection title="Workspace">
            {workspaceItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                onClick={onMobileClose}
              />
            ))}
          </NavSection>

          <NavSection title="Discover">
            {discoverItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                onClick={onMobileClose}
              />
            ))}
          </NavSection>
        </div>

        <div className="px-3 pt-4 border-t" style={{ borderColor: "var(--border-soft)" }}>
          <nav className="flex flex-col gap-1">
            {bottomItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                onClick={onMobileClose}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
