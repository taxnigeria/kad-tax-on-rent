"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { TaxpayerHeader } from "@/components/taxpayer-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, FileText, CreditCard, AlertCircle, Plus, Loader2 } from "lucide-react"
import { createBrowserClient } from "@/utils/supabase/client"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import AIAssistantSidebar from "@/components/ai-assistant-sidebar" // Import AIAssistantSidebar
import ProfileCompletionSection from "@/components/profile-completion-section" // Import ProfileCompletionSection

interface DashboardStats {
  totalProperties: number
  pendingInvoices: number
  totalPaid: number
  outstanding: number
}

interface RecentActivity {
  id: string
  type: "invoice" | "payment" | "property"
  title: string
  description: string
  amount?: number
  date: string
  status?: string
}

export default function TaxpayerDashboardPage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    pendingInvoices: 0,
    totalPaid: 0,
    outstanding: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["taxpayer", "property_manager"].includes(userRole)) {
        router.push("/dashboard")
      }
    }
  }, [user, userRole, loading, router])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return

    setLoadingData(true)
    const supabase = createBrowserClient()

    try {
      // Fetch database user ID using firebase_uid
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("firebase_uid", user.uid)
        .single()

      if (userError || !userData) {
        console.error("Error fetching user:", userError)
        return
      }

      const userId = userData.id

      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId)

      // Fetch invoices data
      const { data: invoices } = await supabase
        .from("invoices")
        .select(
          `
          *,
          tax_calculations!inner (
            id,
            properties!inner (
              owner_id
            )
          )
        `,
        )
        .eq("tax_calculations.properties.owner_id", userId)

      // Calculate stats from invoices
      const pendingCount = invoices?.filter((inv) => inv.payment_status === "unpaid").length || 0
      const totalPaid =
        invoices
          ?.filter((inv) => inv.payment_status === "paid")
          .reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0
      const outstanding = invoices?.reduce((sum, inv) => sum + (inv.balance_due || 0), 0) || 0

      setStats({
        totalProperties: propertiesCount || 0,
        pendingInvoices: pendingCount,
        totalPaid,
        outstanding,
      })

      // Fetch recent activities (recent invoices and payments)
      const activities: RecentActivity[] = []

      // Add recent invoices
      const recentInvoices = invoices?.slice(0, 5) || []
      for (const invoice of recentInvoices) {
        activities.push({
          id: invoice.id,
          type: "invoice",
          title: `Invoice ${invoice.invoice_number}`,
          description: `Tax period: ${invoice.tax_period}`,
          amount: invoice.total_amount,
          date: invoice.created_at,
          status: invoice.payment_status,
        })
      }

      // Sort by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setRecentActivities(activities.slice(0, 5))
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleRegisterProperty = () => {
    router.push("/taxpayer-dashboard/properties")
  }

  const handleViewInvoices = () => {
    router.push("/taxpayer-dashboard/invoices")
  }

  const handleMakePayment = () => {
    router.push("/taxpayer-dashboard/invoices?filter=unpaid")
  }

  // Don't render dashboard if not authenticated or wrong role
  if (!user || (userRole && !["taxpayer", "property_manager"].includes(userRole))) {
    if (loading) {
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
            <TaxpayerHeader />
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <Loader2 className="inline-block h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </div>
          </SidebarInset>
          <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />
        </SidebarProvider>
      )
    }
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
        <TaxpayerHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Welcome Section */}
                <div className="mb-6">
                  <h1 className="text-lg font-bold tracking-tight">Welcome back!</h1>
                  <p className="text-muted-foreground text-sm">Manage your properties and tax obligations</p>
                </div>

                {/* Profile Completion Section */}
                <div className="mb-6">
                  <ProfileCompletionSection />
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4">
                  {/* Total Properties */}
                  <Card className="flex flex-col justify-between rounded-2xl border p-4 shadow-sm w-full sm:w-[48%] lg:w-[23%]">
                    {loadingData ? (
                      <div className="flex w-full justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-semibold">Total Properties</p>
                            <p className="text-sm text-muted-foreground">{stats.totalProperties}</p>
                          </div>
                        </div>
                        <div className="mt-1 text-lg font-bold">{stats.totalProperties}</div>
                      </>
                    )}
                  </Card>

                  {/* Pending Invoices */}
                  <Card className="flex flex-col justify-between rounded-2xl border p-4 shadow-sm w-full sm:w-[48%] lg:w-[23%]">
                    {loadingData ? (
                      <div className="flex w-full justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-semibold">Pending Invoices</p>
                            <p className="text-sm text-muted-foreground">
                              {stats.pendingInvoices === 0 ? "All caught up!" : "Requires payment"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1 text-lg font-bold">{stats.pendingInvoices}</div>
                      </>
                    )}
                  </Card>

                  {/* Total Paid */}
                  <Card className="flex flex-col justify-between rounded-2xl border p-4 shadow-sm w-full sm:w-[48%] lg:w-[23%]">
                    {loadingData ? (
                      <div className="flex w-full justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <CreditCard className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-semibold">Total Paid</p>
                            <p className="text-sm text-muted-foreground">Total payments made</p>
                          </div>
                        </div>
                        <div className="mt-1 text-lg font-bold">{formatCurrency(stats.totalPaid)}</div>
                      </>
                    )}
                  </Card>

                  {/* Outstanding */}
                  <Card className="flex flex-col justify-between rounded-2xl border p-4 shadow-sm w-full sm:w-[48%] lg:w-[23%]">
                    {loadingData ? (
                      <div className="flex w-full justify-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <AlertCircle className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-base font-semibold">Outstanding</p>
                            <p className="text-sm text-muted-foreground">
                              {stats.outstanding === 0 ? "No outstanding balance" : "Balance due"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1 text-lg font-bold">{formatCurrency(stats.outstanding)}</div>
                      </>
                    )}
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
                      <Button
                        className="h-auto flex-col items-start gap-2 p-4 bg-transparent"
                        variant="outline"
                        onClick={handleRegisterProperty}
                      >
                        <Plus className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">Register Property</div>
                          <div className="text-xs text-muted-foreground">Add a new property to your portfolio</div>
                        </div>
                      </Button>

                      <Button
                        className="h-auto flex-col items-start gap-2 p-4 bg-transparent"
                        variant="outline"
                        onClick={handleViewInvoices}
                      >
                        <FileText className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">View Invoices</div>
                          <div className="text-xs text-muted-foreground">Check your tax invoices and bills</div>
                        </div>
                      </Button>

                      <Button
                        className="h-auto flex-col items-start gap-2 p-4 bg-transparent"
                        variant="outline"
                        onClick={handleMakePayment}
                      >
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
                      {loadingData ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : recentActivities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                          <p className="mt-4 text-sm text-muted-foreground">No recent activity</p>
                          <p className="text-xs text-muted-foreground">
                            Your activity will appear here once you start using the system
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentActivities.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {activity.type === "invoice" && (
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {activity.type === "payment" && (
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {activity.type === "property" && (
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{activity.title}</p>
                                    {activity.status && (
                                      <Badge
                                        variant={
                                          activity.status === "paid"
                                            ? "default"
                                            : activity.status === "unpaid"
                                              ? "destructive"
                                              : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {activity.status}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(activity.date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              {activity.amount && (
                                <div className="text-right">
                                  <p className="text-sm font-semibold">{formatCurrency(activity.amount)}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
