"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Trash2, Plus, Mail, Phone } from "lucide-react"
import {
  getManagerDetailsWithProperties,
  revokeManagerAuthorization,
  addPropertyToManagerAuthorization,
} from "@/app/actions/manager-authorizations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ManagerDetailSidepanelProps {
  isOpen: boolean
  onClose: () => void
  managerId: string
  authorizationId: string
  ownerId: string
  onRevoked: () => void
  onPropertyAdded: () => void
  availableProperties: Array<{ id: string; registered_property_name: string }>
}

export function ManagerDetailSidepanel({
  isOpen,
  onClose,
  managerId,
  authorizationId,
  ownerId,
  onRevoked,
  onPropertyAdded,
  availableProperties,
}: ManagerDetailSidepanelProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedProperty, setSelectedProperty] = useState("")
  const [isAddingProperty, setIsAddingProperty] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    loadManagerDetails()
  }, [isOpen])

  const loadManagerDetails = async () => {
    setLoading(true)
    try {
      const result = await getManagerDetailsWithProperties(managerId, ownerId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setData(result.data)
    } catch (error) {
      console.error("[v0] Error loading manager details:", error)
      toast.error("Failed to load manager details")
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async () => {
    try {
      const result = await revokeManagerAuthorization(authorizationId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Authorization has been revoked")
      onRevoked()
      onClose()
    } catch (error) {
      console.error("[v0] Error revoking authorization:", error)
      toast.error("Failed to revoke authorization")
    }
  }

  const handleAddProperty = async () => {
    if (!selectedProperty) {
      toast.error("Please select a property")
      return
    }

    setIsAddingProperty(true)
    try {
      const result = await addPropertyToManagerAuthorization(managerId, ownerId, selectedProperty)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Property added to manager")
      setSelectedProperty("")
      onPropertyAdded()
      loadManagerDetails()
    } catch (error) {
      console.error("[v0] Error adding property:", error)
      toast.error("Failed to add property")
    } finally {
      setIsAddingProperty(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manager Details</SheetTitle>
          <SheetDescription>View and manage this property manager</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading details...</p>
          </div>
        ) : data ? (
          <div className="space-y-6 py-6">
            {/* Manager Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Manager Information</h3>
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {data.manager.first_name} {data.manager.last_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{data.manager.email}</p>
                  </div>
                  {data.manager.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{data.manager.phone_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Stats */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Performance Statistics</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total Tax Due</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      ₦{(data.stats.totalTaxDue || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Discounts Saved</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold text-green-600">
                      ₦{(data.stats.totalDiscounts || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Amount Paid</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">
                      ₦{(data.stats.totalPaid || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{data.stats.totalProperties}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Managed Properties */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Managed Properties</h3>
                <Badge variant="secondary">{data.properties.length}</Badge>
              </div>
              {data.properties.length > 0 ? (
                <div className="space-y-2">
                  {data.properties.map((prop: any) => (
                    <Card key={prop.id}>
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium">{prop.registered_property_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Annual Rent: ₦
                          {(prop.total_annual_rent || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                        </p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {prop.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No properties managed yet</p>
              )}
            </div>

            {/* Add Property */}
            {availableProperties.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Add Property</h3>
                <div className="flex gap-2">
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProperties.map((prop) => (
                        <SelectItem key={prop.id} value={prop.id}>
                          {prop.registered_property_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddProperty} disabled={isAddingProperty} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Revoke Button */}
            <div className="pt-4 border-t">
              <Button variant="destructive" className="w-full gap-2" onClick={handleRevoke}>
                <Trash2 className="h-4 w-4" />
                Revoke Authorization
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
