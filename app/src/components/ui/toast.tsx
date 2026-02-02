'use client'

import * as React from 'react'
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

/**
 * Toast notification system using shadcn/ui pattern
 * Supports success, error, warning, info variants with auto-dismiss
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  variant: ToastVariant
  title?: string
  description: string
  duration?: number
}

interface ToastContextValue {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = toast.duration ?? 5000

    setToasts((prev) => [...prev, { ...toast, id }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastViewport({
  toasts,
  onRemove,
}: {
  toasts: ToastProps[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ variant, title, description, onClose }: ToastProps & { onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  }

  const borderColors = {
    success: 'border-green-600',
    error: 'border-red-600',
    warning: 'border-yellow-600',
    info: 'border-blue-600',
  }

  return (
    <div
      className={`
        flex items-start gap-3 p-4 bg-[var(--bg-elevated)] border-l-4 ${borderColors[variant]}
        rounded-lg shadow-lg animate-in slide-in-from-right
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm text-[var(--text-primary)] mb-1">{title}</p>
        )}
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Standalone toast helper function
 */
let addToastFn: ((toast: Omit<ToastProps, 'id'>) => void) | undefined

export function setToastHandler(handler: (toast: Omit<ToastProps, 'id'>) => void) {
  addToastFn = handler
}

export const toast = {
  success: (description: string, title?: string) => {
    addToastFn?.({ variant: 'success', description, title })
  },
  error: (description: string, title?: string) => {
    addToastFn?.({ variant: 'error', description, title })
  },
  warning: (description: string, title?: string) => {
    addToastFn?.({ variant: 'warning', description, title })
  },
  info: (description: string, title?: string) => {
    addToastFn?.({ variant: 'info', description, title })
  },
}
