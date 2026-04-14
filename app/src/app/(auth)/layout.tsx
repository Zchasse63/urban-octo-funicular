import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'Sign In',
    template: '%s | PodBrain',
  },
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground">
            PodBrain
          </h1>
          <p className="text-muted-foreground mt-2 font-serif text-sm">
            AI-Powered Podcast Content Platform
          </p>
        </div>
        {/* Auth card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {children}
        </div>
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} PodBrain. All rights reserved.
        </p>
      </div>
    </main>
  )
}
