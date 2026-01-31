"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Filter, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInvoices } from "@/app/actions/invoices"
import { Skeleton } from "@/components/ui/skeleton"
import TaxCalculationDetailsSheet from "@/components/admin/tax-calculation-details-sheet"
import TaxpayerDetailsSheet from "@/components/admin/taxpayer-details-sheet" // Added import for TaxpayerDetailsSheet
import type { users } from "@/types/users"

type Invoice = {
  id: string
  invoice_number: string
  bill_reference: string // Added bill_reference
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
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all")
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [sortField, setSortField] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false)
  const [selectedCalculationId, setSelectedCalculationId] = useState<string | null>(null)
  const [taxpayerDetailsOpen, setTaxpayerDetailsOpen] = useState(false)
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<string | null>(null)

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
      const handler = setTimeout(() => {
        fetchInvoices()
      }, 300)
      return () => clearTimeout(handler)
    }
  }, [user, userRole, searchQuery, statusFilter, yearFilter, propertyTypeFilter, currentPage, rowsPerPage, sortField, sortOrder])

  async function fetchInvoices() {
    try {
      setLoading(true)
      const { invoices: data, totalCount: count, error } = await getInvoices({
        page: currentPage,
        pageSize: rowsPerPage,
        search: searchQuery,
        status: statusFilter,
        taxYear: yearFilter,
        propertyType: propertyTypeFilter,
        sortField,
        sortOrder
      })

      if (error) {
        console.error("Error fetching invoices:", error)
        setInvoices([])
        setTotalCount(0)
      } else {
        setInvoices((data as any) || [])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error("Error in fetchInvoices:", error)
      setInvoices([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="ml-1 text-muted-foreground opacity-30">↕</span>
    return <span className="ml-1 text-primary">{sortOrder === "asc" ? "↑" : "↓"}</span>
  }

  const getRelativeDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays === -1) return "Yesterday"

    if (Math.abs(diffDays) < 30) {
      return `${Math.abs(diffDays)}d ${diffDays < 0 ? 'ago' : 'left'}`
    }

    const diffMonths = Math.floor(Math.abs(diffDays) / 30)
    if (diffMonths < 12) {
      return `${diffMonths}m ${diffDays < 0 ? 'ago' : 'left'}`
    }

    const diffYears = Math.floor(diffMonths / 12)
    return `${diffYears}y ${diffDays < 0 ? 'ago' : 'left'}`
  }


  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedInvoices(invoices.map((inv) => inv.id))
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

  function handleViewInvoice(invoice: Invoice) {
    setSelectedCalculationId(invoice.tax_calculation_id)
    setDetailsSheetOpen(true)
  }

  function handleOpenTaxpayerDetails(taxpayerId: string | null) {
    setSelectedTaxpayerId(taxpayerId)
    setTaxpayerDetailsOpen(true)
  }

  const totalPages = Math.ceil(totalCount / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + invoices.length

  const availableYears = Array.from(new Set(invoices.map((inv) => inv.tax_year))).sort((a, b) => b - a)

  const stats = {
    total: totalCount,
    totalAmount: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    totalPaid: invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0),
    totalOutstanding: invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0),
    paid: invoices.filter((inv) => inv.payment_status === "paid").length,
    unpaid: invoices.filter((inv) => inv.payment_status === "unpaid").length,
    partiallyPaid: invoices.filter((inv) => inv.payment_status === "partially_paid").length,
    overdue: invoices.filter((inv) => inv.payment_status !== "paid" && new Date(inv.due_date) < new Date()).length,
  }

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Authenticating...</p>
        </div>
      </div>
    )
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
            <div className="grid gap-3 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="py-3 px-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-5 w-16" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-4">
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Invoices</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-bold text-blue-600">
                      ₦{stats.totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-bold text-green-600">
                      ₦{stats.totalPaid.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
                    <p className="text-lg font-bold text-red-600">
                      ₦{stats.totalOutstanding.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, property, owner, or KADIRS ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
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
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Year" />
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
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted font-bold text-xs uppercase">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={invoices.length > 0 && selectedInvoices.length === invoices.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-12">SN</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("bill_reference")}>
                        Bill Ref <SortIcon field="bill_reference" />
                      </TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("tax_year")}>
                        Period <SortIcon field="tax_year" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("issue_date")}>
                        Issued <SortIcon field="issue_date" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("due_date")}>
                        Due <SortIcon field="due_date" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("total_amount")}>
                        Amount <SortIcon field="total_amount" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("payment_status")}>
                        Status <SortIcon field="payment_status" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {totalCount === 0 ? "No invoices found." : "No invoices match your search criteria."}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice, index) => (
                        <TableRow
                          key={invoice.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-medium text-xs">
                              {invoice.bill_reference || invoice.invoice_number}
                            </div>
                            {invoice.tax_calculations?.backlog_years && (
                              <Badge variant="outline" className="mt-1 text-[9px] h-4">
                                Backlog
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold capitalize text-sm">
                              {invoice.properties?.registered_property_name || "Unnamed Property"}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {invoice.properties?.property_reference}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold capitalize text-sm">
                              {invoice.properties?.owner?.first_name} {invoice.properties?.owner?.last_name}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {invoice.properties?.owner?.taxpayer_profiles?.[0]?.kadirs_id || "No KADIRS ID"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {invoice.tax_period}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-semibold text-primary">
                              {getRelativeDate(invoice.due_date)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-sm">
                            ₦{(invoice.total_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 ${invoice.payment_status === "paid"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : invoice.payment_status === "partially_paid"
                                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                  : "bg-red-500/10 text-red-500 border-red-500/20"
                                }`}
                            >
                              {invoice.payment_status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {invoices.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of{" "}
                    {totalCount} invoices
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
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="150">150</SelectItem>
                          <SelectItem value="200">200</SelectItem>
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

          {/* Tax Calculation Details Sheet */}
          <TaxCalculationDetailsSheet
            open={detailsSheetOpen}
            onOpenChange={setDetailsSheetOpen}
            calculationId={selectedCalculationId}
            onUpdate={fetchInvoices}
            onOpenTaxpayerDetails={handleOpenTaxpayerDetails}
          />

          {/* Taxpayer Details Sheet */}
          <TaxpayerDetailsSheet
            taxpayerId={selectedTaxpayerId}
            open={taxpayerDetailsOpen}
            onOpenChange={setTaxpayerDetailsOpen}
            onUpdate={fetchInvoices}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
