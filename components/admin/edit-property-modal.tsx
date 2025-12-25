"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { Upload } from "lucide-react"

interface EditPropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: any
  onUpdate: (property: any) => void
}

export function EditPropertyModal({ open, onOpenChange, property, onUpdate }: EditPropertyModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState("details")

  // State for details tab
  const [detailsForm, setDetailsForm] = useState({
    property_name: "",
    property_type: "",
    property_category: "",
    usage: "",
  })

  // State for address tab
  const [addressForm, setAddressForm] = useState({
    house_number: "",
    street_name: "",
    city_id: "",
    lga_id: "",
    area_office_id: "",
  })

  // State for images
  const [images, setImages] = useState<any[]>([])
  const [facadeImage, setFacadeImage] = useState<File | null>(null)
  const [addressNumberImage, setAddressNumberImage] = useState<File | null>(null)
  const [otherImages, setOtherImages] = useState<{ file: File; name: string }[]>([])
  const [otherDocName, setOtherDocName] = useState("")

  // Dropdowns data
  const [cities, setCities] = useState<any[]>([])
  const [lgas, setLgas] = useState<any[]>([])
  const [areaOffices, setAreaOffices] = useState<any[]>([])
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])
  const [propertyCategories, setPropertyCategories] = useState<any[]>([])
  const [usageTypes, setUsageTypes] = useState<any[]>([])

  const [currentAddress, setCurrentAddress] = useState<any>(null)

  const supabase = createClient()

  // Initialize form when property changes
  useEffect(() => {
    if (!property) return

    setDetailsForm({
      property_name: property.property_name || "",
      property_type: property.property_type || "",
      property_category: property.property_category || "",
      usage: property.usage || "",
    })

    setAddressForm({
      house_number: property.house_number || "",
      street_name: property.street_name || "",
      city_id: property.city_id || "",
      lga_id: property.lga_id || "",
      area_office_id: property.area_office_id || "",
    })

    // Fetch current address
    fetchCurrentAddress(property.address_id)
    fetchImages(property.id)
  }, [property])

  // Fetch dropdown data
  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Auto-fill LGA and Area Office when city changes
  useEffect(() => {
    if (addressForm.city_id) {
      const selectedCity = cities.find((c) => c.id === addressForm.city_id)
      if (selectedCity) {
        setAddressForm((prev) => ({
          ...prev,
          lga_id: selectedCity.lga_id || "",
          area_office_id: selectedCity.area_office_id || "",
        }))
      }
    }
  }, [addressForm.city_id, cities])

  const fetchDropdownData = async () => {
    try {
      const [citiesRes, lgasRes, aoRes, ptRes, pcRes, utRes] = await Promise.all([
        supabase.from("cities").select("*"),
        supabase.from("lgas").select("*"),
        supabase.from("area_offices").select("*"),
        supabase.from("property_types").select("*"),
        supabase.from("property_categories").select("*"),
        supabase.from("usage_types").select("*"),
      ])

      setCities(citiesRes.data || [])
      setLgas(lgasRes.data || [])
      setAreaOffices(aoRes.data || [])
      setPropertyTypes(ptRes.data || [])
      setPropertyCategories(pcRes.data || [])
      setUsageTypes(utRes.data || [])
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
    }
  }

  const fetchCurrentAddress = async (addressId: string) => {
    try {
      const { data } = await supabase.from("addresses").select("*").eq("id", addressId).single()
      setCurrentAddress(data)
    } catch (error) {
      console.error("Error fetching address:", error)
    }
  }

  const fetchImages = async (propertyId: string) => {
    try {
      const { data } = await supabase.from("documents").select("*").eq("property_id", propertyId)
      setImages(data || [])
    } catch (error) {
      console.error("Error fetching images:", error)
    }
  }

  const handleImageUpload = async (file: File, imageType: string) => {
    if (!file || !property) return

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("propertyId", property.id)
      formData.append("imageType", imageType)
      if (imageType === "other" && otherDocName) {
        formData.append("documentName", otherDocName)
      }

      const response = await fetch("/api/properties/upload-images", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      toast({
        title: "Success",
        description: `${imageType} image uploaded successfully`,
      })

      // Refresh images
      fetchImages(property.id)
      setFacadeImage(null)
      setAddressNumberImage(null)
      setOtherDocName("")
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from("properties")
        .update({
          ...detailsForm,
          ...addressForm,
        })
        .eq("id", property.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Property updated successfully",
      })

      onOpenChange(false)
      onUpdate({ ...property, ...detailsForm, ...addressForm })
    } catch (error) {
      console.error("Error updating property:", error)
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!property) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property Name</Label>
                <Input
                  value={detailsForm.property_name}
                  onChange={(e) => setDetailsForm({ ...detailsForm, property_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Property Type</Label>
                <Select
                  value={detailsForm.property_type}
                  onValueChange={(value) => setDetailsForm({ ...detailsForm, property_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((pt) => (
                      <SelectItem key={pt.id} value={pt.id}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Property Category</Label>
                <Select
                  value={detailsForm.property_category}
                  onValueChange={(value) => setDetailsForm({ ...detailsForm, property_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyCategories.map((pc) => (
                      <SelectItem key={pc.id} value={pc.id}>
                        {pc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Usage Type</Label>
                <Select
                  value={detailsForm.usage}
                  onValueChange={(value) => setDetailsForm({ ...detailsForm, usage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select usage" />
                  </SelectTrigger>
                  <SelectContent>
                    {usageTypes.map((ut) => (
                      <SelectItem key={ut.id} value={ut.id}>
                        {ut.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="address" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>House Number</Label>
                <Input
                  value={addressForm.house_number}
                  onChange={(e) => setAddressForm({ ...addressForm, house_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Street Name</Label>
                <Input
                  value={addressForm.street_name}
                  onChange={(e) => setAddressForm({ ...addressForm, street_name: e.target.value })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Select
                  value={addressForm.city_id}
                  onValueChange={(value) => setAddressForm({ ...addressForm, city_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.city_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>LGA</Label>
                <Select
                  value={addressForm.lga_id}
                  onValueChange={(value) => setAddressForm({ ...addressForm, lga_id: value })}
                >
                  <SelectTrigger>
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
              <div>
                <Label>Area Office</Label>
                <Select
                  value={addressForm.area_office_id}
                  onValueChange={(value) => setAddressForm({ ...addressForm, area_office_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area office" />
                  </SelectTrigger>
                  <SelectContent>
                    {areaOffices.map((ao) => (
                      <SelectItem key={ao.id} value={ao.id}>
                        {ao.office_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {currentAddress && (
              <>
                <Separator className="my-4" />
                <div>
                  <Label className="text-sm text-muted-foreground">Current Address</Label>
                  <Card className="p-3 mt-2">
                    <p className="text-sm">{currentAddress.address}</p>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            {/* Property Facade */}
            <div>
              <Label>Property Facade Image</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                {images.find((img) => img.document_type === "property_facade") ? (
                  <div className="space-y-2">
                    <Image
                      src={
                        images.find((img) => img.document_type === "property_facade")?.file_url || "/placeholder.svg"
                      }
                      alt="Property Facade"
                      width={200}
                      height={200}
                      className="rounded-lg mx-auto"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // Handle delete
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && setFacadeImage(e.target.files[0])}
                      className="hidden"
                      id="facade-upload"
                    />
                    <label htmlFor="facade-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm">Click to upload property facade</p>
                    </label>
                    {facadeImage && (
                      <Button
                        className="mt-2"
                        onClick={() => handleImageUpload(facadeImage, "property_facade")}
                        disabled={loading}
                      >
                        Upload Facade
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Address Number Image */}
            <div>
              <Label>Address Number Image</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                {images.find((img) => img.document_type === "address_number") ? (
                  <div className="space-y-2">
                    <Image
                      src={images.find((img) => img.document_type === "address_number")?.file_url || "/placeholder.svg"}
                      alt="Address Number"
                      width={200}
                      height={200}
                      className="rounded-lg mx-auto"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // Handle delete
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && setAddressNumberImage(e.target.files[0])}
                      className="hidden"
                      id="address-upload"
                    />
                    <label htmlFor="address-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm">Click to upload address number image</p>
                    </label>
                    {addressNumberImage && (
                      <Button
                        className="mt-2"
                        onClick={() => handleImageUpload(addressNumberImage, "address_number")}
                        disabled={loading}
                      >
                        Upload Address Number
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Other Documents */}
            <div>
              <Label>Other Documents</Label>
              <div className="mt-2 space-y-2">
                <Input
                  placeholder="Document name (e.g., Land Deed, Tax Certificate)"
                  value={otherDocName}
                  onChange={(e) => setOtherDocName(e.target.value)}
                />
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files &&
                      setOtherImages([...otherImages, { file: e.target.files[0], name: otherDocName }])
                    }
                    className="hidden"
                    id="other-upload"
                  />
                  <label htmlFor="other-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm">Click to upload additional documents</p>
                  </label>
                </div>
              </div>
            </div>

            <Separator />
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
