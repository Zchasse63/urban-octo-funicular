import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "PodBrain",
    template: "%s | PodBrain",
  },
  description:
    "AI-Powered Podcast Content Platform — Transform audio into SEO-optimized show notes, 30+ content assets, and guest promotion packages.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EDEAE5",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('podbrain-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-body)",
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-ink)",
              boxShadow: "var(--shadow-dropdown)",
            },
          }}
        />
      </body>
    </html>
  )
}
