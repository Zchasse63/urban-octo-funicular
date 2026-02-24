"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>")
  return ctx
}

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

function Tabs({
  defaultValue = "",
  value: controlledValue,
  onValueChange: controlledOnChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = controlledValue ?? internalValue
  const onValueChange = controlledOnChange ?? setInternalValue

  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabList({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-0 border-b border-[var(--color-border)]",
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
}

function TabTrigger({ value, children, className }: TabTriggerProps) {
  const { value: activeValue, onValueChange } = useTabsContext()
  const isActive = activeValue === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        "relative px-4 py-2.5",
        "font-[family-name:var(--font-display)] text-[var(--text-body-sm)] font-medium",
        "transition-colors duration-[var(--duration-fast)]",
        "cursor-pointer",
        isActive
          ? "text-[var(--color-text-ink)]"
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-ink)]",
        className
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-text-ink)]" />
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
  const { value: activeValue } = useTabsContext()
  if (activeValue !== value) return null

  return (
    <div role="tabpanel" className={cn("animate-enter", className)}>
      {children}
    </div>
  )
}

export { Tabs, TabList, TabTrigger, TabContent }
