import type { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "PodBrain — AI-Powered Podcast Content Platform",
    template: "%s | PodBrain",
  },
  description:
    "Transform your podcast into SEO-optimized show notes, 30+ content assets, and guest promotion packages with AI that learns your show.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://getpodbrain.ai"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://getpodbrain.ai",
    siteName: "PodBrain",
    title: "PodBrain — AI-Powered Podcast Content Platform",
    description:
      "Transform your podcast into SEO-optimized show notes, 30+ content assets, and guest promotion packages.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PodBrain - AI-Powered Podcast Content Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PodBrain — AI-Powered Podcast Content Platform",
    description:
      "Transform your podcast into SEO-optimized show notes, 30+ content assets, and guest promotion packages.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('podbrain-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "font-sans bg-card text-card-foreground border border-border shadow-xl",
          }}
        />
      </body>
    </html>
  )
}
