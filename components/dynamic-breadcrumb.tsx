"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function DynamicBreadcrumb() {
  const pathname = usePathname()

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split("/").filter(Boolean)

  // Map of route segments to display names
  const routeNames: Record<string, string> = {
    dashboard: "Dashboard",
    admin: "Admin",
    taxpayers: "Taxpayers",
    properties: "Properties",
    invoices: "Invoices",
    payments: "Payments",
    "tax-calculations": "Tax Calculations",
    reports: "Reports",
    users: "Users & Roles",
    settings: "Settings",
    add: "Add New",
    edit: "Edit",
    create: "Create",
    "taxpayer-dashboard": "Taxpayer Portal",
  }

  // Build breadcrumb path
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join("/")}`
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    return { name, path }
  })

  // Don't show breadcrumb if only on root dashboard
  if (breadcrumbs.length === 0 || (breadcrumbs.length === 1 && breadcrumbs[0].name === "Dashboard")) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <div key={crumb.path} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.path}>{crumb.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
