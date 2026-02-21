"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home, Building2, FileText, CreditCard, Bell, Settings, HelpCircle, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useState } from "react"
import { NotificationsPanel } from "@/components/notifications-panel"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const routeConfig: Record<string, { title: string; icon: any }> = {
  "/taxpayer-dashboard": { title: "Dashboard", icon: Home },
  "/taxpayer-dashboard/properties": { title: "My Properties", icon: Building2 },
  "/taxpayer-dashboard/invoices": { title: "Invoices", icon: FileText },
  "/taxpayer-dashboard/payments": { title: "Payments", icon: CreditCard },
  "/taxpayer-dashboard/notifications": { title: "Notifications", icon: Bell },
  "/taxpayer-dashboard/settings": { title: "Settings", icon: Settings },
  "/taxpayer-dashboard/help": { title: "Help & Support", icon: HelpCircle },
}

export function TaxpayerHeader() {
  const pathname = usePathname()
  const currentRoute = routeConfig[pathname]
  const Icon = currentRoute?.icon
  const { theme, setTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useAuth()
  const { unreadCount } = useNotifications(user?.uid)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
          <div className="flex items-center gap-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/taxpayer-dashboard">
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathname !== "/taxpayer-dashboard" && currentRoute && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        {currentRoute.title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="h-9 w-9 relative group"
            >
              <Bell className={cn(
                "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                unreadCount > 0 && "text-primary shadow-sm"
              )} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2 flex h-2 w-2">
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
