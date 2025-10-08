"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@/utils/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Download, Printer, Loader2, FileText } from "lucide-react"

interface PaymentDetails {
  id: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_method: string
  transaction_id: string
  status: string
  invoice: {
    id: string
    invoice_number: string
    tax_period: string
    total_amount: number
    property: {
      id: string
      registered_property_name: string
      property_reference: string
      street_name: string
      house_number: string
      owner: {
        first_name: string
        last_name: string
        email: string
        phone_number: string
      }
    }
  }
}

interface PaymentDetailsSheetProps {
  paymentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentDetailsSheet({ paymentId, open, onOpenChange }: PaymentDetailsSheetProps) {
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (paymentId && open) {
      loadPaymentDetails()
    }
  }, [paymentId, open])

  const loadPaymentDetails = async () => {
    if (!paymentId) return

    setLoading(true)
    try {
      const supabase = createBrowserClient()

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
          status,
          invoice:invoices (
            id,
            invoice_number,
            tax_period,
            total_amount,
            property:properties (
              id,
              registered_property_name,
              property_reference,
              street_name,
              house_number,
              owner:users!owner_id (
                first_name,
                last_name,
                email,
                phone_number
              )
            )
          )
        `,
        )
        .eq("id", paymentId)
        .single()

      if (error) throw error

      setPayment(data)
    } catch (error) {
      console.error("Error loading payment details:", error)
      toast.error("Failed to load payment details")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    toast.info("Print functionality - Receipt preview coming soon!")
    // Will trigger print when receipt is ready
  }

  const handleDownload = () => {
    toast.info("Download functionality - Receipt preview coming soon!")
    // Will download PDF when receipt is ready
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : payment ? (
          <div className="space-y-6">
            {/* Header */}
            <SheetHeader>
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-2xl">Payment Receipt</SheetTitle>
                  <p className="text-sm text-muted-foreground mt-1">Receipt #{payment.receipt_number}</p>
                </div>
                {getStatusBadge(payment.status)}
              </div>
            </SheetHeader>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm" className="flex-1 bg-transparent">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm" className="flex-1 bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            <Separator />

            {/* Receipt Preview Placeholder */}
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Receipt Preview</h3>
              <p className="text-sm text-muted-foreground">Printable receipt preview will be displayed here</p>
            </div>

            <Separator />

            {/* Payment Information */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Receipt Number</p>
                    <p className="font-mono font-semibold">{payment.receipt_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Date</p>
                    <p className="font-semibold">{new Date(payment.payment_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-semibold capitalize">{payment.payment_method.replace("_", " ")}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm">{payment.transaction_id}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Invoice Information */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Invoice Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-mono font-semibold">{payment.invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Period</p>
                    <p className="font-semibold">{payment.invoice.tax_period}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Invoice Total</p>
                    <p className="font-semibold">{formatCurrency(payment.invoice.total_amount)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Property Information */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Property Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Property Name</p>
                    <p className="font-semibold">{payment.invoice.property.registered_property_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Property Reference</p>
                    <p className="font-mono">{payment.invoice.property.property_reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p>
                      {payment.invoice.property.house_number} {payment.invoice.property.street_name}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Taxpayer Information */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Taxpayer Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">
                      {payment.invoice.property.owner.first_name} {payment.invoice.property.owner.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{payment.invoice.property.owner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p>{payment.invoice.property.owner.phone_number}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No payment selected</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
