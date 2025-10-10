"use client"

import type React from "react"

import { TenantSidebar } from "@/components/tenant-sidebar"
import { TenantHeader } from "@/components/tenant-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"

export default function TenantPropertiesPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <TenantSidebar variant="inset" />
      <SidebarInset>
        <TenantHeader />
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>My Rentals</CardTitle>
                    <CardDescription>Properties you're currently renting</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <AIAssistantSidebar userRole="tenant" />
    </SidebarProvider>
  )
}
