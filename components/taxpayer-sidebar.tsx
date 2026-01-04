"use client"

import type * as React from "react"
import { Home, Building2, FileText, CreditCard, Bell } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserProfilePhoto } from "@/services/user-service"

import { NavMain } from "@/components/nav-main"
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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)

  const getRoleLabel = (role?: string): string => {
    switch (role) {
      case "taxpayer":
        return "Property Owner"
      case "property_manager":
        return "Property Manager"
      case "tenant":
        return "Tenant"
      default:
        return "User"
    }
  }

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (user?.uid) {
        const photoUrl = await getUserProfilePhoto(user.uid)
        setProfilePhotoUrl(photoUrl)
      }
    }
    fetchProfilePhoto()
  }, [user])

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
                  <span className="truncate text-xs">{getRoleLabel(user?.role)}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.displayName || "Taxpayer",
            email: user?.email || "",
            avatar: profilePhotoUrl || user?.photoURL || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
