"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, Camera, MapPin, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Taxpayer {
  id: string
  user: {
    first_name: string
    last_name: string
    email: string
    phone_number: string
  }
  business_name?: string
  properties: Array<{
    registered_property_name: string
    property_type: string
  }>
}

export default function EnumeratePage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 1: Search, 2: Create Taxpayer, 3: Property Form, 4: Review
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Taxpayer[]>([])
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  // GPS coordinates
  const [gpsLoading, setGpsLoading] = useState(false)
  const [latitude, setLatitude] = useState<string>("")
  const [longitude, setLongitude] = useState<string>("")

  // New taxpayer form
  const [newTaxpayer, setNewTaxpayer] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    isBusiness: false,
    businessName: "",
    businessType: "",
    taxIdOrNin: "",
    residentialAddress: "",
  })

  // Property form
  const [propertyData, setPropertyData] = useState({
    propertyName: "",
    propertyType: "residential",
    houseNumber: "",
    streetName: "",
    city: "",
    lga: "",
    totalUnits: "",
    annualRent: "",
    enumerationNotes: "",
  })

  // Photos (compulsory)
  const [facadePhoto, setFacadePhoto] = useState<File | null>(null)
  const [addressNumberPhoto, setAddressNumberPhoto] = useState<File | null>(null)
  const [facadePreview, setFacadePreview] = useState<string>("")
  const [addressPreview, setAddressPreview] = useState<string>("")

  // Offline queue
  const [offlineQueue, setOfflineQueue] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && userRole !== "enumerator") {
      router.push("/login")
    }
  }, [userRole, authLoading, router])

  useEffect(() => {
    // Load offline queue from localStorage
    const saved = localStorage.getItem("enumerator_offline_queue")
    if (saved) {
      setOfflineQueue(JSON.parse(saved))
    }

    // Capture GPS on mount
    captureGPS()
  }, [router])

  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Available",
        description: "Your device does not support GPS",
        variant: "destructive",
      })
      return
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        setGpsLoading(false)
        toast({
          title: "Location Captured",
          description: "GPS coordinates saved successfully",
        })
      },
      (error) => {
        console.error("[v0] GPS error:", error)
        setGpsLoading(false)
        toast({
          title: "GPS Error",
          description: "Could not capture location. Please enable location services.",
          variant: "destructive",
        })
      },
    )
  }

  const searchTaxpayers = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a search term",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/enumerator/search-taxpayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm }),
      })

      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results)

        if (data.results.length === 0) {
          toast({
            title: "No Results",
            description: "No taxpayers found. You can create a new one.",
          })
        }
      } else {
        throw new Error("Search failed")
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectTaxpayer = (taxpayer: Taxpayer) => {
    setSelectedTaxpayer(taxpayer)
    setStep(3) // Go to property form
  }

  const createNewTaxpayer = async () => {
    // Validate
    if (!newTaxpayer.firstName || !newTaxpayer.lastName || !newTaxpayer.phoneNumber) {
      toast({
        title: "Missing Fields",
        description: "First name, last name, and phone number are required",
        variant: "destructive",
      })
      return
    }

    if (!user?.uid) {
      toast({
        title: "Authentication Error",
        description: "Please log in again",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/enumerator/create-taxpayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${newTaxpayer.firstName} ${newTaxpayer.lastName}`,
          phone: newTaxpayer.phoneNumber,
          email: newTaxpayer.email || null,
          address: newTaxpayer.residentialAddress || null,
          firebaseUid: user.uid,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast({
          title: "Taxpayer Created",
          description: `${newTaxpayer.firstName} ${newTaxpayer.lastName} has been registered`,
        })

        setSelectedTaxpayer({
          id: data.taxpayer.id,
          user: {
            first_name: newTaxpayer.firstName,
            last_name: newTaxpayer.lastName,
            email: newTaxpayer.email || "",
            phone_number: newTaxpayer.phoneNumber,
          },
          properties: [],
        })

        setStep(3) // Go to property form
      } else {
        const error = await res.json()
        throw new Error(error.error || "Failed to create taxpayer")
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = (file: File, type: "facade" | "address") => {
    if (type === "facade") {
      setFacadePhoto(file)
      setFacadePreview(URL.createObjectURL(file))
    } else {
      setAddressNumberPhoto(file)
      setAddressPreview(URL.createObjectURL(file))
    }
  }

  const submitProperty = async () => {
    // Validation
    if (!selectedTaxpayer) {
      toast({
        title: "Error",
        description: "No taxpayer selected",
        variant: "destructive",
      })
      return
    }

    if (!facadePhoto || !addressNumberPhoto) {
      toast({
        title: "Photos Required",
        description: "Please upload facade and address number photos",
        variant: "destructive",
      })
      return
    }

    if (!propertyData.propertyName || !propertyData.houseNumber || !propertyData.streetName) {
      toast({
        title: "Missing Fields",
        description: "Property name, house number, and street name are required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("taxpayerId", selectedTaxpayer.id)
      formData.append("propertyName", propertyData.propertyName)
      formData.append("propertyType", propertyData.propertyType)
      formData.append("houseNumber", propertyData.houseNumber)
      formData.append("streetName", propertyData.streetName)
      formData.append("city", propertyData.city)
      formData.append("lga", propertyData.lga)
      formData.append("totalUnits", propertyData.totalUnits)
      formData.append("annualRent", propertyData.annualRent)
      formData.append("latitude", latitude)
      formData.append("longitude", longitude)
      formData.append("enumerationNotes", propertyData.enumerationNotes)
      formData.append("facadePhoto", facadePhoto)
      formData.append("addressNumberPhoto", addressNumberPhoto)

      const res = await fetch("/api/enumerator/create-property", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        toast({
          title: "Property Registered",
          description: `${propertyData.propertyName} has been submitted for verification`,
        })

        // Reset and go back to dashboard
        router.push("/enumerator-dashboard")
      } else {
        const error = await res.json()
        throw new Error(error.error || "Failed to create property")
      }
    } catch (error: any) {
      // Save to offline queue if network error
      if (!navigator.onLine) {
        const queueItem = {
          taxpayer: selectedTaxpayer,
          property: propertyData,
          photos: { facade: facadePreview, address: addressPreview },
          gps: { latitude, longitude },
          timestamp: Date.now(),
        }

        const newQueue = [...offlineQueue, queueItem]
        setOfflineQueue(newQueue)
        localStorage.setItem("enumerator_offline_queue", JSON.stringify(newQueue))

        toast({
          title: "Saved Offline",
          description: "Property saved. Will sync when online.",
        })

        // Reset form
        router.push("/enumerator-dashboard")
      } else {
        toast({
          title: "Submission Failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-4 max-w-2xl mx-auto">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/enumerator-dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Register New Property</h1>
        <p className="text-sm text-muted-foreground">Step {step} of 4</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex-1 h-2 rounded-full ${step >= 4 ? "bg-primary" : "bg-muted"}`} />
      </div>

      {/* Step 1: Search Taxpayer */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Find Taxpayer</CardTitle>
            <CardDescription>Search by name, email, or phone number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter name, email, or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTaxpayers()}
                className="flex-1"
              />
              <Button onClick={searchTaxpayers} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Search Results ({searchResults.length})</Label>
                {searchResults.map((taxpayer) => (
                  <Card
                    key={taxpayer.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => selectTaxpayer(taxpayer)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {taxpayer.user.first_name} {taxpayer.user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{taxpayer.user.phone_number}</p>
                          {taxpayer.user.email && (
                            <p className="text-xs text-muted-foreground">{taxpayer.user.email}</p>
                          )}
                          {taxpayer.business_name && (
                            <Badge variant="secondary" className="mt-1">
                              {taxpayer.business_name}
                            </Badge>
                          )}
                        </div>
                        <Badge>{taxpayer.properties.length} properties</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setStep(2)} size="lg">
                <UserPlus className="mr-2 h-4 w-4" />
                Create New Taxpayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Create New Taxpayer */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>New Taxpayer Details</CardTitle>
            <CardDescription>Enter taxpayer information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newTaxpayer.firstName}
                  onChange={(e) => setNewTaxpayer({ ...newTaxpayer, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={newTaxpayer.lastName}
                  onChange={(e) => setNewTaxpayer({ ...newTaxpayer, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                type="tel"
                value={newTaxpayer.phoneNumber}
                onChange={(e) => setNewTaxpayer({ ...newTaxpayer, phoneNumber: e.target.value })}
                placeholder="0801234567"
              />
            </div>

            <div className="space-y-2">
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={newTaxpayer.email}
                onChange={(e) => setNewTaxpayer({ ...newTaxpayer, email: e.target.value })}
                placeholder="john@example.com"
              />
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
                    {gpsLoading ? "Capturing..." : "Capture"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Property Name *</Label>
              <Input
                value={propertyData.propertyName}
                onChange={(e) => setPropertyData({ ...propertyData, propertyName: e.target.value })}
                placeholder="e.g., Green Valley Apartments"
              />
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
                  onChange={(e) => setPropertyData({ ...propertyData, houseNumber: e.target.value })}
                  placeholder="123"
                />
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
                onChange={(e) => setPropertyData({ ...propertyData, streetName: e.target.value })}
                placeholder="Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={propertyData.city}
                  onChange={(e) => setPropertyData({ ...propertyData, city: e.target.value })}
                  placeholder="Kaduna"
                />
              </div>
              <div className="space-y-2">
                <Label>LGA</Label>
                <Input
                  value={propertyData.lga}
                  onChange={(e) => setPropertyData({ ...propertyData, lga: e.target.value })}
                  placeholder="Kaduna North"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Annual Rent (₦)</Label>
              <Input
                type="number"
                value={propertyData.annualRent}
                onChange={(e) => setPropertyData({ ...propertyData, annualRent: e.target.value })}
                placeholder="0"
              />
            </div>

            {/* Photo Uploads */}
            <div className="space-y-4 pt-4 border-t">
              <Label>Photos (Required) *</Label>

              <div className="grid grid-cols-2 gap-4">
                {/* Facade Photo */}
                <div className="space-y-2">
                  <Label className="text-xs">Property Facade</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {facadePreview ? (
                      <div className="relative">
                        <img
                          src={facadePreview || "/placeholder.svg"}
                          alt="Facade"
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setFacadePhoto(null)
                            setFacadePreview("")
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Tap to capture</p>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "facade")}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Address Number Photo */}
                <div className="space-y-2">
                  <Label className="text-xs">Address Number</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {addressPreview ? (
                      <div className="relative">
                        <img
                          src={addressPreview || "/placeholder.svg"}
                          alt="Address"
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setAddressNumberPhoto(null)
                            setAddressPreview("")
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Tap to capture</p>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], "address")}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={propertyData.enumerationNotes}
                onChange={(e) => setPropertyData({ ...propertyData, enumerationNotes: e.target.value })}
                placeholder="Any additional observations..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
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
            <CardDescription>Verify all information before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Taxpayer Info */}
            <div>
              <h3 className="font-medium mb-2">Taxpayer</h3>
              <Card className="bg-muted/50">
                <CardContent className="p-3 text-sm">
                  <p className="font-medium">
                    {selectedTaxpayer.user.first_name} {selectedTaxpayer.user.last_name}
                  </p>
                  <p className="text-muted-foreground">{selectedTaxpayer.user.phone_number}</p>
                </CardContent>
              </Card>
            </div>

            {/* Property Info */}
            <div>
              <h3 className="font-medium mb-2">Property Details</h3>
              <Card className="bg-muted/50">
                <CardContent className="p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{propertyData.propertyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{propertyData.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span>
                      {propertyData.houseNumber} {propertyData.streetName}
                    </span>
                  </div>
                  {propertyData.annualRent && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Rent:</span>
                      <span>₦{Number.parseFloat(propertyData.annualRent).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Photos */}
            <div>
              <h3 className="font-medium mb-2">Photos</h3>
              <div className="grid grid-cols-2 gap-4">
                {facadePreview && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Facade</p>
                    <img
                      src={facadePreview || "/placeholder.svg"}
                      alt="Facade"
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}
                {addressPreview && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Address Number</p>
                    <img
                      src={addressPreview || "/placeholder.svg"}
                      alt="Address"
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* GPS */}
            {latitude && longitude && (
              <div>
                <h3 className="font-medium mb-2">GPS Location</h3>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-sm">
                    <p className="text-muted-foreground">
                      {Number.parseFloat(latitude).toFixed(6)}, {Number.parseFloat(longitude).toFixed(6)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <input type="checkbox" id="verify" className="mt-1" required />
              <label htmlFor="verify" className="text-sm">
                I have verified this information with the property owner and confirm all details are accurate.
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={submitProperty} disabled={loading} className="flex-1">
                {loading ? "Submitting..." : "Submit Property"}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
