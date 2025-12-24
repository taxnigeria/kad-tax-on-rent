"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  UserCog,
  Trash2,
  Pencil,
  X,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import AssignManagerDialog from "@/components/admin/assign-manager-dialog"
import CalculateTaxDialog from "@/components/admin/calculate-tax-dialog"
import TaxCalculationDetailsSheet from "@/components/admin/tax-calculation-details-sheet"
import { EditPropertyModal } from "@/components/admin/edit-property-modal"

type PropertyDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string | null
  onUpdate: () => void
}

export function PropertyDetailsSheet({ open, onOpenChange, propertyId, onUpdate }: PropertyDetailsSheetProps) {
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [assignManagerDialogOpen, setAssignManagerDialogOpen] = useState(false)
  const [calculateTaxDialogOpen, setCalculateTaxDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedNewOwner, setSelectedNewOwner] = useState<any>(null)
  const [transferNotes, setTransferNotes] = useState("")
  const [transferring, setTransferring] = useState(false)
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [taxCalculations, setTaxCalculations] = useState<any[]>([])
  const [loadingTaxData, setLoadingTaxData] = useState(false)
  const [taxCalcSheetOpen, setTaxCalcSheetOpen] = useState(false)
  const [selectedTaxCalcId, setSelectedTaxCalcId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  function handleEdit() {
    setEditModalOpen(true)
  }

  function handleEditUpdate() {
    fetchPropertyDetails()
    onUpdate()
  }

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
            role
          ),
          area_offices (
            id,
            office_name,
            lgas (
              id,
              name
            )
          ),
          addresses (
            id,
            street_address,
            city,
            lga,
            state,
            postal_code
          ),
          enumerated_by_user:users!properties_enumerated_by_fkey (
            id,
            first_name,
            last_name
          ),
          property_manager:users!properties_property_manager_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone_number
          ),
          documents!documents_property_id_fkey (
            file_url,
            document_type
          )
        `,
        )
        .eq("id", propertyId)
        .single()

      if (error) {
        console.error("Error fetching property details:", error)
        toast.error("Failed to load property details")
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
            bill_reference,
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
        toast.error("Failed to load tax calculations")
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
    e.stopPropagation() // Prevent row click
    const invoice = calc.invoices?.[0]
    if (invoice) {
      toast(`Downloading invoice ${invoice.invoice_number}...`)
      // TODO: Implement actual download logic
    } else {
      toast.error("This calculation doesn't have an associated invoice yet.")
    }
  }

  function handlePrintInvoice(e: React.MouseEvent, calc: any) {
    e.stopPropagation() // Prevent row click
    const invoice = calc.invoices?.[0]
    if (invoice) {
      toast(`Preparing to print invoice ${invoice.invoice_number}...`)
      // TODO: Implement actual print logic
    } else {
      toast.error("This calculation doesn't have an associated invoice yet.")
    }
  }

  async function handleVerificationAction(action: "approved" | "rejected" | "needs_info") {
    if (!property) return

    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          verification_status: action,
          verified_at: new Date().toISOString(),
        })
        .eq("id", property.id)

      if (error) throw error

      toast.success(
        `Property ${action === "approved" ? "approved" : action === "rejected" ? "rejected" : "marked as needs info"}`,
      )
      await fetchPropertyDetails()
      onUpdate()
    } catch (error) {
      console.error("Error updating verification status:", error)
      toast.error("Failed to update verification status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function searchTaxpayers(query: string) {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          middle_name,
          last_name,
          email,
          phone_number,
          address,
          profile_picture_url,
          role
        `,
        )
        .eq("role", "taxpayer")
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`,
        )
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error("Error searching taxpayers:", error)
      toast.error("Failed to search taxpayers")
    } finally {
      setSearching(false)
    }
  }

  async function handleTransferOwnership() {
    if (!property || !selectedNewOwner) return

    setTransferring(true)
    try {
      // Update property owner
      const { error: updateError } = await supabase
        .from("properties")
        .update({
          owner_id: selectedNewOwner.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id)

      if (updateError) throw updateError

      // Create ownership history record (optional - if table exists)
      try {
        await supabase.from("property_ownership_history").insert({
          property_id: property.id,
          previous_owner_id: property.owner_id,
          new_owner_id: selectedNewOwner.id,
          transfer_notes: transferNotes,
          transferred_at: new Date().toISOString(),
        })
      } catch (historyError) {
        // Ignore if table doesn't exist yet
        console.log("Property ownership history table not found, skipping history record")
      }

      toast.success("Property ownership transferred successfully")

      // Reset dialog state
      setTransferDialogOpen(false)
      setSelectedNewOwner(null)
      setSearchQuery("")
      setSearchResults([])
      setTransferNotes("")

      // Refresh property details
      await fetchPropertyDetails()
      onUpdate()
    } catch (error) {
      console.error("Error transferring ownership:", error)
      toast.error("Failed to transfer ownership")
    } finally {
      setTransferring(false)
    }
  }

  async function handleDeleteProperty() {
    if (!property || deleteConfirmText !== "delete") return

    setDeleting(true)
    try {
      // First, archive the property by updating status
      const { error: archiveError } = await supabase
        .from("properties")
        .update({
          status: "archived",
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id)

      if (archiveError) throw archiveError

      // Then delete the property
      const { error: deleteError } = await supabase.from("properties").delete().eq("id", property.id)

      if (deleteError) throw deleteError

      toast.success("Property archived and deleted successfully")

      // Close dialogs and refresh
      setDeleteDialogOpen(false)
      setDeleteConfirmText("")
      onOpenChange(false)
      onUpdate()
    } catch (error) {
      console.error("Error deleting property:", error)
      toast.error("Failed to delete property")
    } finally {
      setDeleting(false)
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
          ) : !propertyId ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No property selected</p>
            </div>
          ) : property ? (
            <>
              <SheetHeader className="pb-6 border-b sticky top-0 bg-background z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <SheetTitle className="text-xl">{property.registered_property_name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-sm">{property.property_reference || "No reference"}</span>
                      {getVerificationBadge(property.verification_status || "pending")}
                      <Badge variant="outline" className="capitalize">
                        {property.property_type}
                      </Badge>
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
              {/* Content section scrolls independently */}
              <div className="space-y-6 mt-6 px-6">
                {/* Property Photos */}
                {property.documents && property.documents.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Property Photos
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {property.documents
                          .filter(
                            (doc: any) =>
                              doc.document_type === "property_facade" || doc.document_type === "address_number",
                          )
                          .map((doc: any, index: number) => (
                            <div key={index} className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground capitalize">
                                {doc.document_type.replace("_", " ")}
                              </p>
                              <img
                                src={doc.file_url || "/placeholder.svg"}
                                alt={doc.document_type}
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {(!property.documents || property.documents.length === 0) && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Property Photos
                      </h3>
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-2" />
                          <p className="text-sm font-medium text-muted-foreground">No images uploaded</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Property facade and address number images can be added when editing the property
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Quick Stats */}
                <div className="flex gap-3">
                  <Card className="flex-1 gap-0 py-0">
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5" />
                        Annual Rent
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                      <div className="text-xl font-bold">
                        ₦{Number(property.total_annual_rent || 0).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="flex-1 gap-0 py-0">
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
                  <Card className="flex-1 gap-0 py-0">
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Owner Information
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 h-8 bg-transparent"
                      onClick={() => setTransferDialogOpen(true)}
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      Transfer Ownership
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Name</div>
                      <div className="font-medium">
                        {property.users?.first_name} {property.users?.middle_name} {property.users?.last_name}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Address</div>
                      <div className="font-mono">{property.users?.address || "No address"}</div>
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Property Manager
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 h-8 bg-transparent"
                      onClick={() => setAssignManagerDialogOpen(true)}
                    >
                      <UserCog className="h-3.5 w-3.5" />
                      {property?.property_manager ? "Change Manager" : "Assign Manager"}
                    </Button>
                  </div>
                  {property?.property_manager ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Name</div>
                        <div>
                          {property.property_manager.first_name} {property.property_manager.last_name}
                        </div>
                      </div>
                      {property.property_manager.email && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Email</div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{property.property_manager.email}</span>
                          </div>
                        </div>
                      )}
                      {property.property_manager.phone_number && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Phone</div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{property.property_manager.phone_number}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-3">
                        <UserCog className="h-6 w-12 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No property manager assigned</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Property Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Property Type</div>
                      <div className="capitalize">{property.property_type}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Property Category</div>
                      <div className="capitalize">{property.property_category || "—"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Business Type</div>
                      <div className="capitalize">{property.business_type || "—"}</div>
                    </div>
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

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </h3>
                  {property.addresses ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Street Name</div>
                        <div>{property.addresses.street_address}</div> {/* Displaying street_address */}
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
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground">{property.property_description}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Tax Calculations & Invoices
                    </h3>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        if (!property.area_office_id) {
                          toast.error("Please add an area office to this property before calculating tax.")
                          return
                        }
                        setCalculateTaxDialogOpen(true)
                      }}
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      Calculate Tax
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tax calculations and their associated invoices for this property
                  </p>

                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted">
                          <TableHead>Year</TableHead>
                          <TableHead>Tax Amount</TableHead>
                          <TableHead>Bill Reference</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingTaxData ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ) : taxCalculations.length > 0 ? (
                          taxCalculations.map((calc) => {
                            const invoice = calc.invoices?.[0] // Get first invoice for this calculation
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
                                <TableCell>
                                  {invoice ? (
                                    <span className="font-mono text-sm">{invoice.bill_reference}</span>
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
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                              No tax calculations found. Click "Calculate Tax" to create one.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Registration Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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

                <Separator />

                {property.admin_notes && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Admin Notes</h3>
                    <p className="text-sm text-muted-foreground">{property.admin_notes}</p>
                  </div>
                )}

                {property.admin_notes && <Separator />}

                {property.rejection_reason && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-red-500">Rejection Reason</h3>
                      <p className="text-sm text-muted-foreground">{property.rejection_reason}</p>
                    </div>
                    <Separator />
                  </>
                )}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Recent Invoices ({property.invoices?.length || 0})</h3>
                  {property.invoices && property.invoices.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted hover:bg-muted">
                            <TableHead>Invoice Number</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {property.invoices.slice(0, 5).map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium font-mono text-sm">{invoice.invoice_number}</TableCell>
                              <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
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
                      <CardContent className="flex flex-col items-center justify-center py-3">
                        <FileText className="h-6 w-12 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No invoices found</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Separator />

                {property.verification_status !== "approved" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Verification Actions</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerificationAction("approved")}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 bg-transparent"
                        onClick={() => handleVerificationAction("needs_info")}
                        disabled={updatingStatus}
                      >
                        <AlertCircle className="h-4 w-4" />
                        Request Info
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 gap-2"
                        onClick={() => handleVerificationAction("rejected")}
                        disabled={updatingStatus}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No property selected</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Property Ownership</DialogTitle>
            <DialogDescription>
              Transfer this property to a new owner. Search for a taxpayer and confirm the transfer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Owner */}
            <div className="space-y-2">
              <Label>Current Owner</Label>
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">
                  {property?.users?.first_name} {property?.users?.middle_name} {property?.users?.last_name}
                </div>
                <div className="text-sm text-muted-foreground">{property?.users?.email}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  {property?.users?.address || "No address"}
                </div>
              </div>
            </div>

            {/* Search New Owner */}
            <div className="space-y-2">
              <Label htmlFor="search">Search New Owner</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or address..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchTaxpayers(e.target.value)
                }}
              />
              {searching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg">
                {searchResults.map((taxpayer) => (
                  <button
                    key={taxpayer.id}
                    className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                      selectedNewOwner?.id === taxpayer.id ? "bg-primary/10" : ""
                    }`}
                    onClick={() => setSelectedNewOwner(taxpayer)}
                  >
                    <div className="font-medium">
                      {taxpayer.first_name} {taxpayer.middle_name} {taxpayer.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">{taxpayer.email}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {taxpayer.address || "No address"}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected New Owner */}
            {selectedNewOwner && (
              <div className="space-y-2">
                <Label>New Owner (Selected)</Label>
                <div className="p-3 border rounded-lg bg-primary/5">
                  <div className="font-medium">
                    {selectedNewOwner.first_name} {selectedNewOwner.middle_name} {selectedNewOwner.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedNewOwner.email}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {selectedNewOwner.address || "No address"}
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Transfer Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this ownership transfer..."
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)} disabled={transferring}>
              Cancel
            </Button>
            <Button onClick={handleTransferOwnership} disabled={!selectedNewOwner || transferring}>
              {transferring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Transferring...
                </>
              ) : (
                "Confirm Transfer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              This action will archive the property before deletion. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
              <p className="text-sm font-medium mb-2">You are about to delete:</p>
              <p className="text-sm font-semibold">{property?.registered_property_name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{property?.property_reference}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">
                Type <span className="font-mono font-bold">delete</span> to confirm
              </Label>
              <Input
                id="confirm"
                placeholder="delete"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProperty}
              disabled={deleteConfirmText !== "delete" || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Property
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignManagerDialog
        open={assignManagerDialogOpen}
        onOpenChange={setAssignManagerDialogOpen}
        property={property}
        onSuccess={() => {
          fetchPropertyDetails()
          onUpdate()
        }}
      />

      <CalculateTaxDialog
        open={calculateTaxDialogOpen}
        onOpenChange={setCalculateTaxDialogOpen}
        property={property}
        onSuccess={() => {
          fetchPropertyDetails()
          fetchTaxCalculationsAndInvoices()
          onUpdate()
        }}
      />

      <TaxCalculationDetailsSheet
        open={taxCalcSheetOpen}
        onOpenChange={setTaxCalcSheetOpen}
        calculationId={selectedTaxCalcId}
        onUpdate={() => {
          fetchTaxCalculationsAndInvoices()
          onUpdate()
        }}
      />

      {/* Update EditPropertyModal component call to match the interface */}
      <EditPropertyModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        property={property}
        onUpdate={handleEditUpdate}
      />
    </>
  )
}
