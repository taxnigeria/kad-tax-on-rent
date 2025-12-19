"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { TaxpayerHeader } from "@/components/taxpayer-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/utils/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Loader2, Search, Receipt } from "lucide-react"
import { PaymentDetailsSheet } from "@/components/taxpayer/payment-details-sheet"

interface Payment {
  id: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_method: string
  transaction_id: string
  verification_status: string
  invoice: {
    id: string
    invoice_number: string
    tax_period: string
    property: {
      registered_property_name: string
      property_reference: string
    }
  }
}

export default function PaymentsPage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()

  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Stats
  const totalPayments = payments.length
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const completedPayments = payments.filter((p) => p.verification_status === "verified").length

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["taxpayer", "property_manager"].includes(userRole)) {
        router.push("/dashboard")
      } else {
        loadPayments()
      }
    }
  }, [user, userRole, loading, router])

  useEffect(() => {
    // Filter payments based on search query
    if (searchQuery.trim() === "") {
      setFilteredPayments(payments)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = payments.filter(
        (payment) =>
          payment.receipt_number?.toLowerCase().includes(query) ||
          payment.invoice.invoice_number?.toLowerCase().includes(query) ||
          payment.invoice.property.registered_property_name?.toLowerCase().includes(query) ||
          payment.transaction_id?.toLowerCase().includes(query),
      )
      setFilteredPayments(filtered)
    }
  }, [searchQuery, payments])

  const loadPayments = async () => {
    if (!user) return

    try {
      const supabase = createBrowserClient()

      // Get user's database ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single()

      if (userError) throw userError

      // Fetch payments with invoice and property details
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          id,
          receipt_number,
          amount,
          payment_date,
          payment_method,
          transaction_id,
          verification_status,
          invoice:invoices (
            id,
            invoice_number,
            tax_period,
            property:properties (
              registered_property_name,
              property_reference
            )
          )
        `,
        )
        .eq("invoice.property.owner_id", userData.id)
        .order("payment_date", { ascending: false })

      if (error) throw error

      setPayments(data || [])
      setFilteredPayments(data || [])
    } catch (error) {
      console.error("Error loading payments:", error)
      toast.error("Failed to load payments")
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleRowClick = (paymentId: string) => {
    setSelectedPaymentId(paymentId)
    setIsSheetOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      verified: "default",
      pending: "secondary",
      rejected: "destructive",
      failed: "destructive",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status === "verified" ? "Completed" : status}
      </Badge>
    )
  }

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
                <Loader2 className="h-8 w-8 animate-spin" />
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
        {loadingPayments ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading payments...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  {/* Header */}
                  <div className="mb-6">
                    <h1 className="text-lg font-bold">Payment History</h1>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Payments</CardDescription>
                        <CardTitle className="text-2xl">{totalPayments}</CardTitle>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Amount Paid</CardDescription>
                        <CardTitle className="text-2xl">{formatCurrency(totalAmount)}</CardTitle>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Completed Payments</CardDescription>
                        <CardTitle className="text-2xl">{completedPayments}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by receipt number, invoice, property, or transaction ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Payments Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>All Payments</CardTitle>
                      <CardDescription>
                        {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""} found
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredPayments.length === 0 ? (
                        <div className="text-center py-12">
                          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No payments found</h3>
                          <p className="text-muted-foreground">
                            {searchQuery ? "Try adjusting your search" : "You haven't made any payments yet"}
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted hover:bg-muted">
                                <TableHead>Receipt Number</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredPayments.map((payment) => (
                                <TableRow
                                  key={payment.id}
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleRowClick(payment.id)}
                                >
                                  <TableCell className="font-mono font-semibold">{payment.receipt_number}</TableCell>
                                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                  <TableCell className="font-mono text-sm">{payment.invoice.invoice_number}</TableCell>
                                  <TableCell className="max-w-[200px] truncate">
                                    {payment.invoice.property.registered_property_name}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {payment.payment_method.replace("_", " ")}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {formatCurrency(payment.amount)}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(payment.verification_status)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
      <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />

      {/* Payment Details Sheet */}
      <PaymentDetailsSheet paymentId={selectedPaymentId} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </SidebarProvider>
  )
}
