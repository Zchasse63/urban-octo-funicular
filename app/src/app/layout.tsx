import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

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
  themeColor: "#FDFDFD",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-soft)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  )
}
