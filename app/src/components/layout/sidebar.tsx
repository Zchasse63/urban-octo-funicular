"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mic2, ChevronDown, LayoutDashboard, UploadCloud, BookOpen, Users, Settings, LifeBuoy, Sun, Moon, ChevronLeft, ChevronRight, TrendingUp, Keyboard, Zap, Search, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import useShows from '@/hooks/use-shows'
import useEpisodes from '@/hooks/use-episodes'
import useVocabulary from '@/hooks/use-vocabulary'
import useSubscription from '@/hooks/use-subscription'
import type { Show } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItemProps = {
  icon: React.ElementType
  label: string
  isActive?: boolean
  count?: number
  status?: 'active' | 'warning' | 'idle'
  isCollapsed?: boolean
  shortcut?: string
  onClick: () => void
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

const StatusDot = ({ status }: { status?: NavItemProps['status'] }) => {
  if (!status) return null
  const colors = {
    active: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    idle: 'bg-stone-300',
  }
  return <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colors[status])} />
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const Tooltip = ({ label, shortcut, visible }: { label: string; shortcut?: string; visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, x: -6, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -4, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="absolute left-full ml-3 z-50 pointer-events-none"
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-900 text-stone-100 text-[11px] font-sans font-medium rounded-lg shadow-xl whitespace-nowrap">
          {label}
          {shortcut && (
            <span className="font-mono text-[9px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded">
              {shortcut}
            </span>
          )}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-900" />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

// ─── Nav Item ─────────────────────────────────────────────────────────────────

const NavItem = ({ icon: Icon, label, isActive, count, status, isCollapsed, shortcut, onClick }: NavItemProps) => {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => isCollapsed && setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'group relative flex items-center w-full rounded-md transition-all duration-200 ease-out outline-none',
          isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5',
          isActive
            ? 'bg-card border border-border shadow-[0_2px_10px_-2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
        )}
      >
        <div className={cn('flex items-center', isCollapsed ? '' : 'gap-3')}>
          <Icon className={cn('w-[18px] h-[18px] flex-shrink-0 transition-colors', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-muted-foreground')} />
          {!isCollapsed && <span className="text-[13px] font-medium font-sans tracking-tight">{label}</span>}
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-2">
            {count !== undefined && (
              <span className="font-mono text-[10px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted group-hover:bg-accent/50 transition-colors">
                {count}
              </span>
            )}
            {shortcut && !isActive && (
              <span className="font-mono text-[9px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                {shortcut}
              </span>
            )}
            <StatusDot status={status} />
          </div>
        )}

        {isActive && <motion.div layoutId="activeIndicator" className="absolute left-[-2px] top-2 bottom-2 w-[3px] bg-stone-900 rounded-full" />}
      </motion.button>

      {isCollapsed && <Tooltip label={label} shortcut={shortcut} visible={showTooltip} />}
    </div>
  )
}

// ─── Keyboard Shortcuts Modal ─────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['⌘', 'F'], description: 'Search episodes' },
  { keys: ['⌘', 'U'], description: 'Upload new episode' },
  { keys: ['⌘', 'N'], description: 'New episode' },
  { keys: ['⌘', '1'], description: 'Go to Episodes' },
  { keys: ['⌘', '2'], description: 'Go to Upload' },
  { keys: ['⌘', '3'], description: 'Go to Vocabulary' },
  { keys: ['⌘', ','], description: 'Settings' },
  { keys: ['Esc'], description: 'Close modal / clear search' },
  { keys: ['↑', '↓'], description: 'Navigate episodes' },
  { keys: ['Enter'], description: 'Open selected episode' },
]

const KeyboardShortcutsModal = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5 mb-0.5">
            <Keyboard className="w-4 h-4 text-foreground" />
            <h2 className="font-sans font-bold text-[15px] text-foreground tracking-tight">Keyboard Shortcuts</h2>
          </div>
          <p className="text-[11.5px] font-serif text-muted-foreground ml-[26px]">Power-user controls at your fingertips</p>
        </div>
        <div className="p-3 space-y-0.5 max-h-72 overflow-y-auto">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors group">
              <span className="text-[12.5px] font-sans text-muted-foreground group-hover:text-foreground transition-colors">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, ki) => (
                  <kbd key={ki} className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-card border border-border text-muted-foreground font-mono text-[10px] rounded-md shadow-[0_1px_0_rgba(0,0,0,0.1)] font-semibold">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border/50 bg-muted/50 flex justify-end">
          <button onClick={onClose} className="text-[11px] font-sans font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
            Close
            <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 bg-card border border-border text-muted-foreground font-mono text-[9px] rounded-md shadow-[0_1px_0_rgba(0,0,0,0.1)]">Esc</kbd>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Show Selector Dropdown ───────────────────────────────────────────────────

const ShowSelector = ({
  shows,
  currentShow,
  isCollapsed,
  onSelect,
}: {
  shows: Show[]
  currentShow: Show | null
  isCollapsed: boolean
  onSelect: (show: Show) => void
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const showName = currentShow?.name || 'Select Show'
  const initials = showName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-orange-400', 'bg-sky-500', 'bg-violet-500', 'bg-emerald-500']
  const colorIndex = currentShow ? shows.indexOf(currentShow) % colors.length : 0

  return (
    <div ref={ref} className="relative px-3 pb-4">
      <button
        onClick={() => !isCollapsed && setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center p-2 rounded-lg bg-muted/50 border border-border hover:border-border/70 hover:bg-accent/80 transition-all duration-150',
          isCollapsed ? 'justify-center' : 'justify-between px-3',
          open && !isCollapsed && 'border-border/70 bg-muted/80'
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className={cn('w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-white font-mono font-bold text-[10px] shadow-sm', colors[colorIndex])}>
            {initials}
          </div>
          {!isCollapsed && <span className="text-[12.5px] font-medium truncate text-foreground">{showName}</span>}
        </div>
        {!isCollapsed && <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />}
      </button>

      <AnimatePresence>
        {open && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-3 right-3 top-full mt-1.5 z-40 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-1.5">
              {shows.map((show, i) => (
                <button
                  key={show.id}
                  onClick={() => {
                    onSelect(show)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150',
                    show.id === currentShow?.id ? 'bg-stone-900 text-white' : 'text-foreground hover:bg-accent'
                  )}
                >
                  <div className={cn('w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-white font-mono font-bold text-[9px] shadow-sm', colors[i % colors.length])}>
                    {show.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[12.5px] font-medium truncate">{show.name}</span>
                  {show.id === currentShow?.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />}
                </button>
              ))}
            </div>
            <div className="border-t border-border/50 p-1.5">
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-accent-foreground hover:bg-accent/50 transition-colors text-[11.5px] font-sans font-medium">
                <Zap className="w-3.5 h-3.5" />
                Add new show
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Sidebar Component ──────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  className?: string
}

function Sidebar({ collapsed, onToggleCollapse, className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { shows } = useShows()
  const { subscription } = useSubscription()
  const [currentShow, setCurrentShow] = useState<Show | null>(null)

  const showId = currentShow?.id
  const { total: episodeCount, isLoading: episodesLoading } = useEpisodes({ showId })
  const { terms, isLoading: vocabularyLoading } = useVocabulary({ showId })
  const [isDark, setIsDark] = useState(false)
  const [showKeyboardModal, setShowKeyboardModal] = useState(false)

  const tier = subscription?.tier || 'free'
  const tierLabel = tier === 'free' ? 'Free Plan' : tier === 'pro' ? 'Pro Plan' : 'Agency Plan'

  // Set first show as current when shows load
  useEffect(() => {
    if (shows.length > 0 && !currentShow) {
      setCurrentShow(shows[0])
    }
  }, [shows, currentShow])

  // Sync dark mode state with DOM
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  // Keyboard shortcut to toggle shortcuts modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setShowKeyboardModal((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const toggleDarkMode = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('podbrain-theme', next ? 'dark' : 'light')
  }

  const navigate = (path: string) => {
    router.push(path)
  }

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  return (
    <>
      <motion.div
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'h-screen border-r border-border flex flex-col font-sans overflow-hidden flex-shrink-0',
          'bg-background text-foreground select-none relative',
          className
        )}
      >
        {/* Brand Header */}
        <div className={cn('flex items-center gap-3 overflow-hidden whitespace-nowrap', collapsed ? 'p-4 justify-center' : 'px-5 py-5')}>
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-800 to-black flex items-center justify-center shadow-lg">
              <Mic2 className="w-[18px] h-[18px] text-stone-100" />
            </div>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-background shadow-sm animate-pulse" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="flex flex-col">
                <span className="font-bold text-[15px] leading-tight tracking-tighter">PodBrain</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground leading-none">AI Studio v2.4</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Show Selector */}
        <ShowSelector shows={shows} currentShow={currentShow} isCollapsed={collapsed} onSelect={setCurrentShow} />

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 scrollbar-none">
          {/* Workspace */}
          <div className="space-y-0.5">
            <AnimatePresence>
              {!collapsed && (
                <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Workspace
                </motion.h3>
              )}
            </AnimatePresence>
            <NavItem icon={LayoutDashboard} label="Episodes" isActive={isActive('/episodes')} count={episodesLoading ? undefined : episodeCount} onClick={() => navigate('/episodes')} status="active" isCollapsed={collapsed} shortcut="⌘1" />
            <NavItem icon={UploadCloud} label="Upload" isActive={isActive('/upload')} onClick={() => navigate('/upload')} isCollapsed={collapsed} shortcut="⌘U" />
          </div>

          {/* Tools */}
          <div className="space-y-0.5">
            <AnimatePresence>
              {!collapsed && (
                <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Tools
                </motion.h3>
              )}
            </AnimatePresence>
            <NavItem icon={BookOpen} label="Vocabulary" isActive={isActive('/vocabulary')} count={vocabularyLoading ? undefined : terms.length} onClick={() => navigate('/vocabulary')} isCollapsed={collapsed} shortcut="⌘3" />
            <NavItem icon={Users} label="Experts" isActive={isActive('/experts')} onClick={() => navigate('/experts')} status="warning" isCollapsed={collapsed} />
            <NavItem icon={Search} label="Search" isActive={isActive('/search')} onClick={() => navigate('/search')} isCollapsed={collapsed} shortcut="⌘F" />
            <NavItem icon={BarChart3} label="Analytics" isActive={isActive('/analytics')} onClick={() => navigate('/analytics')} isCollapsed={collapsed} />
          </div>

          {/* Usage Card */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="mx-1 p-4 rounded-xl bg-gradient-to-br from-stone-900 to-stone-800 text-stone-50 shadow-md border border-stone-800/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-60">{tierLabel}</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-medium">
                      <span className="opacity-80">Monthly Audio</span>
                      <span className="font-mono">82%</span>
                    </div>
                    <div className="h-1 w-full bg-stone-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '82%' }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                        className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] rounded-full"
                      />
                    </div>
                  </div>
                  <button className="w-full py-2 text-[11px] font-bold bg-white/10 hover:bg-white/20 border border-white/5 rounded-md transition-colors">
                    Upgrade Capacity
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-border bg-muted/50 flex-shrink-0">
          <div className="space-y-0.5 mb-2">
            <NavItem icon={Settings} label="Settings" isActive={isActive('/settings')} onClick={() => navigate('/settings')} isCollapsed={collapsed} shortcut="⌘," />
            <NavItem icon={LifeBuoy} label="Support" isActive={isActive('/support')} onClick={() => navigate('/support')} isCollapsed={collapsed} />
          </div>

          <div className={cn('flex items-center px-1 py-1', collapsed ? 'flex-col gap-1.5 items-center' : 'justify-between')}>
            <button onClick={toggleDarkMode} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {!collapsed && (
              <button onClick={() => setShowKeyboardModal(true)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Keyboard shortcuts (⌘/)">
                <Keyboard className="w-4 h-4" />
              </button>
            )}

            <button onClick={onToggleCollapse} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardModal && <KeyboardShortcutsModal onClose={() => setShowKeyboardModal(false)} />}
      </AnimatePresence>
    </>
  )
}

export { Sidebar }
