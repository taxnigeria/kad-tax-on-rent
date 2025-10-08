"use client"

import type * as React from "react"
import { Home, Building2, FileText, CreditCard, Bell, Settings, HelpCircle } from "lucide-react"
import { usePathname } from "next/navigation"

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
import { useAuth } from "@/contexts/auth-context"

export function TaxpayerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const pathname = usePathname()

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/taxpayer-dashboard",
        icon: Home,
        isActive: pathname === "/taxpayer-dashboard",
      },
      {
        title: "My Properties",
        url: "/taxpayer-dashboard/properties",
        icon: Building2,
        isActive: pathname?.startsWith("/taxpayer-dashboard/properties"),
        items: [
          {
            title: "All Properties",
            url: "/taxpayer-dashboard/properties",
          },
          {
            title: "Add Property",
            url: "/taxpayer-dashboard/properties/add",
          },
        ],
      },
      {
        title: "Invoices",
        url: "/taxpayer-dashboard/invoices",
        icon: FileText,
        isActive: pathname === "/taxpayer-dashboard/invoices",
      },
      {
        title: "Payments",
        url: "/taxpayer-dashboard/payments",
        icon: CreditCard,
        isActive: pathname === "/taxpayer-dashboard/payments",
      },
      {
        title: "Notifications",
        url: "/taxpayer-dashboard/notifications",
        icon: Bell,
        isActive: pathname === "/taxpayer-dashboard/notifications",
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "/taxpayer-dashboard/settings",
        icon: Settings,
        isActive: pathname === "/taxpayer-dashboard/settings",
      },
      {
        title: "Help & Support",
        url: "/taxpayer-dashboard/help",
        icon: HelpCircle,
        isActive: pathname === "/taxpayer-dashboard/help",
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/taxpayer-dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Tax Portal</span>
                  <span className="truncate text-xs">Taxpayer</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.displayName || "Taxpayer",
            email: user?.email || "",
            avatar: user?.photoURL || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
