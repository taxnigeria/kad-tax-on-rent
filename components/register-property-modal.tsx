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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, MapPin, ChevronLeft, ChevronRight, Search, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { createProperty } from "@/app/actions/create-property"
import { createClient } from "@/utils/supabase/client"
import { Progress } from "@/components/ui/progress"
import { getProfileCompletionStatus } from "@/app/actions/verification"

interface RegisterPropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  taxpayerId?: string
  initialData?: Partial<PropertyFormData>
}

interface PropertyFormData {
  propertyName: string
  propertyType: string
  propertyCategory: string
  businessType: string
  commencementYear: string
  registeringForSomeoneElse: boolean
  houseNumber: string
  streetName: string
  cityId: string
  cityName: string
  state: string
  lgaId: string
  lgaName: string
  areaOfficeId: string
  areaOfficeName: string
  totalUnits: string
  occupiedUnits: string
  totalAnnualRent: string
  floorArea: string
  yearBuilt: string
  numberOfFloors: string
  propertyDescription: string
}

export function RegisterPropertyModal({
  open,
  onOpenChange,
  onSuccess,
  taxpayerId,
  initialData,
}: RegisterPropertyModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClient()

  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")
  const [checkingValidation, setCheckingValidation] = useState(false)

  const [cities, setCities] = useState<any[]>([])
  const [lgas, setLgas] = useState<any[]>([])
  const [areaOffices, setAreaOffices] = useState<any[]>([])
  const [defaultState, setDefaultState] = useState("")
  const [cityDialogOpen, setCityDialogOpen] = useState(false)
  const [citySearchQuery, setCitySearchQuery] = useState("")

  const [formData, setFormData] = useState<PropertyFormData>({
    propertyName: "",
    propertyType: "",
    propertyCategory: "",
    businessType: "",
    commencementYear: "",
    registeringForSomeoneElse: false,
    houseNumber: "",
    streetName: "",
    cityId: "",
    cityName: "",
    state: "",
    lgaId: "",
    lgaName: "",
    areaOfficeId: "",
    areaOfficeName: "",
    totalUnits: "",
    occupiedUnits: "",
    totalAnnualRent: "",
    floorArea: "",
    yearBuilt: "",
    numberOfFloors: "",
    propertyDescription: "",
  })

  useEffect(() => {
    if (open) {
      fetchLocationData()
      fetchSystemSettings()
      checkUserValidation()
    }
  }, [open])

  async function checkUserValidation() {
    if (!user?.uid || taxpayerId) {
      // Skip validation for admin registering for taxpayer
      return
    }

    setCheckingValidation(true)
    try {
      const result = await getProfileCompletionStatus(user.uid)

      if (!result.success) {
        console.error("Error checking profile status:", result.error)
        return
      }

      const { items } = result
      const missingItems: string[] = []

      if (!items.emailVerified) {
        missingItems.push("verify your email")
      }
      if (!items.phoneVerified) {
        missingItems.push("verify your phone number")
      }
      if (!items.kadirsIdGenerated) {
        missingItems.push("generate your KADIRS ID")
      }

      if (missingItems.length > 0) {
        const message = `Before registering a property, you need to ${missingItems.join(", ")}. Please complete these steps from your dashboard.`
        setValidationMessage(message)
        setShowValidationDialog(true)
      }
    } catch (error) {
      console.error("Error checking validation:", error)
    } finally {
      setCheckingValidation(false)
    }
  }

  async function fetchSystemSettings() {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "default_state")
        .single()

      if (!error && data) {
        const state = data.setting_value as any
        const stateValue = state.value || ""
        setDefaultState(stateValue)
        setFormData((prev) => ({ ...prev, state: stateValue }))
      }
    } catch (error) {
      console.error("Error fetching system settings:", error)
    }
  }

  async function fetchLocationData() {
    try {
      console.log("[v0] Fetching location data...")

      const [citiesRes, lgasRes, officesRes] = await Promise.all([
        supabase.from("cities").select("id, name, lga_id").order("name"),
        supabase.from("lgas").select("id, name, lga_id").order("name"),
        supabase.from("area_offices").select("id, office_name, area_office_id, lga_id").order("office_name"),
      ])

      console.log("[v0] Cities response:", citiesRes)
      console.log("[v0] LGAs response:", lgasRes)
      console.log("[v0] Area offices response:", officesRes)

      if (citiesRes.error) {
        console.error("[v0] Cities query error:", citiesRes.error)
      }
      if (lgasRes.error) {
        console.error("[v0] LGAs query error:", lgasRes.error)
      }
      if (officesRes.error) {
        console.error("[v0] Area offices query error:", officesRes.error)
      }

      if (citiesRes.data) {
        console.log("[v0] Setting cities:", citiesRes.data.length, "cities found")
        setCities(citiesRes.data)
      }
      if (lgasRes.data) {
        console.log("[v0] Setting LGAs:", lgasRes.data.length, "LGAs found")
        setLgas(lgasRes.data)
      }
      if (officesRes.data) {
        console.log("[v0] Setting area offices:", officesRes.data.length, "offices found")
        setAreaOffices(officesRes.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching location data:", error)
    }
  }

  const handleCitySelect = (cityId: string) => {
    const city = cities.find((c) => c.id === cityId)
    if (city) {
      const lga = lgas.find((l) => l.id === city.lga_id)
      const areaOffice = areaOffices.find((a) => a.lga_id === city.lga_id)

      setFormData({
        ...formData,
        cityId: city.id,
        cityName: city.name,
        lgaId: city.lga_id?.toString() || "",
        lgaName: lga?.name || "",
        areaOfficeId: areaOffice?.id?.toString() || "",
        areaOfficeName: areaOffice?.office_name || "",
      })
      setCityDialogOpen(false)
      setCitySearchQuery("")
    }
  }

  useEffect(() => {
    if (initialData && open) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }))
    }
  }, [initialData, open])

  const formatNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const handleNumberInput = (field: keyof PropertyFormData, value: string) => {
    const numbers = value.replace(/\D/g, "")
    setFormData({ ...formData, [field]: numbers })
  }

  const geocodeAddress = async () => {
    if (!formData.houseNumber || !formData.streetName || !formData.cityName || !formData.state) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all address fields before geocoding",
        variant: "destructive",
      })
      return
    }

    setGeocoding(true)
    try {
      const address = `${formData.houseNumber} ${formData.streetName}, ${formData.cityName}, ${formData.state}, Nigeria`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setCoordinates({ lat: Number.parseFloat(lat), lng: Number.parseFloat(lon) })
        toast({
          title: "Location Found",
          description: `Coordinates: ${lat}, ${lon}`,
        })
      } else {
        toast({
          title: "Location Not Found",
          description: "Could not find coordinates for this address. The property will be saved without geolocation.",
        })
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      toast({
        title: "Geocoding Error",
        description: "Failed to get location coordinates. The property will be saved without geolocation.",
        variant: "destructive",
      })
    } finally {
      setGeocoding(false)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.propertyName &&
          formData.propertyType &&
          formData.propertyCategory &&
          formData.houseNumber &&
          formData.streetName &&
          formData.cityId &&
          formData.lgaId &&
          formData.areaOfficeId
        )
      case 2:
        return !!(formData.totalUnits && formData.totalAnnualRent && formData.businessType && formData.commencementYear)
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive",
      })
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // This function is now only used for form structure, not for triggering confirmation
  }

  const handleRegisterClick = async () => {
    if (!validateStep(3)) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!taxpayerId && user?.uid) {
      setCheckingValidation(true)
      try {
        const result = await getProfileCompletionStatus(user.uid)

        if (result.success) {
          const { items } = result
          const missingItems: string[] = []

          if (!items.emailVerified) {
            missingItems.push("verify your email")
          }
          if (!items.phoneVerified) {
            missingItems.push("verify your phone number")
          }
          if (!items.kadirsIdGenerated) {
            missingItems.push("generate your KADIRS ID")
          }

          if (missingItems.length > 0) {
            const message = `Before registering a property, you need to ${missingItems.join(", ")}. Please complete these steps from your dashboard.`
            setValidationMessage(message)
            setShowValidationDialog(true)
            setCheckingValidation(false)
            return
          }
        }
      } catch (error) {
        console.error("Error checking validation:", error)
      } finally {
        setCheckingValidation(false)
      }
    }

    setShowConfirmation(true)
  }

  const handleConfirmedSubmit = async () => {
    setLoading(true)
    setShowConfirmation(false)

    try {
      if (!user?.uid) {
        toast({
          title: "Error",
          description: "You must be logged in to register a property",
          variant: "destructive",
        })
        return
      }

      const result = await createProperty({
        propertyName: formData.propertyName,
        propertyType: formData.propertyType,
        propertyCategory: formData.propertyCategory,
        businessType: formData.businessType,
        commencementYear: formData.commencementYear ? Number.parseInt(formData.commencementYear) : undefined,
        registeringForSomeoneElse: formData.registeringForSomeoneElse,
        houseNumber: formData.houseNumber,
        streetName: formData.streetName,
        city: formData.cityName,
        state: formData.state,
        lga: formData.lgaName,
        areaOfficeId: formData.areaOfficeId,
        totalUnits: Number.parseInt(formData.totalUnits) || 1,
        occupiedUnits: Number.parseInt(formData.occupiedUnits) || 0,
        totalAnnualRent: Number.parseFloat(formData.totalAnnualRent) || 0,
        floorArea: formData.floorArea ? Number.parseFloat(formData.floorArea) : undefined,
        yearBuilt: formData.yearBuilt ? Number.parseInt(formData.yearBuilt) : undefined,
        numberOfFloors: formData.numberOfFloors ? Number.parseInt(formData.numberOfFloors) : undefined,
        propertyDescription: formData.propertyDescription,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng,
        firebaseUid: user.uid,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: taxpayerId
          ? "Property registered successfully for taxpayer!"
          : "Property registered successfully! It will be reviewed by our team.",
      })

      // Reset form
      setFormData({
        propertyName: "",
        propertyType: "",
        propertyCategory: "",
        businessType: "",
        commencementYear: "",
        registeringForSomeoneElse: false,
        houseNumber: "",
        streetName: "",
        cityId: "",
        cityName: "",
        state: defaultState,
        lgaId: "",
        lgaName: "",
        areaOfficeId: "",
        areaOfficeName: "",
        totalUnits: "",
        occupiedUnits: "",
        totalAnnualRent: "",
        floorArea: "",
        yearBuilt: "",
        numberOfFloors: "",
        propertyDescription: "",
      })
      setCoordinates(null)
      setCurrentStep(1)

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error registering property:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register property. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCities = cities.filter((city) => city.name.toLowerCase().includes(citySearchQuery.toLowerCase()))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{taxpayerId ? "Register Property for Taxpayer" : "Register New Property"}</DialogTitle>
            <DialogDescription>
              Step {currentStep} of 3:{" "}
              {currentStep === 1 ? "Basic Information" : currentStep === 2 ? "Property Details" : "Review & Submit"}
            </DialogDescription>
            <div className="pt-2">
              <Progress value={(currentStep / 3) * 100} className="h-2" />
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Basic Property Information</h3>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">
                      Property Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                      required
                    >
                      <SelectTrigger id="propertyType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="mixed">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyCategory">
                      Property Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.propertyCategory}
                      onValueChange={(value) => setFormData({ ...formData, propertyCategory: value })}
                      required
                    >
                      <SelectTrigger id="propertyCategory">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="shop">Shop</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">
                      House Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="houseNumber"
                      placeholder="e.g., 123"
                      value={formData.houseNumber}
                      onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="streetName">
                      Street Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="streetName"
                      placeholder="e.g., Main Street"
                      value={formData.streetName}
                      onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between bg-transparent"
                      onClick={() => setCityDialogOpen(true)}
                    >
                      {formData.cityName || "Select city..."}
                      <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lga">
                      LGA <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lga"
                      value={formData.lgaName}
                      readOnly
                      className="bg-muted"
                      placeholder="Select city first"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaOffice">
                      Area Office <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="areaOffice"
                      value={formData.areaOfficeName}
                      readOnly
                      className="bg-muted"
                      placeholder="Select city first"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <Input id="state" value={formData.state || "Kaduna"} readOnly className="text-primary bg-muted" />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="registeringForSomeoneElse"
                    checked={formData.registeringForSomeoneElse}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, registeringForSomeoneElse: checked as boolean })
                    }
                  />
                  <Label htmlFor="registeringForSomeoneElse" className="text-sm font-normal cursor-pointer">
                    I am registering this property on behalf of someone else
                  </Label>
                </div>
              </div>
            )}

            {/* Step 2: Property Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Property Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessType">
                      Business Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                      required
                    >
                      <SelectTrigger id="businessType">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="cooperative">Cooperative</SelectItem>
                        <SelectItem value="franchise">Franchise</SelectItem>
                        <SelectItem value="trust">Trust</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalUnits">
                      Total Units <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="totalUnits"
                      type="number"
                      placeholder="e.g., 10"
                      value={formData.totalUnits}
                      onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupiedUnits">Occupied Units</Label>
                    <Input
                      id="occupiedUnits"
                      type="number"
                      placeholder="e.g., 8"
                      value={formData.occupiedUnits}
                      onChange={(e) => setFormData({ ...formData, occupiedUnits: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalAnnualRent">
                      Total Annual Rent (₦) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="totalAnnualRent"
                      type="text"
                      placeholder="e.g., 1,200,000"
                      value={formatNumber(formData.totalAnnualRent)}
                      onChange={(e) => handleNumberInput("totalAnnualRent", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      placeholder="e.g., 2015"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.yearBuilt}
                      onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfFloors">Number of Floors</Label>
                    <Input
                      id="numberOfFloors"
                      type="number"
                      placeholder="e.g., 3"
                      value={formData.numberOfFloors}
                      onChange={(e) => setFormData({ ...formData, numberOfFloors: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="floorArea">Floor Area (sqm)</Label>
                    <Input
                      id="floorArea"
                      type="number"
                      placeholder="e.g., 150"
                      value={formData.floorArea}
                      onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="propertyDescription">Property Description</Label>
                    <Input
                      id="propertyDescription"
                      placeholder="Brief description of the property"
                      value={formData.propertyDescription}
                      onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Review & Submit</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={geocodeAddress}
                    disabled={geocoding}
                    className="gap-2 bg-transparent"
                  >
                    {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    {coordinates ? "Update Location" : "Get Location"}
                  </Button>
                </div>
                {coordinates && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    📍 Location: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </div>
                )}
                <div className="space-y-3 text-sm border rounded-lg p-4">
                  <div>
                    <strong>Property:</strong> {formData.propertyName}
                  </div>
                  <div>
                    <strong>Type:</strong> {formData.propertyType} - {formData.propertyCategory}
                  </div>
                  <div>
                    <strong>Address:</strong> {formData.houseNumber} {formData.streetName}, {formData.cityName}
                  </div>
                  <div>
                    <strong>LGA:</strong> {formData.lgaName}
                  </div>
                  <div>
                    <strong>Area Office:</strong> {formData.areaOfficeName}
                  </div>
                  <div>
                    <strong>Annual Rent:</strong> ₦{formatNumber(formData.totalAnnualRent)}
                  </div>
                  <div>
                    <strong>Units:</strong> {formData.totalUnits} total
                    {formData.occupiedUnits && `, ${formData.occupiedUnits} occupied`}
                  </div>
                  {formData.registeringForSomeoneElse && (
                    <div className="text-amber-600">
                      <strong>Note:</strong> Registering on behalf of someone else
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleRegisterClick} disabled={loading || checkingValidation}>
                    {(loading || checkingValidation) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register Property
                  </Button>
                )}
              </div>
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
                    onClick={() => handleCitySelect(city.id)}
                  >
                    {city.name}
                  </Button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Profile Incomplete
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">{validationMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowValidationDialog(false)
                onOpenChange(false)
              }}
            >
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Property Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to register this property? Please review the details one last time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Register
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
