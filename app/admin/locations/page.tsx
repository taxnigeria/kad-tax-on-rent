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
  office_name: string
  office_code?: string
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
  lga_id?: string
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

  const [areaOfficeForm, setAreaOfficeForm] = useState({
    office_name: "",
    office_code: "",
    address: "",
    phone_number: "",
    email: "",
  })
  const [lgaForm, setLgaForm] = useState({ name: "", state: "Kaduna", area_office_id: "" })
  const [cityForm, setCityForm] = useState({ name: "", state: "Kaduna", lga_id: "", area_office_id: "" })

  // Related data for side panels
  const [areaOfficeLgas, setAreaOfficeLgas] = useState<LGA[]>([])
  const [lgaCities, setLgaCities] = useState<City[]>([])

  // Fetch Area Offices
  const fetchAreaOffices = async () => {
    setAreaOfficesLoading(true)
    try {
      const { data: offices, error } = await supabase.from("area_offices").select("*").order("office_name")

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
          area_offices(office_name)
        `)
        .order("name")

      if (error) throw error

      // Get city counts per LGA
      const { data: cityCounts } = await supabase.from("cities").select("lga_id")

      const lgasWithCounts = (data || []).map((lga) => ({
        ...lga,
        area_office_name: lga.area_offices?.office_name,
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
          area_offices(office_name)
        `)
        .order("name")

      if (error) throw error

      // Get property counts per city - match by address city field
      const { data: addresses } = await supabase.from("addresses").select("id, city")

      const citiesWithCounts = (data || []).map((city) => ({
        ...city,
        lga_name: city.lgas?.name,
        area_office_name: city.area_offices?.office_name,
        properties_count: addresses?.filter((a) => a.city?.toLowerCase() === city.name?.toLowerCase()).length || 0,
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

  const filteredAreaOffices = useMemo(() => {
    return areaOffices.filter(
      (o) =>
        o.office_name?.toLowerCase().includes(areaOfficeSearch.toLowerCase()) ||
        o.office_code?.toLowerCase().includes(areaOfficeSearch.toLowerCase()) ||
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

    const { data } = await supabase
      .from("cities")
      .select("*, area_offices(office_name)")
      .eq("lga_id", lga.id)
      .order("name")

    setLgaCities((data || []).map((c) => ({ ...c, area_office_name: c.area_offices?.office_name })))
  }

  // View city details
  const handleViewCity = (city: City) => {
    setSelectedCity(city)
    setCitySheetOpen(true)
  }

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
      setAreaOfficeForm({ office_name: "", office_code: "", address: "", phone_number: "", email: "" })
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
        area_office_id: areaOfficeId || null,
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
                    setAreaOfficeForm({ office_name: "", office_code: "", address: "", phone_number: "", email: "" })
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
                      <TableHead>Code</TableHead>
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
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedAreaOffices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                          <TableCell className="font-medium">{office.office_name}</TableCell>
                          <TableCell className="text-muted-foreground">{office.office_code || "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{office.address || "-"}</TableCell>
                          <TableCell>{office.phone_number || "-"}</TableCell>
                          <TableCell>{office.lgas_count}</TableCell>
                          <TableCell>{office.cities_count}</TableCell>
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
                                    setEditMode(true)
                                    setSelectedAreaOffice(office)
                                    setAreaOfficeForm({
                                      office_name: office.office_name,
                                      office_code: office.office_code || "",
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

                {/* Pagination */}
                {filteredAreaOffices.length > PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(areaOfficePage - 1) * PER_PAGE + 1} to{" "}
                      {Math.min(areaOfficePage * PER_PAGE, filteredAreaOffices.length)} of {filteredAreaOffices.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAreaOfficePage((p) => Math.max(1, p - 1))}
                        disabled={areaOfficePage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAreaOfficePage((p) => p + 1)}
                        disabled={areaOfficePage * PER_PAGE >= filteredAreaOffices.length}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
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
                    <Landmark className="h-4 w-4 text-muted-foreground" />
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
                    <SelectValue placeholder="Filter by office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Offices</SelectItem>
                    {areaOffices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.office_name}
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
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
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
                            {lga.area_office_name || <span className="text-muted-foreground italic">Unassigned</span>}
                          </TableCell>
                          <TableCell>{lga.cities_count}</TableCell>
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
                                    setEditMode(true)
                                    setSelectedLga(lga)
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

                {/* Pagination */}
                {filteredLgas.length > PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(lgaPage - 1) * PER_PAGE + 1} to {Math.min(lgaPage * PER_PAGE, filteredLgas.length)} of{" "}
                      {filteredLgas.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLgaPage((p) => Math.max(1, p - 1))}
                        disabled={lgaPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLgaPage((p) => p + 1)}
                        disabled={lgaPage * PER_PAGE >= filteredLgas.length}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
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
                    <Map className="h-4 w-4 text-muted-foreground" />
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
                    <SelectValue placeholder="Filter by LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All LGAs</SelectItem>
                    {lgas.map((lga) => (
                      <SelectItem key={lga.id} value={lga.id}>
                        {lga.name}
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
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-8" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
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
                          <TableCell>{city.lga_name || "-"}</TableCell>
                          <TableCell>{city.area_office_name || "-"}</TableCell>
                          <TableCell>{city.properties_count}</TableCell>
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
                                    setEditMode(true)
                                    setSelectedCity(city)
                                    setCityForm({
                                      name: city.name,
                                      state: city.state,
                                      lga_id: city.lga_id,
                                      area_office_id: city.area_office_id || "",
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

                {/* Pagination */}
                {filteredCities.length > PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(cityPage - 1) * PER_PAGE + 1} to {Math.min(cityPage * PER_PAGE, filteredCities.length)}{" "}
                      of {filteredCities.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCityPage((p) => Math.max(1, p - 1))}
                        disabled={cityPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCityPage((p) => p + 1)}
                        disabled={cityPage * PER_PAGE >= filteredCities.length}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Area Office Side Panel */}
        <Sheet open={areaOfficeSheetOpen} onOpenChange={setAreaOfficeSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedAreaOffice?.office_name}</SheetTitle>
              <SheetDescription>Area Office Details</SheetDescription>
            </SheetHeader>
            {selectedAreaOffice && (
              <div className="py-6 px-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Office Code</p>
                    <p className="font-medium">{selectedAreaOffice.office_code || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={selectedAreaOffice.is_active ? "default" : "secondary"}>
                      {selectedAreaOffice.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedAreaOffice.address || "-"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedAreaOffice.phone_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedAreaOffice.email || "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Assigned LGAs ({areaOfficeLgas.length})</p>
                  {areaOfficeLgas.length > 0 ? (
                    <div className="space-y-1">
                      {areaOfficeLgas.map((lga) => (
                        <div key={lga.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{lga.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {lga.cities_count || 0} cities
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No LGAs assigned</p>
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

        {/* LGA Side Panel */}
        <Sheet open={lgaSheetOpen} onOpenChange={setLgaSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedLga?.name}</SheetTitle>
              <SheetDescription>LGA Details</SheetDescription>
            </SheetHeader>
            {selectedLga && (
              <div className="py-6 px-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">State</p>
                    <p className="font-medium">{selectedLga.state}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Area Office</p>
                    <p className="font-medium">{selectedLga.area_office_name || "Unassigned"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Cities ({lgaCities.length})</p>
                  {lgaCities.length > 0 ? (
                    <div className="space-y-1">
                      {lgaCities.map((city) => (
                        <div key={city.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{city.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {city.properties_count || 0} properties
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No cities</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="destructive" className="flex-1" onClick={() => setDeleteLgaOpen(true)}>
                    Delete LGA
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* City Side Panel */}
        <Sheet open={citySheetOpen} onOpenChange={setCitySheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedCity?.name}</SheetTitle>
              <SheetDescription>City Details</SheetDescription>
            </SheetHeader>
            {selectedCity && (
              <div className="py-6 px-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">LGA</p>
                    <p className="font-medium">{selectedCity.lga_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Area Office</p>
                    <p className="font-medium">{selectedCity.area_office_name || "-"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">State</p>
                  <p className="font-medium">{selectedCity.state}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Properties</p>
                  <p className="font-medium">{selectedCity.properties_count || 0}</p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="destructive" className="flex-1" onClick={() => setDeleteCityOpen(true)}>
                    Delete City
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
                {editMode ? "Update the area office details" : "Create a new area office"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Office Name</Label>
                <Input
                  value={areaOfficeForm.office_name}
                  onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, office_name: e.target.value })}
                  placeholder="e.g. Kaduna North Tax Station"
                />
              </div>
              <div className="space-y-2">
                <Label>Office Code</Label>
                <Input
                  value={areaOfficeForm.office_code}
                  onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, office_code: e.target.value })}
                  placeholder="e.g. KN-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={areaOfficeForm.address}
                  onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, address: e.target.value })}
                  placeholder="Office address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={areaOfficeForm.phone_number}
                    onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, phone_number: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={areaOfficeForm.email}
                    onChange={(e) => setAreaOfficeForm({ ...areaOfficeForm, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAreaOfficeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAreaOffice} disabled={!areaOfficeForm.office_name}>
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
                {editMode ? "Update the LGA details" : "Create a new Local Government Area"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>LGA Name</Label>
                <Input
                  value={lgaForm.name}
                  onChange={(e) => setLgaForm({ ...lgaForm, name: e.target.value })}
                  placeholder="e.g. Kaduna North"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={lgaForm.state}
                  onChange={(e) => setLgaForm({ ...lgaForm, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label>Area Office</Label>
                <Select
                  value={lgaForm.area_office_id || "none"}
                  onValueChange={(val) => setLgaForm({ ...lgaForm, area_office_id: val === "none" ? "" : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {areaOffices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.office_name}
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
              <DialogDescription>{editMode ? "Update the city details" : "Create a new city"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>City Name</Label>
                <Input
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  placeholder="e.g. Kaduna"
                />
              </div>
              <div className="space-y-2">
                <Label>LGA</Label>
                <Select
                  value={cityForm.lga_id}
                  onValueChange={(val) => {
                    const lga = lgas.find((l) => l.id === val)
                    setCityForm({
                      ...cityForm,
                      lga_id: val,
                      area_office_id: lga?.area_office_id || "",
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* The issue was with the default value being an empty string. Changed to a placeholder and added a distinct "None" option if needed. */}
                    <SelectItem value="none">Select an LGA</SelectItem>
                    {lgas.map((lga) => (
                      <SelectItem key={lga.id} value={lga.id}>
                        {lga.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={cityForm.state}
                  onChange={(e) => setCityForm({ ...cityForm, state: e.target.value })}
                  placeholder="State"
                />
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

        {/* Delete Dialogs */}
        <AlertDialog open={deleteAreaOfficeOpen} onOpenChange={setDeleteAreaOfficeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Area Office</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedAreaOffice?.office_name}"? This action cannot be undone.
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
                Are you sure you want to delete "{selectedLga?.name}"? This action cannot be undone.
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
