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
import { Loader2, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { createProperty } from "@/app/actions/create-property"

interface RegisterPropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  taxpayerId?: string // Optional: for admins registering on behalf of taxpayers
  initialData?: Partial<PropertyFormData> // Optional: for AI prefilling
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
  city: string
  state: string
  lga: string
  totalUnits: string
  occupiedUnits: string
  totalAnnualRent: string
  floorArea: string
}

export function RegisterPropertyModal({
  open,
  onOpenChange,
  onSuccess,
  taxpayerId,
  initialData,
}: RegisterPropertyModalProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const [formData, setFormData] = useState<PropertyFormData>({
    propertyName: "",
    propertyType: "",
    propertyCategory: "",
    businessType: "",
    commencementYear: "",
    registeringForSomeoneElse: false,
    houseNumber: "",
    streetName: "",
    city: "",
    state: "",
    lga: "",
    totalUnits: "",
    occupiedUnits: "",
    totalAnnualRent: "",
    floorArea: "",
  })

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
    if (!formData.houseNumber || !formData.streetName || !formData.city || !formData.state) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all address fields before geocoding",
        variant: "destructive",
      })
      return
    }

    setGeocoding(true)
    try {
      const address = `${formData.houseNumber} ${formData.streetName}, ${formData.city}, ${formData.state}, Nigeria`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        city: formData.city,
        state: formData.state,
        lga: formData.lga,
        totalUnits: Number.parseInt(formData.totalUnits) || 1,
        occupiedUnits: Number.parseInt(formData.occupiedUnits) || 0,
        totalAnnualRent: Number.parseFloat(formData.totalAnnualRent) || 0,
        floorArea: formData.floorArea ? Number.parseFloat(formData.floorArea) : undefined,
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

      setFormData({
        propertyName: "",
        propertyType: "",
        propertyCategory: "",
        businessType: "",
        commencementYear: "",
        registeringForSomeoneElse: false,
        houseNumber: "",
        streetName: "",
        city: "",
        state: "",
        lga: "",
        totalUnits: "",
        occupiedUnits: "",
        totalAnnualRent: "",
        floorArea: "",
      })
      setCoordinates(null)

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[85vw] max-w-[85vw] sm:max-w-7xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{taxpayerId ? "Register Property for Taxpayer" : "Register New Property"}</DialogTitle>
            <DialogDescription>
              Fill in the details below to register a new property. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Property Information</h3>
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
                  <Label htmlFor="floorArea">Floor Area (sqm)</Label>
                  <Input
                    id="floorArea"
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.floorArea}
                    onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                  />
                </div>

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
                  <Label htmlFor="commencementYear">
                    Rent Collection Start Year <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="commencementYear"
                    type="number"
                    placeholder="e.g., 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.commencementYear}
                    onChange={(e) => setFormData({ ...formData, commencementYear: e.target.value })}
                    required
                  />
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

            {/* Address Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Address Information</h3>
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
              <div className="grid gap-4 md:grid-cols-2">
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

                <div className="space-y-2">
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
                  <Input
                    id="city"
                    placeholder="e.g., Lagos"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="state"
                    placeholder="e.g., Lagos State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="lga">
                    Local Government Area (LGA) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lga"
                    placeholder="e.g., Ikeja"
                    value={formData.lga}
                    onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Rental Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Rental Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label htmlFor="occupiedUnits">
                    Occupied Units <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="occupiedUnits"
                    type="number"
                    placeholder="e.g., 8"
                    value={formData.occupiedUnits}
                    onChange={(e) => setFormData({ ...formData, occupiedUnits: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
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
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Property
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Property Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to register this property? Please review the details:
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <strong>Property:</strong> {formData.propertyName}
                </div>
                <div>
                  <strong>Type:</strong> {formData.propertyType}
                </div>
                <div>
                  <strong>Business Type:</strong> {formData.businessType.replace(/_/g, " ")}
                </div>
                <div>
                  <strong>Rent Start Year:</strong> {formData.commencementYear}
                </div>
                <div>
                  <strong>Address:</strong> {formData.houseNumber} {formData.streetName}, {formData.city}
                </div>
                <div>
                  <strong>Annual Rent:</strong> ₦{formatNumber(formData.totalAnnualRent)}
                </div>
                {formData.registeringForSomeoneElse && (
                  <div className="text-amber-600">
                    <strong>Note:</strong> Registering on behalf of someone else
                  </div>
                )}
                {coordinates && (
                  <div className="text-green-600">
                    <strong>Location:</strong> Coordinates captured
                  </div>
                )}
              </div>
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
