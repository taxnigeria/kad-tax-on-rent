"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Loader2, User, MapPin, Building2, X, ChevronDown } from "lucide-react"
import { createTaxpayer } from "@/app/actions/taxpayers"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type AddTaxpayerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
]

const USER_TYPES = [
  { value: "Individual", label: "Individual" },
  { value: "Corporate", label: "Corporate" },
]

const BUSINESS_TYPES = [
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "limited_company", label: "Limited Company" },
  { value: "corporation", label: "Corporation" },
]

const IDENTIFICATION_TYPES = [
  { value: "National ID (NIN)", label: "National ID (NIN)" },
  { value: "Driver's License", label: "Driver's License" },
  { value: "International Passport", label: "International Passport" },
  { value: "Voter's Card", label: "Voter's Card" },
]

export function AddTaxpayerModal({ open, onOpenChange, onSuccess }: AddTaxpayerModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [lgas, setLgas] = useState<any[]>([])
  const [areaOffices, setAreaOffices] = useState<any[]>([])
  const [industries, setIndustries] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "taxpayer",
    taxIdOrNin: "",
    gender: "",
    nationality: "Nigerian",
    dateOfBirth: "",
    residentialAddress: "",
    isBusiness: false,
    businessName: "",
    businessType: "",
    businessAddress: "",
    tin: "",
    meansOfIdentification: "",
    identificationNumber: "",
    userType: "Individual",
    profilePhotoUrl: "",
    lgaId: "",
    areaOfficeId: "",
    addressLine1: "",
    rcNumber: "",
    industryId: "",
    businessRegistrationDate: "",
    managementLicenseNumber: "",
    yearsOfExperience: "",
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const [lgasResult, areaOfficesResult, industriesResult] = await Promise.all([
        supabase.from("lgas").select("*").order("name"),
        supabase.from("area_offices").select("*").order("office_name"),
        supabase.from("industries").select("*").order("name"),
      ])

      if (lgasResult.data) setLgas(lgasResult.data)
      if (areaOfficesResult.data) setAreaOffices(areaOfficesResult.data)
      if (industriesResult.data) setIndustries(industriesResult.data)
    }

    if (open) {
      fetchData()
    }
  }, [open])

  const validateEmail = async (email: string): Promise<string | null> => {
    if (!email) return "Email is required"

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Invalid email format"

    const supabase = createClient()
    const { data } = await supabase.from("users").select("id").eq("email", email).maybeSingle()

    if (data) return "Email already in use"
    return null
  }

  const validatePhone = async (phone: string): Promise<string | null> => {
    if (!phone) return "Phone number is required"

    // Remove + if present
    const cleanPhone = phone.replace(/^\+/, "")
    if (!/^\d{10,}$/.test(cleanPhone)) return "Phone must be at least 10 digits"

    const supabase = createClient()
    const { data } = await supabase.from("users").select("id").eq("phone_number", phone).maybeSingle()

    if (data) return "Phone number already in use"
    return null
  }

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"

    const emailError = await validateEmail(formData.email)
    if (emailError) newErrors.email = emailError

    const phoneError = await validatePhone(formData.phoneNumber)
    if (phoneError) newErrors.phoneNumber = phoneError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!(await validateForm())) {
      return
    }

    setLoading(true)

    try {
      const result = await createTaxpayer({
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        taxIdOrNin: formData.taxIdOrNin,
        gender: formData.gender,
        nationality: formData.nationality,
        dateOfBirth: formData.dateOfBirth,
        residentialAddress: formData.residentialAddress,
        isBusiness: formData.isBusiness,
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress,
        tin: formData.tin,
        meansOfIdentification: formData.meansOfIdentification,
        identificationNumber: formData.identificationNumber,
        userType: formData.userType,
        profilePhotoUrl: formData.profilePhotoUrl,
        lgaId: formData.lgaId,
        areaOfficeId: formData.areaOfficeId,
        addressLine1: formData.addressLine1,
        rcNumber: formData.rcNumber,
        industryId: formData.industryId,
        businessRegistrationDate: formData.businessRegistrationDate,
        managementLicenseNumber: formData.managementLicenseNumber,
        yearsOfExperience: formData.yearsOfExperience,
      })

      if (result.success) {
        toast.success("Taxpayer created successfully")
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        toast.error(result.error || "Failed to create taxpayer")
      }
    } catch (error) {
      console.error("Error creating taxpayer:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: "taxpayer",
      taxIdOrNin: "",
      gender: "",
      nationality: "Nigerian",
      dateOfBirth: "",
      residentialAddress: "",
      isBusiness: false,
      businessName: "",
      businessType: "",
      businessAddress: "",
      tin: "",
      meansOfIdentification: "",
      identificationNumber: "",
      userType: "Individual",
      profilePhotoUrl: "",
      lgaId: "",
      areaOfficeId: "",
      addressLine1: "",
      rcNumber: "",
      industryId: "",
      businessRegistrationDate: "",
      managementLicenseNumber: "",
      yearsOfExperience: "",
    })
    setActiveTab("personal")
  }

  function handleNext(nextTab: string) {
    setActiveTab(nextTab)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Add New Taxpayer</DialogTitle>
              <DialogDescription>
                Create a new taxpayer account. They will receive their login details via WhatsApp.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    disabled={loading}
                  />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    disabled={loading}
                  />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+234..."
                    required
                    disabled={loading}
                  />
                  {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between font-normal",
                          !formData.dateOfBirth && "text-muted-foreground",
                        )}
                        disabled={loading}
                      >
                        {formData.dateOfBirth ? format(new Date(formData.dateOfBirth), "PPP") : "Pick a date"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                        onSelect={(date) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: date ? format(date, "yyyy-MM-dd") : "",
                          })
                        }
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Nigerian"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tin">TIN</Label>
                  <Input
                    id="tin"
                    value={formData.tin}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    placeholder="Tax Identification Number"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxIdOrNin">NIN / Tax ID</Label>
                  <Input
                    id="taxIdOrNin"
                    value={formData.taxIdOrNin}
                    onChange={(e) => setFormData({ ...formData, taxIdOrNin: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meansOfIdentification">ID Type</Label>
                  <Select
                    value={formData.meansOfIdentification}
                    onValueChange={(value) => setFormData({ ...formData, meansOfIdentification: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {IDENTIFICATION_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identificationNumber">ID Number</Label>
                  <Input
                    id="identificationNumber"
                    value={formData.identificationNumber}
                    onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userType">User Type</Label>
                  <Select
                    value={formData.userType}
                    onValueChange={(value) => setFormData({ ...formData, userType: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taxpayer">Taxpayer</SelectItem>
                      <SelectItem value="property_manager">Property Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => handleNext("location")} disabled={loading}>
                  Next
                </Button>
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lgaId">LGA</Label>
                  <Select
                    value={formData.lgaId}
                    onValueChange={(value) => setFormData({ ...formData, lgaId: value })}
                    disabled={loading}
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
                <div className="space-y-2">
                  <Label htmlFor="areaOfficeId">Area Office</Label>
                  <Select
                    value={formData.areaOfficeId}
                    onValueChange={(value) => setFormData({ ...formData, areaOfficeId: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area office" />
                    </SelectTrigger>
                    <SelectContent>
                      {areaOffices
                        .filter((ao) => !formData.lgaId || ao.lga_id === formData.lgaId)
                        .map((ao) => (
                          <SelectItem key={ao.id} value={ao.id}>
                            {ao.office_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="Street address"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="residentialAddress">Residential Address</Label>
                <Input
                  id="residentialAddress"
                  value={formData.residentialAddress}
                  onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                  placeholder="Full residential address"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleNext("personal")} disabled={loading}>
                  Back
                </Button>
                <Button type="button" onClick={() => handleNext("business")} disabled={loading}>
                  Next
                </Button>
              </div>
            </TabsContent>

            {/* Business Tab */}
            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="isBusiness">Business Account</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.isBusiness ? "This is a business/corporate taxpayer" : "This is an individual taxpayer"}
                  </p>
                </div>
                <Switch
                  id="isBusiness"
                  checked={formData.isBusiness}
                  onCheckedChange={(checked) => setFormData({ ...formData, isBusiness: checked })}
                  disabled={loading}
                />
              </div>

              {formData.isBusiness && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select
                        value={formData.businessType}
                        onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rcNumber">RC Number</Label>
                      <Input
                        id="rcNumber"
                        value={formData.rcNumber}
                        onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                        placeholder="Company registration number"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industryId">Industry</Label>
                      <Select
                        value={formData.industryId}
                        onValueChange={(value) => setFormData({ ...formData, industryId: value })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind.id} value={ind.id.toString()}>
                              {ind.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessRegistrationDate">Registration Date</Label>
                      <Input
                        id="businessRegistrationDate"
                        type="date"
                        value={formData.businessRegistrationDate}
                        onChange={(e) => setFormData({ ...formData, businessRegistrationDate: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Input
                      id="businessAddress"
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {/* Property Manager fields */}
              {formData.role === "property_manager" && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Property Manager Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="managementLicenseNumber">License Number</Label>
                      <Input
                        id="managementLicenseNumber"
                        value={formData.managementLicenseNumber}
                        onChange={(e) => setFormData({ ...formData, managementLicenseNumber: e.target.value })}
                        placeholder="Property management license"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                      <Input
                        id="yearsOfExperience"
                        type="number"
                        min="0"
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleNext("location")} disabled={loading}>
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Taxpayer
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  )
}
