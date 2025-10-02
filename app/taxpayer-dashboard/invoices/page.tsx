"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { AlertCircle, Calendar, CreditCard, DollarSign, Eye, FileText, Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getTaxpayerInvoices, getInvoiceStats, type Invoice, type InvoiceStats } from "@/app/actions/invoices"
import { createClient } from "@/lib/supabase/client"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { TaxpayerHeader } from "@/components/taxpayer-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal"
import { IconTrendingUp } from "@tabler/icons-react"

export default function InvoicesPage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

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
      loadInvoices()
    }
  }, [statusFilter, yearFilter, searchQuery, user])

  useEffect(() => {
    if (!user?.uid) return

    const fetchSupabaseUserId = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("users").select("id").eq("firebase_uid", user.uid).single()

        if (error) {
          console.error("[v0] Error fetching Supabase user ID:", error)
          return
        }

        if (data) {
          console.log("[v0] Supabase user ID fetched:", data.id)
          setSupabaseUserId(data.id)
        }
      } catch (error) {
        console.error("[v0] Error in fetchSupabaseUserId:", error)
      }
    }

    fetchSupabaseUserId()
  }, [user?.uid])

  useEffect(() => {
    if (!supabaseUserId) return

    const supabase = createClient()

    console.log("[v0] Setting up realtime subscription for invoices with user ID:", supabaseUserId)

    // Subscribe to changes on the invoices table
    const channel = supabase
      .channel("invoices-realtime")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "invoices",
          filter: `taxpayer_id=eq.${supabaseUserId}`, // Use Supabase database user ID
        },
        (payload) => {
          console.log("[v0] Invoice realtime update received:", payload.eventType)
          // Reload invoices and stats when data changes
          loadInvoices()
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
        (payload) => {
          console.log("[v0] Payment realtime update received:", payload.eventType)
          // Reload when payments change (affects invoice balances)
          loadInvoices()
          loadStats()
        },
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[v0] Successfully subscribed to invoice updates")
        } else if (status === "CHANNEL_ERROR") {
          console.error("[v0] Error subscribing to invoice updates:", err)
        } else if (status === "TIMED_OUT") {
          console.error("[v0] Subscription timed out")
        } else if (status === "CLOSED") {
          console.log("[v0] Subscription closed")
        }
      })

    // Cleanup subscription on unmount
    return () => {
      console.log("[v0] Unsubscribing from invoice updates")
      supabase.removeChannel(channel)
    }
  }, [supabaseUserId]) // Depend on supabaseUserId instead of user object

  const loadData = async () => {
    setLoadingData(true)
    await Promise.all([loadInvoices(), loadStats()])
    setLoadingData(false)
  }

  const loadInvoices = async () => {
    const filters: any = {}
    if (statusFilter !== "all") filters.status = statusFilter
    if (yearFilter !== "all") filters.taxYear = Number.parseInt(yearFilter)
    if (searchQuery) filters.searchQuery = searchQuery

    const result = await getTaxpayerInvoices(filters)
    if (result.success && result.data) {
      setInvoices(result.data)
    }
  }

  const loadStats = async () => {
    const result = await getInvoiceStats()
    if (result.success && result.data) {
      setStats(result.data)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleViewInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setModalOpen(true)
  }

  // Get unique years from invoices
  const availableYears = Array.from(new Set(invoices.map((inv) => inv.tax_year))).sort((a, b) => b - a)

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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 space-y-6">
                {/* Page Header */}
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                  <p className="text-muted-foreground">View and manage your property tax invoices</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                    <Card className="@container/card">
                      <CardHeader>
                        <CardDescription>Total Outstanding</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {formatCurrency(stats.totalOutstanding)}
                        </CardTitle>
                        <CardAction>
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">Amount due across all invoices</div>
                      </CardFooter>
                    </Card>

                    <Card className="@container/card">
                      <CardHeader>
                        <CardDescription>Overdue Invoices</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {stats.overdueCount}
                        </CardTitle>
                        <CardAction>
                          {stats.overdueCount > 0 ? (
                            <Badge variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <IconTrendingUp className="h-4 w-4" />
                            </Badge>
                          )}
                        </CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">
                          {stats.overdueCount > 0 ? "Requires immediate attention" : "All invoices up to date"}
                        </div>
                      </CardFooter>
                    </Card>

                    <Card className="@container/card">
                      <CardHeader>
                        <CardDescription>Paid This Year</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {formatCurrency(stats.totalPaidThisYear)}
                        </CardTitle>
                        <CardAction>
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">Total payments in {new Date().getFullYear()}</div>
                      </CardFooter>
                    </Card>

                    <Card className="@container/card">
                      <CardHeader>
                        <CardDescription>Next Due Date</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {stats.nextDueDate ? format(new Date(stats.nextDueDate), "MMM dd") : "None"}
                        </CardTitle>
                        <CardAction>
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        <div className="text-muted-foreground">
                          {stats.nextDueDate ? "Upcoming payment deadline" : "No pending invoices"}
                        </div>
                      </CardFooter>
                    </Card>
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 gap-2">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by invoice number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Tax Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Invoices Table */}
                <Card>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice Number</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Tax Year</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                          <TableHead className="text-right">Balance Due</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingData ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="flex items-center justify-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No invoices found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{invoice.property.registered_property_name}</p>
                                  <p className="text-xs text-muted-foreground">{invoice.property.property_type}</p>
                                </div>
                              </TableCell>
                              <TableCell>{invoice.tax_year}</TableCell>
                              <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(invoice.balance_due)}
                              </TableCell>
                              <TableCell>{format(new Date(invoice.due_date), "MMM dd, yyyy")}</TableCell>
                              <TableCell>
                                <InvoiceStatusBadge status={invoice.payment_status} dueDate={invoice.due_date} />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal invoiceId={selectedInvoiceId} open={modalOpen} onOpenChange={setModalOpen} />
    </SidebarProvider>
  )
}
