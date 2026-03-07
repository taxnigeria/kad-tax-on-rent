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
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { createProperty } from "@/app/actions/create-property"
import { createClient } from "@/utils/supabase/client"
import { Progress } from "@/components/ui/progress"
import { getProfileCompletionStatus } from "@/app/actions/verification"

import { PropertyFormData } from "./types"
import { BasicInfoStep } from "./BasicInfoStep"
import { PropertyDetailsStep } from "./PropertyDetailsStep"
import { ReviewStep } from "./ReviewStep"
import { CitySelectDialog } from "./CitySelectDialog"

interface RegisterPropertyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    taxpayerId?: string
    initialData?: Partial<PropertyFormData>
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

    const [userRole, setUserRole] = useState<string | null>(null)
    const [authorizedOwners, setAuthorizedOwners] = useState<any[]>([])

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
        ownerIdForManager: "",
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
            fetchUserRole()
        }
    }, [open])

    useEffect(() => {
        if (initialData && open) {
            setFormData((prev) => ({
                ...prev,
                ...initialData,
            }))
        }
    }, [initialData, open])

    async function fetchUserRole() {
        if (!user?.uid) return
        try {
            // Prioritize identifying user role
            const { data: userProfile } = await supabase
                .from("users")
                .select("id, role")
                .eq("firebase_uid", user.uid)
                .single()

            const role = userProfile?.role || null
            setUserRole(role)

            if (role === "property_manager" && userProfile?.id) {
                fetchRegisteredClients(userProfile.id)
            } else if (role === "admin") {
                fetchRegisteredClients() // Admin can see all clients
            }
        } catch (error) {
            console.error("Error fetching user role:", error)
        }
    }

    async function fetchRegisteredClients(managerId?: string) {
        try {
            let query = supabase
                .from("taxpayer_profiles")
                .select(`
                    owner_id:user_id,
                    users:users!taxpayer_profiles_user_id_fkey(first_name, last_name, email)
                `)

            if (managerId) {
                query = query.eq("onboarded_by_id", managerId)
            }

            const { data, error } = await query

            if (!error && data) {
                setAuthorizedOwners(data)
            }
        } catch (error) {
            console.error("Error fetching registered clients:", error)
        }
    }

    async function checkUserValidation() {
        if (!user?.uid || taxpayerId) return

        setCheckingValidation(true)
        try {
            const result = await getProfileCompletionStatus(user.uid)
            if (result.success && result.items) {
                const { items } = result
                const missingItems: string[] = []

                if (!items.emailVerified) missingItems.push("verify your email")
                if (!items.phoneVerified) missingItems.push("verify your phone number")
                if (!items.kadirsIdGenerated) missingItems.push("generate your KADIRS ID")

                if (missingItems.length > 0) {
                    setValidationMessage(`Before registering a property, you need to ${missingItems.join(", ")}.`)
                    setShowValidationDialog(true)
                }
            }
        } catch (error) {
            console.error("Error checking validation:", error)
        } finally {
            setCheckingValidation(false)
        }
    }

    async function fetchSystemSettings() {
        try {
            const { data } = await supabase
                .from("system_settings")
                .select("setting_value")
                .eq("setting_key", "default_state")
                .single()

            if (data) {
                const stateValue = (data.setting_value as any).value || "Kaduna"
                setDefaultState(stateValue)
                setFormData((prev) => ({ ...prev, state: stateValue }))
            }
        } catch (error) {
            console.error("Error fetching system settings:", error)
        }
    }

    async function fetchLocationData() {
        try {
            const [citiesRes, lgasRes, officesRes] = await Promise.all([
                supabase.from("cities").select("*").order("name"),
                supabase.from("lgas").select("*").order("name"),
                supabase.from("area_offices").select("*").order("office_name"),
            ])

            if (citiesRes.data) setCities(citiesRes.data)
            if (lgasRes.data) setLgas(lgasRes.data)
            if (officesRes.data) setAreaOffices(officesRes.data)
        } catch (error) {
            console.error("Error fetching location data:", error)
        }
    }

    const handleCitySelect = (cityId: string) => {
        const city = cities.find((c) => c.id === cityId)
        if (city) {
            const lga = lgas.find((l) => l.id === city.lga_id)
            const office = city.area_office_id ? areaOffices.find((a) => a.id === city.area_office_id) : null

            setFormData({
                ...formData,
                cityId: city.id,
                cityName: city.name,
                lgaId: city.lga_id?.toString() || "",
                lgaName: lga?.name || "",
                areaOfficeId: office?.id?.toString() || "",
                areaOfficeName: office?.office_name || "",
            })
            setCityDialogOpen(false)
            setCitySearchQuery("")
        }
    }

    const formatNumber = (value: string) => {
        const numbers = value.replace(/\D/g, "")
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    const handleNumberInput = (field: keyof PropertyFormData, value: string) => {
        const numbers = value.replace(/\D/g, "")
        setFormData({ ...formData, [field]: numbers })
    }

    const geocodeAddress = async () => {
        if (!formData.houseNumber || !formData.streetName || !formData.cityName) {
            toast({ title: "Incomplete Address", description: "Fill house number, street, and city first.", variant: "destructive" })
            return
        }

        setGeocoding(true)
        try {
            const address = `${formData.houseNumber} ${formData.streetName}, ${formData.cityName}, Kaduna, Nigeria`
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`)
            const data = await res.json()

            if (data && data.length > 0) {
                setCoordinates({ lat: Number.parseFloat(data[0].lat), lng: Number.parseFloat(data[0].lon) })
                toast({ title: "Location Verified", description: "Coordinates captured successfully." })
            } else {
                toast({ title: "Location Not Found", description: "Could not find precise coordinates. Manual review may be needed." })
            }
        } catch (error) {
            console.error("Geocoding error:", error)
        } finally {
            setGeocoding(false)
        }
    }

    const validateStep = (step: number) => {
        if (step === 1) {
            return !!(formData.propertyName && formData.propertyType && formData.propertyCategory &&
                formData.houseNumber && formData.streetName && formData.lgaId && formData.areaOfficeId && formData.commencementYear)
        }
        if (step === 2) {
            return !!(formData.totalUnits && formData.totalAnnualRent && formData.businessType)
        }
        return true
    }

    const handleNext = () => {
        if (validateStep(currentStep)) setCurrentStep((prev) => Math.min(prev + 1, 3))
        else toast({ title: "Required Fields", description: "Please complete all mandatory fields marked with *", variant: "destructive" })
    }

    const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

    const handleConfirmedSubmit = async () => {
        setLoading(true)
        setShowConfirmation(false)

        try {
            if (!user?.uid) throw new Error("Authentication required")

            const result = await createProperty({
                ...formData,
                commencementYear: formData.commencementYear ? parseInt(formData.commencementYear) : undefined,
                totalUnits: parseInt(formData.totalUnits) || 1,
                occupiedUnits: parseInt(formData.occupiedUnits) || 0,
                totalAnnualRent: parseFloat(formData.totalAnnualRent) || 0,
                floorArea: formData.floorArea ? parseFloat(formData.floorArea) : undefined,
                yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
                numberOfFloors: formData.numberOfFloors ? parseInt(formData.numberOfFloors) : undefined,
                latitude: coordinates?.lat,
                longitude: coordinates?.lng,
                firebaseUid: user.uid,
            } as any)

            if (!result.success) throw new Error(result.error)

            toast({ title: "Success", description: "Property registered successfully!" })
            onOpenChange(false)
            onSuccess?.()
        } catch (error: any) {
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const filteredCities = cities.filter((c) => c.name.toLowerCase().includes(citySearchQuery.toLowerCase()))

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-emerald-100">
                    <DialogHeader className="p-6 bg-[#F0FDF4] border-b border-emerald-100">
                        <DialogTitle className="text-emerald-950 font-semibold text-xl">
                            {taxpayerId ? "Admin Property Registration" : "Register Property"}
                        </DialogTitle>
                        <DialogDescription className="text-emerald-700">
                            Step {currentStep} of 3: {["Basic Info", "Property Details", "Review & Finalize"][currentStep - 1]}
                        </DialogDescription>
                        <Progress value={(currentStep / 3) * 100} className="h-1.5 mt-4 bg-emerald-100" />
                    </DialogHeader>

                    <div className="p-6">
                        {currentStep === 1 && (
                            <BasicInfoStep
                                formData={formData}
                                setFormData={setFormData}
                                userRole={userRole}
                                authorizedOwners={authorizedOwners}
                                setCityDialogOpen={setCityDialogOpen}
                                lgas={lgas}
                                areaOffices={areaOffices}
                            />
                        )}
                        {currentStep === 2 && (
                            <PropertyDetailsStep
                                formData={formData}
                                setFormData={setFormData}
                                handleNumberInput={handleNumberInput}
                                formatNumber={formatNumber}
                                geocodeAddress={geocodeAddress}
                                geocoding={geocoding}
                                coordinates={coordinates}
                            />
                        )}
                        {currentStep === 3 && <ReviewStep formData={formData} />}
                    </div>

                    <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between gap-2">
                        <div className="flex gap-2 w-full sm:w-auto">
                            {currentStep > 1 && (
                                <Button variant="outline" onClick={handleBack} disabled={loading} className="border-emerald-200">
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                            {currentStep < 3 ? (
                                <Button onClick={handleNext} className="bg-emerald-800 hover:bg-emerald-700 text-white">
                                    Next <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={loading || checkingValidation}
                                    className="bg-emerald-900 hover:bg-emerald-800 text-white"
                                >
                                    {(loading || checkingValidation) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Register Property
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CitySelectDialog
                open={cityDialogOpen}
                onOpenChange={setCityDialogOpen}
                citySearchQuery={citySearchQuery}
                setCitySearchQuery={setCitySearchQuery}
                filteredCities={filteredCities}
                handleCitySelect={handleCitySelect}
            />

            <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
                <AlertDialogContent className="border-emerald-100">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-emerald-950">
                            <AlertCircle className="h-5 w-5 text-amber-500" /> Validation Required
                        </AlertDialogTitle>
                        <AlertDialogDescription>{validationMessage}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button onClick={() => { setShowValidationDialog(false); onOpenChange(false); }} className="bg-emerald-900 border-none">
                            Complete Profile
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent className="border-emerald-100">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-emerald-950">Confirm Submission</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to register this property for taxation? Details cannot be modified once assessment starts.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Review Again</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmedSubmit} className="bg-emerald-900">Confirm & Register</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
