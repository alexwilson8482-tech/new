import React from "react"
import type { Metadata, Viewport } from "next"
import { Roboto, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Reel Insights",
  description: "Instagram Reel Insights Dashboard",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0c0f14",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js');
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
