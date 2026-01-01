"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { TaxpayerHeader } from "@/components/taxpayer-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Search, Plus, MapPin, Calendar, DollarSign, Home, Filter, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RegisterPropertyModal } from "@/components/register-property-modal"
import { getPropertiesByFirebaseUid } from "@/app/actions/get-properties"
import { TaxpayerPropertyDetailsSheet } from "@/components/taxpayer/property-details-sheet"
import { getProfileCompletionStatus } from "@/app/actions/verification"
import { toast } from "@/components/ui/use-toast"

type Property = {
  id: string
  property_reference: string
  registered_property_name: string
  property_type: string
  property_category: string
  street_name: string
  house_number: string
  total_annual_rent: number
  total_units: number
  occupied_units: number
  verification_status: string
  status: string
  created_at: string
  addresses: {
    street_address: string
    city: string
    state: string
    lga: string
  }
}

export default function PropertiesPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [ownedProperties, setOwnedProperties] = useState<Property[]>([])
  const [managedProperties, setManagedProperties] = useState<Property[]>([])
  const [filteredOwnedProperties, setFilteredOwnedProperties] = useState<Property[]>([])
  const [filteredManagedProperties, setFilteredManagedProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [isPropertySheetOpen, setIsPropertySheetOpen] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState<{
    emailVerified: boolean
    phoneVerified: boolean
    kadirsIdGenerated: boolean
  } | null>(null)
  const [activeTab, setActiveTab] = useState("owned")

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setLoading(false)
        router.push("/login")
      } else if (userRole && !["taxpayer", "property_manager"].includes(userRole)) {
        setLoading(false)
        router.push("/dashboard")
      }
    }
  }, [user, userRole, authLoading, router])

  const fetchProperties = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    try {
      const { ownedProperties: owned, managedProperties: managed, error } = await getPropertiesByFirebaseUid(user.uid)

      if (error) {
        console.error("[v0] Error fetching properties:", error)
        setOwnedProperties([])
        setManagedProperties([])
      } else {
        setOwnedProperties(owned || [])
        setManagedProperties(managed || [])
      }
    } catch (error) {
      console.error("[v0] Error in fetchProperties:", error)
      setOwnedProperties([])
      setManagedProperties([])
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    if (user?.uid) {
      fetchProperties()
    }
  }, [user?.uid, fetchProperties])

  useEffect(() => {
    filterProperties()
  }, [searchQuery, typeFilter, statusFilter, ownedProperties, managedProperties])

  function filterProperties() {
    const filterList = (properties: Property[]) => {
      let filtered = properties

      if (searchQuery) {
        filtered = filtered.filter(
          (p) =>
            p.registered_property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.property_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.street_name?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      }

      if (typeFilter !== "all") {
        filtered = filtered.filter((p) => p.property_type === typeFilter)
      }

      if (statusFilter !== "all") {
        filtered = filtered.filter((p) => p.verification_status === statusFilter)
      }

      return filtered
    }

    setFilteredOwnedProperties(filterList(ownedProperties))
    setFilteredManagedProperties(filterList(managedProperties))
  }

  const ownedStats = {
    total: ownedProperties.length,
    verified: ownedProperties.filter((p) => p.verification_status === "approved").length,
    pending: ownedProperties.filter((p) => p.verification_status === "pending").length,
    totalRent: ownedProperties.reduce((sum, p) => sum + (p.total_annual_rent || 0), 0),
  }

  const managedStats = {
    total: managedProperties.length,
    verified: managedProperties.filter((p) => p.verification_status === "approved").length,
    pending: managedProperties.filter((p) => p.verification_status === "pending").length,
    totalRent: managedProperties.reduce((sum, p) => sum + (p.total_annual_rent || 0), 0),
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { label: string; className: string }> = {
      approved: { label: "Verified", className: "bg-green-500/10 text-green-500 border-green-500/20" },
      pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      rejected: { label: "Rejected", className: "bg-red-500/10 text-red-500 border-red-500/20" },
      needs_info: { label: "Needs Info", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  useEffect(() => {
    const fetchProfileCompletion = async () => {
      if (user?.uid) {
        const result = await getProfileCompletionStatus(user.uid)
        if (result.success) {
          setProfileCompletion(result.items)
        }
      }
    }
    fetchProfileCompletion()
  }, [user?.uid])

  const handleRegisterPropertyClick = () => {
    if (!profileCompletion) {
      toast({
        title: "Loading profile...",
        description: "Please wait while we check your profile status",
      })
      return
    }

    const missingItems: string[] = []
    if (!profileCompletion.emailVerified) missingItems.push("Email verification")
    if (!profileCompletion.phoneVerified) missingItems.push("Phone verification")
    if (!profileCompletion.kadirsIdGenerated) missingItems.push("KADIRS ID")

    if (missingItems.length > 0) {
      toast({
        title: "Complete Your Profile First",
        description: `Please complete the following: ${missingItems.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setIsRegisterModalOpen(true)
  }

  if (!user || (userRole && !["taxpayer", "property_manager"].includes(userRole))) {
    if (authLoading) {
      return (
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <TaxpayerSidebar variant="inset" />
          <SidebarInset>
            <TaxpayerHeader />
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </div>
          </SidebarInset>
          <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />
        </SidebarProvider>
      )
    }
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <TaxpayerSidebar variant="inset" />
      <SidebarInset>
        <TaxpayerHeader />
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading properties...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-lg font-bold tracking-tight">Properties</h1>
                  </div>
                  <Button className="gap-2" onClick={handleRegisterPropertyClick}>
                    <Plus className="h-4 w-4" />
                    Register Property
                  </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-fit">
                    <TabsTrigger value="owned">
                      My Properties
                      <span className="ml-2 text-xs font-semibold text-muted-foreground">{ownedProperties.length}</span>
                    </TabsTrigger>
                    {userRole === "property_manager" && (
                      <TabsTrigger value="managed">
                        Managed Properties
                        <span className="ml-2 text-xs font-semibold text-muted-foreground">
                          {managedProperties.length}
                        </span>
                      </TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="owned" className="space-y-6">
                    {/* Owned Properties Stats */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="text-2xl font-bold">{ownedStats.total}</div>
                          <p className="text-xs text-muted-foreground mt-1">{ownedStats.verified} verified</p>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Verified</CardTitle>
                          <Home className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="text-2xl font-bold">{ownedStats.verified}</div>
                          <p className="text-xs text-muted-foreground mt-1">Active properties</p>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                          <Calendar className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="text-2xl font-bold">{ownedStats.pending}</div>
                          <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Annual Rent</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="text-2xl font-bold">₦{ownedStats.totalRent.toLocaleString()}</div>
                          <p className="text-xs text-muted-foreground mt-1">Across all properties</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, reference, or address..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="w-[160px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Property Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="approved">Verified</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="needs_info">Needs Info</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Owned Properties List */}
                    {filteredOwnedProperties.length === 0 ? (
                      <Card className="border-border/50">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                          <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">
                            {ownedProperties.length === 0 ? "No properties yet" : "No properties found"}
                          </h3>
                          <p className="text-muted-foreground text-center mb-6 max-w-md">
                            {ownedProperties.length === 0
                              ? "Get started by registering your first property to begin managing your tax obligations."
                              : "Try adjusting your search or filter criteria."}
                          </p>
                          {ownedProperties.length === 0 && (
                            <Button className="gap-2" onClick={handleRegisterPropertyClick}>
                              <Plus className="h-4 w-4" />
                              Register Your First Property
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredOwnedProperties.map((property) => (
                          <Card
                            key={property.id}
                            className="border-border/50 hover:border-primary/50 transition-colors"
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base truncate">
                                    {property.registered_property_name || "Unnamed Property"}
                                  </CardTitle>
                                  <CardDescription className="text-xs mt-1">
                                    {property.property_reference}
                                  </CardDescription>
                                </div>
                                {getStatusBadge(property.verification_status)}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <span className="text-muted-foreground">
                                    {property.house_number} {property.street_name}
                                    {property.addresses && (
                                      <>
                                        , {property.addresses.city}, {property.addresses.state}
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground capitalize">
                                    {property.property_type} • {property.property_category}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    ₦{property.total_annual_rent?.toLocaleString() || 0} / year
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Home className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {property.occupied_units || 0} / {property.total_units || 0} units occupied
                                  </span>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-border/50">
                                <Button
                                  variant="outline"
                                  className="w-full bg-transparent"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPropertyId(property.id)
                                    setIsPropertySheetOpen(true)
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {userRole === "property_manager" && (
                    <TabsContent value="managed" className="space-y-6">
                      {/* Managed Properties Stats */}
                      <div className="grid gap-4 md:grid-cols-4">
                        <Card className="border-border/50">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Managed</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="text-2xl font-bold">{managedStats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">{managedStats.verified} verified</p>
                          </CardContent>
                        </Card>

                        <Card className="border-border/50">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Verified</CardTitle>
                            <Home className="h-4 w-4 text-green-500" />
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="text-2xl font-bold">{managedStats.verified}</div>
                            <p className="text-xs text-muted-foreground mt-1">Active properties</p>
                          </CardContent>
                        </Card>

                        <Card className="border-border/50">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                            <Calendar className="h-4 w-4 text-yellow-500" />
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="text-2xl font-bold">{managedStats.pending}</div>
                            <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
                          </CardContent>
                        </Card>

                        <Card className="border-border/50">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Annual Rent</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="text-2xl font-bold">₦{managedStats.totalRent.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Across all managed properties</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Filters */}
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search by name, reference, or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[160px]">
                              <Filter className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Property Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="residential">Residential</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="industrial">Industrial</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="approved">Verified</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="needs_info">Needs Info</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Managed Properties List */}
                      {filteredManagedProperties.length === 0 ? (
                        <Card className="border-border/50">
                          <CardContent className="flex flex-col items-center justify-center py-16">
                            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                              {managedProperties.length === 0 ? "No managed properties yet" : "No properties found"}
                            </h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                              {managedProperties.length === 0
                                ? "You don't have any properties assigned to you for management yet."
                                : "Try adjusting your search or filter criteria."}
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {filteredManagedProperties.map((property) => (
                            <Card
                              key={property.id}
                              className="border-border/50 hover:border-primary/50 transition-colors"
                            >
                              <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base truncate">
                                      {property.registered_property_name || "Unnamed Property"}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                      {property.property_reference}
                                    </CardDescription>
                                  </div>
                                  {getStatusBadge(property.verification_status)}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">
                                      {property.house_number} {property.street_name}
                                      {property.addresses && (
                                        <>
                                          , {property.addresses.city}, {property.addresses.state}
                                        </>
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground capitalize">
                                      {property.property_type} • {property.property_category}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      ₦{property.total_annual_rent?.toLocaleString() || 0} / year
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Home className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      {property.occupied_units || 0} / {property.total_units || 0} units occupied
                                    </span>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-border/50">
                                  <Button
                                    variant="outline"
                                    className="w-full bg-transparent"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPropertyId(property.id)
                                      setIsPropertySheetOpen(true)
                                    }}
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
      <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />
      <RegisterPropertyModal
        open={isRegisterModalOpen}
        onOpenChange={setIsRegisterModalOpen}
        onSuccess={fetchProperties}
      />
      <TaxpayerPropertyDetailsSheet
        open={isPropertySheetOpen}
        onOpenChange={setIsPropertySheetOpen}
        propertyId={selectedPropertyId}
      />
    </SidebarProvider>
  )
}
