import type React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { EnumeratorSidebar } from "@/components/enumerator-sidebar"

export default function EnumeratorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <EnumeratorSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
