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
import { Home, Building2, FileText, CreditCard, Bell, Settings, HelpCircle } from "lucide-react"

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

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
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
    </header>
  )
}
