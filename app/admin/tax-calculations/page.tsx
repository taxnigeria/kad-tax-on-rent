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
import { Calculator, Search, Filter, Download, DollarSign, TrendingUp, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createBrowserClient } from "@supabase/ssr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TaxCalculationDetailsSheet from "@/components/admin/tax-calculation-details-sheet"

type TaxCalculation = {
  id: string
  property_id: string
  tax_year: number
  annual_rent: number
  tax_rate: number
  base_tax_amount: number
  backlog_tax_amount: number
  penalty_amount: number
  interest_amount: number
  total_tax_due: number
  calculation_date: string
  is_active: boolean
  created_at: string
  properties: {
    id: string
    property_reference: string
    registered_property_name: string
    property_type: string
    owner_id: string
    users: {
      first_name: string
      last_name: string
      taxpayer_profiles: Array<{
        kadirs_id: string
      }>
    }
  }
  invoices: Array<{
    id: string
    invoice_number: string
    payment_status: string
    total_amount: number
  }>
}

export default function TaxCalculationsPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [calculations, setCalculations] = useState<TaxCalculation[]>([])
  const [filteredCalculations, setFilteredCalculations] = useState<TaxCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState("all")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false)
  const [selectedCalculationId, setSelectedCalculationId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

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
      fetchCalculations()
    }
  }, [user, userRole])

  useEffect(() => {
    filterCalculations()
  }, [searchQuery, yearFilter, propertyTypeFilter, statusFilter, calculations])

  async function fetchCalculations() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("tax_calculations")
        .select(
          `
          *,
          properties!inner (
            id,
            property_reference,
            registered_property_name,
            property_type,
            owner_id,
            users!properties_owner_id_fkey (
              first_name,
              last_name,
              taxpayer_profiles (
                kadirs_id
              )
            )
          ),
          invoices (
            id,
            invoice_number,
            payment_status,
            total_amount
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching tax calculations:", error)
        setCalculations([])
      } else {
        setCalculations((data as any) || [])
      }
    } catch (error) {
      console.error("Error in fetchCalculations:", error)
      setCalculations([])
    } finally {
      setLoading(false)
    }
  }

  function filterCalculations() {
    let filtered = calculations

    if (searchQuery) {
      filtered = filtered.filter(
        (calc) =>
          calc.properties?.registered_property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          calc.properties?.property_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          calc.properties?.users?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          calc.properties?.users?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          calc.properties?.users?.taxpayer_profiles?.[0]?.kadirs_id
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          calc.tax_year.toString().includes(searchQuery),
      )
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((calc) => calc.tax_year.toString() === yearFilter)
    }

    if (propertyTypeFilter !== "all") {
      filtered = filtered.filter((calc) => calc.properties?.property_type === propertyTypeFilter)
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((calc) => calc.is_active)
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((calc) => !calc.is_active)
      } else if (statusFilter === "invoiced") {
        filtered = filtered.filter((calc) => calc.invoices && calc.invoices.length > 0)
      } else if (statusFilter === "not_invoiced") {
        filtered = filtered.filter((calc) => !calc.invoices || calc.invoices.length === 0)
      }
    }

    setFilteredCalculations(filtered)
    setCurrentPage(1)
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedCalculations(paginatedCalculations.map((c) => c.id))
    } else {
      setSelectedCalculations([])
    }
  }

  function handleSelectCalculation(calcId: string, checked: boolean) {
    if (checked) {
      setSelectedCalculations([...selectedCalculations, calcId])
    } else {
      setSelectedCalculations(selectedCalculations.filter((id) => id !== calcId))
    }
  }

  function handleExport() {
    console.log("Exporting calculations:", selectedCalculations.length > 0 ? selectedCalculations : "all")
  }

  function handleViewCalculation(calcId: string) {
    setSelectedCalculationId(calcId)
    setDetailsSheetOpen(true)
  }

  const totalPages = Math.ceil(filteredCalculations.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedCalculations = filteredCalculations.slice(startIndex, endIndex)

  // Get unique years for filter
  const availableYears = Array.from(new Set(calculations.map((c) => c.tax_year))).sort((a, b) => b - a)

  const stats = {
    total: calculations.length,
    totalTaxDue: calculations.reduce((sum, c) => sum + (c.total_tax_due || 0), 0),
    invoiced: calculations.filter((c) => c.invoices && c.invoices.length > 0).length,
    active: calculations.filter((c) => c.is_active).length,
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
              <h1 className="text-3xl font-bold tracking-tight">Tax Calculations</h1>
              <p className="text-muted-foreground mt-1">View and manage all property tax calculations</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calculations</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">All tax calculations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tax Due</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{stats.totalTaxDue.toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Combined tax amount</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoiced</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.invoiced}</div>
                <p className="text-xs text-muted-foreground mt-1">With invoices generated</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Calculations</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently active</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-3">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by property, owner, KADIRS ID, or year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tax Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="mixed">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="invoiced">Invoiced</SelectItem>
                      <SelectItem value="not_invoiced">Not Invoiced</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedCalculations.length > 0 && (
                    <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExport}>
                      <Download className="h-4 w-4" />
                      Export ({selectedCalculations.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Calculations Table */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Calculations</TabsTrigger>
              <TabsTrigger value="current-year">Current Year</TabsTrigger>
              <TabsTrigger value="backlog">Backlog</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted hover:bg-muted">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                paginatedCalculations.length > 0 &&
                                selectedCalculations.length === paginatedCalculations.length
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Tax Year</TableHead>
                          <TableHead>Base Tax</TableHead>
                          <TableHead>Backlog</TableHead>
                          <TableHead>Penalty</TableHead>
                          <TableHead>Interest</TableHead>
                          <TableHead>Total Due</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCalculations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={13} className="text-center py-12">
                              <Calculator className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                              <p className="text-muted-foreground">
                                {calculations.length === 0
                                  ? "No tax calculations found."
                                  : "No calculations match your search criteria."}
                              </p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedCalculations.map((calc) => (
                            <TableRow key={calc.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedCalculations.includes(calc.id)}
                                  onCheckedChange={(checked) => handleSelectCalculation(calc.id, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {calc.properties?.registered_property_name || "Unnamed Property"}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {calc.properties?.property_reference}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {calc.properties?.users?.first_name} {calc.properties?.users?.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {calc.properties?.users?.taxpayer_profiles?.[0]?.kadirs_id || "No KADIRS ID"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {calc.tax_year}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                ₦{(calc.base_tax_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className="font-medium">
                                ₦{(calc.backlog_tax_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className="font-medium">
                                ₦{(calc.penalty_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className="font-medium">
                                ₦{(calc.interest_amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className="font-bold">
                                ₦{(calc.total_tax_due || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell>
                                {calc.invoices && calc.invoices.length > 0 ? (
                                  <div>
                                    <div className="text-sm font-mono">{calc.invoices[0].invoice_number}</div>
                                    <Badge
                                      variant="outline"
                                      className={
                                        calc.invoices[0].payment_status === "paid"
                                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                                          : calc.invoices[0].payment_status === "partially_paid"
                                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                                      }
                                    >
                                      {calc.invoices[0].payment_status}
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No invoice</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {calc.is_active ? (
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleViewCalculation(calc.id)}>
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredCalculations.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredCalculations.length)} of{" "}
                        {filteredCalculations.length} calculations
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
            </TabsContent>

            <TabsContent value="current-year" className="mt-4">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Filter by current year ({new Date().getFullYear()}) to view calculations
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backlog" className="mt-4">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Filter by previous years to view backlog calculations</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      <TaxCalculationDetailsSheet
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        calculationId={selectedCalculationId}
        onUpdate={fetchCalculations}
      />
    </SidebarProvider>
  )
}
