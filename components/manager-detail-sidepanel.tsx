"use client"

import { useEffect, useState, useMemo } from "react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Trash2, Plus, Mail, Phone, UserPlus } from "lucide-react"
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
  firebaseUid: string
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
  firebaseUid,
  onRevoked,
  onPropertyAdded,
  availableProperties,
}: ManagerDetailSidepanelProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedProperty, setSelectedProperty] = useState("")
  const [isAddingProperty, setIsAddingProperty] = useState(false)
  const [showAddPropertyForm, setShowAddPropertyForm] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    loadManagerDetails()
  }, [isOpen])

  const loadManagerDetails = async () => {
    setLoading(true)
    try {
      const result = await getManagerDetailsWithProperties(managerId, firebaseUid)
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
      const result = await addPropertyToManagerAuthorization(managerId, firebaseUid, selectedProperty)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Property added to manager")
      setSelectedProperty("")
      setShowAddPropertyForm(false)
      onPropertyAdded()
      loadManagerDetails()
    } catch (error) {
      console.error("[v0] Error adding property:", error)
      toast.error("Failed to add property")
    } finally {
      setIsAddingProperty(false)
    }
  }

  const managerInitials = useMemo(() => {
    if (!data?.manager) return "?"
    const first = data.manager.first_name?.[0] || ""
    const last = data.manager.last_name?.[0] || ""
    return `${first}${last}`.toUpperCase() || "?"
  }, [data?.manager])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">Manager Details</SheetTitle>
              <SheetDescription>View and manage this property manager</SheetDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 bg-transparent"
              onClick={() => setShowAddPropertyForm(!showAddPropertyForm)}
            >
              <UserPlus className="h-4 w-4" />
              Assign Property
            </Button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading details...</p>
            </div>
          ) : data ? (
            <div className="space-y-6 p-6">
              {/* Manager Info with Avatar */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Manager Information</h3>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={data.manager.profile_photo_url || "/placeholder.svg"} />
                    <AvatarFallback>{managerInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">
                        {data.manager.first_name} {data.manager.last_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs">{data.manager.email}</p>
                    </div>
                    {data.manager.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs">{data.manager.phone_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Statistics */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Performance Statistics</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-muted p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Tax Due</p>
                    <p className="text-xs font-semibold mt-1">
                      ₦{((data.stats.totalTaxDue || 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Discounts</p>
                    <p className="text-xs font-semibold text-green-600 mt-1">
                      ₦{((data.stats.totalDiscounts || 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-xs font-semibold text-blue-600 mt-1">
                      ₦{((data.stats.totalPaid || 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="bg-muted p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Properties</p>
                    <p className="text-xs font-semibold mt-1">{data.stats.totalProperties}</p>
                  </div>
                </div>
              </div>

              {showAddPropertyForm && availableProperties.length > 0 && (
                <div className="space-y-3 bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h3 className="text-sm font-semibold">Assign Property to Manager</h3>
                  <p className="text-xs text-muted-foreground">Select a property to place under this manager's care</p>
                  <div className="flex gap-2">
                    <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                      <SelectTrigger className="flex-1 h-9 text-sm bg-white">
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProperties.map((prop) => (
                          <SelectItem key={prop.id} value={prop.id} className="text-sm">
                            {prop.registered_property_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleAddProperty}
                      disabled={isAddingProperty || !selectedProperty}
                      className="h-9 gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddPropertyForm(false)
                        setSelectedProperty("")
                      }}
                      className="h-9"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Managed Properties */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">Managed Properties</h3>
                  <Badge variant="secondary" className="text-xs">
                    {data.properties.length}
                  </Badge>
                </div>
                {data.properties.length > 0 ? (
                  <div className="space-y-2">
                    {data.properties.map((prop: any) => (
                      <div key={prop.id} className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium">{prop.registered_property_name}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-muted-foreground">
                            ₦{(prop.total_annual_rent || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {prop.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-md p-4 text-center">
                    <p className="text-sm text-muted-foreground">No properties managed yet</p>
                    {availableProperties.length > 0 && (
                      <Button size="sm" variant="link" className="mt-1" onClick={() => setShowAddPropertyForm(true)}>
                        Assign a property
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Revoke Button */}
              <div className="pt-4 border-t">
                <Button variant="destructive" className="w-full gap-2" onClick={handleRevoke}>
                  <Trash2 className="h-4 w-4" />
                  Revoke Authorization
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
