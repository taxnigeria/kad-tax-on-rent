"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Mail,
  Phone,
  Award as IdCard,
  Building2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { put } from "@vercel/blob"

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
  area_office_id: string | null
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
  lga_id: string
}

export function AddPropertyModal({ open, onOpenChange, onSuccess }: AddPropertyModalProps) {
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [propertyFacadeImage, setPropertyFacadeImage] = useState<{ url: string; name: string } | null>(null)
  const [addressNumberImage, setAddressNumberImage] = useState<{ url: string; name: string } | null>(null)
  const [otherDocuments, setOtherDocuments] = useState<{ url: string; name: string }[]>([]) // Added state for other documents
  const [cities, setCities] = useState<City[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [areaOffices, setAreaOffices] = useState<AreaOffice[]>([])
  const [cityDialogOpen, setCityDialogOpen] = useState(false)
  const [citySearchQuery, setCitySearchQuery] = useState("")
  const [searchingTaxpayers, setSearchingTaxpayers] = useState(false)
  const [searchingManagers, setSearchingManagers] = useState(false)

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

    // Images propertyFacadeImage and addressNumberImage
    propertyFacadeImage: null as { url: string; name: string } | null,
    addressNumberImage: null as { url: string; name: string } | null,
    otherDocuments: [] as { url: string; name: string }[], // Added otherDocuments to formData
  })

  const [taxpayerSearch, setTaxpayerSearch] = useState("")
  const [managerSearch, setManagerSearch] = useState("")
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([])
  const [managers, setManagers] = useState<PropertyManager[]>([])
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null)
  const [selectedManager, setSelectedManager] = useState<PropertyManager | null>(null)
  const [defaultState, setDefaultState] = useState("Kaduna")

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const [citiesRes, lgasRes, areaOfficesRes] = await Promise.all([
        supabase.from("cities").select("id, name, lga_id, area_office_id").order("name"),
        supabase.from("lgas").select("*").order("name"),
        supabase.from("area_offices").select("id, office_name, office_code, lga_id").order("office_name"),
      ])

      if (citiesRes.data) setCities(citiesRes.data)
      if (lgasRes.data) setLgas(lgasRes.data)
      if (areaOfficesRes.data) setAreaOffices(areaOfficesRes.data)
    }

    if (open) {
      fetchData()
    }
  }, [open])

  useEffect(() => {
    const fetchDefaultState = async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "default_state")
        .maybeSingle()

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
          taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (
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
        // Ensure taxpayer_profiles is an array and handle cases where it might be null or empty
        const processedData = (data || []).map((taxpayer: any) => ({
          ...taxpayer,
          taxpayer_profiles: taxpayer.taxpayer_profiles || [],
        }))
        setTaxpayers(processedData)
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
      // reset image fields
      propertyFacadeImage: null,
      addressNumberImage: null,
      otherDocuments: [],
    })
    setTaxpayerSearch("")
    setManagerSearch("")
    setTaxpayers([])
    setManagers([])
    setSelectedTaxpayer(null)
    setSelectedManager(null)
    setPropertyFacadeImage(null) // Reset component state as well
    setAddressNumberImage(null) // Reset component state as well
    setOtherDocuments([]) // Reset otherDocuments state
  }

  function handleCityChange(cityId: string) {
    const selectedCity = cities.find((c) => c.id === cityId)
    if (!selectedCity) return

    const cityLga = lgas.find((l) => l.id === selectedCity.lga_id)

    // Area office is now directly on the city
    const cityAreaOffice = selectedCity.area_office_id
      ? areaOffices.find((a) => a.id === selectedCity.area_office_id)
      : null

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
      toast.error("Missing Information", {
        description: "Please fill in all required fields including Area Office",
      })
      return
    }
    setCurrentStep(2)
  }

  function handleNextFromStep2() {
    if (!formData.annualRent || !formData.totalUnits) {
      toast.error("Missing Information", {
        description: "Please fill in Annual Rent and Total Units",
      })
      return
    }
    setCurrentStep(3)
  }

  // Updated handleImageUpload to use Vercel Blob and accept different image types
  async function handleImageUpload(file: File, imageType: "facade" | "address" | "other", documentName?: string) {
    setUploading(true) // Set uploading state at the beginning
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
      // Use a more specific path for better organization
      const filePath = `properties/${formData.areaOfficeId || "temp"}/${imageType}/${fileName}`

      const blob = await put(filePath, file, {
        access: "public",
      })

      if (!blob.url) throw new Error("Could not get public URL")

      const newImage = {
        url: blob.url,
        name: documentName || file.name, // Use provided name or original file name
      }

      if (imageType === "facade") {
        setPropertyFacadeImage(newImage)
        setFormData((prev) => ({ ...prev, propertyFacadeImage: newImage }))
      } else if (imageType === "address") {
        setAddressNumberImage(newImage)
        setFormData((prev) => ({ ...prev, addressNumberImage: newImage }))
      } else if (imageType === "other") {
        const updatedOtherDocuments = [...otherDocuments, newImage]
        setOtherDocuments(updatedOtherDocuments)
        setFormData((prev) => ({ ...prev, otherDocuments: updatedOtherDocuments }))
      }

      toast.success("Upload Successful", {
        description: `${imageType === "facade" ? "Property facade" : imageType === "address" ? "Address number" : "Document"} uploaded successfully`,
      })
    } catch (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      toast.error("Upload Failed", {
        description: "Failed to upload image. Please try again.",
      })
    } finally {
      setUploading(false) // Ensure uploading state is reset
    }
  }

  // modified handleRemoveImage to accept imageType
  const handleRemoveImage = (imageType: "facade" | "address" | "other", index?: number) => {
    if (imageType === "facade") {
      setPropertyFacadeImage(null)
      setFormData((prev) => ({ ...prev, propertyFacadeImage: null }))
    } else if (imageType === "address") {
      setAddressNumberImage(null)
      setFormData((prev) => ({ ...prev, addressNumberImage: null }))
    } else if (imageType === "other" && index !== undefined) {
      const updatedDocuments = formData.otherDocuments.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, otherDocuments: updatedDocuments }))
      setOtherDocuments(updatedDocuments) // Also update local state
    }
  }

  // validate images - making them optional
  const validateImages = (): boolean => {
    return true
  }

  // validate step and include image validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return (
        !!formData.propertyName &&
        !!formData.propertyType &&
        !!formData.propertyCategory &&
        !!formData.streetAddress &&
        !!formData.areaOfficeId
      )
    }
    if (step === 2) {
      return !!formData.annualRent && !!formData.totalUnits
    }
    if (step === 3) {
      if (formData.registrationType === "owner") {
        return !!selectedTaxpayer
      } else {
        return !!selectedManager
      }
    }
    // Step 4 validation is handled by validateImages() directly in handleSubmit
    return true
  }

  function handleBack() {
    // step logic adjusted for new step 4
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // step logic adjusted for new step 4
    if (currentStep < 4 && !validateStep(currentStep)) {
      toast.error("Missing Information", {
        description: `Please fill in all required fields for the current step.`,
      })
      return
    }
    if (currentStep === 4 && !validateImages()) {
      toast.error("Missing Images", {
        description: "Please upload property facade and address number images.",
      })
      return
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      return
    }

    // Final submission logic (currentStep === 4)
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
        // Add images to the property creation
        // use new image fields
        property_facade_image_url: formData.propertyFacadeImage?.url || null,
        property_facade_image_name: formData.propertyFacadeImage?.name || null,
        address_number_image_url: formData.addressNumberImage?.url || null,
        address_number_image_name: formData.addressNumberImage?.name || null,
        // Include other documents in the submission
        other_documents: formData.otherDocuments, // Assuming a JSON field in your DB for this
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

      toast.success("Success", {
        description: "Property created successfully",
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating property:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to create property",
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

  // progress calculation adjusted for new step 4
  const progress = ((currentStep - 1) / 4) * 100

  const filteredCities = cities.filter((city) => city.name.toLowerCase().includes(citySearchQuery.toLowerCase()))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Step {currentStep} of 4: {/* updated total steps */}
              {currentStep === 1
                ? "Basic Information"
                : currentStep === 2
                  ? "Property Details"
                  : currentStep === 3
                    ? "Owner/Manager Assignment"
                    : "Upload Images"}{" "}
              {/* added step 4 description */}
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
              <Tabs defaultValue="ownerManager" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ownerManager">Owner/Manager</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                </TabsList>

                <TabsContent value="ownerManager" className="space-y-4 pt-4">
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
                                    {/* Check if taxpayer_profiles exists and has elements before accessing kadirs_id */}
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
                              {/* Check if taxpayer_profiles exists and has elements before accessing kadirs_id */}
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
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Property Images</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload photos of the property to help with verification
                      </p>
                    </div>

                    {/* Property Facade Image */}
                    <div className="space-y-2">
                      <Label htmlFor="facade-input">
                        Property Facade Image (Optional)
                      </Label>
                      <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleImageUpload(e.target.files[0], "facade")
                            }
                          }}
                          disabled={uploading}
                          className="hidden"
                          id="facade-input"
                        />
                        <label htmlFor="facade-input" className="cursor-pointer block">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                        </label>
                      </div>
                      {propertyFacadeImage && (
                        <div className="mt-4 relative inline-block">
                          <img
                            src={propertyFacadeImage.url || "/placeholder.svg"}
                            alt="Property Facade"
                            className="h-32 w-auto object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage("facade")}
                            className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <p className="text-xs text-muted-foreground mt-2 truncate">{propertyFacadeImage.name}</p>
                        </div>
                      )}
                    </div>

                    {/* Address Number Image */}
                    <div className="space-y-2">
                      <Label htmlFor="address-input">
                        Address Number Image (Optional)
                      </Label>
                      <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleImageUpload(e.target.files[0], "address")
                            }
                          }}
                          disabled={uploading}
                          className="hidden"
                          id="address-input"
                        />
                        <label htmlFor="address-input" className="cursor-pointer block">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                        </label>
                      </div>
                      {addressNumberImage && (
                        <div className="mt-4 relative inline-block">
                          <img
                            src={addressNumberImage.url || "/placeholder.svg"}
                            alt="Address Number"
                            className="h-32 w-auto object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage("address")}
                            className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <p className="text-xs text-muted-foreground mt-2 truncate">{addressNumberImage.name}</p>
                        </div>
                      )}
                    </div>

                    {/* Other Documents Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="other-documents-input">Other Supporting Documents</Label>
                      <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          multiple // Allow multiple file uploads
                          accept="/*" // Accept all file types
                          onChange={(e) => {
                            if (e.target.files) {
                              for (let i = 0; i < e.target.files.length; i++) {
                                handleImageUpload(e.target.files[i], "other", `document_${i}`)
                              }
                            }
                          }}
                          disabled={uploading}
                          className="hidden"
                          id="other-documents-input"
                        />
                        <label htmlFor="other-documents-input" className="cursor-pointer block">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload or drag and drop documents</p>
                          <p className="text-xs text-muted-foreground mt-1">Any file type supported</p>
                        </label>
                      </div>
                      {formData.otherDocuments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {formData.otherDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2 truncate">
                                <p className="text-sm truncate">{doc.name}</p>
                                <span className="text-xs text-muted-foreground">
                                  ({(doc.name.length / 10).toFixed(0)} KB)
                                </span>{" "}
                                {/* Placeholder size */}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage("other", index)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* new step for image upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Upload Property Images</h3>

                  {/* Property Facade Image */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Property Facade Image (Optional)
                    </label>
                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleImageUpload(e.target.files[0], "facade")
                          }
                        }}
                        disabled={uploading}
                        className="hidden"
                        id="facade-input-step4"
                      />
                      <label htmlFor="facade-input-step4" className="cursor-pointer block">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                      </label>
                    </div>

                    {propertyFacadeImage && (
                      <div className="mt-4 relative inline-block">
                        <img
                          src={propertyFacadeImage.url || "/placeholder.svg"}
                          alt="Property Facade"
                          className="h-32 w-auto object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage("facade")}
                          className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-2 truncate">{propertyFacadeImage.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Address Number Image */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Address Number Image (Optional)
                    </label>
                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleImageUpload(e.target.files[0], "address")
                          }
                        }}
                        disabled={uploading}
                        className="hidden"
                        id="address-input-step4"
                      />
                      <label htmlFor="address-input-step4" className="cursor-pointer block">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                      </label>
                    </div>

                    {addressNumberImage && (
                      <div className="mt-4 relative inline-block">
                        <img
                          src={addressNumberImage.url || "/placeholder.svg"}
                          alt="Address Number"
                          className="h-32 w-auto object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage("address")}
                          className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-2 truncate">{addressNumberImage.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              {/* step logic adjusted for new step 4 */}
              {currentStep < 4 ? (
                <>
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  {currentStep === 1 && (
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                      Cancel
                    </Button>
                  )}
                  <Button type="button" onClick={handleSubmit} disabled={loading || !validateStep(currentStep)}>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                // This is for the final step (Step 4)
                <>
                  <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      loading || uploading // removed !validateImages() check
                    }
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Creating..." : "Create Property"}
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
