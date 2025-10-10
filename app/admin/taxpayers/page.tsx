"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, AlertCircle, UserCheck, Search, Filter, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AddTaxpayerModal } from "@/components/admin/add-taxpayer-modal"
import { TaxpayerDetailsSheet } from "@/components/admin/taxpayer-details-sheet"
import { getTaxpayers, type TaxpayerWithProfile } from "@/app/actions/taxpayers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminTaxpayersPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [taxpayers, setTaxpayers] = useState<TaxpayerWithProfile[]>([])
  const [filteredTaxpayers, setFilteredTaxpayers] = useState<TaxpayerWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedTaxpayers, setSelectedTaxpayers] = useState<string[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<string | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)

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
      fetchTaxpayers()
    }
  }, [user, userRole])

  useEffect(() => {
    filterTaxpayers()
  }, [searchQuery, statusFilter, roleFilter, taxpayers])

  async function fetchTaxpayers() {
    try {
      setLoading(true)
      const { taxpayers: data, error } = await getTaxpayers()
      if (error) {
        console.error("Error fetching taxpayers:", error)
        setTaxpayers([])
      } else {
        setTaxpayers(data || [])
      }
    } catch (error) {
      console.error("Error in fetchTaxpayers:", error)
      setTaxpayers([])
    } finally {
      setLoading(false)
    }
  }

  function filterTaxpayers() {
    let filtered = taxpayers

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.taxpayer_profiles?.kadirs_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.taxpayer_profiles?.tax_id_or_nin?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => {
        if (statusFilter === "active") return t.is_active
        if (statusFilter === "inactive") return !t.is_active
        return true
      })
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((t) => t.role === roleFilter)
    }

    setFilteredTaxpayers(filtered)
    setCurrentPage(1)
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedTaxpayers(paginatedTaxpayers.map((t) => t.id))
    } else {
      setSelectedTaxpayers([])
    }
  }

  function handleSelectTaxpayer(taxpayerId: string, checked: boolean) {
    if (checked) {
      setSelectedTaxpayers([...selectedTaxpayers, taxpayerId])
    } else {
      setSelectedTaxpayers(selectedTaxpayers.filter((id) => id !== taxpayerId))
    }
  }

  function handleViewDetails(taxpayerId: string) {
    setSelectedTaxpayerId(taxpayerId)
    setIsDetailsSheetOpen(true)
  }

  function handleExport() {
    // TODO: Implement CSV export
    console.log("Exporting taxpayers:", selectedTaxpayers.length > 0 ? selectedTaxpayers : "all")
  }

  const totalPages = Math.ceil(filteredTaxpayers.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedTaxpayers = filteredTaxpayers.slice(startIndex, endIndex)

  const stats = {
    total: taxpayers.length,
    active: taxpayers.filter((t) => t.is_active).length,
    inactive: taxpayers.filter((t) => !t.is_active).length,
    newThisMonth: taxpayers.filter((t) => {
      const createdDate = new Date(t.created_at)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    }).length,
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
              <h1 className="text-lg font-bold tracking-tight">Taxpayers</h1>
            </div>
            <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Add Taxpayer
            </Button>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Total Taxpayers</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">Registered accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Active</CardTitle>
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-3xl font-bold">{stats.active}</div>
                  <p className="text-sm text-muted-foreground">Active accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">Inactive</CardTitle>
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-3xl font-bold">{stats.inactive}</div>
                  <p className="text-sm text-muted-foreground">Inactive accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-semibold">New This Month</CardTitle>
                  <UserPlus className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-3xl font-bold">{stats.newThisMonth}</div>
                  <p className="text-sm text-muted-foreground">Recent registrations</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, TIN, or KADIRS ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="taxpayer">Taxpayer</SelectItem>
                      <SelectItem value="property_manager">Property Manager</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedTaxpayers.length > 0 && (
                    <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
                      <Download className="h-4 w-4" />
                      Export ({selectedTaxpayers.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taxpayers Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            paginatedTaxpayers.length > 0 && selectedTaxpayers.length === paginatedTaxpayers.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>KADIRS ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedTaxpayers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {taxpayers.length === 0
                              ? "No taxpayers found. Add your first taxpayer to get started."
                              : "No taxpayers match your search criteria."}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTaxpayers.map((taxpayer) => (
                        <TableRow key={taxpayer.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTaxpayers.includes(taxpayer.id)}
                              onCheckedChange={(checked) => handleSelectTaxpayer(taxpayer.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {taxpayer.taxpayer_profiles?.kadirs_id || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {taxpayer.first_name} {taxpayer.middle_name} {taxpayer.last_name}
                            </div>
                            {taxpayer.taxpayer_profiles?.business_name && (
                              <div className="text-xs text-muted-foreground">
                                {taxpayer.taxpayer_profiles.business_name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{taxpayer.email}</TableCell>
                          <TableCell>{taxpayer.phone_number || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {taxpayer.role?.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {taxpayer.is_active ? (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(taxpayer.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(taxpayer.id)}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredTaxpayers.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredTaxpayers.length)} of{" "}
                    {filteredTaxpayers.length} taxpayers
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

      <AddTaxpayerModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onSuccess={fetchTaxpayers} />

      <TaxpayerDetailsSheet
        open={isDetailsSheetOpen}
        onOpenChange={setIsDetailsSheetOpen}
        taxpayerId={selectedTaxpayerId}
        onUpdate={fetchTaxpayers}
      />
    </SidebarProvider>
  )
}
