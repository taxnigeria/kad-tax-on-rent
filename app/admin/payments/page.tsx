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
import { Receipt, Search, Filter, Download, DollarSign, CheckCircle2, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createBrowserClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import type { users } from "@/types/users"

type Payment = {
  id: string
  invoice_id: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_method: string
  transaction_id: string | null
  verification_status: string
  verified_by: string | null
  verified_at: string | null
  notes: string | null
  created_at: string
  invoices: {
    id: string
    invoice_number: string
    tax_year: number
    tax_period: string
    total_amount: number
    property_id: string
    taxpayer_id: string
    properties: {
      id: string
      property_reference: string
      registered_property_name: string
      property_type: string
      owner: users
      taxpayer_profiles: Array<{
        kadirs_id: string
      }>
    }
  }
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
      fetchPayments()
    }
  }, [user, userRole])

  useEffect(() => {
    filterPayments()
  }, [searchQuery, statusFilter, methodFilter, payments])

  async function fetchPayments() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          *,
          invoices!inner (
            id,
            invoice_number,
            tax_year,
            tax_period,
            total_amount,
            property_id,
            taxpayer_id,
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
            )
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching payments:", error)
        setPayments([])
      } else {
        setPayments((data as any) || [])
      }
    } catch (error) {
      console.error("Error in fetchPayments:", error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  function filterPayments() {
    let filtered = payments

    if (searchQuery) {
      filtered = filtered.filter(
        (payment) =>
          payment.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.invoices?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.invoices?.properties?.registered_property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.invoices?.properties?.property_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.invoices?.properties?.owner?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.invoices?.properties?.owner?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.invoices?.properties?.owner?.taxpayer_profiles?.[0]?.kadirs_id
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.verification_status === statusFilter)
    }

    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.payment_method === methodFilter)
    }

    setFilteredPayments(filtered)
    setCurrentPage(1)
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedPayments(paginatedPayments.map((payment) => payment.id))
    } else {
      setSelectedPayments([])
    }
  }

  function handleSelectPayment(paymentId: string, checked: boolean) {
    if (checked) {
      setSelectedPayments([...selectedPayments, paymentId])
    } else {
      setSelectedPayments(selectedPayments.filter((id) => id !== paymentId))
    }
  }

  function handleExport() {
    console.log("Exporting payments:", selectedPayments.length > 0 ? selectedPayments : "all")
  }

  function handleViewPayment(payment: Payment) {
    setSelectedPayment(payment)
    setIsSheetOpen(true)
  }

  function handleDownloadReceipt(payment: Payment) {
    console.log("Download receipt:", payment.receipt_number)
  }

  function handlePrintReceipt(payment: Payment) {
    console.log("Print receipt:", payment.receipt_number)
  }

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex)

  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    verified: payments.filter((payment) => payment.verification_status === "verified").length,
    pending: payments.filter((payment) => payment.verification_status === "pending").length,
    failed: payments.filter((payment) => payment.verification_status === "failed").length,
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "verified":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  function getMethodBadge(method: string) {
    const colors: Record<string, string> = {
      bank_transfer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      card: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      cash: "bg-green-500/10 text-green-500 border-green-500/20",
      pos: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    }

    return (
      <Badge variant="outline" className={colors[method] || ""}>
        {method.replace("_", " ")}
      </Badge>
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
              <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
              <p className="text-muted-foreground mt-1">View and manage all payment transactions</p>
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
                  <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">All transactions</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Total received</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.verified}</div>
                  <p className="text-xs text-muted-foreground mt-1">Confirmed payments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
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
                    placeholder="Search by receipt, transaction ID, invoice, property, or taxpayer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedPayments.length > 0 && (
                    <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
                      <Download className="h-4 w-4" />
                      Export ({selectedPayments.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={paginatedPayments.length > 0 && selectedPayments.length === paginatedPayments.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Receipt Number</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Taxpayer</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
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
                            <Skeleton className="h-4 w-24" />
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
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-12">
                          <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {payments.length === 0 ? "No payments found." : "No payments match your search criteria."}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPayments.map((payment) => (
                        <TableRow
                          key={payment.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewPayment(payment)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedPayments.includes(payment.id)}
                              onCheckedChange={(checked) => handleSelectPayment(payment.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-medium">{payment.receipt_number}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {payment.invoices?.properties?.owner?.first_name}{" "}
                              {payment.invoices?.properties?.owner?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {payment.invoices?.properties?.owner?.taxpayer_profiles?.[0]?.kadirs_id || "No KADIRS ID"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {payment.invoices?.properties?.registered_property_name || "Unnamed Property"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {payment.invoices?.properties?.property_reference}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono">{payment.invoices?.invoice_number}</div>
                          </TableCell>
                          <TableCell className="font-bold">
                            ₦{(payment.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                          <TableCell>
                            <div className="font-mono text-xs">{payment.transaction_id || "N/A"}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.verification_status)}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleViewPayment(payment)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredPayments.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredPayments.length)} of{" "}
                    {filteredPayments.length} payments
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
        </div>
      </SidebarInset>

      {/* Payment Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedPayment && (
            <>
              <SheetHeader>
                <SheetTitle>Payment Details</SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Payment Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Payment Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receipt Number</span>
                      <span className="font-mono font-medium">{selectedPayment.receipt_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Date</span>
                      <span>{new Date(selectedPayment.payment_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold">
                        ₦{selectedPayment.amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span>{getMethodBadge(selectedPayment.payment_method)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-xs">{selectedPayment.transaction_id || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span>{getStatusBadge(selectedPayment.verification_status)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Invoice Details */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Invoice Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Number</span>
                      <span className="font-mono">{selectedPayment.invoices?.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Year</span>
                      <span>{selectedPayment.invoices?.tax_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Period</span>
                      <Badge variant="outline">{selectedPayment.invoices?.tax_period}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Total</span>
                      <span className="font-bold">
                        ₦{selectedPayment.invoices?.total_amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Property Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Property Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property Name</span>
                      <span className="font-medium">
                        {selectedPayment.invoices?.properties?.registered_property_name || "Unnamed Property"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property Reference</span>
                      <span className="font-mono">{selectedPayment.invoices?.properties?.property_reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property Type</span>
                      <Badge variant="outline">{selectedPayment.invoices?.properties?.property_type}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Taxpayer Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Taxpayer Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">
                        {selectedPayment.invoices?.properties?.owner?.first_name}{" "}
                        {selectedPayment.invoices?.properties?.owner?.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">KADIRS ID</span>
                      <span className="font-mono">
                        {selectedPayment.invoices?.properties?.owner?.taxpayer_profiles?.[0]?.kadirs_id ||
                          "No KADIRS ID"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{selectedPayment.invoices?.properties?.owner?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span>{selectedPayment.invoices?.properties?.owner?.phone_number || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {selectedPayment.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Notes</h3>
                      <p className="text-sm text-muted-foreground">{selectedPayment.notes}</p>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => handleDownloadReceipt(selectedPayment)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => handlePrintReceipt(selectedPayment)}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  )
}
