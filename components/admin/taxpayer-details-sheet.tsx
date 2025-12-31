"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getTaxpayerById } from "@/app/actions/taxpayers"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Building2, DollarSign, CheckCircle, Loader2, Mail, Pencil, User, ShieldCheck, ShieldX, X } from "lucide-react"
import { EditTaxpayerModal } from "./edit-taxpayer-modal"
import { PropertyDetailsSheet } from "./property-details-sheet"
import { InvoiceDetailsSheet } from "./invoice-details-sheet"
import { AddPropertyModal } from "./add-property-modal"
import CalculateTaxDialog from "./calculate-tax-dialog"
import { GenerateKadirsIdModal } from "./generate-kadirs-id-modal"
import { useAuth } from "@/contexts/auth-context"
import { PropertySelectionModal } from "./property-selection-modal"
import { CreateFirebaseAccountModal } from "./create-firebase-account-modal"

type TaxpayerDetailsSheetProps = {
  taxpayerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

type TaxpayerDetails = {
  id: string
  first_name: string
  middle_name: string
  last_name: string
  email: string
  phone_number: string
  is_active: boolean
  created_at: string
  property_count: number
  total_tax_owed: number
  total_paid: number
  email_verified: boolean
  phone_verified: boolean
  taxpayer_profiles: {
    id: string
    kadirs_id: string
    tin: string
    tax_id_or_nin: string
    is_business: boolean
    business_name: string
    business_type: string
    business_address: string
    residential_address: string
    rc_number: string
    gender: string
    date_of_birth: string
    nationality: string
    means_of_identification: string
    identification_number: string
    years_of_experience: number
    industry_id: string
    user_type: string
    area_office_id: string
    lga_id: string
    address_line1: string
    business_registration_date: string
    management_license_number: string
    paykaduna_customer_code: string
    paykaduna_customer_id: string
    lgas: { name: string }
    area_offices: { office_name: string }
  }
  properties: any[]
  invoices: any[]
}

type Property = {
  id: string
  registered_property_name: string
  property_reference: string
  property_type: string
  verification_status: string
}

export function TaxpayerDetailsSheet({ taxpayerId, open, onOpenChange, onUpdate }: TaxpayerDetailsSheetProps) {
  const [taxpayer, setTaxpayer] = useState<TaxpayerDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [showPropertyDetails, setShowPropertyDetails] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [showCalculateTaxDialog, setShowCalculateTaxDialog] = useState(false)
  const { userRole } = useAuth()
  const [generateKadirsModalOpen, setGenerateKadirsModalOpen] = useState(false)
  const [showPropertySelectionModal, setShowPropertySelectionModal] = useState(false)
  const [showFirebaseCreateModal, setShowFirebaseCreateModal] = useState(false)

  useEffect(() => {
    if (open && taxpayerId) {
      fetchTaxpayerDetails()
    }
  }, [open, taxpayerId])

  async function fetchTaxpayerDetails() {
    if (!taxpayerId) return

    setLoading(true)
    try {
      const { taxpayer: data, error } = await getTaxpayerById(taxpayerId)
      if (error) {
        console.error("Error fetching taxpayer details:", error)
        toast.error("Failed to load taxpayer details")
      } else {
        console.log("[v0] Taxpayer data:", data)
        console.log("[v0] Properties:", data?.properties)
        console.log("[v0] Properties length:", data?.properties?.length)
        setTaxpayer(data)
      }
    } catch (error) {
      console.error("Error in fetchTaxpayerDetails:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusToggle(newStatus: boolean) {
    if (!taxpayer) return
    setUpdatingStatus(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("users").update({ is_active: newStatus }).eq("id", taxpayer.id)

      if (error) throw error

      setTaxpayer((prev) => (prev ? { ...prev, is_active: newStatus } : null))
      toast.success(newStatus ? "Taxpayer account activated" : "Taxpayer account deactivated")
      onUpdate()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setUpdatingStatus(false)
    }
  }

  function handlePropertyClick(propertyId: string) {
    setSelectedPropertyId(propertyId)
    setShowPropertyDetails(true)
  }

  function handleInvoiceClick(invoiceId: string) {
    setSelectedInvoiceId(invoiceId)
    setShowInvoiceDetails(true)
  }

  function handleEditUpdate() {
    fetchTaxpayerDetails()
    onUpdate()
  }

  function handleAddProperty() {
    setShowAddPropertyModal(true)
  }

  function handleCreateInvoice() {
    if (!taxpayer?.properties || taxpayer.properties.length === 0) {
      toast.error("Please add a property before creating an invoice")
      return
    }

    if (taxpayer.properties.length === 1) {
      // Automatically select single property
      handlePropertySelected(taxpayer.properties[0].id)
    } else {
      // Show modal to select property
      setShowPropertySelectionModal(true)
    }
  }

  function handlePropertySelected(propertyId: string) {
    // Store selected property and open calculate tax dialog
    sessionStorage.setItem("selectedPropertyForInvoice", propertyId)
    setShowCalculateTaxDialog(true)
  }

  function getEditTaxpayerData() {
    if (!taxpayer) return null
    const profile = taxpayer.taxpayer_profiles
    return {
      id: profile?.id || "",
      user_id: taxpayer.id,
      kadirs_id: profile?.kadirs_id,
      first_name: taxpayer.first_name,
      last_name: taxpayer.last_name,
      middle_name: taxpayer.middle_name,
      email: taxpayer.email,
      phone_number: taxpayer.phone_number,
      is_active: taxpayer.is_active,
      tin: profile?.tin,
      tax_id_or_nin: profile?.tax_id_or_nin,
      is_business: profile?.is_business || false,
      business_name: profile?.business_name,
      business_type: profile?.business_type,
      business_address: profile?.business_address,
      residential_address: profile?.residential_address,
      rc_number: profile?.rc_number,
      gender: profile?.gender,
      date_of_birth: profile?.date_of_birth,
      nationality: profile?.nationality,
      means_of_identification: profile?.means_of_identification,
      identification_number: profile?.identification_number,
      years_of_experience: profile?.years_of_experience,
      industry_id: profile?.industry_id,
      user_type: profile?.user_type,
      area_office_id: profile?.area_office_id,
      lga_id: profile?.lga_id,
      address_line1: profile?.address_line1,
      business_registration_date: profile?.business_registration_date,
      management_license_number: profile?.management_license_number,
      paykaduna_customer_code: profile?.paykaduna_customer_code,
      paykaduna_customer_id: profile?.paykaduna_customer_id,
    }
  }

  const handleGenerateKadirsId = () => {
    setGenerateKadirsModalOpen(true)
  }

  const handleKadirsIdGenerated = async () => {
    // Refresh taxpayer data
    await fetchTaxpayerDetails()
    if (onUpdate) {
      onUpdate()
    }
  }

  const handleFirebaseAccountCreated = async () => {
    await fetchTaxpayerDetails()
    if (onUpdate) {
      onUpdate()
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {loading ? (
            <div className="space-y-6 mt-6 px-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : taxpayer ? (
            <>
              <SheetHeader className="pb-6 border-b sticky top-0 bg-background z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {taxpayer.first_name?.[0]}
                          {taxpayer.last_name?.[0]}
                        </span>
                      </div>
                      <SheetTitle className="text-xl">
                        {taxpayer.first_name} {taxpayer.last_name}
                      </SheetTitle>
                      {taxpayer.is_active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {taxpayer.taxpayer_profiles?.user_type?.replace("_", " ") || "No User Type"}
                      </Badge>
                    </div>
                    <SheetDescription className="flex items-center gap-2 flex-wrap">
                      {taxpayer.taxpayer_profiles?.kadirs_id ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-600">KD</span>
                          </div>
                          <span className="font-mono text-sm">{taxpayer.taxpayer_profiles.kadirs_id}</span>
                        </div>
                      ) : (
                        <span>No KADIRS ID</span>
                      )}
                      {!taxpayer.taxpayer_profiles?.kadirs_id &&
                        userRole &&
                        ["admin", "super_admin"].includes(userRole) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2 h-6 text-xs bg-transparent"
                            onClick={handleGenerateKadirsId}
                          >
                            Generate KADIRS ID
                          </Button>
                        )}
                      {userRole && ["admin", "super_admin"].includes(userRole) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2 h-6 text-xs bg-transparent"
                          onClick={() => setShowFirebaseCreateModal(true)}
                        >
                          Create Firebase Account
                        </Button>
                      )}
                    </SheetDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => setEditModalOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <SheetClose asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6 mt-6 mb-6 px-6">
                {/* Status and Quick Stats */}
                <div className="flex gap-3">
                  <Card className="flex-1 gap-0 py-0">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">{taxpayer.property_count || 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="flex-1 gap-0 py-0">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" />
                        Total Owed
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">₦{(taxpayer.total_tax_owed || 0).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card className="flex-1 gap-0 py-0">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Total Paid
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">₦{(taxpayer.total_paid || 0).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Contact Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Email
                          {taxpayer.email_verified ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <ShieldX className="h-3.5 w-3.5 text-red-500" />
                          )}
                        </p>
                        <a href={`mailto:${taxpayer.email}`} className="text-sm text-primary hover:underline">
                          {taxpayer.email}
                        </a>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Phone
                          {taxpayer.phone_number &&
                            (taxpayer.phone_verified ? (
                              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <ShieldX className="h-3.5 w-3.5 text-red-500" />
                            ))}
                        </p>
                        {taxpayer.phone_number ? (
                          <a href={`tel:${taxpayer.phone_number}`} className="text-sm text-primary hover:underline">
                            {taxpayer.phone_number}
                          </a>
                        ) : (
                          <p className="text-sm">—</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Personal Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">TIN/NIN</div>
                      <div className="font-medium font-mono">{taxpayer.taxpayer_profiles?.tax_id_or_nin || "—"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Gender</div>
                      <div className="font-medium capitalize">{taxpayer.taxpayer_profiles?.gender || "—"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Date of Birth</div>
                      <div className="font-medium">
                        {taxpayer.taxpayer_profiles?.date_of_birth
                          ? new Date(taxpayer.taxpayer_profiles.date_of_birth).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Nationality</div>
                      <div className="font-medium">{taxpayer.taxpayer_profiles?.nationality || "—"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">User Type</div>
                      <div className="font-medium capitalize">{taxpayer.taxpayer_profiles?.user_type || "—"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Means of ID</div>
                      <div className="font-medium capitalize">
                        {taxpayer.taxpayer_profiles?.means_of_identification?.replace(/_/g, " ") || "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">ID Number</div>
                      <div className="font-medium font-mono">
                        {taxpayer.taxpayer_profiles?.identification_number || "—"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Registered</div>
                      <div className="font-medium">{new Date(taxpayer.created_at).toLocaleDateString()}</div>
                    </div>
                    {taxpayer.taxpayer_profiles?.years_of_experience && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Years of Experience</div>
                        <div className="font-medium">{taxpayer.taxpayer_profiles.years_of_experience} years</div>
                      </div>
                    )}
                    {taxpayer.taxpayer_profiles?.management_license_number && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">License Number</div>
                        <div className="font-medium font-mono">
                          {taxpayer.taxpayer_profiles.management_license_number}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Information */}
                {(taxpayer.taxpayer_profiles?.lga_id ||
                  taxpayer.taxpayer_profiles?.area_office_id ||
                  taxpayer.taxpayer_profiles?.address_line1) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Location Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {taxpayer.taxpayer_profiles?.lgas?.name && (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">LGA</div>
                            <div className="font-medium">{taxpayer.taxpayer_profiles.lgas.name}</div>
                          </div>
                        )}
                        {taxpayer.taxpayer_profiles?.area_offices?.office_name && (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Area Office</div>
                            <div className="font-medium">{taxpayer.taxpayer_profiles.area_offices.office_name}</div>
                          </div>
                        )}
                        {taxpayer.taxpayer_profiles?.address_line1 && (
                          <div className="space-y-1 md:col-span-2 lg:col-span-3">
                            <div className="text-xs text-muted-foreground">Address</div>
                            <div className="font-medium">{taxpayer.taxpayer_profiles.address_line1}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Business Information */}
                {taxpayer.taxpayer_profiles?.is_business && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Business Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Business Name</div>
                          <div className="font-medium">{taxpayer.taxpayer_profiles.business_name || "—"}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Business Type</div>
                          <div className="font-medium capitalize">
                            {taxpayer.taxpayer_profiles.business_type || "—"}
                          </div>
                        </div>
                        {taxpayer.taxpayer_profiles.business_address && (
                          <div className="space-y-1 md:col-span-2 lg:col-span-3">
                            <div className="text-xs text-muted-foreground">Business Address</div>
                            <div className="font-medium">{taxpayer.taxpayer_profiles.business_address}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Properties */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Properties ({taxpayer.properties?.length || 0})</h3>
                    <Button size="sm" variant="outline" onClick={handleAddProperty}>
                      Add Property
                    </Button>
                  </div>
                  {taxpayer.properties && taxpayer.properties.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted hover:bg-muted">
                            <TableHead>Property Name</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {taxpayer.properties.map((property: any) => (
                            <TableRow
                              key={property.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handlePropertyClick(property.id)}
                            >
                              <TableCell className="font-medium">
                                {property.registered_property_name || "Unnamed"}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{property.property_reference}</TableCell>
                              <TableCell className="capitalize">{property.property_type}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {property.verification_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Building2 className="h-12 w-12 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No properties registered</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Recent Invoices */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Recent Invoices ({taxpayer.invoices?.length || 0})</h3>
                    <Button size="sm" variant="outline" onClick={handleCreateInvoice}>
                      Create Invoice
                    </Button>
                  </div>
                  {taxpayer.invoices && taxpayer.invoices.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted hover:bg-muted">
                            <TableHead>Invoice Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {taxpayer.invoices.slice(0, 5).map((invoice: any) => (
                            <TableRow
                              key={invoice.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleInvoiceClick(invoice.id)}
                            >
                              <TableCell className="font-medium font-mono text-sm">{invoice.invoice_number}</TableCell>
                              <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                              <TableCell className="font-semibold">
                                ₦{Number(invoice.total_amount).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    invoice.payment_status === "paid"
                                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                                      : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                  }
                                >
                                  {invoice.payment_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Mail className="h-12 w-12 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No invoices found</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant={taxpayer.is_active ? "destructive" : "default"}
                    className="flex-1 gap-2"
                    onClick={() => handleStatusToggle(!taxpayer.is_active)}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : taxpayer.is_active ? (
                      <>
                        <User className="h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Property Selection Modal */}
      {showPropertySelectionModal && (
        <PropertySelectionModal
          open={showPropertySelectionModal}
          onOpenChange={setShowPropertySelectionModal}
          properties={taxpayer?.properties || []}
          onSelect={handlePropertySelected}
        />
      )}

      {/* Add PropertyDetailsSheet component */}
      <PropertyDetailsSheet
        open={showPropertyDetails}
        onOpenChange={setShowPropertyDetails}
        propertyId={selectedPropertyId}
        onUpdate={fetchTaxpayerDetails}
      />

      {/* Invoice Details Sheet component */}
      <InvoiceDetailsSheet
        open={showInvoiceDetails}
        onOpenChange={setShowInvoiceDetails}
        invoiceId={selectedInvoiceId}
        onUpdate={fetchTaxpayerDetails}
      />

      {/* Edit Taxpayer Modal */}
      <EditTaxpayerModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        taxpayer={getEditTaxpayerData()}
        onSuccess={handleEditUpdate}
      />

      {/* AddPropertyModal */}
      <AddPropertyModal
        open={showAddPropertyModal}
        onOpenChange={setShowAddPropertyModal}
        ownerId={taxpayer?.id}
        onSuccess={() => {
          setShowAddPropertyModal(false)
          fetchTaxpayerDetails()
          onUpdate()
          toast.success("Property added successfully")
        }}
      />

      {/* CalculateTaxDialog for creating invoices */}
      {taxpayer?.properties && taxpayer.properties.length > 0 && (
        <CalculateTaxDialog
          open={showCalculateTaxDialog}
          onOpenChange={setShowCalculateTaxDialog}
          property={taxpayer.properties[0]}
          onSuccess={() => {
            setShowCalculateTaxDialog(false)
            fetchTaxpayerDetails()
            onUpdate()
          }}
        />
      )}

      {/* Generate KADIRS ID Modal */}
      {taxpayer && (
        <GenerateKadirsIdModal
          open={generateKadirsModalOpen}
          onOpenChange={setGenerateKadirsModalOpen}
          taxpayerId={taxpayer.id}
          onSuccess={handleKadirsIdGenerated}
        />
      )}

      {/* Create Firebase Account Modal */}
      {taxpayer && (
        <CreateFirebaseAccountModal
          open={showFirebaseCreateModal}
          onOpenChange={setShowFirebaseCreateModal}
          taxpayerId={taxpayer.id}
          onSuccess={handleFirebaseAccountCreated}
        />
      )}
    </>
  )
}
