"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CreditCard,
  Calculator,
  BarChart3,
  Shield,
  MapPin,
  Bell,
} from "lucide-react"

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const pathname = usePathname()

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
        isActive: pathname === "/admin",
      },
      {
        title: "Taxpayers",
        url: "/admin/taxpayers",
        icon: Users,
        isActive: pathname?.startsWith("/admin/taxpayers"),
        items: [
          {
            title: "All Taxpayers",
            url: "/admin/taxpayers",
          },
          {
            title: "Add Taxpayer",
            url: "/admin/taxpayers?add=true",
          },
        ],
      },
      {
        title: "Properties",
        url: "/admin/properties",
        icon: Building2,
        isActive: pathname?.startsWith("/admin/properties"),
        items: [
          {
            title: "All Properties",
            url: "/admin/properties",
          },
          {
            title: "Add Property",
            url: "/admin/properties?add=true",
          },
          {
            title: "Assessments",
            url: "/dashboard/properties/assessments",
          },
        ],
      },
      {
        title: "Invoices",
        url: "/admin/invoices",
        icon: FileText,
        isActive: pathname?.startsWith("/admin/invoices"),
        items: [
          {
            title: "All Invoices",
            url: "/admin/invoices",
          },
          {
            title: "Create Invoice",
            url: "/admin/invoices/create",
          },
          {
            title: "Overdue",
            url: "/admin/invoices/overdue",
          },
        ],
      },
      {
        title: "Notifications",
        url: "/admin/notifications",
        icon: Bell,
        isActive: pathname === "/admin/notifications",
        items: [
          {
            title: "Broadcasts",
            url: "/admin/notifications",
          },
        ]
      },
      {
        title: "Payments",
        url: "/admin/payments",
        icon: CreditCard,
        isActive: pathname?.startsWith("/admin/payments"),
        items: [
          {
            title: "All Payments",
            url: "/admin/payments",
          },
          {
            title: "Reconciliation",
            url: "/admin/payments/reconciliation",
          },
          {
            title: "Payment History",
            url: "/admin/payments/history",
          },
        ],
      },
      {
        title: "Tax Calculations",
        url: "/admin/tax-calculations",
        icon: Calculator,
        isActive: pathname?.startsWith("/admin/tax-calculations"),
        items: [
          {
            title: "All Calculations",
            url: "/admin/tax-calculations",
          },
          {
            title: "Tax Rates",
            url: "/dashboard/tax-calculations/rates",
          },
          {
            title: "Formulas",
            url: "/dashboard/tax-calculations/formulas",
          },
        ],
      },
      {
        title: "Reports",
        url: "/admin/reports",
        icon: BarChart3,
        isActive: pathname?.startsWith("/admin/reports"),
        items: [
          {
            title: "Financial Reports",
            url: "/admin/reports?type=financial",
          },
          {
            title: "Collection Reports",
            url: "/admin/reports?type=collection",
          },
          {
            title: "Analytics",
            url: "/admin/reports?type=analytics",
          },
        ],
      },
      {
        title: "Users & Roles",
        url: "/admin/users",
        icon: Shield,
        isActive: pathname?.startsWith("/admin/users"),
        items: [
          {
            title: "Staff Users",
            url: "/admin/users",
          },
          {
            title: "Roles & Permissions",
            url: "/admin/users/roles",
          },
          {
            title: "Activity Log",
            url: "/admin/users/activity",
          },
        ],
      },
      {
        title: "Locations",
        url: "/admin/locations",
        icon: MapPin,
        isActive: pathname?.startsWith("/admin/locations"),
        items: [
          {
            title: "Area Offices",
            url: "/admin/locations?tab=area-offices",
          },
          {
            title: "LGAs",
            url: "/admin/locations?tab=lgas",
          },
          {
            title: "Cities",
            url: "/admin/locations?tab=cities",
          },
        ],
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">KADIRS</span>
                  <span className="truncate text-xs">Admin Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.displayName || "Admin",
            email: user?.email || "",
            avatar: user?.photoURL || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
