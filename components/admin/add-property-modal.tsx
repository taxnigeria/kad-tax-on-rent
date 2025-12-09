"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Loader2, ChevronLeft, ChevronRight, Search, User, Mail, Phone, Award as IdCard, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type AddPropertyModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type Taxpayer = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  taxpayer_profiles: Array<{
    kadirs_id: string
  }>
}

type PropertyManager = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
}

type City = {
  id: string
  name: string
  lga_id: string
  area_office_id: string
  state: string
}

type LGA = {
  id: string
  name: string
  state: string
  area_office_id: string
}

type AreaOffice = {
  id: string
  office_name: string
  office_code: string
}

export function AddPropertyModal({ open, onOpenChange, onSuccess }: AddPropertyModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchingTaxpayers, setSearchingTaxpayers] = useState(false)
  const [searchingManagers, setSearchingManagers] = useState(false)
  const { toast } = useToast()

  const [cities, setCities] = useState<City[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [areaOffices, setAreaOffices] = useState<AreaOffice[]>([])
  const [cityDialogOpen, setCityDialogOpen] = useState(false)
  const [citySearchQuery, setCitySearchQuery] = useState("")

  const [formData, setFormData] = useState({
    // Basic Information
    propertyName: "",
    propertyType: "",
    propertyCategory: "",
    houseNumber: "",
    streetAddress: "",
    cityId: "", // Changed from city to cityId
    city: "", // Keep city name for display
    state: "Kaduna",
    lgaId: "", // Changed from lga to lgaId
    lga: "", // Keep lga name for display
    areaOfficeId: "", // Added area office ID
    areaOffice: "", // Added area office name for display

    // Property Details
    yearBuilt: "",
    numberOfFloors: "",
    totalFloorArea: "",
    totalUnits: "1",
    occupiedUnits: "0",
    annualRent: "",
    rentalCommencementDate: "",
    businessType: "",
    propertyDescription: "",
    propertyStatus: "draft",

    // Owner/Manager Assignment
    registrationType: "owner",
    managerFullName: "",
    managerEmail: "",
    managerPhone: "",
    managerTaxId: "",
    managementStartDate: "",
  })

  const [taxpayerSearch, setTaxpayerSearch] = useState("")
  const [managerSearch, setManagerSearch] = useState("")
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([])
  const [managers, setManagers] = useState<PropertyManager[]>([])
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null)
  const [selectedManager, setSelectedManager] = useState<PropertyManager | null>(null)
  const [defaultState, setDefaultState] = useState("Kaduna")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function fetchLocationData() {
      const [citiesRes, lgasRes, officesRes] = await Promise.all([
        supabase.from("cities").select("*").order("name"),
        supabase.from("lgas").select("*").order("name"),
        supabase.from("area_offices").select("id, office_name, office_code").eq("is_active", true).order("office_name"),
      ])

      if (!citiesRes.error) setCities(citiesRes.data || [])
      if (!lgasRes.error) setLgas(lgasRes.data || [])
      if (!officesRes.error) setAreaOffices(officesRes.data || [])
    }
    fetchLocationData()
  }, [])

  useEffect(() => {
    async function fetchDefaultState() {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "default_state")
        .eq("is_active", true)
        .single()

      if (!error && data) {
        const state = data.setting_value as string
        setDefaultState(state.replace(/"/g, ""))
        setFormData((prev) => ({ ...prev, state: state.replace(/"/g, "") }))
      }
    }
    fetchDefaultState()
  }, [])

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  useEffect(() => {
    if (currentStep === 3 && formData.registrationType === "owner" && taxpayerSearch.length >= 2) {
      searchTaxpayers()
    } else {
      setTaxpayers([])
    }
  }, [taxpayerSearch, currentStep, formData.registrationType])

  useEffect(() => {
    if (currentStep === 3 && formData.registrationType === "manager" && managerSearch.length >= 2) {
      searchManagers()
    } else {
      setManagers([])
    }
  }, [managerSearch, currentStep, formData.registrationType])

  async function searchTaxpayers() {
    setSearchingTaxpayers(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          phone_number,
          taxpayer_profiles (
            kadirs_id
          )
        `,
        )
        .or(`first_name.ilike.%${taxpayerSearch}%,last_name.ilike.%${taxpayerSearch}%,email.ilike.%${taxpayerSearch}%`)
        .eq("role", "taxpayer")
        .limit(10)

      if (error) {
        console.error("Error searching taxpayers:", error)
        setTaxpayers([])
      } else {
        setTaxpayers((data as any) || [])
      }
    } catch (error) {
      console.error("Error in searchTaxpayers:", error)
      setTaxpayers([])
    } finally {
      setSearchingTaxpayers(false)
    }
  }

  async function searchManagers() {
    setSearchingManagers(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, phone_number")
        .or(`first_name.ilike.%${managerSearch}%,last_name.ilike.%${managerSearch}%,email.ilike.%${managerSearch}%`)
        .eq("role", "taxpayer")
        .limit(10)

      if (error) {
        console.error("Error searching managers:", error)
        setManagers([])
      } else {
        setManagers((data as any) || [])
      }
    } catch (error) {
      console.error("Error in searchManagers:", error)
      setManagers([])
    } finally {
      setSearchingManagers(false)
    }
  }

  function resetForm() {
    setCurrentStep(1)
    setFormData({
      propertyName: "",
      propertyType: "",
      propertyCategory: "",
      houseNumber: "",
      streetAddress: "",
      cityId: "",
      city: "",
      state: defaultState,
      lgaId: "",
      lga: "",
      areaOfficeId: "",
      areaOffice: "",
      yearBuilt: "",
      numberOfFloors: "",
      totalFloorArea: "",
      totalUnits: "1",
      occupiedUnits: "0",
      annualRent: "",
      rentalCommencementDate: "",
      businessType: "",
      propertyDescription: "",
      propertyStatus: "draft",
      registrationType: "owner",
      managerFullName: "",
      managerEmail: "",
      managerPhone: "",
      managerTaxId: "",
      managementStartDate: "",
    })
    setTaxpayerSearch("")
    setManagerSearch("")
    setTaxpayers([])
    setManagers([])
    setSelectedTaxpayer(null)
    setSelectedManager(null)
  }

  function handleCityChange(cityId: string) {
    const selectedCity = cities.find((c) => c.id === cityId)
    if (!selectedCity) return

    const cityLga = lgas.find((l) => l.id === selectedCity.lga_id)

    const cityAreaOffice = areaOffices.find((a) => a.lga_id === selectedCity.lga_id)

    setFormData({
      ...formData,
      cityId: selectedCity.id,
      city: selectedCity.name,
      lgaId: selectedCity.lga_id,
      lga: cityLga?.name || "",
      areaOfficeId: cityAreaOffice?.id || "",
      areaOffice: cityAreaOffice?.office_name || "",
    })
    setCityDialogOpen(false)
    setCitySearchQuery("")
  }

  function handleNextFromStep1() {
    if (
      !formData.propertyName ||
      !formData.propertyType ||
      !formData.propertyCategory ||
      !formData.streetAddress ||
      !formData.areaOfficeId
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including Area Office",
        variant: "destructive",
      })
      return
    }
    setCurrentStep(2)
  }

  function handleNextFromStep2() {
    if (!formData.annualRent || !formData.totalUnits) {
      toast({
        title: "Missing Information",
        description: "Please fill in Annual Rent and Total Units",
        variant: "destructive",
      })
      return
    }
    setCurrentStep(3)
  }

  function handleBack() {
    setCurrentStep(currentStep - 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formData.registrationType === "owner" && !selectedTaxpayer) {
      toast({
        title: "No Owner Selected",
        description: "Please select a taxpayer as the property owner",
        variant: "destructive",
      })
      return
    }

    if (formData.registrationType === "manager" && !selectedManager) {
      toast({
        title: "No Manager Selected",
        description: "Please select a property manager",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // First, create the address
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({
          street_address: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          lga: formData.lga,
          country: "Nigeria",
        })
        .select()
        .single()

      if (addressError) {
        throw new Error("Failed to create address")
      }

      const propertyData: any = {
        registered_property_name: formData.propertyName,
        property_type: formData.propertyType,
        property_category: formData.propertyCategory,
        house_number: formData.houseNumber || null,
        street_name: formData.streetAddress,
        address_id: addressData.id,
        area_office_id: formData.areaOfficeId, // Added area office ID
        year_built: formData.yearBuilt ? Number.parseInt(formData.yearBuilt) : null,
        number_of_floors: formData.numberOfFloors ? Number.parseInt(formData.numberOfFloors) : null,
        total_floor_area: formData.totalFloorArea ? Number.parseFloat(formData.totalFloorArea) : null,
        total_units: Number.parseInt(formData.totalUnits),
        occupied_units: Number.parseInt(formData.occupiedUnits),
        total_annual_rent: Number.parseFloat(formData.annualRent.replace(/,/g, "")),
        rental_commencement_date: formData.rentalCommencementDate || null,
        business_type: formData.businessType || null,
        property_description: formData.propertyDescription || null,
        status: formData.propertyStatus,
        verification_status: "pending",
      }

      if (formData.registrationType === "owner") {
        propertyData.owner_id = selectedTaxpayer!.id
        propertyData.has_property_manager = false
      } else {
        propertyData.property_manager_id = selectedManager!.id
        propertyData.manager_full_name =
          formData.managerFullName || `${selectedManager!.first_name} ${selectedManager!.last_name}`
        propertyData.manager_email = formData.managerEmail || selectedManager!.email
        propertyData.manager_phone = formData.managerPhone || selectedManager!.phone_number
        propertyData.manager_tax_id = formData.managerTaxId || null
        propertyData.management_start_date = formData.managementStartDate || null
        propertyData.has_property_manager = true
      }

      const { error: propertyError } = await supabase.from("properties").insert(propertyData)

      if (propertyError) {
        console.error("Property creation error:", propertyError)
        throw new Error("Failed to create property")
      }

      toast({
        title: "Success",
        description: "Property created successfully",
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating property:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create property",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const handleNumberInput = (field: string, value: string) => {
    const numbers = value.replace(/\D/g, "")
    setFormData({ ...formData, [field]: numbers })
  }

  const progress = (currentStep / 3) * 100

  const filteredCities = cities.filter((city) => city.name.toLowerCase().includes(citySearchQuery.toLowerCase()))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Step {currentStep} of 3:{" "}
              {currentStep === 1
                ? "Basic Information"
                : currentStep === 2
                  ? "Property Details"
                  : "Owner/Manager Assignment"}
            </DialogDescription>
            <Progress value={progress} className="mt-2" />
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Property Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="propertyName">
                      Property Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="propertyName"
                      placeholder="e.g., Sunset Apartments"
                      value={formData.propertyName}
                      onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">
                      Property Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                      disabled={loading}
                    >
                      <SelectTrigger id="propertyType">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="agricultural">Agricultural</SelectItem>
                        <SelectItem value="mixed">Mixed-Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="propertyCategory">
                      Property Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.propertyCategory}
                      onValueChange={(value) => setFormData({ ...formData, propertyCategory: value })}
                      disabled={loading}
                    >
                      <SelectTrigger id="propertyCategory">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="shop">Shop</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">House Number</Label>
                    <Input
                      id="houseNumber"
                      placeholder="e.g., 123"
                      value={formData.houseNumber}
                      onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetAddress">
                    Street Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="streetAddress"
                    placeholder="e.g., Main Street"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between bg-transparent"
                      onClick={() => setCityDialogOpen(true)}
                      disabled={loading}
                    >
                      {formData.city || "Select city..."}
                      <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={formData.state || "Kaduna"} disabled readOnly />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lga">LGA</Label>
                    <Select
                      value={formData.lgaId}
                      onValueChange={(value) => {
                        const selectedLga = lgas.find((l) => l.id === value)
                        setFormData({ ...formData, lgaId: value, lga: selectedLga?.name || "" })
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger id="lga">
                        <SelectValue placeholder="Select LGA" />
                      </SelectTrigger>
                      <SelectContent>
                        {lgas.map((lga) => (
                          <SelectItem key={lga.id} value={lga.id}>
                            {lga.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaOffice">
                      Area Office <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.areaOfficeId}
                      onValueChange={(value) => {
                        const selectedOffice = areaOffices.find((a) => a.id === value)
                        setFormData({ ...formData, areaOfficeId: value, areaOffice: selectedOffice?.office_name || "" })
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger id="areaOffice">
                        <SelectValue placeholder="Select area office" />
                      </SelectTrigger>
                      <SelectContent>
                        {areaOffices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.office_name} ({office.office_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Property Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      placeholder="e.g., 2020"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.yearBuilt}
                      onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfFloors">Number of Floors</Label>
                    <Input
                      id="numberOfFloors"
                      type="number"
                      placeholder="e.g., 2"
                      min="1"
                      value={formData.numberOfFloors}
                      onChange={(e) => setFormData({ ...formData, numberOfFloors: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalFloorArea">Floor Area (sqm)</Label>
                    <Input
                      id="totalFloorArea"
                      type="number"
                      placeholder="e.g., 500"
                      step="0.01"
                      value={formData.totalFloorArea}
                      onChange={(e) => setFormData({ ...formData, totalFloorArea: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="totalUnits">
                      Total Units <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="totalUnits"
                      type="number"
                      placeholder="e.g., 12"
                      min="1"
                      value={formData.totalUnits}
                      onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupiedUnits">Occupied Units</Label>
                    <Input
                      id="occupiedUnits"
                      type="number"
                      placeholder="e.g., 10"
                      min="0"
                      value={formData.occupiedUnits}
                      onChange={(e) => setFormData({ ...formData, occupiedUnits: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="annualRent">
                      Annual Rent (₦) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="annualRent"
                      type="text"
                      placeholder="e.g., 6,000,000"
                      value={formatNumber(formData.annualRent)}
                      onChange={(e) => handleNumberInput("annualRent", e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rentalCommencementDate">Rental Commencement Date</Label>
                    <Input
                      id="rentalCommencementDate"
                      type="date"
                      value={formData.rentalCommencementDate}
                      onChange={(e) => setFormData({ ...formData, rentalCommencementDate: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                {formData.propertyType === "commercial" && (
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input
                      id="businessType"
                      placeholder="e.g., Retail, Restaurant, Office"
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="propertyStatus">Property Status</Label>
                  <Select
                    value={formData.propertyStatus}
                    onValueChange={(value) => setFormData({ ...formData, propertyStatus: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="propertyStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyDescription">Property Description</Label>
                  <Textarea
                    id="propertyDescription"
                    placeholder="Add any additional details about the property..."
                    value={formData.propertyDescription}
                    onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
                    disabled={loading}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Owner/Manager Assignment */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>
                    Registration Type <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.registrationType}
                    onValueChange={(value) => {
                      setFormData({ ...formData, registrationType: value })
                      setSelectedTaxpayer(null)
                      setSelectedManager(null)
                      setTaxpayerSearch("")
                      setManagerSearch("")
                    }}
                    disabled={loading}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="owner" id="owner" />
                      <Label htmlFor="owner" className="font-normal cursor-pointer">
                        Register under Owner (Taxpayer)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manager" id="manager" />
                      <Label htmlFor="manager" className="font-normal cursor-pointer">
                        Register under Manager (Agent)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Owner Search */}
                {formData.registrationType === "owner" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="taxpayerSearch">
                        Search Property Owner <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="taxpayerSearch"
                          placeholder="Search by name, email, or KADIRS ID..."
                          value={taxpayerSearch}
                          onChange={(e) => setTaxpayerSearch(e.target.value)}
                          disabled={loading}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {searchingTaxpayers && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {!searchingTaxpayers && taxpayers.length > 0 && !selectedTaxpayer && (
                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                        {taxpayers.map((taxpayer) => (
                          <Card
                            key={taxpayer.id}
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => setSelectedTaxpayer(taxpayer)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">
                                    {taxpayer.first_name} {taxpayer.last_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{taxpayer.email}</div>
                                  {taxpayer.taxpayer_profiles?.[0]?.kadirs_id && (
                                    <div className="text-xs font-mono text-muted-foreground mt-1">
                                      KADIRS: {taxpayer.taxpayer_profiles[0].kadirs_id}
                                    </div>
                                  )}
                                </div>
                                <Badge variant="outline">Select</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {!searchingTaxpayers &&
                      taxpayerSearch.length >= 2 &&
                      taxpayers.length === 0 &&
                      !selectedTaxpayer && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No taxpayers found matching your search.</p>
                          <p className="text-sm mt-2">Try searching with a different name or email.</p>
                        </div>
                      )}

                    {selectedTaxpayer && (
                      <Card className="border-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold">Selected Owner</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTaxpayer(null)}
                              disabled={loading}
                            >
                              Change
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {selectedTaxpayer.first_name} {selectedTaxpayer.last_name}
                              </span>
                            </div>
                            {selectedTaxpayer.taxpayer_profiles?.[0]?.kadirs_id && (
                              <div className="flex items-center gap-2 text-sm">
                                <IdCard className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono">{selectedTaxpayer.taxpayer_profiles[0].kadirs_id}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedTaxpayer.email}</span>
                            </div>
                            {selectedTaxpayer.phone_number && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedTaxpayer.phone_number}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {taxpayerSearch.length < 2 && !selectedTaxpayer && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Start typing to search for property owners</p>
                        <p className="text-sm mt-2">Enter at least 2 characters to begin searching</p>
                      </div>
                    )}
                  </>
                )}

                {/* Manager Search */}
                {formData.registrationType === "manager" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="managerSearch">
                        Search Property Manager <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="managerSearch"
                          placeholder="Search by name or email..."
                          value={managerSearch}
                          onChange={(e) => setManagerSearch(e.target.value)}
                          disabled={loading}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {searchingManagers && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {!searchingManagers && managers.length > 0 && !selectedManager && (
                      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                        {managers.map((manager) => (
                          <Card
                            key={manager.id}
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => setSelectedManager(manager)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">
                                    {manager.first_name} {manager.last_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{manager.email}</div>
                                </div>
                                <Badge variant="outline">Select</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {!searchingManagers && managerSearch.length >= 2 && managers.length === 0 && !selectedManager && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No managers found matching your search.</p>
                        <p className="text-sm mt-2">Try searching with a different name or email.</p>
                      </div>
                    )}

                    {selectedManager && (
                      <>
                        <Card className="border-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold">Selected Manager</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedManager(null)}
                                disabled={loading}
                              >
                                Change
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {selectedManager.first_name} {selectedManager.last_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedManager.email}</span>
                              </div>
                              {selectedManager.phone_number && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{selectedManager.phone_number}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="font-semibold text-sm">Additional Manager Details (Optional)</h4>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="managerFullName">Manager Full Name</Label>
                              <Input
                                id="managerFullName"
                                placeholder="Override default name"
                                value={formData.managerFullName}
                                onChange={(e) => setFormData({ ...formData, managerFullName: e.target.value })}
                                disabled={loading}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="managerTaxId">Manager Tax ID</Label>
                              <Input
                                id="managerTaxId"
                                placeholder="e.g., TIN123456"
                                value={formData.managerTaxId}
                                onChange={(e) => setFormData({ ...formData, managerTaxId: e.target.value })}
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="managerEmail">Manager Email</Label>
                              <Input
                                id="managerEmail"
                                type="email"
                                placeholder="Override default email"
                                value={formData.managerEmail}
                                onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                                disabled={loading}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="managerPhone">Manager Phone</Label>
                              <Input
                                id="managerPhone"
                                placeholder="Override default phone"
                                value={formData.managerPhone}
                                onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="managementStartDate">Management Start Date</Label>
                            <Input
                              id="managementStartDate"
                              type="date"
                              value={formData.managementStartDate}
                              onChange={(e) => setFormData({ ...formData, managementStartDate: e.target.value })}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {managerSearch.length < 2 && !selectedManager && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Start typing to search for property managers</p>
                        <p className="text-sm mt-2">Enter at least 2 characters to begin searching</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              {currentStep === 1 ? (
                <>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleNextFromStep1} disabled={loading}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : currentStep === 2 ? (
                <>
                  <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleNextFromStep2} disabled={loading}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      (formData.registrationType === "owner" && !selectedTaxpayer) ||
                      (formData.registrationType === "manager" && !selectedManager)
                    }
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Property
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select City</DialogTitle>
            <DialogDescription>Search and select a city from the list</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cities..."
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredCities.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  {cities.length === 0 ? "No cities available. Please contact support." : "No cities found."}
                </div>
              ) : (
                filteredCities.map((city) => (
                  <Button
                    key={city.id}
                    variant={formData.cityId === city.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleCityChange(city.id)}
                  >
                    {city.name}
                  </Button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
