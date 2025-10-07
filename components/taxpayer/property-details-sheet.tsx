"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Building2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  Home,
  Download,
  Printer,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import TaxCalculationDetailsSheet from "@/components/admin/tax-calculation-details-sheet"

type PropertyDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string | null
}

export function TaxpayerPropertyDetailsSheet({ open, onOpenChange, propertyId }: PropertyDetailsSheetProps) {
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const [taxCalculations, setTaxCalculations] = useState<any[]>([])
  const [loadingTaxData, setLoadingTaxData] = useState(false)
  const [taxCalcSheetOpen, setTaxCalcSheetOpen] = useState(false)
  const [selectedTaxCalcId, setSelectedTaxCalcId] = useState<string | null>(null)

  useEffect(() => {
    if (open && propertyId) {
      fetchPropertyDetails()
      fetchTaxCalculationsAndInvoices()
    }
  }, [open, propertyId])

  async function fetchPropertyDetails() {
    if (!propertyId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          *,
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
            lga,
            postal_code
          ),
          invoices (
            id,
            invoice_number,
            total_amount,
            balance_due,
            payment_status,
            issue_date,
            due_date,
            created_at
          ),
          area_offices (
            office_name
          )
        `,
        )
        .eq("id", propertyId)
        .single()

      if (error) {
        console.error("Error fetching property details:", error)
        toast({
          title: "Error",
          description: "Failed to load property details",
          variant: "destructive",
        })
      } else {
        setProperty(data)
      }
    } catch (error) {
      console.error("Error in fetchPropertyDetails:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTaxCalculationsAndInvoices() {
    if (!propertyId) return

    setLoadingTaxData(true)
    try {
      const { data, error } = await supabase
        .from("tax_calculations")
        .select(
          `
          *,
          invoices (
            id,
            invoice_number,
            payment_status,
            total_amount,
            balance_due,
            issue_date,
            due_date
          )
        `,
        )
        .eq("property_id", propertyId)
        .order("tax_year", { ascending: false })

      if (error) {
        console.error("Error fetching tax calculations:", error)
        toast({
          title: "Error",
          description: "Failed to load tax calculations",
          variant: "destructive",
        })
      } else {
        setTaxCalculations(data || [])
      }
    } catch (error) {
      console.error("Error in fetchTaxCalculationsAndInvoices:", error)
    } finally {
      setLoadingTaxData(false)
    }
  }

  function handleDownloadInvoice(e: React.MouseEvent, calc: any) {
    e.stopPropagation()
    const invoice = calc.invoices?.[0]
    if (invoice) {
      toast({
        title: "Downloading Invoice",
        description: `Downloading invoice ${invoice.invoice_number}...`,
      })
      // TODO: Implement actual download logic
    } else {
      toast({
        title: "No Invoice",
        description: "This calculation doesn't have an associated invoice yet.",
        variant: "destructive",
      })
    }
  }

  function handlePrintInvoice(e: React.MouseEvent, calc: any) {
    e.stopPropagation()
    const invoice = calc.invoices?.[0]
    if (invoice) {
      toast({
        title: "Printing Invoice",
        description: `Preparing to print invoice ${invoice.invoice_number}...`,
      })
      // TODO: Implement actual print logic
    } else {
      toast({
        title: "No Invoice",
        description: "This calculation doesn't have an associated invoice yet.",
        variant: "destructive",
      })
    }
  }

  function getVerificationBadge(status: string) {
    const badges = {
      approved: { icon: CheckCircle, className: "bg-green-500/10 text-green-500 border-green-500/20" },
      pending: { icon: AlertCircle, className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      rejected: { icon: XCircle, className: "bg-red-500/10 text-red-500 border-red-500/20" },
      needs_info: { icon: AlertCircle, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    return (
      <Badge className={badge.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace("_", " ")}
      </Badge>
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : property ? (
            <div className="space-y-6 mt-6 mb-6 px-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold break-words">{property.registered_property_name}</h2>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {property.property_reference || "No reference"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getVerificationBadge(property.verification_status || "pending")}
                    <Badge variant="outline" className="capitalize">
                      {property.property_type}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="gap-0 py-0">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Annual Rent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-4">
                    <div className="text-xl font-bold">₦{Number(property.total_annual_rent || 0).toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="gap-0 py-0">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Invoices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-4">
                    <div className="text-xl font-bold">{property.invoices?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card className="gap-0 py-0">
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5" />
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 px-4">
                    <div className="text-xl font-bold capitalize">{property.status || "Active"}</div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Owner Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Name</div>
                    <div className="font-medium">
                      {property.users?.first_name} {property.users?.middle_name} {property.users?.last_name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">KADIRS ID</div>
                    <div className="font-mono">
                      {property.users?.taxpayer_profiles?.[0]?.kadirs_id || "No KADIRS ID"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Email</div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{property.users?.email}</span>
                    </div>
                  </div>
                  {property.users?.phone_number && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Phone</div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{property.users?.phone_number}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Property Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Property Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Property Type</div>
                    <div className="capitalize">{property.property_type}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Property Category</div>
                    <div className="capitalize">{property.property_category || "—"}</div>
                  </div>
                  {property.business_type && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Business Type</div>
                      <div className="capitalize">{property.business_type}</div>
                    </div>
                  )}
                  {property.year_built && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Year Built</div>
                      <div>{property.year_built}</div>
                    </div>
                  )}
                  {property.number_of_floors && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Number of Floors</div>
                      <div>{property.number_of_floors}</div>
                    </div>
                  )}
                  {property.total_units && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Total Units</div>
                      <div>
                        {property.total_units} ({property.occupied_units || 0} occupied)
                      </div>
                    </div>
                  )}
                  {property.total_floor_area && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Total Floor Area</div>
                      <div>{Number(property.total_floor_area).toLocaleString()} sq m</div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </h3>
                {property.addresses ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Street Address</div>
                      <div>{property.addresses.street_address}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">City</div>
                      <div>{property.addresses.city}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">LGA</div>
                      <div>{property.addresses.lga}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">State</div>
                      <div>{property.addresses.state}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Area Office</div>
                      <div>{property.area_offices?.office_name || "—"}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address information available</p>
                )}
              </div>

              <Separator />

              {property.property_description && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground">{property.property_description}</p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Tax Calculations & Invoices */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Tax Calculations & Invoices
                </h3>
                <p className="text-xs text-muted-foreground">
                  View your tax calculations and associated invoices for this property
                </p>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableHead>Year</TableHead>
                        <TableHead>Tax Amount</TableHead>
                        <TableHead className="hidden sm:table-cell">Invoice Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingTaxData ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : taxCalculations.length > 0 ? (
                        taxCalculations.map((calc) => {
                          const invoice = calc.invoices?.[0]
                          return (
                            <TableRow
                              key={calc.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedTaxCalcId(calc.id)
                                setTaxCalcSheetOpen(true)
                              }}
                            >
                              <TableCell className="font-medium">{calc.tax_year}</TableCell>
                              <TableCell className="font-semibold">
                                ₦{Number(calc.total_tax_due || 0).toLocaleString()}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {invoice ? (
                                  <span className="font-mono text-sm">{invoice.invoice_number}</span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No invoice</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {invoice ? (
                                  <Badge
                                    variant="outline"
                                    className={
                                      invoice.payment_status === "paid"
                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                        : invoice.payment_status === "overdue"
                                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                    }
                                  >
                                    {invoice.payment_status}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-muted">
                                    No invoice
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => handleDownloadInvoice(e, calc)}
                                  >
                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => handlePrintInvoice(e, calc)}
                                  >
                                    <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                            No tax calculations found for this property.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              {/* Registration Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Registration Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Registered</div>
                    <div>{new Date(property.created_at).toLocaleDateString()}</div>
                  </div>
                  {property.submitted_at && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Submitted</div>
                      <div>{new Date(property.submitted_at).toLocaleDateString()}</div>
                    </div>
                  )}
                  {property.verified_at && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Verified</div>
                      <div>{new Date(property.verified_at).toLocaleDateString()}</div>
                    </div>
                  )}
                  {property.rental_commencement_date && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Rental Commencement</div>
                      <div>{new Date(property.rental_commencement_date).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {property.rejection_reason && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-red-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Verification Feedback
                    </h3>
                    <div className="p-4 border border-red-500/20 rounded-lg bg-red-500/5">
                      <p className="text-sm text-muted-foreground">{property.rejection_reason}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No property selected</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <TaxCalculationDetailsSheet
        open={taxCalcSheetOpen}
        onOpenChange={setTaxCalcSheetOpen}
        calculationId={selectedTaxCalcId}
        onUpdate={() => {
          fetchTaxCalculationsAndInvoices()
        }}
      />
    </>
  )
}
