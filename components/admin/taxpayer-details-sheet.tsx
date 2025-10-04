"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getTaxpayerById, updateTaxpayerStatus } from "@/app/actions/taxpayers"
import { Building2, FileText, Mail, Loader2, UserX, UserCheck, DollarSign, CheckCircle, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RegisterPropertyModal } from "@/components/register-property-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TaxpayerDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxpayerId: string | null
  onUpdate: () => void
}

export function TaxpayerDetailsSheet({ open, onOpenChange, taxpayerId, onUpdate }: TaxpayerDetailsSheetProps) {
  const [taxpayer, setTaxpayer] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [isRegisterPropertyOpen, setIsRegisterPropertyOpen] = useState(false)
  const { toast } = useToast()

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
        toast({
          title: "Error",
          description: "Failed to load taxpayer details",
          variant: "destructive",
        })
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

  async function handleToggleStatus() {
    if (!taxpayer) return

    setUpdatingStatus(true)
    try {
      const result = await updateTaxpayerStatus(taxpayer.id, !taxpayer.is_active)
      if (result.success) {
        toast({
          title: "Success",
          description: `Taxpayer ${!taxpayer.is_active ? "activated" : "deactivated"} successfully`,
        })
        await fetchTaxpayerDetails()
        onUpdate()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
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
              <SheetHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <SheetTitle className="flex items-center gap-3 flex-wrap">
                      {taxpayer.first_name} {taxpayer.middle_name} {taxpayer.last_name}
                      {taxpayer.is_active ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20">
                          Inactive
                        </Badge>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {taxpayer.role?.replace("_", " ")}
                      </Badge>
                    </SheetTitle>
                    <SheetDescription>{taxpayer.taxpayer_profiles?.kadirs_id || "No KADIRS ID"}</SheetDescription>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 mr-6 bg-transparent">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
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
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-medium">{taxpayer.email}</div>
                    </div>
                    {taxpayer.phone_number && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Phone</div>
                        <div className="font-medium">{taxpayer.phone_number}</div>
                      </div>
                    )}
                    {taxpayer.taxpayer_profiles?.residential_address && (
                      <div className="space-y-1 md:col-span-2 lg:col-span-3">
                        <div className="text-xs text-muted-foreground">Residential Address</div>
                        <div className="font-medium">{taxpayer.taxpayer_profiles.residential_address}</div>
                      </div>
                    )}
                  </div>
                </div>

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
                      <div className="text-xs text-muted-foreground">Registered</div>
                      <div className="font-medium">{new Date(taxpayer.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

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
                    <Button size="sm" variant="outline" onClick={() => setIsRegisterPropertyOpen(true)}>
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
                            <TableRow key={property.id}>
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
                    <Button size="sm" variant="outline">
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
                            <TableRow key={invoice.id}>
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
                        <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
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
                    onClick={handleToggleStatus}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : taxpayer.is_active ? (
                      <>
                        <UserX className="h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No taxpayer selected</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Register Property Modal */}
      <RegisterPropertyModal
        open={isRegisterPropertyOpen}
        onOpenChange={setIsRegisterPropertyOpen}
        taxpayerId={taxpayerId}
        onSuccess={() => {
          fetchTaxpayerDetails()
          onUpdate()
        }}
      />
    </>
  )
}
