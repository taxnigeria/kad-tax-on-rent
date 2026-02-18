"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Users, Home, FileText, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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

interface LgaPerformance {
  name: string
  revenue: number
}

interface EnumeratorStat {
  name: string
  count: number
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
  const [lgaPerformance, setLgaPerformance] = useState<LgaPerformance[]>([])
  const [topEnumerators, setTopEnumerators] = useState<EnumeratorStat[]>([])

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
        { data: taxpayersData },
        { data: properties },
        { data: taxCalculations },
        { data: recentPaymentsData },
        { data: lgas },
      ] = await Promise.all([
        supabase.from("payments").select("amount, verification_status, created_at, invoice_id"),
        supabase.from("invoices").select("id, total_amount, payment_status, due_date, created_at, property_id"),
        // Join taxpayer_profiles with users to get is_active
        supabase
          .from("taxpayer_profiles")
          .select("id, created_at, user_id, users!inner(is_active)"),
        supabase.from("properties").select("id, verification_status, created_at, lga_id, enumerated_by_user_id"),
        supabase
          .from("tax_calculations")
          .select("id, total_tax_due, property_id, created_at, properties(registered_property_name)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("payments")
          .select(
            `id, amount, created_at, verification_status, invoice_id, 
            invoices!inner(
              taxpayer_profile_id, 
              taxpayer_profiles!inner(
                user_id, 
                users!inner(first_name, last_name)
              )
            )`,
          )
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("lgas").select("id, name"),
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
        taxpayersData?.filter((t) => {
          const created = new Date(t.created_at)
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
        }).length || 0

      const activeTaxpayers = taxpayersData?.filter((t: any) => t.users?.is_active === true).length || 0

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

      const recentPaymentsProcessed = (recentPaymentsData || []).map((p: any) => {
        const firstName = p.invoices?.taxpayer_profiles?.users?.first_name || ""
        const lastName = p.invoices?.taxpayer_profiles?.users?.last_name || ""
        const taxpayerName = `${firstName} ${lastName}`.trim() || "Unknown"

        return {
          id: p.id,
          amount: p.amount || 0,
          taxpayerName,
          date: new Date(p.created_at).toLocaleDateString(),
          status: p.verification_status,
        }
      })

      const recentCalcsData = (taxCalculations || []).map((c: any) => ({
        id: c.id,
        propertyName: c.properties?.registered_property_name || "Unknown",
        amount: c.total_tax_due || 0,
        date: new Date(c.created_at).toLocaleDateString(),
      }))

      // Recent registrations (properties)
      const recentRegs =
        properties?.slice(0, 5).map((p) => ({
          id: p.id,
          name: "Property",
          type: p.verification_status,
          date: new Date(p.created_at).toLocaleDateString(),
        })) || []

      // Calculate LGA performance
      const lgaData: LgaPerformance[] = (lgas || []).map(lga => {
        const lgaRevenue = (payments || [])
          .filter(p => p.verification_status === "verified")
          .filter(p => {
            const inv = invoices?.find(i => i.id === p.invoice_id)
            const prop = properties?.find(pr => pr.id === inv?.property_id)
            return prop?.lga_id === lga.id
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0)

        return { name: lga.name, revenue: lgaRevenue }
      })
        .filter(l => l.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate Top Enumerators
      const enumeratorMap = new Map<string, number>()
      properties?.filter(p => p.verification_status === "verified").forEach(p => {
        if (p.enumerated_by_user_id) {
          enumeratorMap.set(p.enumerated_by_user_id, (enumeratorMap.get(p.enumerated_by_user_id) || 0) + 1)
        }
      })

      // We don't have user names easily here without another join, 
      // but for now let's use the ID or placeholder if we can't find them.
      // In a real app, you'd join with the users table.
      const enumStats: EnumeratorStat[] = Array.from(enumeratorMap.entries())
        .map(([id, count]) => ({ name: `Staff ${id.slice(0, 4)}`, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setStats({
        revenue: {
          total: totalCollected + totalOutstanding,
          outstanding: totalOutstanding,
          collected: totalCollected,
          pendingVerification,
        },
        taxpayers: {
          total: taxpayersData?.length || 0,
          active: activeTaxpayers,
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
      setLgaPerformance(lgaData)
      setTopEnumerators(enumStats)
      setRecentActivity({
        payments: recentPaymentsProcessed,
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
        loadDashboardData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        loadDashboardData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        loadDashboardData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "taxpayer_profiles" }, () => {
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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Real-time overview of tax collection system</p>
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
              {/* Decision Center - Tasks Needing Attention */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2 border-primary/20 bg-primary/5">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="size-4 text-primary" />
                        Decision Center
                      </CardTitle>
                      <CardDescription className="text-[10px]">Critical items requiring administrative action</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3 px-4 pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-2 rounded-lg bg-background border flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/admin/properties?status=pending')}>
                        <span className="text-lg font-bold text-orange-600">{stats.properties.pending}</span>
                        <span className="text-[10px] text-muted-foreground">Pending Properties</span>
                      </div>
                      <div className="p-2 rounded-lg bg-background border flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/admin/payments?status=pending')}>
                        <span className="text-lg font-bold text-blue-600">{stats.revenue.pendingVerification}</span>
                        <span className="text-[10px] text-muted-foreground">Pending Payments</span>
                      </div>
                      <div className="p-2 rounded-lg bg-background border flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/admin/invoices?status=overdue')}>
                        <span className="text-lg font-bold text-red-600">{stats.invoices.overdue}</span>
                        <span className="text-[10px] text-muted-foreground">Overdue Invoices</span>
                      </div>
                      <div className="p-2 rounded-lg bg-background border flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-bold text-green-600">{(stats.revenue.collected / (stats.revenue.total || 1) * 100).toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">Collection Eff.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="size-4 text-green-600" />
                      Growth Insight
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4 pt-0">
                    <div className="text-lg font-bold">{stats.taxpayers.newThisMonth}</div>
                    <p className="text-[10px] text-muted-foreground">New taxpayers registered this month. The system is seeing a healthy growth rate.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Compact KPI Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="py-3 px-4 relative overflow-hidden group hover:shadow-md transition-shadow dashboard-card">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</span>
                    <span className="text-xl font-bold font-mono">{formatCurrency(stats.revenue.total)}</span>
                  </div>
                  <DollarSign className="absolute right-2 top-1/2 -translate-y-1/2 size-8 text-black/[0.03] group-hover:text-primary/5 transition-colors" />
                </Card>

                <Card className="py-3 px-4 relative overflow-hidden group hover:shadow-md transition-shadow dashboard-card">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Collected</span>
                    <span className="text-xl font-bold font-mono text-green-600">{formatCurrency(stats.revenue.collected)}</span>
                  </div>
                  <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 size-8 text-black/[0.03] group-hover:text-green-500/5 transition-colors" />
                </Card>

                <Card className="py-3 px-4 relative overflow-hidden group hover:shadow-md transition-shadow dashboard-card">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Taxpayers</span>
                    <span className="text-xl font-bold font-mono">{stats.taxpayers.total}</span>
                  </div>
                  <Users className="absolute right-2 top-1/2 -translate-y-1/2 size-8 text-black/[0.03] group-hover:text-primary/5 transition-colors" />
                </Card>

                <Card className="py-3 px-4 relative overflow-hidden group hover:shadow-md transition-shadow dashboard-card">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Verified Props</span>
                    <span className="text-xl font-bold font-mono text-blue-600">{stats.properties.verified}</span>
                  </div>
                  <Home className="absolute right-2 top-1/2 -translate-y-1/2 size-8 text-black/[0.03] group-hover:text-blue-500/5 transition-colors" />
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Monthly Revenue Chart */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Revenue",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-[200px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyRevenue}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            strokeWidth={2}
                          />
                        </AreaChart>
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
                    <ChartContainer
                      config={{
                        paid: {
                          label: "Paid",
                          color: "#10b981",
                        },
                        partial: {
                          label: "Partial",
                          color: "#f59e0b",
                        },
                        unpaid: {
                          label: "Unpaid",
                          color: "#ef4444",
                        },
                      }}
                      className="h-[200px] w-full"
                    >
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
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Insights Row */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* LGA Performance Bar Chart */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-bold">LGA Revenue Performance (Top 5)</CardTitle>
                    <CardDescription className="text-[10px]">Revenue distribution by Local Government Area</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Revenue",
                          color: "hsl(var(--primary))",
                        },
                      }}
                      className="h-full w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lgaPerformance} layout="vertical" margin={{ left: 40, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888820" />
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 500 }}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="revenue"
                            fill="hsl(var(--primary))"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Top Enumerators Table */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-bold">Top Performing Staff</CardTitle>
                    <CardDescription className="text-[10px]">Most verified property registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topEnumerators.map((en, i) => (
                        <div key={en.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {i + 1}
                            </div>
                            <span className="text-sm font-medium">{en.name}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-bold">{en.count}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Properties</span>
                          </div>
                        </div>
                      ))}
                      {topEnumerators.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground text-sm italic">
                          No performance data recorded yet
                        </div>
                      )}
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
