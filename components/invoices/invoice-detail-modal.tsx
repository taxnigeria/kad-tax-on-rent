"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Download, FileText, Loader2 } from "lucide-react"
import { getInvoiceDetails, downloadInvoicePDF } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { InvoiceStatusBadge } from "./invoice-status-badge"
import { useToast } from "@/hooks/use-toast"

interface InvoiceDetailModalProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceDetailModal({ invoiceId, open, onOpenChange }: InvoiceDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [invoice, setInvoice] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open && invoiceId) {
      loadInvoiceDetails()
    }
  }, [open, invoiceId])

  const loadInvoiceDetails = async () => {
    if (!invoiceId) return

    setLoading(true)
    const result = await getInvoiceDetails(invoiceId)

    if (result.success && result.data) {
      setInvoice(result.data.invoice)
      setPayments(result.data.payments)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load invoice details",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const handleDownloadPDF = async () => {
    if (!invoiceId) return

    setDownloading(true)
    const result = await downloadInvoicePDF(invoiceId)

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      })
    }
    setDownloading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details
          </DialogTitle>
          <DialogDescription>Complete invoice information and payment history</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invoice ? (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{invoice.invoice_number}</h3>
                <p className="text-sm text-muted-foreground">Bill Ref: {invoice.bill_reference}</p>
              </div>
              <InvoiceStatusBadge status={invoice.payment_status} dueDate={invoice.due_date} />
            </div>

            {/* Property Information */}
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium">Property Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Property Name</p>
                  <p className="font-medium">{invoice.property.registered_property_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Property Reference</p>
                  <p className="font-medium">{invoice.property.property_reference}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Property Type</p>
                  <p className="font-medium">{invoice.property.property_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax Year</p>
                  <p className="font-medium">{invoice.tax_year}</p>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Amount Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Amount</span>
                  <span>{formatCurrency(invoice.base_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stamp Duty</span>
                  <span>{formatCurrency(invoice.stamp_duty)}</span>
                </div>
                {invoice.penalty > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Penalty</span>
                    <span>{formatCurrency(invoice.penalty)}</span>
                  </div>
                )}
                {invoice.interest > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Interest</span>
                    <span>{formatCurrency(invoice.interest)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
                {invoice.amount_paid > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>{formatCurrency(invoice.amount_paid)}</span>
                  </div>
                )}
                {invoice.balance_due > 0 && (
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Balance Due</span>
                    <span>{formatCurrency(invoice.balance_due)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Issue Date</p>
                <p className="font-medium">{format(new Date(invoice.issue_date), "MMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Due Date</p>
                <p className="font-medium">{format(new Date(invoice.due_date), "MMM dd, yyyy")}</p>
              </div>
              {invoice.paid_date && (
                <div>
                  <p className="text-muted-foreground">Paid Date</p>
                  <p className="font-medium">{format(new Date(invoice.paid_date), "MMM dd, yyyy")}</p>
                </div>
              )}
            </div>

            {/* Narration */}
            {invoice.narration && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{invoice.narration}</p>
              </div>
            )}

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">Payment History</h4>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(payment.payment_date), "MMM dd, yyyy")} • {payment.payment_method}
                        </p>
                      </div>
                      <Badge variant="outline">{payment.verification_status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadPDF}
                disabled={downloading}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              {invoice.balance_due > 0 && <Button className="flex-1">Make Payment</Button>}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No invoice data available</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
