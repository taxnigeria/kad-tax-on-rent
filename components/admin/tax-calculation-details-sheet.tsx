"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Calculator,
  FileText,
  Loader2,
  Building2,
  User,
  Calendar,
  Download,
  Printer,
  Trash2,
  FilePlus,
  ArrowDown,
  AlertCircle,
} from "lucide-react"
import { toast as sonnerToast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { InvoicePrintDialog } from "@/components/invoice-print-dialog"
import { createInvoiceFromTaxCalculation } from "@/app/actions/invoices"

type TaxCalculationDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  calculationId?: string | null
  onUpdate: () => void
  setDetailsSheetOpen?: (open: boolean) => void
  onOpenTaxpayerDetails?: (taxpayerId: string | null) => void
  taxCalculationId?: string | null
}

export function TaxCalculationDetailsSheet({
  open,
  onOpenChange,
  calculationId,
  taxCalculationId,
  onUpdate,
  setDetailsSheetOpen,
  onOpenTaxpayerDetails,
}: TaxCalculationDetailsSheetProps) {
  const [calculation, setCalculation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const supabase = createClient()

  const actualCalculationId = calculationId || taxCalculationId

  useEffect(() => {
    if (open && actualCalculationId) {
      fetchCalculationDetails()
    }
  }, [open, actualCalculationId])

  async function fetchCalculationDetails() {
    if (!actualCalculationId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tax_calculations')
        .select(`
          *,
          property:properties!inner(
            id,
            property_reference,
            registered_property_name,
            street_name,
            house_number,
            property_type,
            property_category,
            total_annual_rent,
            rental_commencement_date,
            area_office_id,
            owner_id,
            owner:users!properties_owner_id_fkey(
              id,
              first_name,
              middle_name,
              last_name,
              email,
              phone_number,
              taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey(
                kadirs_id,
                tax_id_or_nin
              )
            ),
            area_office:area_offices!properties_area_office_id_fkey(
              id,
              office_name,
              address,
              area_officer_id,
              area_officer:users!area_offices_area_officer_id_fkey(
                first_name,
                last_name
              )
            ),
            address:addresses(
              street_address,
              city,
              state,
              lga
            )
          ),
          invoices(
            id,
            invoice_number,
            bill_reference,
            total_amount,
            base_amount,
            penalty,
            interest,
            discount,
            stamp_duty,
            balance_due,
            amount_paid,
            payment_status,
            issue_date,
            due_date,
            created_at
          )
        `)
        .eq('id', actualCalculationId)
        .maybeSingle();

      if (error) {
        console.error("[v0] Error fetching tax calculation:", error)
        sonnerToast.error("Failed to load calculation details")
      } else {
        setCalculation(data)
      }
    } catch (error) {
      console.error("[v0] Error in fetchCalculationDetails:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateInvoice() {
    if (!calculation) return

    const loadingToast = sonnerToast.loading("Generating invoice from tax calculation...")

    try {
      const result = await createInvoiceFromTaxCalculation(calculation.id)

      if (result.success) {
        sonnerToast.dismiss(loadingToast)
        sonnerToast.success("Invoice generated successfully!", {
          description: `Bill Reference: ${result.billReference || "Pending"}`,
        })
        // Refresh to show updated invoice
        setTimeout(() => {
          onUpdate?.()
        }, 1500)
      } else {
        sonnerToast.dismiss(loadingToast)
        sonnerToast.error(result.error || "Failed to generate invoice")
      }
    } catch (error) {
      sonnerToast.dismiss(loadingToast)
      sonnerToast.error("Error generating invoice")
    }
  }

  async function handleDeleteCalculation() {
    if (!calculation) return

    setDeleting(true)
    try {
      const invoice = calculation?.invoices?.[0]

      if (invoice?.id) {
        const { error: invoiceError } = await supabase.from("invoices").delete().eq("id", invoice.id)

        if (invoiceError) {
          console.error("Error deleting invoice:", invoiceError)
          sonnerToast.error("Failed to delete invoice. Please try again.")
          setDeleting(false)
          return
        }
      }

      const { error: calcError } = await supabase.from("tax_calculations").delete().eq("id", actualCalculationId)

      if (calcError) {
        console.error("Error deleting tax calculation:", calcError)
        sonnerToast.error("Failed to delete tax calculation. Please try again.")
        setDeleting(false)
        return
      }

      sonnerToast.success(
        invoice?.id ? "Tax calculation and invoice deleted successfully" : "Tax calculation deleted successfully",
      )

      onOpenChange(false)
      onUpdate()
    } catch (error) {
      console.error("Error in handleDeleteCalculation:", error)
      sonnerToast.error("An unexpected error occurred")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  async function handlePrint() {
    if (!calculation) return

    const invoice = calculation?.invoices?.[0]

    if (invoice?.id) {
      setShowPrintDialog(true)
    } else {
      sonnerToast.error("Please generate an invoice first before printing")
    }
  }

  async function handleDownload() {
    if (!calculation) return

    const invoice = calculation?.invoices?.[0]

    if (invoice?.id) {
      setShowPrintDialog(true)
    } else {
      sonnerToast.error("Please generate an invoice first before downloading")
    }
  }

  const invoice = calculation?.invoices?.[0]

  const invoiceData =
    invoice && calculation
      ? {
        invoiceNumber: invoice?.bill_reference,
        date: invoice?.issue_date
          ? new Date(invoice.issue_date).toLocaleDateString()
          : "—",

        clientName: `${calculation.property?.owner?.first_name || ""} ${calculation.property?.owner?.last_name || ""
          }`.trim(),

        propertyName: calculation.property?.registered_property_name || "Unnamed Property",

        clientPhone: calculation.property?.owner?.phone_number || "—",

        areaOffice:
          calculation.property?.area_office?.office_name || "Headquarters",

        areaOfficeAddress:
          calculation.property?.area_office?.address || "",

        recipientAddress: (calculation.property?.street_name || calculation.property?.house_number)
          ? [
            `${calculation.property.house_number || ""} ${calculation.property.street_name || ""}`.trim(),
            "Kaduna"
            // calculation.property.address?.city,
            // calculation.property.address?.lga
          ].filter(Boolean).join(", ")
          : calculation.property?.address
            ? [
              calculation.property.address.street_address,
              "Kaduna"
              // calculation.property.address.city,
              // calculation.property.address.lga
            ].filter(Boolean).join(", ")
            : "—",

        assessmentYear: calculation.tax_year,
        taxYears: (calculation.backlog_years || 0) + 1,

        actualAmount: calculation.base_tax_amount || 0,
        arrears: calculation.backlog_tax_amount || 0,

        stampDuty: invoice?.stamp_duty || 0,
        penalties: calculation.penalty_amount || 0,
        interest: calculation.interest_amount || 0,

        totalOutstanding: invoice?.total_amount || 0,

        officerName: calculation.property?.area_office?.area_officer
          ? `${calculation.property.area_office.area_officer.first_name} ${calculation.property.area_office.area_officer.last_name}`
          : "Adamu",

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
          ...(invoice?.stamp_duty > 0
            ? [{ description: "Stamp Duty (1%)", amount: invoice.stamp_duty }]
            : []),
        ],

        discount: invoice?.discount || 0,

        total: invoice?.total_amount || 0,

        paymentReference: invoice?.bill_reference || invoice?.invoice_number,
      }

      : null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col overflow-hidden">
          <SheetHeader className="sticky top-0 z-10 bg-white border-b pb-4">
            <SheetTitle className="text-2xl font-bold">Tax Calculation</SheetTitle>
          </SheetHeader>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : calculation ? (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 mt-6 mb-6 px-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold">Tax Calculation</h2>
                        <Badge variant="outline" className="font-mono">
                          {calculation.tax_year}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {calculation.property?.registered_property_name || "Unnamed Property"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {calculation.property?.property_reference}
                      </p>
                    </div>
                    {calculation.is_active ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons - hide Generate Invoice and Delete if invoice exists */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!invoice && (
                      <Button size="sm" variant="default" className="gap-2 h-8" onClick={handleGenerateInvoice}>
                        <FilePlus className="h-3.5 w-3.5" />
                        Generate Invoice
                      </Button>
                    )}
                    {!invoice && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 h-8 bg-transparent text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-2 h-8 bg-transparent" onClick={handleDownload}>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2 h-8 bg-transparent" onClick={handlePrint}>
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Owner
                      </div>
                      <div className="font-medium">
                        {calculation.property?.owner?.first_name} {calculation.property?.owner?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {calculation.property?.owner?.taxpayer_profiles?.[0]?.kadirs_id || "No KADIRS ID"}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs w-full bg-transparent"
                        onClick={() => onOpenTaxpayerDetails?.(calculation.property?.owner_id)}
                      >
                        View Profile
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Property Type
                      </div>
                      <div className="capitalize">{calculation.property?.property_type}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {calculation.property?.property_category || "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Rental Start
                      </div>
                      <div>
                        {calculation.property?.rental_commencement_date
                          ? new Date(calculation.property.rental_commencement_date).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Tax Calculation</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="gap-0 py-0">
                      <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Annual Rent</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">
                          ₦{Number(calculation.annual_rent || 0).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="gap-0 py-0">
                      <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Tax Rate</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">{Number(calculation.tax_rate || 0)}%</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div>
                        <div className="text-sm font-medium">Base Tax</div>
                        <div className="text-xs text-muted-foreground">
                          ₦{Number(calculation.annual_rent || 0).toLocaleString()} × {calculation.tax_rate}%
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        ₦{Number(calculation.base_tax_amount || 0).toLocaleString()}
                      </div>
                    </div>

                    {calculation.backlog_tax_amount > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-amber-500/5 border-amber-500/20">
                        <div>
                          <div className="text-sm font-medium text-amber-700">Backlog Tax</div>
                          <div className="text-xs text-amber-600">{calculation.backlog_years} year(s) accumulated</div>
                        </div>
                        <div className="text-lg font-bold text-amber-700">
                          ₦{Number(calculation.backlog_tax_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {calculation.penalty_amount > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-500/5 border-orange-500/20">
                        <div>
                          <div className="text-sm font-medium text-orange-700">Penalty</div>
                          <div className="text-xs text-orange-600">10% late payment charge</div>
                        </div>
                        <div className="text-lg font-bold text-orange-700">
                          ₦{Number(calculation.penalty_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {calculation.interest_amount > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-red-500/5 border-red-500/20">
                        <div>
                          <div className="text-sm font-medium text-red-700">Interest</div>
                          <div className="text-xs text-red-600">27% annual interest rate</div>
                        </div>
                        <div className="text-lg font-bold text-red-700">
                          ₦{Number(calculation.interest_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-primary/5 border-primary/20">
                      <div>
                        <div className="text-base font-bold">Total Tax Due</div>
                        <div className="text-xs text-muted-foreground">Calculated amount</div>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        ₦{Number(calculation.total_tax_due || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-start gap-2 p-3 bg-muted/30 rounded border">
                    <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium">Calculated on:</span>{" "}
                      {calculation.calculation_date
                        ? new Date(calculation.calculation_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center py-2">
                  <div className="flex flex-col items-center gap-1">
                    <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
                    <span className="text-xs text-muted-foreground font-medium">Generates</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Invoice</h3>
                    {invoice && (
                      <Badge
                        variant="outline"
                        className={
                          invoice.payment_status === "paid"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : invoice.payment_status === "partially_paid"
                              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              : invoice.payment_status === "overdue"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }
                      >
                        {invoice.payment_status.replace("_", " ")}
                      </Badge>
                    )}
                  </div>

                  {invoice ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground">Invoice Number</div>
                            <div className="font-mono font-medium">{invoice.invoice_number}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Bill Reference</div>
                            <div className="font-mono text-sm">{invoice.bill_reference}</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">Issue Date</div>
                            <div className="font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Due Date</div>
                            <div className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-2 rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-muted-foreground">Base Tax</div>
                          <div className="text-xl font-bold">
                            ₦{Number(calculation.base_tax_amount || 0).toLocaleString()}
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2 text-sm">
                          {invoice?.stamp_duty > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Stamp Duty</span>
                              <span className="font-medium text-blue-600">
                                +₦{Number(invoice.stamp_duty).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          )}
                          {invoice?.penalty > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Penalty</span>
                              <span className="font-medium text-orange-600">
                                +₦{Number(invoice.penalty).toLocaleString("en-NG")}
                              </span>
                            </div>
                          )}

                          {invoice?.interest > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Interest</span>
                              <span className="font-medium text-orange-600">
                                +₦{Number(invoice.interest).toLocaleString("en-NG")}
                              </span>
                            </div>
                          )}

                          {invoice?.discount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Discount Applied</span>
                              <span className="font-medium text-green-600">
                                -₦{Number(invoice.discount).toLocaleString("en-NG")}
                              </span>
                            </div>
                          )}
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-muted-foreground">Invoice Total</div>
                          <div className="text-2xl font-bold">
                            ₦{Number(invoice.total_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Card className="gap-0 py-0 border-green-500/20 bg-green-500/5">
                          <CardHeader className="pb-1 pt-3 px-4">
                            <CardTitle className="text-xs font-medium text-green-700">Amount Paid</CardTitle>
                          </CardHeader>
                          <CardContent className="pb-3 px-4">
                            <div className="text-xl font-bold text-green-700">
                              ₦{Number(invoice.amount_paid || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="gap-0 py-0 border-red-500/20 bg-red-500/5">
                          <CardHeader className="pb-1 pt-3 px-4">
                            <CardTitle className="text-xs font-medium text-red-700">Balance Due</CardTitle>
                          </CardHeader>
                          <CardContent className="pb-3 px-4">
                            <div className="text-xl font-bold text-red-700">
                              ₦{Number(invoice.balance_due || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1 gap-2" onClick={handleDownload}>
                          <Download className="h-4 w-4" />
                          Download Invoice
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={handlePrint}>
                          <Printer className="h-4 w-4" />
                          Print Invoice
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground mb-2">No Invoice Generated</p>
                        <p className="text-xs text-muted-foreground text-center mb-4">
                          This tax calculation hasn't been converted to an invoice yet
                        </p>
                        <Button size="sm" onClick={handleGenerateInvoice} className="gap-2">
                          <FilePlus className="h-4 w-4" />
                          Generate Invoice Now
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {calculation.calculation_notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Notes</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded border">
                        {calculation.calculation_notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No calculation selected</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              {invoice ? (
                <>
                  This will permanently delete the tax calculation and its associated invoice (
                  <span className="font-mono font-medium">{invoice.invoice_number}</span>). This action cannot be
                  undone.
                </>
              ) : (
                "This will permanently delete the tax calculation. This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCalculation}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showPrintDialog && invoiceData && (
        <InvoicePrintDialog open={showPrintDialog} onOpenChange={setShowPrintDialog} invoiceData={invoiceData} />
      )}
    </>
  )
}

export default TaxCalculationDetailsSheet
