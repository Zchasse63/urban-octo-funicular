"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) throw new Error("Tab components must be used within <Tabs>")
  return context
}

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeTab = value ?? internalValue
  const setActiveTab = onValueChange ?? setInternalValue

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: ReactNode
  className?: string
}

function TabList({ children, className }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-0",
        "border-b border-[var(--color-border)]",
        "px-5",
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabTriggerProps {
  value: string
  children: ReactNode
  className?: string
  icon?: ReactNode
}

function TabTrigger({ value, children, className, icon }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useTabs()
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative flex items-center gap-2",
        "px-4 py-3",
        "font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-medium",
        "transition-colors duration-[var(--duration-fast)]",
        "cursor-pointer select-none",
        isActive
          ? "text-[var(--color-text-ink)]"
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-ink)]",
        className
      )}
    >
      {icon}
      {children}
      {/* Active indicator line */}
      {isActive && (
        <span
          className="absolute bottom-0 left-4 right-4 h-[2px] bg-[var(--color-accent-blue)] rounded-full"
        />
      )}
    </button>
  )
}

interface TabContentProps {
  value: string
  children: ReactNode
  className?: string
}

function TabContent({ value, children, className }: TabContentProps) {
  const { activeTab } = useTabs()
  if (activeTab !== value) return null

  return (
    <div role="tabpanel" className={cn("", className)}>
      {children}
    </div>
  )
}

export { Tabs, TabList, TabTrigger, TabContent }
