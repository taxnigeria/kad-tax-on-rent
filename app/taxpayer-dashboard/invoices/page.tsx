"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { AlertCircle, Calendar, CreditCard, DollarSign, FileText, Search, Filter } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { TaxpayerHeader } from "@/components/taxpayer-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { TaxBillDetailsSheet } from "@/components/taxpayer/tax-bill-details-sheet"

type TaxBill = {
  id: string
  calculation_id: string
  invoice_id: string
  invoice_number: string

  // Property info
  property_id: string
  property_name: string
  property_reference: string
  property_type: string

  // Tax calculation details
  tax_year: number
  is_backlog: boolean
  backlog_start_date: string | null
  backlog_end_date: string | null
  backlog_years: number | null
  annual_rent: number
  tax_rate: number
  base_tax_amount: number
  backlog_tax_amount: number
  penalty_amount: number
  interest_amount: number
  total_tax_due: number

  // Invoice/payment details
  issue_date: string
  due_date: string
  payment_status: string
  total_amount: number
  amount_paid: number
  balance_due: number
  tax_period: string
}

type Stats = {
  totalOutstanding: number
  overdueCount: number
  totalPaidThisYear: number
  nextDueDate: string | null
  backlogCount: number
  currentYearCount: number
}

export default function InvoicesPage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()
  const { toast } = useToast()
  const [bills, setBills] = useState<TaxBill[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all") // all, backlog, current
  const [searchQuery, setSearchQuery] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["taxpayer", "property_manager"].includes(userRole)) {
        router.push("/dashboard")
      } else {
        loadData()
      }
    }
  }, [user, userRole, loading, router])

  useEffect(() => {
    if (user) {
      loadBills()
    }
  }, [statusFilter, typeFilter, searchQuery, user])

  useEffect(() => {
    if (!user?.uid) return

    const fetchSupabaseUserId = async () => {
      try {
        const { data, error } = await supabase.from("users").select("id").eq("firebase_uid", user.uid).single()

        if (error) {
          console.error("Error fetching Supabase user ID:", error)
          return
        }

        if (data) {
          setSupabaseUserId(data.id)
        }
      } catch (error) {
        console.error("Error in fetchSupabaseUserId:", error)
      }
    }

    fetchSupabaseUserId()
  }, [user?.uid])

  useEffect(() => {
    if (!supabaseUserId) return

    const channel = supabase
      .channel("tax-bills-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `taxpayer_id=eq.${supabaseUserId}`,
        },
        () => {
          loadBills()
          loadStats()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tax_calculations",
        },
        () => {
          loadBills()
          loadStats()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        () => {
          loadBills()
          loadStats()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabaseUserId])

  const loadData = async () => {
    setLoadingData(true)
    await Promise.all([loadBills(), loadStats()])
    setLoadingData(false)
  }

  const loadBills = async () => {
    try {
      let query = supabase
        .from("invoices")
        .select(
          `
          id,
          invoice_number,
          issue_date,
          due_date,
          payment_status,
          total_amount,
          amount_paid,
          balance_due,
          tax_period,
          tax_calculation_id,
          property_id,
          properties!inner (
            id,
            registered_property_name,
            property_reference,
            property_type
          ),
          tax_calculations!inner (
            id,
            tax_year,
            annual_rent,
            tax_rate,
            base_tax_amount,
            backlog_tax_amount,
            backlog_start_date,
            backlog_end_date,
            backlog_years,
            penalty_amount,
            interest_amount,
            total_tax_due
          )
        `,
        )
        .order("due_date", { ascending: false })

      // Apply filters
      if (statusFilter !== "all") {
        if (statusFilter === "unpaid") {
          query = query.eq("payment_status", "unpaid")
        } else if (statusFilter === "partial") {
          query = query.eq("payment_status", "partially_paid")
        } else if (statusFilter === "paid") {
          query = query.eq("payment_status", "paid")
        }
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching bills:", error)
        return
      }

      const transformedBills: TaxBill[] = (data || []).map((item: any) => {
        const calc = item.tax_calculations
        const prop = item.properties
        const isBacklog = calc.backlog_years && calc.backlog_years > 0

        return {
          id: item.id,
          calculation_id: calc.id,
          invoice_id: item.id,
          invoice_number: item.invoice_number,
          property_id: prop.id,
          property_name: prop.registered_property_name,
          property_reference: prop.property_reference,
          property_type: prop.property_type,
          tax_year: calc.tax_year,
          is_backlog: isBacklog,
          backlog_start_date: calc.backlog_start_date,
          backlog_end_date: calc.backlog_end_date,
          backlog_years: calc.backlog_years,
          annual_rent: calc.annual_rent,
          tax_rate: calc.tax_rate,
          base_tax_amount: calc.base_tax_amount,
          backlog_tax_amount: calc.backlog_tax_amount,
          penalty_amount: calc.penalty_amount,
          interest_amount: calc.interest_amount,
          total_tax_due: calc.total_tax_due,
          issue_date: item.issue_date,
          due_date: item.due_date,
          payment_status: item.payment_status,
          total_amount: item.total_amount,
          amount_paid: item.amount_paid,
          balance_due: item.balance_due,
          tax_period: item.tax_period,
        }
      })

      // Apply type filter (backlog vs current)
      let filteredBills = transformedBills
      if (typeFilter === "backlog") {
        filteredBills = transformedBills.filter((b) => b.is_backlog)
      } else if (typeFilter === "current") {
        filteredBills = transformedBills.filter((b) => !b.is_backlog)
      }

      // Apply search filter
      if (searchQuery) {
        filteredBills = filteredBills.filter(
          (b) =>
            b.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.property_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.tax_period?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      }

      setBills(filteredBills)
    } catch (error) {
      console.error("Error in loadBills:", error)
    }
  }

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.from("invoices").select(
        `
          id,
          balance_due,
          due_date,
          payment_status,
          amount_paid,
          issue_date,
          tax_calculations!inner (
            backlog_years
          )
        `,
      )

      if (error) {
        console.error("Error fetching stats:", error)
        return
      }

      const currentYear = new Date().getFullYear()
      const today = new Date()

      const totalOutstanding = (data || []).reduce((sum, inv) => sum + (inv.balance_due || 0), 0)
      const overdueCount = (data || []).filter(
        (inv) => inv.payment_status !== "paid" && new Date(inv.due_date) < today,
      ).length
      const totalPaidThisYear = (data || [])
        .filter((inv) => new Date(inv.issue_date).getFullYear() === currentYear)
        .reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)

      const upcomingInvoices = (data || [])
        .filter((inv) => inv.payment_status !== "paid" && new Date(inv.due_date) >= today)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

      const nextDueDate = upcomingInvoices.length > 0 ? upcomingInvoices[0].due_date : null

      const backlogCount = (data || []).filter((inv: any) => inv.tax_calculations?.backlog_years > 0).length
      const currentYearCount = (data || []).filter((inv: any) => !inv.tax_calculations?.backlog_years).length

      setStats({
        totalOutstanding,
        overdueCount,
        totalPaidThisYear,
        nextDueDate,
        backlogCount,
        currentYearCount,
      })
    } catch (error) {
      console.error("Error in loadStats:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleDownload = (billId: string) => {
    toast({
      title: "Download started",
      description: "Your invoice is being downloaded...",
    })
  }

  const handlePrint = (billId: string) => {
    toast({
      title: "Print dialog opened",
      description: "Preparing invoice for printing...",
    })
  }

  const handlePayNow = (billId: string) => {
    router.push(`/taxpayer-dashboard/payments?invoice=${billId}`)
  }

  const [selectedCalculationId, setSelectedCalculationId] = useState<string | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)

  if (loading || !user || (userRole && !["taxpayer", "property_manager"].includes(userRole))) {
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
            <div className="flex flex-col gap-6 p-4 md:p-6">
              {/* Page Header */}
              <div>
                <h1 className="text-lg font-bold tracking-tight">My Tax Bills</h1>
              </div>

              {/* Stats Cards */}
              {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</div>
                      <p className="text-xs text-muted-foreground mt-1">Amount due across all bills</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
                      <AlertCircle
                        className={`h-4 w-4 ${stats.overdueCount > 0 ? "text-red-500" : "text-muted-foreground"}`}
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overdueCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.overdueCount > 0 ? "Requires attention" : "All up to date"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Paid This Year</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(stats.totalPaidThisYear)}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total in {new Date().getFullYear()}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.nextDueDate ? format(new Date(stats.nextDueDate), "MMM dd") : "None"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.nextDueDate ? "Upcoming deadline" : "No pending bills"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by invoice, property, or tax period..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[160px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Bills</SelectItem>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          <SelectItem value="current">Current Year</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {loadingData ? (
                <Card className="border-border/50">
                  <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading tax bills...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : bills.length === 0 ? (
                <Card className="border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tax bills found</h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                      Your tax bills will appear here once they are calculated by the tax office.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bills.map((bill) => (
                    <Card
                      key={bill.id}
                      className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedCalculationId(bill.calculation_id)
                        setIsDetailsSheetOpen(true)
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate font-bold">{bill.invoice_number}</CardTitle>
                            <CardDescription className="text-xs mt-1">{bill.property_name}</CardDescription>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              bill.payment_status === "paid"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : bill.payment_status === "partially_paid"
                                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                  : new Date(bill.due_date) < new Date()
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            }
                          >
                            {bill.payment_status === "paid"
                              ? "Paid"
                              : bill.payment_status === "partially_paid"
                                ? "Partial"
                                : new Date(bill.due_date) < new Date()
                                  ? "Overdue"
                                  : "Unpaid"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Tax Period</span>
                            <span className="font-medium">{bill.is_backlog ? "Backlog" : bill.tax_year}</span>
                          </div>

                          {bill.is_backlog && (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs"
                              >
                                Backlog ({bill.backlog_years} {bill.backlog_years === 1 ? "year" : "years"})
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground">Total Amount</span>
                            <span className="font-semibold">{formatCurrency(bill.total_amount)}</span>
                          </div>

                          {bill.amount_paid > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Paid</span>
                              <span className="text-green-500">-{formatCurrency(bill.amount_paid)}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between font-bold pt-1">
                            <span>Balance Due</span>
                            <span className="text-lg">{formatCurrency(bill.balance_due)}</span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <span className="text-muted-foreground text-xs">Due Date</span>
                            <span className="text-xs font-medium">
                              {format(new Date(bill.due_date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                          <Button variant="outline" className="w-full bg-transparent" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />

      <TaxBillDetailsSheet
        open={isDetailsSheetOpen}
        onOpenChange={setIsDetailsSheetOpen}
        calculationId={selectedCalculationId}
        onUpdate={() => {
          loadBills()
          loadStats()
        }}
      />
    </SidebarProvider>
  )
}
