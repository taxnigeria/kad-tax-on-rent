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
  Settings,
  HelpCircle,
} from "lucide-react"

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const pathname = usePathname()

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: "Taxpayers",
        url: "/admin/taxpayers",
        icon: Users,
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
        title: "Payments",
        url: "/admin/payments",
        icon: CreditCard,
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
        url: "/dashboard/reports",
        icon: BarChart3,
        items: [
          {
            title: "Financial Reports",
            url: "/dashboard/reports/financial",
          },
          {
            title: "Collection Reports",
            url: "/dashboard/reports/collection",
          },
          {
            title: "Analytics",
            url: "/dashboard/reports/analytics",
          },
        ],
      },
      {
        title: "Users & Roles",
        url: "/dashboard/users",
        icon: Shield,
        items: [
          {
            title: "Admin Users",
            url: "/dashboard/users",
          },
          {
            title: "Roles & Permissions",
            url: "/dashboard/users/roles",
          },
          {
            title: "Activity Log",
            url: "/dashboard/users/activity",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
      },
      {
        title: "Help & Support",
        url: "/dashboard/help",
        icon: HelpCircle,
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
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
        <NavSecondary items={data.navSecondary} className="mt-auto" pathname={pathname} />
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
