"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calculator,
  FileText,
  Mail,
  Loader2,
  DollarSign,
  Building2,
  User,
  Calendar,
  Edit,
  Trash2,
  Download,
  Eye,
  Plus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"

type TaxCalculationDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  calculationId: string | null
  onUpdate: () => void
}

export default function TaxCalculationDetailsSheet({
  open,
  onOpenChange,
  calculationId,
  onUpdate,
}: TaxCalculationDetailsSheetProps) {
  const [calculation, setCalculation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
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
            property_reference,
            registered_property_name,
            property_type,
            property_category,
            total_annual_rent,
            rental_commencement_date,
            owner_id,
            users!properties_owner_id_fkey (
              id,
              first_name,
              middle_name,
              last_name,
              email,
              phone_number,
              taxpayer_profiles (
                kadirs_id,
                tax_id_or_nin
              )
            ),
            addresses (
              street_address,
              city,
              state,
              lga
            )
          ),
          invoices (
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
        `,
        )
        .eq("id", calculationId)
        .single()

      if (error) {
        console.error("Error fetching calculation details:", error)
        toast({
          title: "Error",
          description: "Failed to load calculation details",
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

  async function handleGenerateInvoice() {
    if (!calculation) return

    toast({
      title: "Generating Invoice",
      description: "Creating invoice from tax calculation...",
    })

    // TODO: Implement invoice generation
    // This would call a server action to create an invoice from the calculation
  }

  async function handleDeleteCalculation() {
    if (!calculation) return

    // TODO: Implement delete with confirmation dialog
    toast({
      title: "Delete Calculation",
      description: "This feature will be implemented",
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : calculation ? (
          <div className="space-y-6 mt-6 mb-6 px-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">Tax Calculation</h2>
                  <p className="text-sm text-muted-foreground">
                    {calculation.properties?.registered_property_name || "Unnamed Property"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {calculation.properties?.property_reference}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-lg">
                    {calculation.tax_year}
                  </Badge>
                  {calculation.is_active ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-2 h-8 bg-transparent">
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 h-8 text-destructive hover:text-destructive bg-transparent"
                  onClick={handleDeleteCalculation}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button size="sm" variant="outline" className="gap-2 h-8 bg-transparent">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </div>
            </div>

            <Separator />

            {/* Tabs for Calculation and Invoice */}
            <Tabs defaultValue="calculation" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calculation" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Calculation
                </TabsTrigger>
                <TabsTrigger value="invoice" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Invoice
                  {calculation.invoices && calculation.invoices.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      {calculation.invoices.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Calculation Tab */}
              <TabsContent value="calculation" className="space-y-6 mt-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="gap-0 py-0">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" />
                        Annual Rent
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">₦{Number(calculation.annual_rent || 0).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="gap-0 py-0">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calculator className="h-3.5 w-3.5" />
                        Tax Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{Number(calculation.tax_rate || 0)}%</div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Tax Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Tax Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">Base Tax Amount</div>
                        <div className="text-xs text-muted-foreground">
                          Annual Rent × Tax Rate ({calculation.tax_rate}%)
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        ₦{Number(calculation.base_tax_amount || 0).toLocaleString()}
                      </div>
                    </div>

                    {calculation.backlog_tax_amount > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-500/5">
                        <div>
                          <div className="text-sm font-medium">Backlog Tax</div>
                          <div className="text-xs text-muted-foreground">
                            {calculation.backlog_years} year(s) backlog
                          </div>
                        </div>
                        <div className="text-lg font-bold text-yellow-600">
                          ₦{Number(calculation.backlog_tax_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {calculation.penalty_amount > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-500/5">
                        <div>
                          <div className="text-sm font-medium">Penalty</div>
                          <div className="text-xs text-muted-foreground">Late payment penalty (10%)</div>
                        </div>
                        <div className="text-lg font-bold text-orange-600">
                          ₦{Number(calculation.penalty_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {calculation.interest_amount > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-red-500/5">
                        <div>
                          <div className="text-sm font-medium">Interest</div>
                          <div className="text-xs text-muted-foreground">Accrued interest (27%)</div>
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          ₦{Number(calculation.interest_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-primary/5">
                      <div>
                        <div className="text-base font-bold">Total Tax Due</div>
                        <div className="text-xs text-muted-foreground">Final amount payable</div>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        ₦{Number(calculation.total_tax_due || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Property Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Property Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Property Type</div>
                      <div className="capitalize">{calculation.properties?.property_type}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Category</div>
                      <div className="capitalize">{calculation.properties?.property_category || "—"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Rental Start</div>
                      <div>
                        {calculation.properties?.rental_commencement_date
                          ? new Date(calculation.properties.rental_commencement_date).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Owner Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Owner Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Name</div>
                      <div className="font-medium">
                        {calculation.properties?.users?.first_name} {calculation.properties?.users?.middle_name}{" "}
                        {calculation.properties?.users?.last_name}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">KADIRS ID</div>
                      <div className="font-mono">
                        {calculation.properties?.users?.taxpayer_profiles?.[0]?.kadirs_id || "No KADIRS ID"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Email</div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{calculation.properties?.users?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Calculation Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Calculation Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Calculation Date</div>
                      <div>
                        {calculation.calculation_date
                          ? new Date(calculation.calculation_date).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Method</div>
                      <div className="capitalize">{calculation.calculation_method || "Standard"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Created</div>
                      <div>{new Date(calculation.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {calculation.calculation_notes && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Notes</div>
                      <p className="text-sm">{calculation.calculation_notes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Invoice Tab */}
              <TabsContent value="invoice" className="space-y-6 mt-6">
                {calculation.invoices && calculation.invoices.length > 0 ? (
                  calculation.invoices.map((invoice: any) => (
                    <div key={invoice.id} className="space-y-6">
                      {/* Invoice Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Invoice Details</h3>
                          <p className="text-sm text-muted-foreground font-mono">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground font-mono">{invoice.bill_reference}</p>
                        </div>
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
                          {invoice.payment_status}
                        </Badge>
                      </div>

                      <Separator />

                      {/* Invoice Amount Breakdown */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Amount Breakdown</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">Base Amount</span>
                            <span className="font-medium">₦{Number(invoice.base_amount || 0).toLocaleString()}</span>
                          </div>
                          {invoice.penalty > 0 && (
                            <div className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">Penalty</span>
                              <span className="font-medium text-orange-600">
                                ₦{Number(invoice.penalty || 0).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {invoice.interest > 0 && (
                            <div className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">Interest</span>
                              <span className="font-medium text-red-600">
                                ₦{Number(invoice.interest || 0).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {invoice.stamp_duty > 0 && (
                            <div className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">Stamp Duty</span>
                              <span className="font-medium">₦{Number(invoice.stamp_duty || 0).toLocaleString()}</span>
                            </div>
                          )}
                          {invoice.discount > 0 && (
                            <div className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">Discount</span>
                              <span className="font-medium text-green-600">
                                -₦{Number(invoice.discount || 0).toLocaleString()}
                              </span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex items-center justify-between p-3 border-2 rounded-lg bg-primary/5">
                            <span className="font-bold">Total Amount</span>
                            <span className="text-xl font-bold text-primary">
                              ₦{Number(invoice.total_amount || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Payment Information */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Payment Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 border rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Amount Paid</div>
                            <div className="text-lg font-bold text-green-600">
                              ₦{Number(invoice.amount_paid || 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Balance Due</div>
                            <div className="text-lg font-bold text-red-600">
                              ₦{Number(invoice.balance_due || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Invoice Dates */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Important Dates</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Issue Date</div>
                            <div>{new Date(invoice.issue_date).toLocaleDateString()}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Due Date</div>
                            <div>{new Date(invoice.due_date).toLocaleDateString()}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Created</div>
                            <div>{new Date(invoice.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Invoice Actions */}
                      <div className="flex gap-2">
                        <Button className="flex-1 gap-2">
                          <Eye className="h-4 w-4" />
                          View Invoice
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">No invoice generated for this calculation</p>
                      <Button onClick={handleGenerateInvoice} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Generate Invoice
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No calculation selected</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
