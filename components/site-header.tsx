"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandSearch } from "@/components/command-search"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationsPanel } from "@/components/notifications-panel"
import { useState } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useAuth()
  const { unreadCount } = useNotifications(user?.uid)

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="relative group"
            >
              <Bell className={cn(
                "h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110",
                unreadCount > 0 && "text-primary animate-in fade-in"
              )} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  )
}
