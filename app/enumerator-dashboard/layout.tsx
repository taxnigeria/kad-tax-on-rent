import type React from "react"
import type { Metadata, Viewport } from "next"
import { EnumeratorDesktopSidebar } from "@/components/enumerator/enumerator-sidebar"
import { BottomNav } from "@/components/enumerator/bottom-nav"
import { AppBar } from "@/components/enumerator/app-bar"
import { ThemeProvider } from "@/components/theme-provider"
import { PWAPrompt } from "@/components/enumerator/pwa-prompt"
import { ServiceWorkerRegister } from "@/components/enumerator/service-worker-register"

export const maxDuration = 60;
export const metadata: Metadata = {
  title: "KADIRS Enumerator",
  description: "KADIRS Tax Enumeration App for Field Agents",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KADIRS Enumerator",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function EnumeratorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ServiceWorkerRegister />
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <EnumeratorDesktopSidebar />

        {/* Mobile App Bar */}
        <AppBar />

        {/* Main Content - offset for sidebar on desktop, bottom padding for nav on mobile */}
        <main className="md:pl-64 pb-20 md:pb-0 min-h-screen">{children}</main>

        {/* Mobile Bottom Nav */}
        <BottomNav />

        {/* PWA Install Prompt */}
        <PWAPrompt />
      </div>
    </ThemeProvider>
  )
}
