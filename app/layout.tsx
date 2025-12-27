import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

import { Inter, JetBrains_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from "next/font/google"

const _sourceSerif_4 = V0_Font_Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--v0-font-source-serif-4",
})

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
  title: "Kad Tax on Rent",
  description: "Created with v0",
  generator: "v0.app",
  verification: {
    google: "6CbGiBi8WUtgkpuo5s1CaYkbNoZwtSD-td7ht9h_uCE",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className={`font-sans antialiased ${_sourceSerif_4.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            <Toaster
              richColors
              position="top-right"
              closeButton // enable close button on toasts
              expand // enable stacking of toasts
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
