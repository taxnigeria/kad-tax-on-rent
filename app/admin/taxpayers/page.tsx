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
import { Users, UserPlus, AlertCircle, UserCheck, Search, Filter, Download, Pencil } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { AddTaxpayerModal } from "@/components/admin/add-taxpayer-modal"
import { TaxpayerDetailsSheet } from "@/components/admin/taxpayer-details-sheet"
import { EditTaxpayerModal } from "@/components/admin/edit-taxpayer-modal"
import {
  getTaxpayers,
  type TaxpayerWithProfile,
  bulkUpdateTaxpayerStatus,
  bulkUpdateTaxpayerSource,
  bulkDeleteTaxpayers,
  bulkGenerateKadirsIds
} from "@/app/actions/taxpayers"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminTaxpayersPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [taxpayers, setTaxpayers] = useState<TaxpayerWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [roleFilter, setRoleFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [selectedTaxpayers, setSelectedTaxpayers] = useState<string[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<string | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [sortField, setSortField] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTaxpayer, setEditingTaxpayer] = useState<any>(null)

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
      const handler = setTimeout(() => {
        fetchTaxpayers()
      }, 300)
      return () => clearTimeout(handler)
    }
  }, [user, userRole, searchQuery, statusFilter, roleFilter, sourceFilter, currentPage, rowsPerPage, sortField, sortOrder])

  async function fetchTaxpayers() {
    try {
      setLoading(true)
      const { taxpayers: data, totalCount: count, error } = await getTaxpayers({
        page: currentPage,
        pageSize: rowsPerPage,
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        source: sourceFilter,
        sortField: sortField,
        sortOrder: sortOrder
      })

      if (error) {
        console.error("Error fetching taxpayers:", error)
        setTaxpayers([])
        setTotalCount(0)
      } else {
        setTaxpayers(data || [])
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error("Error in fetchTaxpayers:", error)
      setTaxpayers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="ml-1 text-muted-foreground opacity-30">↕</span>
    return <span className="ml-1 text-primary">{sortOrder === "asc" ? "↑" : "↓"}</span>
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedTaxpayers(taxpayers.map((t) => t.id))
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

  async function handleBulkDeactivate() {
    if (selectedTaxpayers.length === 0) return

    try {
      setLoading(true)
      const result = await bulkUpdateTaxpayerStatus(selectedTaxpayers, false)
      if (result.success) {
        toast.success(`Successfully deactivated ${selectedTaxpayers.length} taxpayers`)
        setSelectedTaxpayers([])
        fetchTaxpayers()
      } else {
        toast.error(result.error || "Failed to deactivate taxpayers")
      }
    } catch (error) {
      toast.error("An error occurred during bulk deactivation")
    } finally {
      setLoading(false)
    }
  }

  async function handleBulkDelete() {
    if (selectedTaxpayers.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedTaxpayers.length} taxpayers? This action cannot be undone.`)) return

    try {
      setLoading(true)
      const result = await bulkDeleteTaxpayers(selectedTaxpayers)
      if (result.success) {
        toast.success(`Successfully deleted ${selectedTaxpayers.length} taxpayers`)
        setSelectedTaxpayers([])
        fetchTaxpayers()
      } else {
        toast.error(result.error || "Failed to delete taxpayers")
      }
    } catch (error) {
      toast.error("An error occurred during bulk deletion")
    } finally {
      setLoading(false)
    }
  }

  async function handleBulkChangeSource(source: string) {
    if (selectedTaxpayers.length === 0) return

    try {
      setLoading(true)
      const result = await bulkUpdateTaxpayerSource(selectedTaxpayers, source)
      if (result.success) {
        toast.success(`Successfully updated source for ${selectedTaxpayers.length} taxpayers`)
        setSelectedTaxpayers([])
        fetchTaxpayers()
      } else {
        toast.error(result.error || "Failed to update source")
      }
    } catch (error) {
      toast.error("An error occurred while changing source")
    } finally {
      setLoading(false)
    }
  }

  async function handleBulkGenerateKadirs() {
    toast.info("Bulk KADIRS ID generation initiated", {
      description: "This process may take some time depending on the number of records."
    })

    const result = await bulkGenerateKadirsIds(selectedTaxpayers)
    if (result.success) {
      toast.success("Bulk Generation Complete", {
        description: (result as any).message
      })
      setSelectedTaxpayers([])
      fetchTaxpayers()
    } else {
      toast.warning("Bulk Generation Limited", {
        description: result.error
      })
    }
  }

  function handleEditTaxpayer(taxpayer: TaxpayerWithProfile) {
    setEditingTaxpayer({
      id: taxpayer.taxpayer_profiles?.id,
      user_id: taxpayer.id,
      kadirs_id: taxpayer.taxpayer_profiles?.kadirs_id,
      first_name: taxpayer.first_name,
      last_name: taxpayer.last_name,
      middle_name: taxpayer.middle_name,
      email: taxpayer.email,
      phone_number: taxpayer.phone_number,
      is_active: taxpayer.is_active,
      ...taxpayer.taxpayer_profiles,
    })
    setEditModalOpen(true)
  }

  const totalPages = Math.ceil(totalCount / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + taxpayers.length

  const stats = {
    total: totalCount,
    active: taxpayers.filter((t) => t.is_active).length, // Note: This is now just for the current page
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
            <div className="grid gap-3 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="py-3 px-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-5 w-16" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-4">
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Taxpayers</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active</p>
                    <p className="text-lg font-bold text-green-600">{stats.active}</p>
                  </div>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Inactive</p>
                    <p className="text-lg font-bold text-red-600">{stats.inactive}</p>
                  </div>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              </Card>

              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">New This Month</p>
                    <p className="text-lg font-bold text-blue-600">{stats.newThisMonth}</p>
                  </div>
                  <UserPlus className="h-4 w-4 text-blue-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, TIN, or KADIRS ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9">
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
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="taxpayer">Taxpayer</SelectItem>
                  <SelectItem value="property_manager">Property Manager</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="enumerator">Enumerator</SelectItem>
                  <SelectItem value="agent">Agent/Manager</SelectItem>
                  <SelectItem value="self">Self-Registered</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>

              {selectedTaxpayers.length > 0 && (
                <Button variant="outline" size="sm" className="gap-2 h-9 bg-transparent" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export ({selectedTaxpayers.length})
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedTaxpayers.length > 0 && (
            <div className="sticky top-2 z-30 flex items-center justify-between bg-primary px-4 py-2 rounded-lg shadow-lg text-primary-foreground animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-none">
                  {selectedTaxpayers.length} Selected
                </Badge>
                <div className="h-4 w-px bg-primary-foreground/20 mx-1" />
                <p className="text-sm font-medium hidden md:block">Bulk Actions:</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] font-semibold hover:bg-primary-foreground/10 text-primary-foreground gap-1.5"
                  onClick={handleBulkDeactivate}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Deactivate
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] font-semibold hover:bg-primary-foreground/10 text-primary-foreground gap-1.5"
                  onClick={handleBulkGenerateKadirs}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Generate KADIRS ID
                </Button>

                <Select onValueChange={handleBulkChangeSource}>
                  <SelectTrigger className="h-8 w-[130px] bg-primary-foreground/10 border-none text-[11px] font-semibold text-primary-foreground">
                    <SelectValue placeholder="Change Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="enumerator">Enumerator</SelectItem>
                    <SelectItem value="agent">Agent/Manager</SelectItem>
                    <SelectItem value="self">Self-Registered</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-4 w-px bg-primary-foreground/20 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] font-semibold hover:bg-red-500/20 text-red-100 gap-1.5"
                  onClick={handleBulkDelete}
                >
                  <Pencil className="h-3.5 w-3.5 text-red-200" />
                  Delete
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-primary-foreground/20 ml-2"
                  onClick={() => setSelectedTaxpayers([])}
                >
                  <span className="text-xs">×</span>
                </Button>
              </div>
            </div>
          )}

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
                            taxpayers.length > 0 && selectedTaxpayers.length === taxpayers.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-12">SN</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("first_name")}>
                        Taxpayer <SortIcon field="first_name" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                        Contact <SortIcon field="email" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("role")}>
                        Role <SortIcon field="role" />
                      </TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("is_active")}>
                        Status <SortIcon field="is_active" />
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                        Registered <SortIcon field="created_at" />
                      </TableHead>
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
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
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
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : taxpayers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {totalCount === 0
                              ? "No taxpayers found. Add your first taxpayer to get started."
                              : "No taxpayers match your search criteria."}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      taxpayers.map((taxpayer, index) => (
                        <TableRow
                          key={taxpayer.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewDetails(taxpayer.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedTaxpayers.includes(taxpayer.id)}
                              onCheckedChange={(checked) => handleSelectTaxpayer(taxpayer.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold capitalize text-sm">
                                {taxpayer.first_name} {taxpayer.last_name}
                              </span>
                              <span className="text-[11px] text-muted-foreground uppercase font-mono">
                                {taxpayer.taxpayer_profiles?.kadirs_id || "NO KADIRS ID"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm lowercase">{taxpayer.email}</span>
                              <span className="text-xs text-muted-foreground">{taxpayer.phone_number || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {taxpayer.role?.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-[10px] py-0 h-5">
                              {taxpayer.taxpayer_profiles?.registration_source || "unknown"}
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
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleEditTaxpayer(taxpayer)}>
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
              {taxpayers.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of{" "}
                    {totalCount} taxpayers
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
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="150">150</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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

      <EditTaxpayerModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        taxpayer={editingTaxpayer}
        onSuccess={fetchTaxpayers}
      />
    </SidebarProvider>
  )
}
