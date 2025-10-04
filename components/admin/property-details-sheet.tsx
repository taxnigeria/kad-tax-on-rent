"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
  Pencil,
  User,
  Calendar,
  DollarSign,
  Home,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"

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
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (open && propertyId) {
      fetchPropertyDetails()
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

      toast({
        title: "Success",
        description: `Property ${action === "approved" ? "approved" : action === "rejected" ? "rejected" : "marked as needs info"}`,
      })
      await fetchPropertyDetails()
      onUpdate()
    } catch (error) {
      console.error("Error updating verification status:", error)
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : property ? (
          <>
            <SheetHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <SheetTitle className="flex items-center gap-3 flex-wrap">
                    {property.registered_property_name || "Unnamed Property"}
                    {getVerificationBadge(property.verification_status)}
                    <Badge variant="outline" className="capitalize">
                      {property.property_type}
                    </Badge>
                  </SheetTitle>
                  <SheetDescription className="font-mono">{property.property_reference}</SheetDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-2 mr-6 bg-transparent">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </SheetHeader>

            <div className="space-y-6 mt-6 mb-6 px-6">
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
                    <div className="text-xl font-bold">₦{Number(property.total_annual_rent || 0).toLocaleString()}</div>
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
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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
                      <div className="text-xs font-medium text-muted-foreground">Street Address</div>
                      <div>{property.addresses.street_address}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">City</div>
                      <div>{property.addresses.city}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">State</div>
                      <div>{property.addresses.state}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">LGA</div>
                      <div>{property.addresses.lga}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address information available</p>
                )}
              </div>

              {/* Property Manager */}
              {property.has_property_manager && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Property Manager</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Name</div>
                        <div>{property.manager_full_name || "—"}</div>
                      </div>
                      {property.manager_email && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Email</div>
                          <div>{property.manager_email}</div>
                        </div>
                      )}
                      {property.manager_phone && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">Phone</div>
                          <div>{property.manager_phone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Description */}
              {property.property_description && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground">{property.property_description}</p>
                  </div>
                </>
              )}

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

              {/* Admin Notes */}
              {property.admin_notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Admin Notes</h3>
                    <p className="text-sm text-muted-foreground">{property.admin_notes}</p>
                  </div>
                </>
              )}

              {/* Rejection Reason */}
              {property.rejection_reason && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-red-500">Rejection Reason</h3>
                    <p className="text-sm text-muted-foreground">{property.rejection_reason}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Associated Invoices */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Associated Invoices ({property.invoices?.length || 0})</h3>
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
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No invoices found</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              {/* Verification Actions */}
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
  )
}
