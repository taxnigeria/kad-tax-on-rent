import type React from "react"
import { EnumeratorDesktopSidebar } from "@/components/enumerator/enumerator-sidebar"
import { BottomNav } from "@/components/enumerator/bottom-nav"
import { AppBar } from "@/components/enumerator/app-bar"
import { ThemeProvider } from "@/components/theme-provider"

export default function EnumeratorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <EnumeratorDesktopSidebar />

        {/* Mobile App Bar */}
        <AppBar />

        {/* Main Content - offset for sidebar on desktop, bottom padding for nav on mobile */}
        <main className="md:pl-64 pb-20 md:pb-0 min-h-screen">{children}</main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </ThemeProvider>
  )
}
