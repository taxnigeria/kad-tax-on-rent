"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { DollarSign, Users, Home, FileText, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  revenue: {
    total: number
    outstanding: number
    collected: number
    pendingVerification: number
  }
  taxpayers: {
    total: number
    active: number
    newThisMonth: number
  }
  properties: {
    total: number
    verified: number
    pending: number
    rejected: number
  }
  invoices: {
    total: number
    paid: number
    partial: number
    unpaid: number
    overdue: number
  }
}

interface RecentActivity {
  payments: Array<{
    id: string
    amount: number
    taxpayerName: string
    date: string
    status: string
  }>
  registrations: Array<{
    id: string
    name: string
    type: string
    date: string
  }>
  calculations: Array<{
    id: string
    propertyName: string
    amount: number
    date: string
  }>
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

export default function AdminDashboard() {
  const { user, userRole, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    revenue: { total: 0, outstanding: 0, collected: 0, pendingVerification: 0 },
    taxpayers: { total: 0, active: 0, newThisMonth: 0 },
    properties: { total: 0, verified: 0, pending: 0, rejected: 0 },
    invoices: { total: 0, paid: 0, partial: 0, unpaid: 0, overdue: 0 },
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({
    payments: [],
    registrations: [],
    calculations: [],
  })
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["admin", "super_admin", "staff"].includes(userRole)) {
        router.push("/unauthorized")
      }
    }
  }, [user, userRole, authLoading, router])

  // Load dashboard data
  const loadDashboardData = async () => {
    const supabase = createClient()

    try {
      // Parallel fetch all data
      const [
        { data: payments },
        { data: invoices },
        { data: taxpayers },
        { data: properties },
        { data: taxCalculations },
        { data: recentPayments },
      ] = await Promise.all([
        supabase.from("payments").select("amount, verification_status, created_at"),
        supabase.from("invoices").select("total_amount, payment_status, due_date, created_at"),
        supabase.from("taxpayer_profiles").select("id, is_active, created_at"),
        supabase.from("properties").select("id, verification_status, created_at"),
        supabase
          .from("tax_calculations")
          .select("id, total_tax, property_id, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("payments")
          .select("id, amount, created_at, verification_status, taxpayer_id")
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      // Calculate revenue stats
      const totalCollected =
        payments?.filter((p) => p.verification_status === "verified").reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const pendingVerification = payments?.filter((p) => p.verification_status === "pending").length || 0
      const totalOutstanding =
        invoices?.filter((i) => i.payment_status !== "paid").reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0

      // Calculate taxpayer stats
      const now = new Date()
      const newThisMonth =
        taxpayers?.filter((t) => {
          const created = new Date(t.created_at)
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
        }).length || 0

      // Calculate property stats
      const verifiedProps = properties?.filter((p) => p.verification_status === "verified").length || 0
      const pendingProps = properties?.filter((p) => p.verification_status === "pending").length || 0
      const rejectedProps = properties?.filter((p) => p.verification_status === "rejected").length || 0

      // Calculate invoice stats
      const paidInvoices = invoices?.filter((i) => i.payment_status === "paid").length || 0
      const partialInvoices = invoices?.filter((i) => i.payment_status === "partial").length || 0
      const unpaidInvoices = invoices?.filter((i) => i.payment_status === "unpaid").length || 0
      const overdueInvoices =
        invoices?.filter((i) => i.payment_status !== "paid" && new Date(i.due_date) < now).length || 0

      // Calculate monthly revenue (last 6 months)
      const monthlyData: MonthlyRevenue[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const revenue =
          payments
            ?.filter((p) => {
              const pDate = new Date(p.created_at)
              return p.verification_status === "verified" && pDate >= monthStart && pDate <= monthEnd
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        monthlyData.push({
          month: date.toLocaleDateString("en-US", { month: "short" }),
          revenue,
        })
      }

      // Process recent payments
      const recentPaymentsData = await Promise.all(
        (recentPayments || []).map(async (p) => {
          const { data: taxpayer } = await supabase
            .from("taxpayer_profiles")
            .select("full_name")
            .eq("id", p.taxpayer_id)
            .single()
          return {
            id: p.id,
            amount: p.amount || 0,
            taxpayerName: taxpayer?.full_name || "Unknown",
            date: new Date(p.created_at).toLocaleDateString(),
            status: p.verification_status,
          }
        }),
      )

      // Process recent calculations
      const recentCalcsData = await Promise.all(
        (taxCalculations || []).map(async (c) => {
          const { data: property } = await supabase
            .from("properties")
            .select("property_name")
            .eq("id", c.property_id)
            .single()
          return {
            id: c.id,
            propertyName: property?.property_name || "Unknown",
            amount: c.total_tax || 0,
            date: new Date(c.created_at).toLocaleDateString(),
          }
        }),
      )

      // Recent registrations (properties)
      const recentRegs =
        properties?.slice(0, 5).map((p) => ({
          id: p.id,
          name: "Property",
          type: p.verification_status,
          date: new Date(p.created_at).toLocaleDateString(),
        })) || []

      setStats({
        revenue: {
          total: totalCollected + totalOutstanding,
          outstanding: totalOutstanding,
          collected: totalCollected,
          pendingVerification,
        },
        taxpayers: {
          total: taxpayers?.length || 0,
          active: taxpayers?.filter((t) => t.is_active).length || 0,
          newThisMonth,
        },
        properties: {
          total: properties?.length || 0,
          verified: verifiedProps,
          pending: pendingProps,
          rejected: rejectedProps,
        },
        invoices: {
          total: invoices?.length || 0,
          paid: paidInvoices,
          partial: partialInvoices,
          unpaid: unpaidInvoices,
          overdue: overdueInvoices,
        },
      })

      setMonthlyRevenue(monthlyData)
      setRecentActivity({
        payments: recentPaymentsData,
        registrations: recentRegs,
        calculations: recentCalcsData,
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (user && userRole && ["admin", "super_admin", "staff"].includes(userRole)) {
      loadDashboardData()
    }
  }, [user, userRole])

  // Realtime subscriptions
  useEffect(() => {
    if (!user || !userRole || !["admin", "super_admin", "staff"].includes(userRole)) return

    const supabase = createClient()
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        console.log("[v0] Payments updated, refreshing dashboard...")
        loadDashboardData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        console.log("[v0] Invoices updated, refreshing dashboard...")
        loadDashboardData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        console.log("[v0] Properties updated, refreshing dashboard...")
        loadDashboardData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "taxpayer_profiles" }, () => {
        console.log("[v0] Taxpayers updated, refreshing dashboard...")
        loadDashboardData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, userRole])

  // Invoice status chart data
  const invoiceChartData = [
    { name: "Paid", value: stats.invoices.paid, color: "#10b981" },
    { name: "Partial", value: stats.invoices.partial, color: "#f59e0b" },
    { name: "Unpaid", value: stats.invoices.unpaid, color: "#ef4444" },
  ]

  if (!user || (userRole && !["admin", "super_admin", "staff"].includes(userRole))) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time overview of tax collection system</p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-7 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Revenue Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
                    <p className="text-xs text-muted-foreground">Collected + Outstanding</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Collected</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.revenue.collected)}</div>
                    <p className="text-xs text-muted-foreground">Verified payments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.revenue.outstanding)}</div>
                    <p className="text-xs text-muted-foreground">Unpaid invoices</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.revenue.pendingVerification}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>
              </div>

              {/* Taxpayer & Property Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Taxpayers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.taxpayers.total}</div>
                    <p className="text-xs text-muted-foreground">{stats.taxpayers.active} active</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.taxpayers.newThisMonth}</div>
                    <p className="text-xs text-muted-foreground">New registrations</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.properties.total}</div>
                    <p className="text-xs text-muted-foreground">{stats.properties.verified} verified</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Properties</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.properties.pending}</div>
                    <p className="text-xs text-muted-foreground">Awaiting verification</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Monthly Revenue Chart */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Revenue",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[200px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Invoice Status Chart */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="text-base">Invoice Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={invoiceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {invoiceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Tables */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Recent Payments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentActivity.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{payment.taxpayerName}</p>
                            <p className="text-xs text-muted-foreground">{payment.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={payment.status === "verified" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {payment.status}
                            </Badge>
                            <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                          </div>
                        </div>
                      ))}
                      {recentActivity.payments.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent payments</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Tax Calculations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Calculations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentActivity.calculations.map((calc) => (
                        <div key={calc.id} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{calc.propertyName}</p>
                            <p className="text-xs text-muted-foreground">{calc.date}</p>
                          </div>
                          <span className="font-semibold">{formatCurrency(calc.amount)}</span>
                        </div>
                      ))}
                      {recentActivity.calculations.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent calculations</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Invoice Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Invoice Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Total Invoices</span>
                        </div>
                        <span className="font-semibold">{stats.invoices.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Paid</span>
                        </div>
                        <span className="font-semibold">{stats.invoices.paid}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">Partial</span>
                        </div>
                        <span className="font-semibold">{stats.invoices.partial}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm">Unpaid</span>
                        </div>
                        <span className="font-semibold">{stats.invoices.unpaid}</span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">Overdue</span>
                        </div>
                        <Badge variant="destructive">{stats.invoices.overdue}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
