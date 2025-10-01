"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, FileText, CreditCard, AlertCircle, Plus } from "lucide-react"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"

export default function TaxpayerDashboardPage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["taxpayer", "property_manager"].includes(userRole)) {
        // Redirect non-taxpayers to admin dashboard
        router.push("/dashboard")
      }
    }
  }, [user, userRole, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated or wrong role
  if (!user || (userRole && !["taxpayer", "property_manager"].includes(userRole))) {
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <TaxpayerSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Welcome Section */}
              <div className="px-4 lg:px-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
                  <p className="text-muted-foreground">Manage your properties and tax obligations</p>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">No properties registered yet</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">All caught up!</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₦0.00</div>
                      <p className="text-xs text-muted-foreground">This year</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₦0.00</div>
                      <p className="text-xs text-muted-foreground">No outstanding balance</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Get started with common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Button className="h-auto flex-col items-start gap-2 p-4 bg-transparent" variant="outline">
                        <Plus className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">Register Property</div>
                          <div className="text-xs text-muted-foreground">Add a new property to your portfolio</div>
                        </div>
                      </Button>

                      <Button className="h-auto flex-col items-start gap-2 p-4 bg-transparent" variant="outline">
                        <FileText className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">View Invoices</div>
                          <div className="text-xs text-muted-foreground">Check your tax invoices and bills</div>
                        </div>
                      </Button>

                      <Button className="h-auto flex-col items-start gap-2 p-4 bg-transparent" variant="outline">
                        <CreditCard className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">Make Payment</div>
                          <div className="text-xs text-muted-foreground">Pay your outstanding tax bills</div>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your latest transactions and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-sm text-muted-foreground">No recent activity</p>
                        <p className="text-xs text-muted-foreground">
                          Your activity will appear here once you start using the system
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />
    </SidebarProvider>
  )
}
