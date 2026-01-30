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
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    Search,
    Upload,
    X,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { put } from "@vercel/blob"
import { useAuth } from "@/contexts/auth-context"

type Client = {
    id: string
    first_name: string
    last_name: string
    email: string
    phone_number: string
}

type AddPropertyForClientModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    client: Client | null
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

export function AddPropertyForClientModal({ open, onOpenChange, onSuccess, client }: AddPropertyForClientModalProps) {
    const { user } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [propertyFacadeImage, setPropertyFacadeImage] = useState<{ url: string; name: string } | null>(null)
    const [addressNumberImage, setAddressNumberImage] = useState<{ url: string; name: string } | null>(null)
    const [otherDocuments, setOtherDocuments] = useState<{ url: string; name: string }[]>([])
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
        cityId: "",
        city: "",
        state: "Kaduna",
        lgaId: "",
        lga: "",
        areaOfficeId: "",
        areaOffice: "",

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

        // Images
        propertyFacadeImage: null as { url: string; name: string } | null,
        addressNumberImage: null as { url: string; name: string } | null,
        otherDocuments: [] as { url: string; name: string }[],
    })

    const [defaultState, setDefaultState] = useState("Kaduna")

    const supabase = createClient()

    useEffect(() => {
        async function fetchData() {
            const [citiesRes, lgasRes, areaOfficesRes] = await Promise.all([
                supabase.from("cities").select("id, name, lga_id, area_office_id").order("name"),
                supabase.from("lgas").select("id, name").order("name"),
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
            // Only reset form, preserve client
            setCurrentStep(1)
            setFormData(prev => ({
                ...prev,
                propertyName: "",
                propertyType: "",
                propertyCategory: "",
                houseNumber: "",
                streetAddress: "",
                cityId: "",
                city: "",
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
                propertyFacadeImage: null,
                addressNumberImage: null,
                otherDocuments: [],
            }))
            setPropertyFacadeImage(null)
            setAddressNumberImage(null)
            setOtherDocuments([])
        }
    }, [open])

    function handleCityChange(cityId: string) {
        const selectedCity = cities.find((c) => c.id === cityId)
        if (!selectedCity) return

        const cityLga = lgas.find((l) => l.id === selectedCity.lga_id)

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

    // Adjusted validation for fewer steps
    // Step 1: Basic Info
    // Step 2: Property Details
    // Step 3: Images
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
        // Step 3 (Images) validation handled separately or implicitly
        return true
    }

    const validateImages = (): boolean => {
        return propertyFacadeImage !== null && addressNumberImage !== null
    }

    function handleBack() {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    async function handleImageUpload(file: File, imageType: "facade" | "address" | "other", documentName?: string) {
        setUploading(true)
        try {
            const fileExt = file.name.split(".").pop()
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
            const filePath = `properties/${formData.areaOfficeId || "temp"}/${imageType}/${fileName}`

            const blob = await put(filePath, file, {
                access: "public",
                token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN
            })

            if (!blob.url) throw new Error("Could not get public URL")

            const newImage = {
                url: blob.url,
                name: documentName || file.name,
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

            toast.success("Upload Successful")
        } catch (uploadError) {
            console.error("Upload error:", uploadError)
            toast.error("Upload Failed", {
                description: "Failed to upload image. Please try again.",
            })
        } finally {
            setUploading(false)
        }
    }

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
            setOtherDocuments(updatedDocuments)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (currentStep < 3 && !validateStep(currentStep)) {
            toast.error("Missing Information", {
                description: `Please fill in all required fields.`,
            })
            return
        }
        if (currentStep === 3 && !validateImages()) {
            toast.error("Missing Images", {
                description: "Please upload property facade and address number images.",
            })
            return
        }

        if (currentStep < 3) {
            setCurrentStep(currentStep + 1)
            return
        }

        if (!client) {
            toast.error("Error", { description: "Client not identified" })
            return
        }
        if (!user) {
            toast.error("Error", { description: "Session expired" })
            return
        }

        setLoading(true)

        try {
            // Fetch manager details (current user) to ensure we have the correct DB ID
            const { data: managerData, error: managerError } = await supabase
                .from("users")
                .select("id, first_name, last_name, email, phone_number")
                .eq("firebase_uid", user.uid)
                .single()

            if (managerError || !managerData) {
                throw new Error("Could not verify your manager account")
            }


            // Create address
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

            if (addressError) throw new Error("Failed to create address")

            const propertyData: any = {
                registered_property_name: formData.propertyName,
                property_type: formData.propertyType,
                property_category: formData.propertyCategory,
                house_number: formData.houseNumber || null,
                street_name: formData.streetAddress,
                address_id: addressData.id,
                area_office_id: formData.areaOfficeId,
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
                property_facade_image_url: formData.propertyFacadeImage?.url || null,
                property_facade_image_name: formData.propertyFacadeImage?.name || null,
                address_number_image_url: formData.addressNumberImage?.url || null,
                address_number_image_name: formData.addressNumberImage?.name || null,
                other_documents: formData.otherDocuments, // Assuming column matches admin modal logic

                // Ownership & Management
                owner_id: client.id,
                has_property_manager: true,
                property_manager_id: managerData.id,
                manager_full_name: `${managerData.first_name} ${managerData.last_name}`,
                manager_email: managerData.email,
                manager_phone: managerData.phone_number
            }

            const { error: propertyError } = await supabase.from("properties").insert(propertyData)

            if (propertyError) {
                console.error("Property creation error:", propertyError)
                throw new Error("Failed to create property")
            }

            toast.success("Success", { description: "Property created successfully" })
            onSuccess()
            onOpenChange(false)
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

    const progress = ((currentStep - 1) / 3) * 100
    const filteredCities = cities.filter((city) => city.name.toLowerCase().includes(citySearchQuery.toLowerCase()))

    if (!client) return null

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Property for {client.first_name} {client.last_name}</DialogTitle>
                        <DialogDescription>
                            Step {currentStep} of 3
                        </DialogDescription>
                        <Progress value={progress} className="mt-2" />
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Basic Property Information */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="propertyName">Property Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="propertyName"
                                            placeholder="e.g., Sunset Apartments"
                                            value={formData.propertyName}
                                            onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="propertyType">Property Type <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={formData.propertyType}
                                            onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
                                        <Label htmlFor="propertyCategory">Property Category <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={formData.propertyCategory}
                                            onValueChange={(value) => setFormData({ ...formData, propertyCategory: value })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="house">House</SelectItem>
                                                <SelectItem value="apartment">Apartment</SelectItem>
                                                <SelectItem value="office">Office</SelectItem>
                                                <SelectItem value="shop">Shop</SelectItem>
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
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="streetAddress">Street Address <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="streetAddress"
                                        placeholder="e.g., Main Street"
                                        value={formData.streetAddress}
                                        onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                                        required
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
                                        >
                                            {formData.city || "Select city..."}
                                            <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="areaOffice">Area Office <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={formData.areaOfficeId}
                                            onValueChange={(value) => {
                                                const selectedOffice = areaOffices.find((a) => a.id === value)
                                                setFormData({ ...formData, areaOfficeId: value, areaOffice: selectedOffice?.office_name || "" })
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select area office" /></SelectTrigger>
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

                        {/* Step 2: Details */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="annualRent">Annual Rent (₦) <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="annualRent"
                                            value={formatNumber(formData.annualRent)}
                                            onChange={(e) => handleNumberInput("annualRent", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="totalUnits">Total Units <span className="text-destructive">*</span></Label>
                                        <Input
                                            type="number"
                                            value={formData.totalUnits}
                                            onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="propertyDescription">Description</Label>
                                    <Textarea
                                        value={formData.propertyDescription}
                                        onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Images */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Property Facade Image <span className="text-destructive">*</span></Label>
                                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "facade")}
                                            className="hidden"
                                            id="facade-upload"
                                        />
                                        <label htmlFor="facade-upload" className="cursor-pointer block">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <span className="text-sm">Click to upload facade</span>
                                        </label>
                                    </div>
                                    {propertyFacadeImage && <p className="text-xs text-green-600 mt-1">Uploaded: {propertyFacadeImage.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Address Number Image <span className="text-destructive">*</span></Label>
                                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "address")}
                                            className="hidden"
                                            id="address-upload"
                                        />
                                        <label htmlFor="address-upload" className="cursor-pointer block">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <span className="text-sm">Click to upload address number</span>
                                        </label>
                                    </div>
                                    {addressNumberImage && <p className="text-xs text-green-600 mt-1">Uploaded: {addressNumberImage.name}</p>}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {currentStep > 1 && (
                                <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>Back</Button>
                            )}
                            {currentStep < 3 ? (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (validateStep(currentStep)) {
                                            setCurrentStep(prev => prev + 1)
                                        } else {
                                            toast.error("Missing Information", {
                                                description: "Please fill in all required fields.",
                                            })
                                        }
                                    }}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading || uploading}>
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Create Property
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select City</DialogTitle>
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
                            {filteredCities.map((city) => (
                                <Button
                                    key={city.id}
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => handleCityChange(city.id)}
                                >
                                    {city.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
