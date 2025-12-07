"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Filter, Download, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createBrowserClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal"
import type { users } from "@/types/users"

type Invoice = {
  id: string
  invoice_number: string
  tax_calculation_id: string
  property_id: string
  taxpayer_id: string
  tax_year: number
  tax_period: string
  base_amount: number
  penalty: number
  interest: number
  discount: number
  stamp_duty: number
  total_amount: number
  amount_paid: number
  balance_due: number
  payment_status: string
  issue_date: string
  due_date: string
  paid_date: string | null
  narration: string
  created_at: string
  properties: {
    id: string
    property_reference: string
    registered_property_name: string
    property_type: string
    owner: users // Corrected type
    taxpayer_profiles: Array<{
      kadirs_id: string
    }>
  }
  tax_calculations: {
    id: string
    tax_year: number
    backlog_years: number | null
  }
}

export default function AdminInvoicesPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all")
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  const supabase = createBrowserClient()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["admin", "super_admin", "staff"].includes(userRole)) {
        router.push("/taxpayer-dashboard")
      }
    }
  }, [user, userRole, authLoading, router])

  useEffect(() => {
    if (user && userRole && ["admin", "super_admin", "staff"].includes(userRole)) {
      fetchInvoices()
    }
  }, [user, userRole])

  useEffect(() => {
    filterInvoices()
  }, [searchQuery, statusFilter, yearFilter, propertyTypeFilter, invoices])

  async function fetchInvoices() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          properties!inner (
            id,
            property_reference,
            registered_property_name,
            property_type,
            owner:users!owner_id (
              first_name,
              last_name,
              email,
              phone_number,
              taxpayer_profiles (
                kadirs_id
              )
            )
          ),
          tax_calculations (
            id,
            tax_year,
            backlog_years
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching invoices:", error)
        setInvoices([])
      } else {
        setInvoices((data as any) || [])
      }
    } catch (error) {
      console.error("Error in fetchInvoices:", error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  function filterInvoices() {
    let filtered = invoices

    if (searchQuery) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.properties?.registered_property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.properties?.property_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.properties?.owner?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.properties?.owner?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.properties?.owner?.taxpayer_profiles?.[0]?.kadirs_id?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.payment_status === statusFilter)
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((inv) => inv.tax_year?.toString() === yearFilter)
    }

    if (propertyTypeFilter !== "all") {
      filtered = filtered.filter((inv) => inv.properties?.property_type === propertyTypeFilter)
    }

    setFilteredInvoices(filtered)
    setCurrentPage(1)
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedInvoices(paginatedInvoices.map((inv) => inv.id))
    } else {
      setSelectedInvoices([])
    }
  }

  function handleSelectInvoice(invId: string, checked: boolean) {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invId])
    } else {
      setSelectedInvoices(selectedInvoices.filter((id) => id !== invId))
    }
  }

  function handleExport() {
    console.log("Exporting invoices:", selectedInvoices.length > 0 ? selectedInvoices : "all")
  }

  function handleViewInvoice(invId: string) {
    setSelectedInvoiceId(invId)
    setDetailsModalOpen(true)
  }

  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

  const availableYears = Array.from(new Set(invoices.map((inv) => inv.tax_year))).sort((a, b) => b - a)

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    totalPaid: invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0),
    totalOutstanding: invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0),
    paid: invoices.filter((inv) => inv.payment_status === "paid").length,
    unpaid: invoices.filter((inv) => inv.payment_status === "unpaid").length,
    partiallyPaid: invoices.filter((inv) => inv.payment_status === "partially_paid").length,
    overdue: invoices.filter((inv) => inv.payment_status !== "paid" && new Date(inv.due_date) < new Date()).length,
  }

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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Invoices</h1>
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">All invoices generated</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦{stats.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Combined invoice value</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦{stats.totalPaid.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stats.paid} invoices paid</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦{stats.totalOutstanding.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stats.overdue} overdue</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-3">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice number, property, owner, or KADIRS ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[140px]">
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

                  <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedInvoices.length > 0 && (
                    <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
                      <Download className="h-4 w-4" />
                      Export ({selectedInvoices.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={paginatedInvoices.length > 0 && selectedInvoices.length === paginatedInvoices.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Tax Period</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-12">
                          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {invoices.length === 0 ? "No invoices found." : "No invoices match your search criteria."}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-medium">{invoice.invoice_number}</div>
                            {invoice.tax_calculations?.backlog_years && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Backlog
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {invoice.properties?.registered_property_name || "Unnamed Property"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {invoice.properties?.property_reference}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {invoice.properties?.owner?.first_name} {invoice.properties?.owner?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {invoice.properties?.owner?.taxpayer_profiles?.[0]?.kadirs_id || "No KADIRS ID"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {invoice.tax_period}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}
                            </div>
                            {invoice.payment_status !== "paid" &&
                              invoice.due_date &&
                              new Date(invoice.due_date) < new Date() && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  Overdue
                                </Badge>
                              )}
                          </TableCell>
                          <TableCell className="font-bold">
                            ₦{(invoice.total_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            ₦{(invoice.amount_paid || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                invoice.payment_status === "paid"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : invoice.payment_status === "partially_paid"
                                    ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                              }
                            >
                              {invoice.payment_status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice.id)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredInvoices.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of{" "}
                    {filteredInvoices.length} invoices
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Rows per page</span>
                      <Select
                        value={rowsPerPage.toString()}
                        onValueChange={(value) => {
                          setRowsPerPage(Number(value))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Detail Modal */}
          {selectedInvoiceId && (
            <InvoiceDetailModal
              invoiceId={selectedInvoiceId}
              isOpen={detailsModalOpen}
              onClose={() => setDetailsModalOpen(false)}
            />
          )}
        </div>
      </SidebarInset>

      <InvoiceDetailModal invoiceId={selectedInvoiceId} open={detailsModalOpen} onOpenChange={setDetailsModalOpen} />
    </SidebarProvider>
  )
}
