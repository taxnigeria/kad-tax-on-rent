"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, Building2, MapPin, ImageIcon, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"

interface Property {
  id: string
  registered_property_name: string
  property_reference: string
  property_type: string
  property_category: string
  status: string
  total_annual_rent: number
  house_number: string
  street_name: string
  property_description?: string
  total_units?: number
  occupied_units?: number
  number_of_floors?: number
  year_built?: number
  rental_commencement_date?: string
  business_type?: string
  admin_notes?: string
  rejection_reason?: string
  area_office_id?: string
  property_manager_id?: string
  address_id?: string // Added address_id
  // Nested data
  area_offices?: { id: string; office_name: string }
  addresses?: { street_address: string; city: string; lga: string; state: string }
  documents?: { file_url: string; document_type: string }[]
}

interface EditPropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property | null
  onUpdate: () => void
}

const PROPERTY_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed", label: "Mixed Use" },
]

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

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
]

export function EditPropertyModal({ open, onOpenChange, property, onUpdate }: EditPropertyModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [areaOffices, setAreaOffices] = useState<{ id: string; office_name: string }[]>([])
  const [propertyManagers, setPropertyManagers] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [detailsForm, setDetailsForm] = useState({
    registered_property_name: "",
    property_type: "",
    property_category: "",
    status: "",
    total_annual_rent: "",
    property_description: "",
    total_units: "",
    occupied_units: "",
    number_of_floors: "",
    year_built: "",
    rental_commencement_date: "",
    business_type: "",
    admin_notes: "",
    rejection_reason: "",
    property_manager_id: "",
  })

  const [addressForm, setAddressForm] = useState({
    house_number: "",
    street_name: "",
    area_office_id: "",
    street_address: "",
    city: "",
    lga: "",
  })

  const [propertyFacadeImage, setPropertyFacadeImage] = useState<{ url: string; name: string } | null>(null)
  const [addressNumberImage, setAddressNumberImage] = useState<{ url: string; name: string } | null>(null)
  const [otherDocuments, setOtherDocuments] = useState<Array<{ url: string; name: string; documentName: string }>>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]) // Declare the variable here
  const [otherDocumentName, setOtherDocumentName] = useState("") // Add state for document name input

  useEffect(() => {
    if (open) {
      fetchAreaOffices()
      fetchPropertyManagers()
    }
  }, [open])

  useEffect(() => {
    if (property) {
      setDetailsForm({
        registered_property_name: property.registered_property_name || "",
        property_type: property.property_type || "",
        property_category: property.property_category || "",
        status: property.status || "",
        total_annual_rent: property.total_annual_rent?.toString() || "",
        property_description: property.property_description || "",
        total_units: property.total_units?.toString() || "",
        occupied_units: property.occupied_units?.toString() || "",
        number_of_floors: property.number_of_floors?.toString() || "",
        year_built: property.year_built?.toString() || "",
        rental_commencement_date: property.rental_commencement_date || "",
        business_type: property.business_type || "",
        admin_notes: property.admin_notes || "",
        rejection_reason: property.rejection_reason || "",
        property_manager_id: property.property_manager_id || "",
      })
      setAddressForm({
        house_number: property.house_number || "",
        street_name: property.street_name || "",
        area_office_id: property.area_office_id || "",
        street_address: property.addresses?.street_address || "",
        city: property.addresses?.city || "",
        lga: property.addresses?.lga || "",
      })
      // Load existing images
      const existingImages =
        property.documents?.filter(
          (doc) => doc.document_type === "property_facade" || doc.document_type === "address_number",
        ) || []
      setPropertyFacadeImage(existingImages.find((img) => img.document_type === "property_facade") || null)
      setAddressNumberImage(existingImages.find((img) => img.document_type === "address_number") || null)
      setOtherDocuments(
        property.documents
          ?.filter((doc) => doc.document_type !== "property_facade" && doc.document_type !== "address_number")
          .map((doc) => ({
            url: doc.file_url,
            name: doc.file_url.split("/").pop() || "",
            documentName: doc.document_type,
          })) || [],
      )
      setImagesToDelete([]) // Initialize the variable here
      setErrors({})
      setActiveTab("details")
    }
  }, [property])

  async function fetchAreaOffices() {
    const supabase = createClient()
    const { data } = await supabase
      .from("area_offices")
      .select("id, office_name")
      .eq("is_active", true)
      .order("office_name")
    if (data) setAreaOffices(data)
  }

  async function fetchPropertyManagers() {
    const supabase = createClient()
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("role", "property_manager")
      .eq("is_active", true)
      .order("first_name")
    if (data) setPropertyManagers(data)
  }

  function validateForm() {
    const newErrors: Record<string, string> = {}

    if (!detailsForm.registered_property_name.trim()) {
      newErrors.registered_property_name = "Property name is required"
    }
    if (!detailsForm.property_type) {
      newErrors.property_type = "Property type is required"
    }
    if (!detailsForm.status) {
      newErrors.status = "Status is required"
    }
    if (!addressForm.house_number.trim()) {
      newErrors.house_number = "House number is required"
    }
    if (!addressForm.street_name.trim()) {
      newErrors.street_name = "Street name is required"
    }
    if (!addressForm.street_address.trim()) {
      newErrors.street_address = "Full address is required"
    }
    if (!addressForm.city.trim()) {
      newErrors.city = "City is required"
    }
    if (!addressForm.lga.trim()) {
      newErrors.lga = "LGA is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, imageType: "facade" | "address" | "other") {
    const file = e.target.files?.[0]
    if (!file) return

    if (imageType === "other") {
      if (!otherDocumentName.trim()) {
        toast.error("Document Name Required", {
          description: "Please enter a name for this document.",
        })
        return
      }
    }

    setUploadingImages(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("propertyId", property.id)
      formDataToSend.append(
        imageType === "facade" ? "facadeImage" : imageType === "address" ? "addressNumberImage" : "otherImage",
        file,
      )
      if (imageType === "other") {
        formDataToSend.append("otherImageName", otherDocumentName)
      }

      const response = await fetch("/api/properties/upload-images", {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()

      const newImage = {
        url: data.files[0]?.url || "",
        name: imageType === "other" ? otherDocumentName : file.name,
      }

      if (imageType === "facade") {
        setPropertyFacadeImage(newImage)
      } else if (imageType === "address") {
        setAddressNumberImage(newImage)
      } else if (imageType === "other") {
        setOtherDocuments([...otherDocuments, newImage])
        setOtherDocumentName("") // Clear input after upload
      }

      toast.success(
        `${imageType === "facade" ? "Property facade" : imageType === "address" ? "Address number" : "Document"} uploaded successfully`,
      )
    } catch (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      toast.error("Failed to upload image. Please try again.", {
        description: uploadError instanceof Error ? uploadError.message : "Failed to upload image. Please try again.",
      })
    } finally {
      setUploadingImages(false)
    }
  }

  function handleRemoveImage(imageType: "facade" | "address" | "other", index?: number) {
    if (imageType === "facade") {
      setPropertyFacadeImage(null)
      setImagesToDelete((prev) => [...prev, propertyFacadeImage?.url || ""])
    } else if (imageType === "address") {
      setAddressNumberImage(null)
      setImagesToDelete((prev) => [...prev, addressNumberImage?.url || ""])
    } else if (imageType === "other" && index !== undefined) {
      setOtherDocuments(otherDocuments.filter((_, i) => i !== index))
      setImagesToDelete((prev) => [...prev, otherDocuments[index]?.url || ""])
    }
  }

  async function handleSubmit() {
    if (!property || !validateForm()) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Update property
      const { error: propertyError } = await supabase
        .from("properties")
        .update({
          registered_property_name: detailsForm.registered_property_name.trim(),
          property_type: detailsForm.property_type,
          property_category: detailsForm.property_category || null,
          status: detailsForm.status,
          total_annual_rent: detailsForm.total_annual_rent
            ? Number.parseFloat(detailsForm.total_annual_rent.replace(/,/g, ""))
            : null,
          property_description: detailsForm.property_description.trim() || null,
          total_units: detailsForm.total_units ? Number.parseInt(detailsForm.total_units) : null,
          occupied_units: detailsForm.occupied_units ? Number.parseInt(detailsForm.occupied_units) : null,
          number_of_floors: detailsForm.number_of_floors ? Number.parseInt(detailsForm.number_of_floors) : null,
          year_built: detailsForm.year_built ? Number.parseInt(detailsForm.year_built) : null,
          rental_commencement_date: detailsForm.rental_commencement_date || null,
          business_type: detailsForm.business_type.trim() || null,
          admin_notes: detailsForm.admin_notes.trim() || null,
          rejection_reason: detailsForm.rejection_reason.trim() || null,
          property_manager_id: detailsForm.property_manager_id || null,
          house_number: addressForm.house_number.trim(),
          street_name: addressForm.street_name.trim(),
          area_office_id: addressForm.area_office_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id)

      if (propertyError) throw propertyError

      if (property.address_id) {
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            street_address: addressForm.street_address.trim(),
            city: addressForm.city.trim(),
            lga: addressForm.lga.trim(),
          })
          .eq("id", property.address_id)

        if (addressError) console.error("Error updating addresses:", addressError.message)
      }

      // Delete removed images from documents table
      if (imagesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("documents")
          .delete()
          .eq("entity_id", property.id)
          .in("file_url", imagesToDelete)

        if (deleteError) console.error("Error deleting images:", deleteError)
      }

      // Add new images to documents table
      const newImages = [
        propertyFacadeImage && {
          entity_id: property.id,
          entity_type: "property",
          document_type: "property_facade",
          file_url: propertyFacadeImage.url,
          document_name: "Property Facade",
          uploaded_at: new Date().toISOString(),
        },
        addressNumberImage && {
          entity_id: property.id,
          entity_type: "property",
          document_type: "address_number",
          file_url: addressNumberImage.url,
          document_name: "Address Number",
          uploaded_at: new Date().toISOString(),
        },
        ...otherDocuments.map((doc) => ({
          entity_id: property.id,
          entity_type: "property",
          document_type: doc.documentName,
          file_url: doc.url,
          document_name: doc.documentName,
          uploaded_at: new Date().toISOString(),
        })),
      ].filter(Boolean)

      if (newImages.length > 0) {
        const { error: insertError } = await supabase.from("documents").insert(newImages)

        if (insertError) console.error("Error inserting images:", insertError)
      }

      toast.success("Property updated successfully")
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating property:", error)
      toast.error("Upload Failed", {
        description: "Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!property) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Update property details, address, and images. Reference: {property.property_reference}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="registered_property_name">Property Name *</Label>
              <Input
                id="registered_property_name"
                value={detailsForm.registered_property_name}
                onChange={(e) => setDetailsForm({ ...detailsForm, registered_property_name: e.target.value })}
                className={errors.registered_property_name ? "border-red-500" : ""}
              />
              {errors.registered_property_name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.registered_property_name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={detailsForm.property_type}
                  onValueChange={(value) => setDetailsForm({ ...detailsForm, property_type: value })}
                >
                  <SelectTrigger className={errors.property_type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property_category">Category</Label>
                <Select
                  value={detailsForm.property_category}
                  onValueChange={(value) => setDetailsForm({ ...detailsForm, property_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_CATEGORIES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={detailsForm.status}
                  onValueChange={(value) => setDetailsForm({ ...detailsForm, status: value })}
                >
                  <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_annual_rent">Annual Rent (₦)</Label>
                <Input
                  id="total_annual_rent"
                  value={detailsForm.total_annual_rent}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "")
                    const formatted = value ? Number.parseInt(value).toLocaleString() : ""
                    setDetailsForm({ ...detailsForm, total_annual_rent: formatted })
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_units">Total Units</Label>
                <Input
                  id="total_units"
                  type="number"
                  value={detailsForm.total_units}
                  onChange={(e) => setDetailsForm({ ...detailsForm, total_units: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupied_units">Occupied Units</Label>
                <Input
                  id="occupied_units"
                  type="number"
                  value={detailsForm.occupied_units}
                  onChange={(e) => setDetailsForm({ ...detailsForm, occupied_units: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number_of_floors">Floors</Label>
                <Input
                  id="number_of_floors"
                  type="number"
                  value={detailsForm.number_of_floors}
                  onChange={(e) => setDetailsForm({ ...detailsForm, number_of_floors: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year_built">Year Built</Label>
                <Input
                  id="year_built"
                  type="number"
                  value={detailsForm.year_built}
                  onChange={(e) => setDetailsForm({ ...detailsForm, year_built: e.target.value })}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental_commencement_date">Rental Commencement</Label>
                <Input
                  id="rental_commencement_date"
                  type="date"
                  value={detailsForm.rental_commencement_date}
                  onChange={(e) => setDetailsForm({ ...detailsForm, rental_commencement_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_manager_id">Property Manager</Label>
              <Select
                value={detailsForm.property_manager_id}
                onValueChange={(value) => setDetailsForm({ ...detailsForm, property_manager_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {propertyManagers.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.first_name} {pm.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_description">Description</Label>
              <Textarea
                id="property_description"
                value={detailsForm.property_description}
                onChange={(e) => setDetailsForm({ ...detailsForm, property_description: e.target.value })}
                rows={2}
              />
            </div>

            {detailsForm.status === "rejected" && (
              <div className="space-y-2">
                <Label htmlFor="rejection_reason">Rejection Reason</Label>
                <Textarea
                  id="rejection_reason"
                  value={detailsForm.rejection_reason}
                  onChange={(e) => setDetailsForm({ ...detailsForm, rejection_reason: e.target.value })}
                  rows={2}
                  placeholder="Reason for rejection..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin_notes">Admin Notes</Label>
              <Textarea
                id="admin_notes"
                value={detailsForm.admin_notes}
                onChange={(e) => setDetailsForm({ ...detailsForm, admin_notes: e.target.value })}
                rows={2}
                placeholder="Internal notes..."
              />
            </div>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address" className="space-y-4 mt-4">
            {/* Full Address Section */}
            <div className="space-y-2">
              <Label htmlFor="street_address">Full Address</Label>
              <Input
                id="street_address"
                placeholder="e.g., 123 Main Street, Kaduna"
                value={addressForm.street_address}
                onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                className={errors.street_address ? "border-red-500" : ""}
              />
              {errors.street_address && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.street_address}
                </p>
              )}
            </div>

            {/* City and LGA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., Kaduna"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.city}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lga">LGA</Label>
                <Input
                  id="lga"
                  placeholder="e.g., Kaduna North"
                  value={addressForm.lga}
                  onChange={(e) => setAddressForm({ ...addressForm, lga: e.target.value })}
                  className={errors.lga ? "border-red-500" : ""}
                />
                {errors.lga && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lga}
                  </p>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Property-Specific Address Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="house_number">House Number *</Label>
                <Input
                  id="house_number"
                  value={addressForm.house_number}
                  onChange={(e) => setAddressForm({ ...addressForm, house_number: e.target.value })}
                  className={errors.house_number ? "border-red-500" : ""}
                />
                {errors.house_number && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.house_number}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="street_name">Street Name *</Label>
                <Input
                  id="street_name"
                  value={addressForm.street_name}
                  onChange={(e) => setAddressForm({ ...addressForm, street_name: e.target.value })}
                  className={errors.street_name ? "border-red-500" : ""}
                />
                {errors.street_name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.street_name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_office_id">Area Office</Label>
              <Select
                value={addressForm.area_office_id}
                onValueChange={(value) => setAddressForm({ ...addressForm, area_office_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {areaOffices.map((ao) => (
                    <SelectItem key={ao.id} value={ao.id}>
                      {ao.office_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {property.addresses && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Current Address (from addresses table)</p>
                <p className="text-sm text-muted-foreground">
                  {property.addresses.street_address}, {property.addresses.city}, {property.addresses.lga},{" "}
                  {property.addresses.state}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4 mt-4">
            {/* Property Facade Upload */}
            <div className="space-y-2">
              <Label>Property Facade Image</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("facade-input")?.click()}
              >
                <input
                  id="facade-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "facade")}
                  disabled={uploadingImages}
                  className="hidden"
                />
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload property facade</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              {propertyFacadeImage && (
                <div className="relative inline-block w-full">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-muted">
                    <Image
                      src={propertyFacadeImage.url || "/placeholder.svg"}
                      alt="Property Facade"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => handleRemoveImage("facade")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Address Number Upload */}
            <div className="space-y-2">
              <Label>Address Number Image</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("address-input")?.click()}
              >
                <input
                  id="address-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "address")}
                  disabled={uploadingImages}
                  className="hidden"
                />
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload address number</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              {addressNumberImage && (
                <div className="relative inline-block w-full">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-muted">
                    <Image
                      src={addressNumberImage.url || "/placeholder.svg"}
                      alt="Address Number"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => handleRemoveImage("address")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Other Documents Upload */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Other Documents</h4>

              <div className="space-y-2">
                <Label htmlFor="doc-name">Document Name</Label>
                <Input
                  id="doc-name"
                  placeholder="e.g., Invoice Copy, Deed, Tax Clearance"
                  value={otherDocumentName}
                  onChange={(e) => setOtherDocumentName(e.target.value)}
                  disabled={uploadingImages}
                />
              </div>

              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("other-input")?.click()}
              >
                <input
                  id="other-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "other")}
                  disabled={uploadingImages || !otherDocumentName.trim()}
                  className="hidden"
                />
                {uploadingImages ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload document</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>

              {otherDocuments.length > 0 && (
                <div className="space-y-2">
                  {otherDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.url}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => {
                          setOtherDocuments(otherDocuments.filter((_, i) => i !== idx))
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!propertyFacadeImage && !addressNumberImage && otherDocuments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No documents uploaded yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || uploadingImages}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
