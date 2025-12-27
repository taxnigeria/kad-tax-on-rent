"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Search, Filter, Download, CheckCircle, Clock, Home, Pencil } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { PropertyDetailsSheet } from "@/components/admin/property-details-sheet"
import { EditPropertyModal } from "@/components/admin/edit-property-modal"
import { AddPropertyModal } from "@/components/admin/add-property-modal" // Added import for AddPropertyModal

type Property = {
  id: string
  property_reference: string
  registered_property_name: string
  property_type: string
  total_annual_rent: number
  verification_status: string
  status: string
  created_at: string
  street_name: string
  house_number: string
  owner_id: string
  users: {
    id: string
    first_name: string
    last_name: string
    email: string
    taxpayer_profiles: {
      kadirs_id: string
    }
  }
}

export default function AdminPropertiesPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all")
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedProperties, setSelectedProperties] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [showPropertyDetails, setShowPropertyDetails] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["admin", "super_admin", "staff"].includes(userRole)) {
        router.push("/taxpayer-dashboard")
      }
    }
  }, [user, userRole, authLoading, router])

  useEffect(() => {
    if (user && userRole && ["admin", "super_admin", "staff"].includes(userRole)) {
      fetchProperties()
    }
  }, [user, userRole])

  useEffect(() => {
    filterProperties()
  }, [searchQuery, propertyTypeFilter, verificationStatusFilter, statusFilter, properties])

  async function fetchProperties() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          id,
          property_reference,
          registered_property_name,
          property_type,
          total_annual_rent,
          verification_status,
          status,
          created_at,
          street_name,
          house_number,
          owner_id,
          users!properties_owner_id_fkey (
            id,
            first_name,
            last_name,
            email,
            taxpayer_profiles (
              kadirs_id
            )
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching properties:", error)
        setProperties([])
      } else {
        setProperties((data as any) || [])
      }
    } catch (error) {
      console.error("Error in fetchProperties:", error)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  function filterProperties() {
    let filtered = properties

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.registered_property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.property_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.users?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.users?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.users?.taxpayer_profiles?.kadirs_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.street_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (propertyTypeFilter !== "all") {
      filtered = filtered.filter((p) => p.property_type === propertyTypeFilter)
    }

    if (verificationStatusFilter !== "all") {
      filtered = filtered.filter((p) => p.verification_status === verificationStatusFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    setFilteredProperties(filtered)
    setCurrentPage(1)
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedProperties(paginatedProperties.map((p) => p.id))
    } else {
      setSelectedProperties([])
    }
  }

  function handleSelectProperty(propertyId: string, checked: boolean) {
    if (checked) {
      setSelectedProperties([...selectedProperties, propertyId])
    } else {
      setSelectedProperties(selectedProperties.filter((id) => id !== propertyId))
    }
  }

  function handleViewDetails(propertyId: string) {
    setSelectedPropertyId(propertyId)
    setShowPropertyDetails(true)
  }

  function handleExport() {
    console.log("Exporting properties:", selectedProperties.length > 0 ? selectedProperties : "all")
  }

  function handleAddProperty() {
    setShowAddPropertyModal(true)
  }

  function handleEditProperty(property: any) {
    setEditingProperty(property)
    setEditModalOpen(true)
  }

  function handleEditUpdate() {
    fetchProperties()
  }

  const totalPages = Math.ceil(filteredProperties.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex)

  const stats = {
    total: properties.length,
    verified: properties.filter((p) => p.verification_status === "approved").length,
    pending: properties.filter((p) => p.verification_status === "pending").length,
    totalRent: properties.reduce((sum, p) => sum + (p.total_annual_rent || 0), 0),
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || (userRole && !["admin", "super_admin", "staff"].includes(userRole))) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Properties Management</h1>
            </div>
            <Button className="gap-2" onClick={handleAddProperty}>
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid gap-3 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="py-3 px-4">
                  {/* Placeholder for skeleton component */}
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-4">
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Properties</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Verified</p>
                    <p className="text-lg font-bold text-green-600">{stats.verified}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Annual Rent</p>
                    <p className="text-lg font-bold">
                      ₦{stats.totalRent.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by property name, reference, owner, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verificationStatusFilter} onValueChange={setVerificationStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="needs_info">Needs Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {selectedProperties.length > 0 && (
                <Button variant="outline" size="sm" className="gap-2 h-9 bg-transparent" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export ({selectedProperties.length})
                </Button>
              )}
            </div>
          </div>

          {/* Properties Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            paginatedProperties.length > 0 && selectedProperties.length === paginatedProperties.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Property Name</TableHead>
                      <TableHead>Owner/Taxpayer</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Annual Rent</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                          <TableCell>{/* Placeholder for skeleton component */}</TableCell>
                        </TableRow>
                      ))
                    ) : paginatedProperties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {properties.length === 0
                              ? "No properties found. Add your first property to get started."
                              : "No properties match your search criteria."}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProperties.map((property) => (
                        <TableRow
                          key={property.id}
                          onClick={() => handleViewDetails(property.id)}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedProperties.includes(property.id)}
                              onCheckedChange={(checked) => handleSelectProperty(property.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{property.registered_property_name || "Unnamed Property"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {property.users?.first_name} {property.users?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {property.users?.taxpayer_profiles?.kadirs_id || "No KADIRS ID"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {property.house_number} {property.street_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {property.property_type?.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{(property.total_annual_rent || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell>
                            {property.verification_status === "approved" && (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                                Approved
                              </Badge>
                            )}
                            {property.verification_status === "pending" && (
                              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">
                                Pending
                              </Badge>
                            )}
                            {property.verification_status === "rejected" && (
                              <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">
                                Rejected
                              </Badge>
                            )}
                            {property.verification_status === "needs_info" && (
                              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">
                                Needs Info
                              </Badge>
                            )}
                            {!property.verification_status && <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(property.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleEditProperty(property)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredProperties.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredProperties.length)} of{" "}
                    {filteredProperties.length} properties
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Rows per page</span>
                      <Select
                        value={rowsPerPage.toString()}
                        onValueChange={(value) => {
                          setRowsPerPage(Number(value))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
      <AddPropertyModal
        open={showAddPropertyModal}
        onOpenChange={setShowAddPropertyModal}
        onSuccess={fetchProperties}
      />
      <PropertyDetailsSheet
        open={showPropertyDetails}
        onOpenChange={setShowPropertyDetails}
        propertyId={selectedPropertyId}
        onUpdate={fetchProperties}
      />
      <EditPropertyModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        property={editingProperty}
        onSuccess={handleEditUpdate}
      />
    </SidebarProvider>
  )
}
