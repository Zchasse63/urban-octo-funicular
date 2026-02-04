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
        // Base styles
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
        "transition-all duration-200 ease-out",
        // Default state
        !isActive && "text-[#6A6A69] hover:text-[#121212] hover:bg-[rgba(0,0,0,0.04)]",
        // Active state with accent indicator
        isActive && [
          "text-[#121212] bg-white",
          "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.10)]",
        ]
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Active indicator bar - positioned to be visible */}
      {isActive && (
        <div
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#007AFF]"
          style={{
            boxShadow: "0 0 12px rgba(0, 122, 255, 0.6), 0 0 4px rgba(0, 122, 255, 0.8)",
          }}
        />
      )}

      {/* Icon with color transition */}
      <Icon
        className={cn(
          "w-[18px] h-[18px] transition-colors duration-200 relative z-10",
          isActive ? "text-[#007AFF]" : "text-[#9A9A99] group-hover:text-[#6A6A69]"
        )}
        strokeWidth={1.75}
      />

      {/* Label */}
      <span className="flex-1 relative z-10">{label}</span>
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
      <div className="flex items-center gap-2 mb-2 ml-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9A9A99]">
          {title}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-[#E5E5E5] to-transparent" />
      </div>
      <nav className="flex flex-col gap-0.5">{children}</nav>
    </div>
  );
}

function PodBrainLogo() {
  return (
    <div className="flex items-center gap-3 px-3 mb-8">
      {/* Logo container with gradient background and subtle glow */}
      <div
        className="relative w-9 h-9 rounded-[10px] flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Shine overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
          }}
        />
        {/* Audio waveform icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white relative z-10"
        >
          <rect x="2" y="8" width="2" height="4" rx="1" fill="currentColor" />
          <rect x="6" y="5" width="2" height="10" rx="1" fill="currentColor" />
          <rect x="10" y="3" width="2" height="14" rx="1" fill="currentColor" />
          <rect x="14" y="6" width="2" height="8" rx="1" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-[var(--text-primary)] font-semibold text-[15px] tracking-tight leading-tight">
          PodBrain
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)] font-medium tracking-wide uppercase">
          Intelligence
        </span>
      </div>
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

  const sidebarContent = (
    <>
      <PodBrainLogo />

      <div className="flex-1 overflow-y-auto px-4">
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

      <div className="px-4 pt-4 border-t" style={{ borderColor: "var(--border-soft)" }}>
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
    </>
  );

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

      {/* Mobile Sidebar - Fixed overlay with slide animation */}
      <aside
        className={cn(
          "sidebar-mobile md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar - Static within CSS Grid */}
      <aside
        className="sidebar-desktop hidden md:flex"
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
