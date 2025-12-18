"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { DollarSign, Loader2, Mail, Download, Printer } from "lucide-react"

type InvoiceDetailsSheetProps = {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

type Invoice = {
  id: string
  invoice_number: string
  taxpayer_id: string
  property_id: string | null
  issue_date: string
  due_date: string
  base_amount: number
  tax_amount: number
  penalty: number
  interest: number
  discount: number
  total_amount: number
  balance_due: number
  amount_paid: number
  payment_status: string
  tax_year: number
  tax_period: string
  narration: string
  payment_url: any
  paykaduna_invoice_id: string
  paykaduna_invoice_code: string
  paykaduna_payment_link: string
  created_at: string
  updated_at: string
}

export function InvoiceDetailsSheet({ invoiceId, open, onOpenChange, onUpdate }: InvoiceDetailsSheetProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails()
    }
  }, [open, invoiceId])

  async function fetchInvoiceDetails() {
    if (!invoiceId) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("invoices").select("*").eq("id", invoiceId).single()

      if (error) {
        console.error("Error fetching invoice details:", error)
        toast.error("Failed to load invoice details")
      } else {
        setInvoice(data)
      }
    } catch (error) {
      console.error("Error in fetchInvoiceDetails:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "overdue":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "partial":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {loading ? (
          <div className="space-y-6 mt-6 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invoice ? (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <SheetTitle className="flex items-center gap-3 flex-wrap">
                    {invoice.invoice_number}
                    <Badge variant="outline" className={`capitalize ${getPaymentStatusColor(invoice.payment_status)}`}>
                      {invoice.payment_status}
                    </Badge>
                  </SheetTitle>
                  <SheetDescription>Tax Year {invoice.tax_year}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6 mt-6 mb-6 px-6">
              {/* Dates */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="gap-0 py-0">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Issue Date</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-4">
                    <div className="font-semibold">{new Date(invoice.issue_date).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
                <Card className="gap-0 py-0">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Due Date</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-4">
                    <div className="font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
                <Card className="gap-0 py-0">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Tax Period</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-4">
                    <div className="font-semibold">{invoice.tax_period}</div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Amount Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Amount Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Amount</span>
                    <span className="font-medium">₦{Number(invoice.base_amount).toLocaleString()}</span>
                  </div>
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Amount</span>
                      <span className="font-medium">₦{Number(invoice.tax_amount).toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.penalty > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Penalty</span>
                      <span className="font-medium text-red-600">₦{Number(invoice.penalty).toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.interest > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest</span>
                      <span className="font-medium text-red-600">₦{Number(invoice.interest).toLocaleString()}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium text-green-600">-₦{Number(invoice.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-lg">₦{Number(invoice.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Amount Paid</div>
                    <div className="font-medium">₦{Number(invoice.amount_paid).toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Balance Due</div>
                    <div className={`font-medium ${invoice.balance_due > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₦{Number(invoice.balance_due).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {invoice.narration && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Notes</h3>
                    <p className="text-sm text-muted-foreground">{invoice.narration}</p>
                  </div>
                </>
              )}

              {invoice.paykaduna_invoice_code && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">PayKaduna Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Invoice Code</div>
                        <div className="font-mono text-xs bg-muted p-2 rounded">{invoice.paykaduna_invoice_code}</div>
                      </div>
                      {invoice.paykaduna_invoice_id && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Invoice ID</div>
                          <div className="font-mono text-xs bg-muted p-2 rounded">{invoice.paykaduna_invoice_id}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4">
                {invoice.payment_url && (
                  <Button variant="outline" className="flex-1 gap-2 bg-transparent" asChild>
                    <a href={invoice.payment_url} target="_blank" rel="noopener noreferrer">
                      <DollarSign className="h-4 w-4" />
                      Pay Invoice
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="gap-2 bg-transparent" disabled>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent" disabled>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Mail className="h-12 w-12 mb-2" />
            <p>No invoice selected</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
