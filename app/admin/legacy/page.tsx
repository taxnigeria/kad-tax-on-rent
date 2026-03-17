"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Home, 
  FileText, 
  Search, 
  RefreshCw, 
  Printer, 
  Download,
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { LegacyDataTable } from "@/components/legacy/legacy-data-table"
import { TaxpayerDetailsSheet } from "@/components/legacy/taxpayer-details-sheet"

export default function LegacyDataPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  
  const [activeTab, setActiveTab] = useState("taxpayers")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [sortConfig, setSortConfig] = useState({ field: "", order: "desc" as "asc" | "desc" })
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  // Redirect if not authorized
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["admin", "super_admin", "superadmin"].includes(userRole)) {
        router.push("/dashboard")
      }
    }
  }, [user, userRole, authLoading, router])

  const fetchData = useCallback(async (tab: string, query: string, page: number, sortField?: string, sortOrder?: string) => {
    setLoading(true)
    try {
      const field = sortField || (tab === "taxpayers" ? "displayName" : tab === "enumerations" ? "date_created" : "dateCreated")
      const order = sortOrder || "desc"
      
      const endpoint = `/api/admin/legacy/${tab}?q=${encodeURIComponent(query)}&page=${page}&sortField=${field}&sortOrder=${order}`
      const response = await fetch(endpoint)
      const result = await response.json()
      
      if (result.error) {
        toast.error(result.error)
        setData([])
      } else {
        setData(result.data || [])
        setPagination({
          page: result.pagination?.page || 1,
          limit: result.pagination?.limit || 20,
          total: result.pagination?.total || 0
        })
        if (result.pagination?.sortField) {
          setSortConfig({
            field: result.pagination.sortField,
            order: result.pagination.sortOrder as "asc" | "desc"
          })
        }
      }
    } catch (error) {
      console.error(`Error fetching legacy ${tab}:`, error)
      toast.error(`Failed to load legacy ${tab}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user && ["admin", "super_admin", "superadmin"].includes(userRole || "")) {
      // Use defaults for initial fetch
      const defaultSortField = activeTab === "taxpayers" ? "displayName" : activeTab === "enumerations" ? "date_created" : "dateCreated"
      fetchData(activeTab, searchQuery, 1, defaultSortField, "desc")
      setSelectedIds([]) // Reset selection when tab changes
    }
  }, [activeTab, user, userRole, fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData(activeTab, searchQuery, 1, sortConfig.field, sortConfig.order)
  }

  const handleSort = (field: string) => {
    const isAsc = sortConfig.field === field && sortConfig.order === "asc"
    const newOrder = isAsc ? "desc" : "asc"
    setSortConfig({ field, order: newOrder })
    fetchData(activeTab, searchQuery, 1, field, newOrder)
  }

  const handleRowClick = (item: any) => {
    if (activeTab === "taxpayers") {
      setSelectedTaxpayerId(item.uid)
      setIsDetailsOpen(true)
    } else if (activeTab === "enumerations") {
      // Logic for enumeration details
    } else if (activeTab === "invoices") {
      // Logic for invoice details
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleMigrate = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select items to migrate")
      return
    }

    setIsMigrating(true)
    try {
      const response = await fetch("/api/admin/legacy/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          ids: selectedIds
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Successfully migrated ${result.count} items to Supabase`)
        setSelectedIds([])
        fetchData(activeTab, searchQuery, pagination.page)
      } else {
        toast.error(result.error || "Migration failed")
      }
    } catch (error) {
      console.error("Migration error:", error)
      toast.error("An error occurred during migration")
    } finally {
      setIsMigrating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-col flex-1 gap-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Legacy Data Viewer</h2>
              <p className="text-muted-foreground text-xs">
                View and manage historical records from the legacy Firebase system.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {selectedIds.length > 0 && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleMigrate}
                  disabled={isMigrating}
                >
                  {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Migrate {selectedIds.length} to Supabase
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print View
              </Button>
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <Tabs defaultValue="taxpayers" className="space-y-4" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="taxpayers" className="gap-2">
                  <Users className="h-4 w-4" />
                  Taxpayers
                </TabsTrigger>
                <TabsTrigger value="enumerations" className="gap-2">
                  <Home className="h-4 w-4" />
                  Enumerations
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Invoices
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={`Search ${activeTab}...`}
                    className="pl-8 w-[250px] md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </form>
            </div>

            <TabsContent value="taxpayers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historical Taxpayers</CardTitle>
                  <CardDescription>
                    List of taxpayers from the legacy kadirsenumerator system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LegacyDataTable 
                    type={activeTab as any} 
                    data={data} 
                    loading={loading} 
                    onRowClick={handleRowClick}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    pagination={pagination}
                    onPageChange={(page: number) => fetchData(activeTab, searchQuery, page, sortConfig.field, sortConfig.order)}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enumerations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Legacy Property Enumerations</CardTitle>
                  <CardDescription>
                    Historical property records and enumeration data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LegacyDataTable 
                    type={activeTab as any} 
                    data={data} 
                    loading={loading} 
                    onRowClick={handleRowClick}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    pagination={pagination}
                    onPageChange={(page: number) => fetchData(activeTab, searchQuery, page, sortConfig.field, sortConfig.order)}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historical Invoice Bills</CardTitle>
                  <CardDescription>
                    Previous invoice records and billing history.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LegacyDataTable 
                    type={activeTab as any} 
                    data={data} 
                    loading={loading} 
                    onRowClick={handleRowClick}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    pagination={pagination}
                    onPageChange={(page: number) => fetchData(activeTab, searchQuery, page, sortConfig.field, sortConfig.order)}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <TaxpayerDetailsSheet 
          taxpayerId={selectedTaxpayerId} 
          open={isDetailsOpen} 
          onOpenChange={setIsDetailsOpen} 
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
