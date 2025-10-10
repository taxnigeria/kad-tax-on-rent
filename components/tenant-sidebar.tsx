"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import { Building2, FileText, CreditCard, Settings, LifeBuoy, Bell, Home } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/tenant-dashboard",
      icon: Home,
    },
    {
      title: "My Rentals",
      url: "/tenant-dashboard/properties",
      icon: Building2,
    },
    {
      title: "Invoices",
      url: "/tenant-dashboard/invoices",
      icon: FileText,
    },
    {
      title: "Payments",
      url: "/tenant-dashboard/payments",
      icon: CreditCard,
    },
  ],
  navSecondary: [
    {
      title: "Notifications",
      url: "/tenant-dashboard/notifications",
      icon: Bell,
    },
    {
      title: "Settings",
      url: "/tenant-dashboard/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/tenant-dashboard/help",
      icon: LifeBuoy,
    },
  ],
}

export function TenantSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/tenant-dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">KADIRS</span>
                  <span className="truncate text-xs">Tenant Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} pathname={pathname} />
        <NavSecondary items={data.navSecondary} pathname={pathname} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
