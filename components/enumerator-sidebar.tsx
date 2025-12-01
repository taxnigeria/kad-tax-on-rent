"use client"

import type * as React from "react"
import { Home, MapPin, Award, Settings, HelpCircle, LogOut } from "lucide-react"
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

export function EnumeratorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const pathname = usePathname()

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/enumerator-dashboard",
        icon: Home,
        isActive: pathname === "/enumerator-dashboard",
      },
      {
        title: "Enumerate Property",
        url: "/enumerator-dashboard/enumerate",
        icon: MapPin,
        isActive: pathname === "/enumerator-dashboard/enumerate",
      },
      {
        title: "Leaderboard",
        url: "/enumerator-dashboard/leaderboard",
        icon: Award,
        isActive: pathname === "/enumerator-dashboard/leaderboard",
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "/enumerator-dashboard/settings",
        icon: Settings,
        isActive: pathname === "/enumerator-dashboard/settings",
      },
      {
        title: "Help & Support",
        url: "/enumerator-dashboard/help",
        icon: HelpCircle,
        isActive: pathname === "/enumerator-dashboard/help",
      },
      {
        title: "Log out",
        url: "#",
        icon: LogOut,
        isActive: false,
        onClick: "logout",
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/enumerator-dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MapPin className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">KADIRS</span>
                  <span className="truncate text-xs">Field Agent</span>
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
            name: user?.displayName || "Field Agent",
            email: user?.email || "",
            avatar: user?.photoURL || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
