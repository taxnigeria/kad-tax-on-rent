"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  User,
  DollarSign,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

type PropertyStatus = "verified" | "pending" | "rejected"

interface Property {
  id: string
  registered_property_name: string
  property_reference: string
  property_type: string
  property_category: string
  status: string
  total_annual_rent: number
  house_number: string
  street_name: string
  created_at: string
  area_offices: {
    office_name: string
    lgas: {
      name: string
    } | null
  } | null
  addresses: {
    city: string
    lga: string
    state: string
  } | null
  users: {
    first_name: string
    last_name: string
    phone_number: string
    email: string
  } | null
}

interface PropertiesListSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: PropertyStatus
}

// Helper to truncate sensitive data
function truncatePhone(phone: string | null | undefined): string {
  if (!phone) return "N/A"
  if (phone.length <= 6) return phone
  return phone.slice(0, 4) + "****" + phone.slice(-2)
}

function truncateEmail(email: string | null | undefined): string {
  if (!email) return "N/A"
  const [local, domain] = email.split("@")
  if (!domain) return email
  const truncatedLocal = local.length > 3 ? local.slice(0, 3) + "***" : local
  return `${truncatedLocal}@${domain}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getStatusConfig(status: PropertyStatus) {
  switch (status) {
    case "verified":
      return {
        title: "Verified Properties",
        description: "Properties that have been approved by admin",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/30",
      }
    case "pending":
      return {
        title: "Pending Properties",
        description: "Properties awaiting admin review",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      }
    case "rejected":
      return {
        title: "Rejected Properties",
        description: "Properties that need corrections",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/30",
      }
  }
}

function getPropertyStatusBadge(status: string) {
  switch (status) {
    case "verified":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Verified</Badge>
    case "submitted":
    case "under_review":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Pending</Badge>
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Rejected</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function PropertiesListSheet({ open, onOpenChange, status }: PropertiesListSheetProps) {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const config = getStatusConfig(status)
  const StatusIcon = config.icon

  useEffect(() => {
    if (open && user) {
      fetchProperties()
    }
  }, [open, user, status])

  const fetchProperties = async () => {
    if (!user) return

    setLoading(true)
    try {
      const res = await fetch(`/api/enumerator/properties?firebaseUid=${user.uid}&status=${status}`)
      if (res.ok) {
        const data = await res.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setSelectedProperty(null)
  }

  const handleClose = () => {
    setSelectedProperty(null)
    onOpenChange(false)
  }

  // Property Details View
  if (selectedProperty) {
    const isVerified = selectedProperty.status === "verified"

    const city = selectedProperty.addresses?.city || "N/A"
    const lga = selectedProperty.addresses?.lga || selectedProperty.area_offices?.lgas?.name || "N/A"

    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <SheetTitle className="text-left">Property Details</SheetTitle>
                <SheetDescription className="text-left">{selectedProperty.property_reference}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              {getPropertyStatusBadge(selectedProperty.status)}
              <span className="text-sm text-muted-foreground">{formatDate(selectedProperty.created_at)}</span>
            </div>

            {/* Property Info */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedProperty.registered_property_name || "Unnamed Property"}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedProperty.property_type} • {selectedProperty.property_category}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {selectedProperty.house_number} {selectedProperty.street_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {city}, {lga}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Rent</p>
                    <p className="font-medium">{formatCurrency(selectedProperty.total_annual_rent || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info - Truncated for verified properties */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Owner Information</span>
                  {isVerified && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      Truncated
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedProperty.users?.first_name} {selectedProperty.users?.last_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {isVerified
                        ? truncatePhone(selectedProperty.users?.phone_number)
                        : selectedProperty.users?.phone_number || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {isVerified
                        ? truncateEmail(selectedProperty.users?.email)
                        : selectedProperty.users?.email || "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rejection Reason (if rejected) */}
            {selectedProperty.status === "rejected" && (
              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-600">Rejection Reason</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Please review and correct the property information, then resubmit for approval.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Properties List View
  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className={`inline-flex items-center gap-2 p-2 rounded-lg ${config.bgColor} w-fit`}>
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            <SheetTitle className={config.color}>{config.title}</SheetTitle>
          </div>
          <SheetDescription>{config.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {loading ? (
            // Skeleton loader
            [...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No {status} properties found</p>
            </div>
          ) : (
            properties.map((property) => (
              <Card
                key={property.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedProperty(property)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {property.registered_property_name || "Unnamed Property"}
                        </p>
                        {getPropertyStatusBadge(property.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {property.house_number} {property.street_name}, {property.addresses?.city || "N/A"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{property.property_category}</span>
                        <span>{formatDate(property.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
