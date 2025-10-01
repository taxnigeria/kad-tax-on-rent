"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
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
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState<PropertyFormData>({
    propertyName: "",
    propertyType: "",
    propertyCategory: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let ownerId: string

      if (taxpayerId) {
        ownerId = taxpayerId
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast({
            title: "Error",
            description: "You must be logged in to register a property",
            variant: "destructive",
          })
          return
        }
        ownerId = user.id
      }

      // First, create the address
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({
          street_address: `${formData.houseNumber} ${formData.streetName}`,
          city: formData.city,
          state: formData.state,
          lga: formData.lga,
          country: "Nigeria",
        })
        .select()
        .single()

      if (addressError) throw addressError

      // Then create the property
      const { error: propertyError } = await supabase.from("properties").insert({
        owner_id: ownerId,
        registered_property_name: formData.propertyName,
        property_type: formData.propertyType,
        property_category: formData.propertyCategory,
        house_number: formData.houseNumber,
        street_name: formData.streetName,
        address_id: addressData.id,
        total_units: Number.parseInt(formData.totalUnits) || 1,
        occupied_units: Number.parseInt(formData.occupiedUnits) || 0,
        total_annual_rent: Number.parseFloat(formData.totalAnnualRent) || 0,
        total_floor_area: Number.parseFloat(formData.floorArea) || 0,
        verification_status: "pending",
        status: "draft",
        rental_commencement_date: new Date().toISOString().split("T")[0],
      })

      if (propertyError) throw propertyError

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

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error registering property:", error)
      toast({
        title: "Error",
        description: "Failed to register property. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="floorArea">
                  Floor Area (sqm) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="floorArea"
                  type="number"
                  placeholder="e.g., 150"
                  value={formData.floorArea}
                  onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Address Information</h3>
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
                  type="number"
                  placeholder="e.g., 1200000"
                  value={formData.totalAnnualRent}
                  onChange={(e) => setFormData({ ...formData, totalAnnualRent: e.target.value })}
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
  )
}
