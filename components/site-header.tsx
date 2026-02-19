"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandSearch } from "@/components/command-search"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationsPanel } from "@/components/taxpayer/notifications-panel"
import { useState } from "react"

export function SiteHeader() {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 bg-background flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="h-4 shrink-0" />
            <div className="min-w-0">
              <DynamicBreadcrumb />
            </div>
          </div>

          <div className="flex items-center justify-center flex-1 max-w-md">
            <CommandSearch />
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button variant="ghost" size="icon" onClick={() => setShowNotifications(true)}>
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  )
}
