"use client"
import { useEffect, useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  Download,
  Printer,
  CreditCard,
  AlertCircle,
  CheckCircle,
  ArrowDown,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { InvoicePrintDialog } from "@/components/invoice-print-dialog"

type TaxBillDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  calculationId: string | null
  onUpdate?: () => void
}

export function TaxBillDetailsSheet({ open, onOpenChange, calculationId, onUpdate }: TaxBillDetailsSheetProps) {
  const [calculation, setCalculation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (open && calculationId) {
      fetchCalculationDetails()
    }
  }, [open, calculationId])

  async function fetchCalculationDetails() {
    if (!calculationId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("tax_calculations")
        .select(
          `
          *,
          properties (
            id,
            registered_property_name,
            property_reference,
            property_type,
            total_annual_rent,
            street_name,
            house_number,
            addresses (
              city,
              state,
              lga
            ),
            owner:users!owner_id (
              first_name,
              middle_name,
              last_name,
              email,
              taxpayer_profiles (
                kadirs_id
              )
            )
          ),
          invoices (
            id,
            invoice_number,
            bill_reference,
            payment_status,
            total_amount,
            balance_due,
            amount_paid,
            issue_date,
            due_date,
            tax_period,
            narration
          )
        `,
        )
        .eq("id", calculationId)
        .single()

      if (error) {
        console.error("Error fetching calculation details:", error)
        toast({
          title: "Error",
          description: "Failed to load tax bill details",
          variant: "destructive",
        })
      } else {
        setCalculation(data)
      }
    } catch (error) {
      console.error("Error in fetchCalculationDetails:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!invoice?.bill_reference) {
      toast({
        title: "Invalid Invoice",
        description: "This invoice needs a bill reference before it can be downloaded. Please generate one first.",
        variant: "destructive",
      })
      return
    }
    if (invoice?.id) {
      setShowPrintDialog(true)
    } else {
      toast({
        title: "No Invoice Available",
        description: "An invoice has not been generated yet",
        variant: "destructive",
      })
    }
  }

  function handlePrint() {
    if (!invoice?.bill_reference) {
      toast({
        title: "Invalid Invoice",
        description: "This invoice needs a bill reference before it can be printed. Please generate one first.",
        variant: "destructive",
      })
      return
    }
    if (invoice?.id) {
      setShowPrintDialog(true)
    } else {
      toast({
        title: "No Invoice Available",
        description: "An invoice has not been generated yet",
        variant: "destructive",
      })
    }
  }

  function handlePayNow() {
    if (!invoice?.bill_reference) {
      toast({
        title: "Invalid Invoice",
        description: "This invoice needs a bill reference before payment can be processed. Please contact support.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Payment",
      description: "Redirecting to payment gateway...",
    })
    // TODO: Implement payment logic
  }

  async function handleGenerateBillReference() {
    if (!invoice?.id) return

    setLoading(true)
    try {
      const response = await fetch("/api/generate-bill-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Bill Reference Generated",
          description: `Bill Reference: ${result.billReference}`,
        })
        await fetchCalculationDetails()
        if (onUpdate) onUpdate()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate bill reference",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating bill reference:", error)
      toast({
        title: "Error",
        description: "Failed to generate bill reference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { label: string; className: string; icon: any }> = {
      paid: {
        label: "Paid",
        className: "bg-green-500/10 text-green-500 border-green-500/20",
        icon: CheckCircle,
      },
      unpaid: {
        label: "Unpaid",
        className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        icon: AlertCircle,
      },
      overdue: {
        label: "Overdue",
        className: "bg-red-500/10 text-red-500 border-red-500/20",
        icon: AlertCircle,
      },
      partial: {
        label: "Partial",
        className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        icon: AlertCircle,
      },
    }
    const variant = variants[status] || variants.unpaid
    const Icon = variant.icon
    return (
      <Badge variant="outline" className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    )
  }

  const invoice = calculation?.invoices?.[0]
  const property = calculation?.properties
  const owner = property?.owner
  const isBacklog = calculation?.backlog_years && calculation.backlog_years > 0

  const invoiceData =
    invoice && calculation
      ? {
          invoiceNumber: invoice.invoice_number,
          date: new Date(invoice.issue_date).toLocaleDateString(),
          clientName: `${owner?.first_name || ""} ${owner?.middle_name || ""} ${owner?.last_name || ""}`.trim(),
          propertyName: property?.registered_property_name || "Unnamed Property",
          clientPhone: owner?.email || "—",
          areaOffice: "Kaduna State Internal Revenue Service",
          recipientAddress: property?.addresses?.[0]
            ? `${property.street_name || ""} ${property.house_number || ""}, ${property.addresses[0].city || ""}, ${property.addresses[0].state || ""}`.trim()
            : "—",
          assessmentYear: calculation.tax_year,
          actualAmount: calculation.base_tax_amount || 0,
          arrears: calculation.backlog_tax_amount || 0,
          stampDuty: 0,
          penalties: calculation.penalty_amount || 0,
          interest: calculation.interest_amount || 0,
          totalOutstanding: invoice.total_amount || 0,
          officerName: "Tax Officer",
          items: [
            {
              description: `Withholding Tax on Rent (${calculation.tax_year})`,
              amount: calculation.base_tax_amount || 0,
            },
            ...(calculation.backlog_tax_amount > 0
              ? [
                  {
                    description: `Backlog Tax (${calculation.backlog_years} years)`,
                    amount: calculation.backlog_tax_amount,
                  },
                ]
              : []),
            ...(calculation.penalty_amount > 0
              ? [{ description: "Penalties (10%)", amount: calculation.penalty_amount }]
              : []),
            ...(calculation.interest_amount > 0
              ? [{ description: "Interest (27%)", amount: calculation.interest_amount }]
              : []),
          ],
          discount: 0,
          total: invoice.total_amount || 0,
          paymentReference: invoice.invoice_number,
        }
      : null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : calculation ? (
            <div className="space-y-6 mt-6 mb-6 px-6">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold">Tax Bill Details</h2>
                    <p className="text-sm text-muted-foreground font-mono mt-1">
                      {invoice?.invoice_number || "No invoice generated"}
                    </p>
                  </div>
                  {invoice && getStatusBadge(invoice.payment_status)}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {!invoice?.bill_reference ? (
                    <Button onClick={handleGenerateBillReference} disabled={loading} className="gap-2">
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      Generate Bill Reference
                    </Button>
                  ) : (
                    <>
                      {invoice?.payment_status !== "paid" && (
                        <Button onClick={handlePayNow} className="gap-2">
                          <CreditCard className="h-4 w-4" />
                          Pay Now
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleDownload} className="gap-2 bg-transparent">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" onClick={handlePrint} className="gap-2 bg-transparent">
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Property Context */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Property Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Property Name</div>
                    <div className="font-medium">{property?.registered_property_name || "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Reference</div>
                    <div className="font-mono text-xs">{property?.property_reference || "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Owner</div>
                    <div>
                      {owner?.first_name} {owner?.middle_name} {owner?.last_name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">KADIRS ID</div>
                    <div className="font-mono text-xs">{owner?.taxpayer_profiles?.[0]?.kadirs_id || "—"}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tax Calculation Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Tax Calculation
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {calculation.tax_year}
                    </Badge>
                    {isBacklog && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                        Backlog ({calculation.backlog_years} years)
                      </Badge>
                    )}
                  </div>
                </div>

                <Card className="border-border/50">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Annual Rent</span>
                      <span className="font-medium">₦{Number(property?.total_annual_rent || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Base Tax Amount</span>
                      <span className="font-medium">₦{Number(calculation.base_tax_amount || 0).toLocaleString()}</span>
                    </div>

                    {isBacklog && calculation.backlog_tax_amount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Backlog Tax ({calculation.backlog_years} years)</span>
                        <span className="font-medium">
                          ₦{Number(calculation.backlog_tax_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {calculation.penalty_amount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Penalties</span>
                        <span className="font-medium text-red-500">
                          ₦{Number(calculation.penalty_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {calculation.interest_amount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Interest</span>
                        <span className="font-medium text-red-500">
                          ₦{Number(calculation.interest_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Tax Due</span>
                      <span className="text-xl font-bold">
                        ₦{Number(calculation.total_tax_due || 0).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visual Flow Indicator */}
              {invoice && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-px w-12 bg-border" />
                    <ArrowDown className="h-4 w-4" />
                    <div className="h-px w-12 bg-border" />
                  </div>
                </div>
              )}

              {/* Invoice Section */}
              {invoice ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Invoice Details
                  </h3>

                  <Card className="border-border/50">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bill Reference</span>
                        {invoice.bill_reference ? (
                          <span className="font-mono text-xs font-semibold text-green-600">
                            {invoice.bill_reference}
                          </span>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            Not Generated
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Invoice Number</span>
                        <span className="font-mono text-xs">{invoice.invoice_number}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tax Period</span>
                        <span className="font-medium">{invoice.tax_period}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Issue Date</span>
                        <span>{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "—"}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Due Date</span>
                        <span>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}</span>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span className="font-semibold">₦{Number(invoice.total_amount || 0).toLocaleString()}</span>
                      </div>

                      {invoice.amount_paid > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Amount Paid</span>
                          <span className="font-medium text-green-500">
                            ₦{Number(invoice.amount_paid || 0).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {invoice.payment_status !== "paid" && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Balance Due</span>
                            <span className="text-xl font-bold text-red-500">
                              ₦{Number(invoice.balance_due || 0).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}

                      {invoice.payment_status === "paid" && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">Fully Paid</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {invoice.narration && (
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-sm">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{invoice.narration}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-sm font-semibold mb-1">No Invoice Generated</h3>
                    <p className="text-xs text-muted-foreground text-center">
                      An invoice has not been generated for this tax calculation yet.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Calculation Dates */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Calculation Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Calculated On</div>
                    <div>{new Date(calculation.created_at).toLocaleDateString()}</div>
                  </div>
                  {isBacklog && (
                    <>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Backlog Period</div>
                        <div>
                          {new Date(calculation.backlog_start_date).toLocaleDateString()} -{" "}
                          {new Date(calculation.backlog_end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No tax bill selected</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Print Dialog */}
      {invoiceData && (
        <InvoicePrintDialog open={showPrintDialog} onOpenChange={setShowPrintDialog} invoiceData={invoiceData} />
      )}
    </>
  )
}
