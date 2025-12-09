"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Search,
  MoreHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Map,
  Landmark,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const PER_PAGE = 50

interface AreaOffice {
  id: string
  area_office_id: number
  name: string
  address: string
  phone_number?: string
  email?: string
  is_active: boolean
  created_at: string
  lgas_count?: number
  cities_count?: number
}

interface LGA {
  id: string
  lga_id?: number
  name: string
  state: string
  area_office_id?: string
  area_office_name?: string
  created_at: string
  cities_count?: number
}

interface City {
  id: string
  name: string
  state: string
  lga_id: string
  lga_name?: string
  area_office_id: string
  area_office_name?: string
  created_at: string
  properties_count?: number
}

export default function LocationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Tab state
  const [activeTab, setActiveTab] = useState("area-offices")

  // Area Offices state
  const [areaOffices, setAreaOffices] = useState<AreaOffice[]>([])
  const [areaOfficesLoading, setAreaOfficesLoading] = useState(true)
  const [areaOfficeSearch, setAreaOfficeSearch] = useState("")
  const [areaOfficePage, setAreaOfficePage] = useState(1)
  const [selectedAreaOffice, setSelectedAreaOffice] = useState<AreaOffice | null>(null)
  const [areaOfficeSheetOpen, setAreaOfficeSheetOpen] = useState(false)

  // LGAs state
  const [lgas, setLgas] = useState<LGA[]>([])
  const [lgasLoading, setLgasLoading] = useState(true)
  const [lgaSearch, setLgaSearch] = useState("")
  const [lgaPage, setLgaPage] = useState(1)
  const [lgaAreaOfficeFilter, setLgaAreaOfficeFilter] = useState("all")
  const [selectedLga, setSelectedLga] = useState<LGA | null>(null)
  const [lgaSheetOpen, setLgaSheetOpen] = useState(false)

  // Cities state
  const [cities, setCities] = useState<City[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [citySearch, setCitySearch] = useState("")
  const [cityPage, setCityPage] = useState(1)
  const [cityLgaFilter, setCityLgaFilter] = useState("all")
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [citySheetOpen, setCitySheetOpen] = useState(false)

  // Add/Edit dialogs
  const [addAreaOfficeOpen, setAddAreaOfficeOpen] = useState(false)
  const [addLgaOpen, setAddLgaOpen] = useState(false)
  const [addCityOpen, setAddCityOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Delete dialogs
  const [deleteAreaOfficeOpen, setDeleteAreaOfficeOpen] = useState(false)
  const [deleteLgaOpen, setDeleteLgaOpen] = useState(false)
  const [deleteCityOpen, setDeleteCityOpen] = useState(false)

  // Form states
  const [areaOfficeForm, setAreaOfficeForm] = useState({ name: "", address: "", phone_number: "", email: "" })
  const [lgaForm, setLgaForm] = useState({ name: "", state: "Kaduna", area_office_id: "" })
  const [cityForm, setCityForm] = useState({ name: "", state: "Kaduna", lga_id: "", area_office_id: "" })

  // Related data for side panels
  const [areaOfficeLgas, setAreaOfficeLgas] = useState<LGA[]>([])
  const [lgaCities, setLgaCities] = useState<City[]>([])

  // Fetch Area Offices
  const fetchAreaOffices = async () => {
    setAreaOfficesLoading(true)
    try {
      // Fetch area offices with counts
      const { data: offices, error } = await supabase.from("area_offices").select("*").order("name")

      if (error) throw error

      // Get LGA counts per area office
      const { data: lgaCounts } = await supabase.from("lgas").select("area_office_id")

      // Get city counts per area office
      const { data: cityCounts } = await supabase.from("cities").select("area_office_id")

      const officesWithCounts = (offices || []).map((office) => ({
        ...office,
        is_active: office.is_active ?? true,
        lgas_count: lgaCounts?.filter((l) => l.area_office_id === office.id).length || 0,
        cities_count: cityCounts?.filter((c) => c.area_office_id === office.id).length || 0,
      }))

      setAreaOffices(officesWithCounts)
    } catch (error) {
      console.error("Error fetching area offices:", error)
      toast.error("Failed to fetch area offices")
    } finally {
      setAreaOfficesLoading(false)
    }
  }

  // Fetch LGAs
  const fetchLgas = async () => {
    setLgasLoading(true)
    try {
      const { data, error } = await supabase
        .from("lgas")
        .select(`
          *,
          area_offices(name)
        `)
        .order("name")

      if (error) throw error

      // Get city counts per LGA
      const { data: cityCounts } = await supabase.from("cities").select("lga_id")

      const lgasWithCounts = (data || []).map((lga) => ({
        ...lga,
        area_office_name: lga.area_offices?.name,
        cities_count: cityCounts?.filter((c) => c.lga_id === lga.id).length || 0,
      }))

      setLgas(lgasWithCounts)
    } catch (error) {
      console.error("Error fetching LGAs:", error)
      toast.error("Failed to fetch LGAs")
    } finally {
      setLgasLoading(false)
    }
  }

  // Fetch Cities
  const fetchCities = async () => {
    setCitiesLoading(true)
    try {
      const { data, error } = await supabase
        .from("cities")
        .select(`
          *,
          lgas(name),
          area_offices(name)
        `)
        .order("name")

      if (error) throw error

      // Get property counts per city
      const { data: propCounts } = await supabase.from("properties").select("city")

      const citiesWithCounts = (data || []).map((city) => ({
        ...city,
        lga_name: city.lgas?.name,
        area_office_name: city.area_offices?.name,
        properties_count: propCounts?.filter((p) => p.city?.toLowerCase() === city.name?.toLowerCase()).length || 0,
      }))

      setCities(citiesWithCounts)
    } catch (error) {
      console.error("Error fetching cities:", error)
      toast.error("Failed to fetch cities")
    } finally {
      setCitiesLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    fetchAreaOffices()
    fetchLgas()
    fetchCities()
  }, [user, authLoading])

  // Filtered and paginated data
  const filteredAreaOffices = useMemo(() => {
    return areaOffices.filter(
      (o) =>
        o.name.toLowerCase().includes(areaOfficeSearch.toLowerCase()) ||
        o.address?.toLowerCase().includes(areaOfficeSearch.toLowerCase()),
    )
  }, [areaOffices, areaOfficeSearch])

  const paginatedAreaOffices = useMemo(() => {
    const start = (areaOfficePage - 1) * PER_PAGE
    return filteredAreaOffices.slice(start, start + PER_PAGE)
  }, [filteredAreaOffices, areaOfficePage])

  const filteredLgas = useMemo(() => {
    return lgas.filter((l) => {
      const matchesSearch = l.name.toLowerCase().includes(lgaSearch.toLowerCase())
      const matchesOffice = lgaAreaOfficeFilter === "all" || l.area_office_id === lgaAreaOfficeFilter
      return matchesSearch && matchesOffice
    })
  }, [lgas, lgaSearch, lgaAreaOfficeFilter])

  const paginatedLgas = useMemo(() => {
    const start = (lgaPage - 1) * PER_PAGE
    return filteredLgas.slice(start, start + PER_PAGE)
  }, [filteredLgas, lgaPage])

  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(citySearch.toLowerCase())
      const matchesLga = cityLgaFilter === "all" || c.lga_id === cityLgaFilter
      return matchesSearch && matchesLga
    })
  }, [cities, citySearch, cityLgaFilter])

  const paginatedCities = useMemo(() => {
    const start = (cityPage - 1) * PER_PAGE
    return filteredCities.slice(start, start + PER_PAGE)
  }, [filteredCities, cityPage])

  // Stats
  const areaOfficeStats = {
    total: areaOffices.length,
    active: areaOffices.filter((o) => o.is_active).length,
    inactive: areaOffices.filter((o) => !o.is_active).length,
  }

  const lgaStats = {
    total: lgas.length,
    assigned: lgas.filter((l) => l.area_office_id).length,
    unassigned: lgas.filter((l) => !l.area_office_id).length,
  }

  const cityStats = {
    total: cities.length,
    withProperties: cities.filter((c) => (c.properties_count || 0) > 0).length,
  }

  // View area office details
  const handleViewAreaOffice = async (office: AreaOffice) => {
    setSelectedAreaOffice(office)
    setAreaOfficeSheetOpen(true)

    // Fetch LGAs for this area office
    const { data } = await supabase.from("lgas").select("*").eq("area_office_id", office.id).order("name")

    setAreaOfficeLgas(data || [])
  }

  // View LGA details
  const handleViewLga = async (lga: LGA) => {
    setSelectedLga(lga)
    setLgaSheetOpen(true)

    // Fetch cities for this LGA
    const { data } = await supabase.from("cities").select("*, area_offices(name)").eq("lga_id", lga.id).order("name")

    setLgaCities((data || []).map((c) => ({ ...c, area_office_name: c.area_offices?.name })))
  }

  // View city details
  const handleViewCity = (city: City) => {
    setSelectedCity(city)
    setCitySheetOpen(true)
  }

  // Add/Edit Area Office
  const handleSaveAreaOffice = async () => {
    try {
      if (editMode && selectedAreaOffice) {
        const { error } = await supabase.from("area_offices").update(areaOfficeForm).eq("id", selectedAreaOffice.id)

        if (error) throw error
        toast.success("Area office updated")
      } else {
        const { error } = await supabase.from("area_offices").insert({ ...areaOfficeForm, is_active: true })

        if (error) throw error
        toast.success("Area office created")
      }

      setAddAreaOfficeOpen(false)
      setEditMode(false)
      setAreaOfficeForm({ name: "", address: "", phone_number: "", email: "" })
      fetchAreaOffices()
    } catch (error) {
      console.error("Error saving area office:", error)
      toast.error("Failed to save area office")
    }
  }

  // Add/Edit LGA
  const handleSaveLga = async () => {
    try {
      const payload = {
        name: lgaForm.name,
        state: lgaForm.state,
        area_office_id: lgaForm.area_office_id || null,
      }

      if (editMode && selectedLga) {
        const { error } = await supabase.from("lgas").update(payload).eq("id", selectedLga.id)

        if (error) throw error
        toast.success("LGA updated")
      } else {
        const { error } = await supabase.from("lgas").insert(payload)

        if (error) throw error
        toast.success("LGA created")
      }

      setAddLgaOpen(false)
      setEditMode(false)
      setLgaForm({ name: "", state: "Kaduna", area_office_id: "" })
      fetchLgas()
    } catch (error) {
      console.error("Error saving LGA:", error)
      toast.error("Failed to save LGA")
    }
  }

  // Add/Edit City
  const handleSaveCity = async () => {
    try {
      // Get area_office_id from selected LGA if not specified
      let areaOfficeId = cityForm.area_office_id
      if (!areaOfficeId && cityForm.lga_id) {
        const lga = lgas.find((l) => l.id === cityForm.lga_id)
        areaOfficeId = lga?.area_office_id || ""
      }

      const payload = {
        name: cityForm.name,
        state: cityForm.state,
        lga_id: cityForm.lga_id,
        area_office_id: areaOfficeId,
      }

      if (editMode && selectedCity) {
        const { error } = await supabase.from("cities").update(payload).eq("id", selectedCity.id)

        if (error) throw error
        toast.success("City updated")
      } else {
        const { error } = await supabase.from("cities").insert(payload)

        if (error) throw error
        toast.success("City created")
      }

      setAddCityOpen(false)
      setEditMode(false)
      setCityForm({ name: "", state: "Kaduna", lga_id: "", area_office_id: "" })
      fetchCities()
    } catch (error) {
      console.error("Error saving city:", error)
      toast.error("Failed to save city")
    }
  }

  // Delete handlers
  const handleDeleteAreaOffice = async () => {
    if (!selectedAreaOffice) return
    try {
      const { error } = await supabase.from("area_offices").delete().eq("id", selectedAreaOffice.id)

      if (error) throw error
      toast.success("Area office deleted")
      setDeleteAreaOfficeOpen(false)
      setAreaOfficeSheetOpen(false)
      fetchAreaOffices()
    } catch (error) {
      console.error("Error deleting area office:", error)
      toast.error("Failed to delete area office. It may have LGAs or cities assigned.")
    }
  }

  const handleDeleteLga = async () => {
    if (!selectedLga) return
    try {
      const { error } = await supabase.from("lgas").delete().eq("id", selectedLga.id)

      if (error) throw error
      toast.success("LGA deleted")
      setDeleteLgaOpen(false)
      setLgaSheetOpen(false)
      fetchLgas()
    } catch (error) {
      console.error("Error deleting LGA:", error)
      toast.error("Failed to delete LGA. It may have cities assigned.")
    }
  }

  const handleDeleteCity = async () => {
    if (!selectedCity) return
    try {
      const { error } = await supabase.from("cities").delete().eq("id", selectedCity.id)

      if (error) throw error
      toast.success("City deleted")
      setDeleteCityOpen(false)
      setCitySheetOpen(false)
      fetchCities()
    } catch (error) {
      console.error("Error deleting city:", error)
      toast.error("Failed to delete city")
    }
  }

  // Toggle area office status
  const handleToggleAreaOfficeStatus = async () => {
    if (!selectedAreaOffice) return
    try {
      const { error } = await supabase
        .from("area_offices")
        .update({ is_active: !selectedAreaOffice.is_active })
        .eq("id", selectedAreaOffice.id)

      if (error) throw error
      toast.success(selectedAreaOffice.is_active ? "Area office deactivated" : "Area office activated")
      setAreaOfficeSheetOpen(false)
      fetchAreaOffices()
    } catch (error) {
      console.error("Error toggling area office status:", error)
      toast.error("Failed to update area office status")
    }
  }

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Locations</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="area-offices">Area Offices</TabsTrigger>
              <TabsTrigger value="lgas">LGAs</TabsTrigger>
              <TabsTrigger value="cities">Cities</TabsTrigger>
            </TabsList>

            {/* Area Offices Tab */}
            <TabsContent value="area-offices" className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Offices</p>
                      <p className="text-lg font-bold">{areaOfficeStats.total}</p>
                    </div>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
                <Card className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Active</p>
                      <p className="text-lg font-bold text-emerald-600">{areaOfficeStats.active}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                </Card>
                <Card className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Inactive</p>
                      <p className="text-lg font-bold text-red-600">{areaOfficeStats.inactive}</p>
                    </div>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search offices..."
                    value={areaOfficeSearch}
                    onChange={(e) => setAreaOfficeSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditMode(false)
                    setAreaOfficeForm({ name: "", address: "", phone_number: "", email: "" })
                    setAddAreaOfficeOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Office
                </Button>
              </div>

              {/* Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>LGAs</TableHead>
                      <TableHead>Cities</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areaOfficesLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : paginatedAreaOffices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No area offices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAreaOffices.map((office) => (
                        <TableRow
                          key={office.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewAreaOffice(office)}
                        >
                          <TableCell className="font-medium">{office.name}</TableCell>
                          <TableCell>{office.address || "-"}</TableCell>
                          <TableCell>{office.phone_number || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{office.lgas_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{office.cities_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {office.is_active ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>{office.is_active ? "Active" : "Inactive"}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewAreaOffice(office)
                                  }}
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedAreaOffice(office)
                                    setEditMode(true)
                                    setAreaOfficeForm({
                                      name: office.name,
                                      address: office.address || "",
                                      phone_number: office.phone_number || "",
                                      email: office.email || "",
                                    })
                                    setAddAreaOfficeOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedAreaOffice(office)
                                    setDeleteAreaOfficeOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {filteredAreaOffices.length > PER_PAGE && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(areaOfficePage - 1) * PER_PAGE + 1}-
                    {Math.min(areaOfficePage * PER_PAGE, filteredAreaOffices.length)} of {filteredAreaOffices.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={areaOfficePage === 1}
                      onClick={() => setAreaOfficePage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={areaOfficePage * PER_PAGE >= filteredAreaOffices.length}
                      onClick={() => setAreaOfficePage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* LGAs Tab */}
            <TabsContent value="lgas" className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total LGAs</p>
                      <p className="text-lg font-bold">{lgaStats.total}</p>
                    </div>
                    <Map className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
                <Card className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned to Office</p>
                      <p className="text-lg font-bold text-emerald-600">{lgaStats.assigned}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                </Card>
                <Card className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Unassigned</p>
                      <p className="text-lg font-bold text-amber-600">{lgaStats.unassigned}</p>
                    </div>
                    <XCircle className="h-4 w-4 text-amber-600" />
                  </div>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search LGAs..."
                    value={lgaSearch}
                    onChange={(e) => setLgaSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={lgaAreaOfficeFilter} onValueChange={setLgaAreaOfficeFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="All Offices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Offices</SelectItem>
                    {areaOffices.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditMode(false)
                    setLgaForm({ name: "", state: "Kaduna", area_office_id: "" })
                    setAddLgaOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add LGA
                </Button>
              </div>

              {/* Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Area Office</TableHead>
                      <TableHead>Cities</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lgasLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : paginatedLgas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No LGAs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedLgas.map((lga) => (
                        <TableRow
                          key={lga.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewLga(lga)}
                        >
                          <TableCell className="font-medium">{lga.name}</TableCell>
                          <TableCell>{lga.state}</TableCell>
                          <TableCell>
                            {lga.area_office_name ? (
                              <Badge variant="secondary">{lga.area_office_name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lga.cities_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewLga(lga)
                                  }}
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedLga(lga)
                                    setEditMode(true)
                                    setLgaForm({
                                      name: lga.name,
                                      state: lga.state,
                                      area_office_id: lga.area_office_id || "",
                                    })
                                    setAddLgaOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedLga(lga)
                                    setDeleteLgaOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {filteredLgas.length > PER_PAGE && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(lgaPage - 1) * PER_PAGE + 1}-{Math.min(lgaPage * PER_PAGE, filteredLgas.length)} of{" "}
                    {filteredLgas.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={lgaPage === 1}
                      onClick={() => setLgaPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={lgaPage * PER_PAGE >= filteredLgas.length}
                      onClick={() => setLgaPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Cities Tab */}
            <TabsContent value="cities" className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cities</p>
                      <p className="text-lg font-bold">{cityStats.total}</p>
                    </div>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
                <Card className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">With Properties</p>
                      <p className="text-lg font-bold text-emerald-600">{cityStats.withProperties}</p>
                    </div>
                    <Building2 className="h-4 w-4 text-emerald-600" />
                  </div>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cities..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={cityLgaFilter} onValueChange={setCityLgaFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="All LGAs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LGAs</SelectItem>
                    {lgas.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditMode(false)
                    setCityForm({ name: "", state: "Kaduna", lga_id: "", area_office_id: "" })
                    setAddCityOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add City
                </Button>
              </div>

              {/* Table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>LGA</TableHead>
                      <TableHead>Area Office</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citiesLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : paginatedCities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No cities found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCities.map((city) => (
                        <TableRow
                          key={city.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewCity(city)}
                        >
                          <TableCell className="font-medium">{city.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{city.lga_name}</Badge>
                          </TableCell>
                          <TableCell>
                            {city.area_office_name ? (
                              <Badge variant="outline">{city.area_office_name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{city.properties_count}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewCity(city)
                                  }}
                                >
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedCity(city)
                                    setEditMode(true)
                                    setCityForm({
                                      name: city.name,
                                      state: city.state,
                                      lga_id: city.lga_id,
                                      area_office_id: city.area_office_id,
                                    })
                                    setAddCityOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedCity(city)
                                    setDeleteCityOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {filteredCities.length > PER_PAGE && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(cityPage - 1) * PER_PAGE + 1}-{Math.min(cityPage * PER_PAGE, filteredCities.length)} of{" "}
                    {filteredCities.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cityPage === 1}
                      onClick={() => setCityPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cityPage * PER_PAGE >= filteredCities.length}
                      onClick={() => setCityPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Area Office Details Sheet */}
        <Sheet open={areaOfficeSheetOpen} onOpenChange={setAreaOfficeSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Area Office Details</SheetTitle>
              <SheetDescription>View and manage area office information</SheetDescription>
            </SheetHeader>
            {selectedAreaOffice && (
              <div className="py-6 px-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedAreaOffice.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAreaOffice.address}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selectedAreaOffice.phone_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{selectedAreaOffice.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={selectedAreaOffice.is_active ? "default" : "secondary"}>
                      {selectedAreaOffice.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">PayKaduna ID</p>
                    <p className="text-sm font-medium">{selectedAreaOffice.area_office_id || "-"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Assigned LGAs ({areaOfficeLgas.length})</h4>
                  {areaOfficeLgas.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {areaOfficeLgas.map((lga) => (
                        <Badge key={lga.id} variant="outline">
                          {lga.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No LGAs assigned</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={handleToggleAreaOfficeStatus}>
                    {selectedAreaOffice.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setDeleteAreaOfficeOpen(true)}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* LGA Details Sheet */}
        <Sheet open={lgaSheetOpen} onOpenChange={setLgaSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>LGA Details</SheetTitle>
              <SheetDescription>View and manage LGA information</SheetDescription>
            </SheetHeader>
            {selectedLga && (
              <div className="py-6 px-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Map className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedLga.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedLga.state} State</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Area Office</p>
                    <p className="text-sm font-medium">{selectedLga.area_office_name || "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">PayKaduna ID</p>
                    <p className="text-sm font-medium">{selectedLga.lga_id || "-"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Cities ({lgaCities.length})</h4>
                  {lgaCities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {lgaCities.map((city) => (
                        <Badge key={city.id} variant="outline">
                          {city.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No cities in this LGA</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setEditMode(true)
                      setLgaForm({
                        name: selectedLga.name,
                        state: selectedLga.state,
                        area_office_id: selectedLga.area_office_id || "",
                      })
                      setAddLgaOpen(true)
                      setLgaSheetOpen(false)
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setDeleteLgaOpen(true)}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* City Details Sheet */}
        <Sheet open={citySheetOpen} onOpenChange={setCitySheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>City Details</SheetTitle>
              <SheetDescription>View and manage city information</SheetDescription>
            </SheetHeader>
            {selectedCity && (
              <div className="py-6 px-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Landmark className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedCity.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCity.state} State</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">LGA</p>
                    <p className="text-sm font-medium">{selectedCity.lga_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Area Office</p>
                    <p className="text-sm font-medium">{selectedCity.area_office_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Properties</p>
                    <p className="text-sm font-medium">{selectedCity.properties_count || 0}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setEditMode(true)
                      setCityForm({
                        name: selectedCity.name,
                        state: selectedCity.state,
                        lga_id: selectedCity.lga_id,
                        area_office_id: selectedCity.area_office_id,
                      })
                      setAddCityOpen(true)
                      setCitySheetOpen(false)
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setDeleteCityOpen(true)}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Add/Edit Area Office Dialog */}
        <Dialog open={addAreaOfficeOpen} onOpenChange={setAddAreaOfficeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? "Edit Area Office" : "Add Area Office"}</DialogTitle>
              <DialogDescription>
                {editMode ? "Update area office details" : "Create a new area office"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="office-name">Name *</Label>
                <Input
                  id="office-name"
                  value={areaOfficeForm.name}
                  onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, name: e.target.value })}
                  placeholder="e.g. Kakuri East"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="office-address">Address</Label>
                <Input
                  id="office-address"
                  value={areaOfficeForm.address}
                  onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, address: e.target.value })}
                  placeholder="e.g. Kaduna"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="office-phone">Phone</Label>
                <Input
                  id="office-phone"
                  value={areaOfficeForm.phone_number}
                  onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, phone_number: e.target.value })}
                  placeholder="e.g. +234..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="office-email">Email</Label>
                <Input
                  id="office-email"
                  type="email"
                  value={areaOfficeForm.email}
                  onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, email: e.target.value })}
                  placeholder="e.g. office@kadirs.gov.ng"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAreaOfficeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAreaOffice} disabled={!areaOfficeForm.name}>
                {editMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit LGA Dialog */}
        <Dialog open={addLgaOpen} onOpenChange={setAddLgaOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? "Edit LGA" : "Add LGA"}</DialogTitle>
              <DialogDescription>
                {editMode ? "Update LGA details" : "Create a new Local Government Area"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lga-name">Name *</Label>
                <Input
                  id="lga-name"
                  value={lgaForm.name}
                  onChange={(e) => setLgaForm({ ...lgaForm, name: e.target.value })}
                  placeholder="e.g. Kaduna North"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lga-state">State</Label>
                <Input
                  id="lga-state"
                  value={lgaForm.state}
                  onChange={(e) => setLgaForm({ ...lgaForm, state: e.target.value })}
                  placeholder="e.g. Kaduna"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lga-office">Area Office</Label>
                <Select
                  value={lgaForm.area_office_id}
                  onValueChange={(v) => setLgaForm({ ...lgaForm, area_office_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area office" />
                  </SelectTrigger>
                  <SelectContent>
                    {areaOffices.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddLgaOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLga} disabled={!lgaForm.name}>
                {editMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit City Dialog */}
        <Dialog open={addCityOpen} onOpenChange={setAddCityOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? "Edit City" : "Add City"}</DialogTitle>
              <DialogDescription>{editMode ? "Update city details" : "Create a new city"}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="city-name">Name *</Label>
                <Input
                  id="city-name"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  placeholder="e.g. Barnawa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city-state">State</Label>
                <Input
                  id="city-state"
                  value={cityForm.state}
                  onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                  placeholder="e.g. Kaduna"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city-lga">LGA *</Label>
                <Select
                  value={cityForm.lga_id}
                  onValueChange={(v) => {
                    const lga = lgas.find((l) => l.id === v)
                    setCityForm({ ...cityForm, lga_id: v, area_office_id: lga?.area_office_id || "" })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {lgas.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city-office">Area Office</Label>
                <Select
                  value={cityForm.area_office_id}
                  onValueChange={(v) => setCityForm({ ...cityForm, area_office_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-filled from LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {areaOffices.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Auto-filled from selected LGA if not specified</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCityOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCity} disabled={!cityForm.name || !cityForm.lga_id}>
                {editMode ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmations */}
        <AlertDialog open={deleteAreaOfficeOpen} onOpenChange={setDeleteAreaOfficeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Area Office</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedAreaOffice?.name}"? This action cannot be undone. LGAs and
                cities assigned to this office will need to be reassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAreaOffice} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteLgaOpen} onOpenChange={setDeleteLgaOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete LGA</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedLga?.name}"? This will also delete all cities in this LGA.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLga} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteCityOpen} onOpenChange={setDeleteCityOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete City</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedCity?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCity} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
