"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  UserPlus,
  Camera,
  MapPin,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Navigation,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/utils/image-compression"
import { toast as sonnerToast } from "sonner"
import { createTaxpayerByEnumerator, searchTaxpayersByEnumerator } from "@/app/actions/taxpayers"
import { enumerateProperty } from "@/app/actions/create-property"
import { PhoneInput } from "@/components/ui/phone-input"
import { validateEmailFormat } from "@/app/actions/validation"

interface Taxpayer {
  id: string
  user_id: string
  kadirs_id: string | null
  user: {
    first_name: string
    last_name: string
    email: string
    phone_number: string
  }
  business_name?: string
  properties?: Array<{
    registered_property_name: string
    property_type: string
  }>
  properties_count?: number
}

interface City {
  id: string
  name: string
  state: string
  lga_id: string
  area_office_id: string | null
  lgas?: { id: string; name: string }
  area_offices?: { id: string; office_name: string }
}

const PROPERTY_CATEGORIES = [
  { value: "plaza", label: "Plaza" },
  { value: "house", label: "House" },
  { value: "estate_compound", label: "Estate / Compound" },
  { value: "telecom_mast", label: "Telecommunication Mast" },
  { value: "farm", label: "Farm" },
  { value: "restaurant", label: "Restaurant" },
  { value: "garden_bar", label: "Garden / Bar" },
  { value: "event_center", label: "Event Center" },
  { value: "school", label: "School" },
  { value: "hospital", label: "Hospital" },
  { value: "shop", label: "Shop" },
  { value: "others", label: "Others" },
]

export default function EnumeratePage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Taxpayer[]>([])
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [debugInfo, setDebugInfo] = useState<{
    requestTime?: string;
    payloadSize?: string;
    responseStatus?: string;
    errorMessage?: string;
    rawData?: any;
    lastAction?: string;
  } | null>(null)

  // GPS coordinates
  const [gpsLoading, setGpsLoading] = useState(false)
  const [latitude, setLatitude] = useState<string>("")
  const [longitude, setLongitude] = useState<string>("")

  // Photos
  const [facadePhoto, setFacadePhoto] = useState<File | null>(null)
  const [addressNumberPhoto, setAddressNumberPhoto] = useState<File | null>(null)
  const [facadePreview, setFacadePreview] = useState<string>("")
  const [addressPreview, setAddressPreview] = useState<string>("")

  // File input refs
  const facadeInputRef = useRef<HTMLInputElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)

  // City data
  const [cities, setCities] = useState<City[]>([])
  const [citySearch, setCitySearch] = useState("")
  const [showCityModal, setShowCityModal] = useState(false)
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [loadingCities, setLoadingCities] = useState(false)
  const [lgas, setLgas] = useState<{ id: string; name: string }[]>([])
  const [areaOffices, setAreaOffices] = useState<{ id: string; office_name: string }[]>([])

  // New taxpayer form
  const [newTaxpayer, setNewTaxpayer] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    residentialAddress: "",
  })

  // Property form
  const [propertyData, setPropertyData] = useState({
    propertyName: "",
    propertyType: "residential",
    propertyCategory: "",
    houseNumber: "",
    streetName: "",
    city: "",
    lga: "",
    areaOfficeId: "",
    totalUnits: "",
    annualRent: "",
    enumerationNotes: "",
    rentalCommencementDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true)
      const supabase = createClient()

      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from("cities")
        .select(`
          id,
          name,
          state,
          lga_id,
          area_office_id,
          lgas (id, name),
          area_offices (id, office_name)
        `)
        .order("name")

      if (!citiesError && citiesData) {
        setCities(citiesData as City[])
      }

      // Fetch LGAs
      const { data: lgasData, error: lgasError } = await supabase
        .from("lgas")
        .select("id, name")
        .order("name")
      if (!lgasError && lgasData) {
        setLgas(lgasData)
      }

      // Fetch Area Offices
      const { data: officesData, error: officesError } = await supabase
        .from("area_offices")
        .select("id, office_name")
        .order("office_name")
      if (!officesError && officesData) {
        setAreaOffices(officesData)
      }

      setLoadingCities(false)
    }
    fetchCities()
  }, [])

  const filteredCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      city.lgas?.name?.toLowerCase().includes(citySearch.toLowerCase()),
  )

  const handleCitySelect = (city: City) => {
    setSelectedCity(city)
    setPropertyData({
      ...propertyData,
      city: city.name,
      lga: city.lgas?.name || "",
      areaOfficeId: city.area_office_id || "",
    })
    setShowCityModal(false)
    setCitySearch("")
    setValidationErrors({ ...validationErrors, city: "" })
  }

  const captureGPS = () => {
    if (!navigator.geolocation) {
      sonnerToast.error("Your device does not support GPS")
      return
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        setGpsLoading(false)
        sonnerToast.success("Location captured successfully")
        setValidationErrors({ ...validationErrors, gps: "" })
      },
      (error) => {
        console.error("[v0] GPS error:", error)
        setGpsLoading(false)
        sonnerToast.error("Could not capture location. Please enable location services.")
      },
    )
  }

  const searchTaxpayers = async () => {
    if (!searchTerm.trim()) {
      sonnerToast.error("Please enter a search term")
      return
    }

    if (!user?.uid) {
      sonnerToast.error("Please log in again")
      return
    }

    setLoading(true)
    try {
      const result = await searchTaxpayersByEnumerator(searchTerm, user.uid)
      if (!result.error) {
        setSearchResults(result.results as Taxpayer[])
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      sonnerToast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const capitalize = (str: string) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const validateStep2 = async () => {
    const errors: Record<string, string> = {}

    if (!newTaxpayer.firstName.trim()) {
      errors.firstName = "First name is required"
    }
    if (!newTaxpayer.lastName.trim()) {
      errors.lastName = "Last name is required"
    }
    if (!newTaxpayer.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required"
    } else {
      // Basic check for length, although PhoneInput handles more
      if (newTaxpayer.phoneNumber.length < 5) {
        errors.phoneNumber = "Invalid phone number"
      }
    }

    if (newTaxpayer.email && !(await validateEmailFormat(newTaxpayer.email))) {
      errors.email = "Invalid email format"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const createNewTaxpayer = async () => {
    const isValid = await validateStep2()
    if (!isValid) {
      sonnerToast.error("Please correct the errors in the form")
      return
    }

    if (!user?.uid) {
      sonnerToast.error("Please log in again")
      return
    }

    setLoading(true)
    try {
      const result = await createTaxpayerByEnumerator({
        firstName: newTaxpayer.firstName,
        lastName: newTaxpayer.lastName,
        phoneNumber: newTaxpayer.phoneNumber,
        email: newTaxpayer.email || null,
        address: newTaxpayer.residentialAddress || null,
        firebaseUid: user.uid,
      })

      if (result.success && result.taxpayer) {
        sonnerToast.success(`${newTaxpayer.firstName} ${newTaxpayer.lastName} has been registered`)

        setSelectedTaxpayer(result.taxpayer as Taxpayer)
        setStep(3)
      } else {
        throw new Error(result.error || "Failed to create taxpayer")
      }
    } catch (error: any) {
      sonnerToast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (file: File, type: "facade" | "address") => {
    const compressedFile = await compressImage(file, 0.5) // Compress to max 500KB

    if (type === "facade") {
      setFacadePhoto(compressedFile)
      setFacadePreview(URL.createObjectURL(compressedFile))
    } else {
      setAddressNumberPhoto(compressedFile)
      setAddressPreview(URL.createObjectURL(compressedFile))
    }

    // Show file size to user
    const sizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2)
    console.log(`[v0] Image compressed: ${sizeMB}MB`)
  }

  const submitProperty = async () => {
    if (!selectedTaxpayer) {
      sonnerToast.error("No taxpayer selected")
      return
    }

    if (!facadePhoto) {
      sonnerToast.error("Please upload facade photo")
      return
    }

    if (!propertyData.propertyName || !propertyData.houseNumber || !propertyData.streetName) {
      sonnerToast.error("Property name, house number, and street name are required")
      return
    }

    setLoading(true)
    setDebugInfo({
      requestTime: new Date().toISOString(),
      lastAction: "Submit Property",
      rawData: {
        taxpayerId: selectedTaxpayer.id,
        propertyName: propertyData.propertyName,
        propertyType: propertyData.propertyType,
        facadePhotoSize: facadePhoto.size,
        addressPhotoSize: addressNumberPhoto?.size || 0,
        latitude,
        longitude
      }
    })

    try {
      const formData = new FormData()
      formData.append("taxpayerId", selectedTaxpayer.id)
      formData.append("firebaseUid", user?.uid || "")
      formData.append("propertyName", propertyData.propertyName)
      formData.append("propertyType", propertyData.propertyType)
      formData.append("propertyCategory", propertyData.propertyCategory)
      formData.append("houseNumber", propertyData.houseNumber)
      formData.append("streetName", propertyData.streetName)
      formData.append("city", propertyData.city)
      formData.append("lga", propertyData.lga)
      formData.append("areaOfficeId", propertyData.areaOfficeId)
      formData.append("totalUnits", propertyData.totalUnits || "1")
      formData.append("annualRent", propertyData.annualRent || "0")
      formData.append("enumerationNotes", propertyData.enumerationNotes)
      formData.append("rentalCommencementDate", propertyData.rentalCommencementDate)
      formData.append("latitude", latitude)
      formData.append("longitude", longitude)
      formData.append("facadePhoto", facadePhoto)
      if (addressNumberPhoto) {
        formData.append("addressPhoto", addressNumberPhoto)
      }

      console.log("[Debug] Submitting property registration...")
      const result = await enumerateProperty(formData)
      console.log("[Debug] Server Response:", result)

      setDebugInfo(prev => ({
        ...prev,
        responseStatus: result.success ? "Success" : "Failed",
        errorMessage: result.error,
        rawData: result
      }))

      if (result.success) {
        sonnerToast.success("Property registered successfully!")
        setStep(1)
        setSelectedTaxpayer(null)
        setSearchResults([])
        setSearchTerm("")
        setPropertyData({
          propertyName: "",
          propertyType: "residential",
          propertyCategory: "",
          houseNumber: "",
          streetName: "",
          city: "",
          lga: "",
          areaOfficeId: "",
          totalUnits: "",
          annualRent: "",
          enumerationNotes: "",
          rentalCommencementDate: new Date().toISOString().split("T")[0],
        })
        setFacadePhoto(null)
        setAddressNumberPhoto(null)
        setFacadePreview("")
        setAddressPreview("")
        setLatitude("")
        setLongitude("")
        setSelectedCity(null)
        setDebugInfo(null) // Clear on success? Maybe keep for a second?
      } else {
        throw new Error(result.error || "Failed to register property")
      }
    } catch (error: any) {
      console.error("[Debug] Catch Error:", error)
      const errorMsg = error.message || "An unknown error occurred"

      setDebugInfo(prev => ({
        ...prev,
        responseStatus: "Critical Error / Exception",
        errorMessage: errorMsg,
        rawData: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
      }))

      sonnerToast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const formatNaira = (value: string) => {
    const num = value.replace(/[^\d]/g, "")
    if (!num) return ""
    return new Intl.NumberFormat("en-NG").format(Number.parseInt(num))
  }

  const parseNaira = (value: string) => {
    return value.replace(/[^\d]/g, "")
  }

  const validatePropertyForm = () => {
    const errors: Record<string, string> = {}

    if (!propertyData.propertyName.trim()) {
      errors.propertyName = "Property name is required"
    }
    if (!propertyData.propertyCategory) {
      errors.propertyCategory = "Property category is required"
    }
    if (!propertyData.houseNumber.trim()) {
      errors.houseNumber = "House number is required"
    }
    if (!propertyData.streetName.trim()) {
      errors.streetName = "Street name is required"
    }
    if (!propertyData.lga) {
      errors.lga = "LGA is required"
    }
    if (!propertyData.areaOfficeId) {
      errors.areaOfficeId = "Area office is required"
    }
    if (!latitude || !longitude) {
      errors.gps = "GPS coordinates are required"
    }
    if (!facadePhoto) {
      errors.facadePhoto = "Facade photo is required"
    }
    if (!propertyData.annualRent.trim()) {
      errors.annualRent = "Annual rent is required"
    }
    if (!propertyData.rentalCommencementDate.trim()) {
      errors.rentalCommencementDate = "Rental commencement date is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextToReview = () => {
    if (validatePropertyForm()) {
      setStep(4)
    } else {
      sonnerToast.error("Please fill in all required fields")
    }
  }

  if (authLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 md:pb-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/enumerator-dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Register Property</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <Card className="bg-yellow-500/10 border-yellow-500 mb-4">
          <CardContent className="p-3 text-center text-yellow-600">
            <p className="text-sm font-medium">You are offline. Data will be synced when connected.</p>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Search/Select Taxpayer */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Find Taxpayer</CardTitle>
            <CardDescription>Search for an existing taxpayer or create a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTaxpayers()}
              />
              <Button onClick={searchTaxpayers} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Search Results ({searchResults.length})</p>
                {searchResults.map((taxpayer) => (
                  <Card
                    key={taxpayer.id || taxpayer.user?.phone_number}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedTaxpayer(taxpayer)
                      setStep(3)
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {taxpayer.user?.first_name} {taxpayer.user?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{taxpayer.user?.phone_number}</p>
                        <p className="text-xs text-muted-foreground">{taxpayer.user?.email}</p>
                      </div>
                      <Badge variant="outline">
                        {taxpayer.properties_count ?? taxpayer.properties?.length ?? 0} properties
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full bg-transparent" onClick={() => setStep(2)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Register New Taxpayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Create New Taxpayer */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>New Taxpayer</CardTitle>
            <CardDescription>Enter the taxpayer's details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newTaxpayer.firstName}
                  onChange={(e) => {
                    const val = capitalize(e.target.value)
                    setNewTaxpayer({ ...newTaxpayer, firstName: val })
                    if (val.trim()) setValidationErrors((prev) => {
                      const { firstName, ...rest } = prev
                      return rest
                    })
                  }}
                  placeholder="John"
                  className={validationErrors.firstName ? "border-red-500" : ""}
                />
                {validationErrors.firstName && (
                  <p className="text-[10px] text-red-500">{validationErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={newTaxpayer.lastName}
                  onChange={(e) => {
                    const val = capitalize(e.target.value)
                    setNewTaxpayer({ ...newTaxpayer, lastName: val })
                    if (val.trim()) setValidationErrors((prev) => {
                      const { lastName, ...rest } = prev
                      return rest
                    })
                  }}
                  placeholder="Doe"
                  className={validationErrors.lastName ? "border-red-500" : ""}
                />
                {validationErrors.lastName && (
                  <p className="text-[10px] text-red-500">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <PhoneInput
                value={newTaxpayer.phoneNumber}
                onChange={(val) => {
                  setNewTaxpayer({ ...newTaxpayer, phoneNumber: val })
                  if (val.trim()) setValidationErrors((prev) => {
                    const { phoneNumber, ...rest } = prev
                    return rest
                  })
                }}
                onNormalizedChange={(normalized) => {
                  // We can store normalized if needed
                }}
                userId={user?.id}
                className={validationErrors.phoneNumber ? "[&_input]:border-red-500" : ""}
              />
              {validationErrors.phoneNumber && (
                <p className="text-[10px] text-red-500">{validationErrors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newTaxpayer.email}
                onChange={async (e) => {
                  const val = e.target.value
                  setNewTaxpayer({ ...newTaxpayer, email: val })
                  if (val && !(await validateEmailFormat(val))) {
                    setValidationErrors((prev) => ({ ...prev, email: "Invalid email format" }))
                  } else {
                    setValidationErrors((prev) => {
                      const { email, ...rest } = prev
                      return rest
                    })
                  }
                }}
                placeholder="john@example.com"
                className={validationErrors.email ? "border-red-500" : ""}
              />
              {validationErrors.email && (
                <p className="text-xs text-red-500">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Residential Address</Label>
              <Textarea
                value={newTaxpayer.residentialAddress}
                onChange={(e) => setNewTaxpayer({ ...newTaxpayer, residentialAddress: e.target.value })}
                placeholder="Enter full address"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={createNewTaxpayer} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Property Form */}
      {step === 3 && selectedTaxpayer && (
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              Registering for: {selectedTaxpayer.user.first_name} {selectedTaxpayer.user.last_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GPS Section */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">GPS Location</p>
                      {latitude && longitude ? (
                        <p className="text-xs text-muted-foreground">
                          {Number.parseFloat(latitude).toFixed(6)}, {Number.parseFloat(longitude).toFixed(6)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No location captured</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={captureGPS} disabled={gpsLoading}>
                    {gpsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4 mr-1" />
                    )}
                    {gpsLoading ? "" : "Capture"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Google Map Preview */}
            {latitude && longitude && (
              <Card className="overflow-hidden">
                <div className="h-40 w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}&zoom=17`}
                  />
                </div>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Property Name *</Label>
              <Input
                value={propertyData.propertyName}
                onChange={(e) => {
                  setPropertyData({ ...propertyData, propertyName: e.target.value })
                  setValidationErrors({ ...validationErrors, propertyName: "" })
                }}
                placeholder="e.g., Green Valley Apartments"
                className={validationErrors.propertyName ? "border-destructive" : ""}
              />
              {validationErrors.propertyName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.propertyName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Property Category *</Label>
              <Select
                value={propertyData.propertyCategory}
                onValueChange={(v) => {
                  setPropertyData({ ...propertyData, propertyCategory: v })
                  setValidationErrors({ ...validationErrors, propertyCategory: "" })
                }}
              >
                <SelectTrigger className={validationErrors.propertyCategory ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.propertyCategory && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.propertyCategory}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Property Type *</Label>
              <Select
                value={propertyData.propertyType}
                onValueChange={(v) => setPropertyData({ ...propertyData, propertyType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>House Number *</Label>
                <Input
                  value={propertyData.houseNumber}
                  onChange={(e) => {
                    setPropertyData({ ...propertyData, houseNumber: e.target.value })
                    setValidationErrors({ ...validationErrors, houseNumber: "" })
                  }}
                  placeholder="123"
                  className={validationErrors.houseNumber ? "border-destructive" : ""}
                />
                {validationErrors.houseNumber && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.houseNumber}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Total Units</Label>
                <Input
                  type="number"
                  value={propertyData.totalUnits}
                  onChange={(e) => setPropertyData({ ...propertyData, totalUnits: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Street Name *</Label>
              <Input
                value={propertyData.streetName}
                onChange={(e) => {
                  setPropertyData({ ...propertyData, streetName: e.target.value })
                  setValidationErrors({ ...validationErrors, streetName: "" })
                }}
                placeholder="Main Street"
                className={validationErrors.streetName ? "border-destructive" : ""}
              />
              {validationErrors.streetName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.streetName}
                </p>
              )}
            </div>

            {/* City Selector */}
            <div className="space-y-2">
              <Label>City</Label>
              <Button
                variant="outline"
                className={`w-full justify-between bg-transparent ${validationErrors.city ? "border-destructive" : ""}`}
                onClick={() => setShowCityModal(true)}
              >
                {selectedCity ? selectedCity.name : "Select city..."}
                <Search className="h-4 w-4 ml-2 opacity-50" />
              </Button>
              {validationErrors.city && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.city}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>LGA *</Label>
                <Select
                  value={propertyData.lga}
                  onValueChange={(value) => {
                    setPropertyData({ ...propertyData, lga: value })
                    setValidationErrors((prev) => ({ ...prev, lga: "" }))
                  }}
                >
                  <SelectTrigger className={validationErrors.lga ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {lgas.map((lga) => (
                      <SelectItem key={lga.id} value={lga.name}>
                        {lga.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.lga && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.lga}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Area Office *</Label>
                <Select
                  value={propertyData.areaOfficeId}
                  onValueChange={(value) => {
                    setPropertyData({ ...propertyData, areaOfficeId: value })
                    setValidationErrors((prev) => ({ ...prev, areaOfficeId: "" }))
                  }}
                >
                  <SelectTrigger className={validationErrors.areaOfficeId ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select Area Office" />
                  </SelectTrigger>
                  <SelectContent>
                    {areaOffices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.office_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.areaOfficeId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.areaOfficeId}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Annual Rent (₦) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                <Input
                  value={propertyData.annualRent}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "")
                    if (/^\d*$/.test(raw)) {
                      const formatted = raw ? Number(raw).toLocaleString() : ""
                      setPropertyData({ ...propertyData, annualRent: formatted })
                      setValidationErrors({ ...validationErrors, annualRent: "" })
                    }
                  }}
                  placeholder="500,000"
                  className={`pl-8 ${validationErrors.annualRent ? "border-destructive" : ""}`}
                />
              </div>
              {validationErrors.annualRent && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.annualRent}
                </p>
              )}
            </div>

            {/* Rental Commencement Date */}
            <div className="space-y-2">
              <Label>Rental Commencement Date *</Label>
              <Input
                type="date"
                value={propertyData.rentalCommencementDate}
                onChange={(e) => {
                  setPropertyData({ ...propertyData, rentalCommencementDate: e.target.value })
                  setValidationErrors({ ...validationErrors, rentalCommencementDate: "" })
                }}
                className={validationErrors.rentalCommencementDate ? "border-destructive" : ""}
              />
              {validationErrors.rentalCommencementDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.rentalCommencementDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={propertyData.enumerationNotes}
                onChange={(e) => setPropertyData({ ...propertyData, enumerationNotes: e.target.value })}
                placeholder="Any additional notes about the property..."
              />
            </div>

            {/* Photo Uploads with validation */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label>Facade Photo *</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center relative cursor-pointer ${validationErrors.facadePhoto ? "border-destructive" : ""}`}
                  onClick={() => facadeInputRef.current?.click()}
                >
                  {facadePreview ? (
                    <img
                      src={facadePreview || "/placeholder.svg"}
                      alt="Facade"
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="py-4">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-2">Tap to upload</p>
                    </div>
                  )}
                  <input
                    ref={facadeInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handlePhotoUpload(e.target.files[0], "facade")
                        setValidationErrors({ ...validationErrors, facadePhoto: "" })
                      }
                    }}
                  />
                </div>
                {validationErrors.facadePhoto && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.facadePhoto}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Address Number Photo (Optional)</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center relative cursor-pointer`}
                  onClick={() => addressInputRef.current?.click()}
                >
                  {addressPreview ? (
                    <img
                      src={addressPreview || "/placeholder.svg"}
                      alt="Address"
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="py-4">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-2">Tap to upload</p>
                    </div>
                  )}
                  <input
                    ref={addressInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handlePhotoUpload(e.target.files[0], "address")
                        setValidationErrors({ ...validationErrors, addressPhoto: "" })
                      }
                    }}
                  />
                </div>

              </div>
            </div>

            {/* GPS Validation Error */}
            {validationErrors.gps && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.gps}
              </p>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNextToReview} className="flex-1">
                Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && selectedTaxpayer && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>Confirm all details before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Taxpayer Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-2">Taxpayer</p>
              <p className="font-medium">
                {selectedTaxpayer.user.first_name} {selectedTaxpayer.user.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedTaxpayer.user.phone_number}</p>
            </div>

            {/* Property Summary - Updated */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Property Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span>{propertyData.propertyName}</span>
                <span className="text-muted-foreground">Category:</span>
                <span>{PROPERTY_CATEGORIES.find((c) => c.value === propertyData.propertyCategory)?.label || "-"}</span>
                <span className="text-muted-foreground">Type:</span>
                <span className="capitalize">{propertyData.propertyType}</span>
                <span className="text-muted-foreground">Address:</span>
                <span>
                  {propertyData.houseNumber} {propertyData.streetName}
                </span>
                <span className="text-muted-foreground">City:</span>
                <span>{selectedCity?.name || propertyData.city || "-"}</span>
                <span className="text-muted-foreground">LGA:</span>
                <span>{propertyData.lga}</span>
                <span className="text-muted-foreground">Area Office:</span>
                <span>{areaOffices.find(o => o.id === propertyData.areaOfficeId)?.office_name || "-"}</span>
                <span className="text-muted-foreground">Annual Rent:</span>
                <span>₦{propertyData.annualRent || "0"}</span>
                <span className="text-muted-foreground">Rental Commencement Date:</span>
                <span>{propertyData.rentalCommencementDate}</span>
                <span className="text-muted-foreground">GPS:</span>
                <span>
                  {latitude && longitude
                    ? `${Number.parseFloat(latitude).toFixed(6)}, ${Number.parseFloat(longitude).toFixed(6)}`
                    : "-"}
                </span>
              </div>
            </div>

            {/* Photo Previews */}
            <div className="grid grid-cols-2 gap-4">
              {facadePreview && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Facade Photo</p>
                  <img
                    src={facadePreview || "/placeholder.svg"}
                    alt="Facade"
                    className="w-full h-24 object-cover rounded"
                  />
                </div>
              )}
              {addressPreview && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Address Photo</p>
                  <img
                    src={addressPreview || "/placeholder.svg"}
                    alt="Address"
                    className="w-full h-24 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={submitProperty} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Submit
              </Button>
            </div>

            {/* Debug Info Section */}
            {(debugInfo || loading) && (
              <div className="mt-6 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-[10px] font-mono border border-slate-700 shadow-xl">
                <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Debug Diagnostic Panel</span>
                  <div className="flex gap-2">
                    {loading && (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        PROCESSING...
                      </span>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px]"
                      type="button"
                    >
                      COPY LOG
                    </button>
                    <button
                      onClick={() => setDebugInfo(null)}
                      className="px-2 py-0.5 bg-red-900/50 hover:bg-red-800/50 rounded text-[9px]"
                      type="button"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p><span className="text-slate-500">REQUEST AT:</span> {debugInfo?.requestTime || "Initializing..."}</p>
                  <p><span className="text-slate-500">ACTION:</span> {debugInfo?.lastAction || "None"}</p>
                  <p><span className="text-slate-500">STATUS:</span>
                    <span className={debugInfo?.responseStatus === "Success" ? "text-green-400" : "text-red-400"}>
                      {debugInfo?.responseStatus || (loading ? "Waiting for Server Response..." : "Idle")}
                    </span>
                  </p>

                  {debugInfo?.errorMessage && (
                    <div className="p-2 bg-red-950/30 border border-red-900/50 rounded mt-1">
                      <p className="text-red-400 font-bold mb-1">ERROR DETAILS:</p>
                      <p className="whitespace-pre-wrap">{debugInfo.errorMessage}</p>
                    </div>
                  )}

                  <div className="mt-2">
                    <p className="text-slate-500 mb-1">RAW PAYLOAD/RESPONSE:</p>
                    <pre className="max-h-40 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-800 scrollbar-thin scrollbar-thumb-slate-800">
                      {JSON.stringify(debugInfo?.rawData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* City Search Modal */}
      <Dialog open={showCityModal} onOpenChange={setShowCityModal}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select City</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cities..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto space-y-1">
              {loadingCities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredCities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cities found</p>
              ) : (
                filteredCities.map((city) => (
                  <div
                    key={city.id}
                    className="p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleCitySelect(city)}
                  >
                    <p className="font-medium">{city.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {city.lgas?.name} • {city.area_offices?.office_name || "No office assigned"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
