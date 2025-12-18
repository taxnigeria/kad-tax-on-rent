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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle, User, Building2, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Taxpayer {
  id: string // taxpayer_profile id
  user_id: string
  kadirs_id?: string
  // User fields
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  phone_number: string
  is_active: boolean
  // Profile fields
  tin?: string
  tax_id_or_nin?: string
  is_business: boolean
  business_name?: string
  business_type?: string
  business_address?: string
  residential_address?: string
  rc_number?: string
  gender?: string
  date_of_birth?: string
  nationality?: string
  means_of_identification?: string
  identification_number?: string
  years_of_experience?: number
  profile_photo_url?: string
  industry_id?: number
  user_type?: string
  area_office_id?: string
  lga_id?: string
  address_line1?: string
  business_registration_date?: string
  management_license_number?: string
  paykaduna_customer_code?: string
  paykaduna_customer_id?: string
}

interface AreaOffice {
  id: string
  office_name: string
  lga_id: string
}

interface LGA {
  id: string
  name: string
}

interface Industry {
  id: number
  name: string
}

interface EditTaxpayerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxpayer: Taxpayer | null
  onSuccess: () => void
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
]

const IDENTIFICATION_TYPES = [
  { value: "nin", label: "National ID (NIN)" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "international_passport", label: "International Passport" },
]

const BUSINESS_TYPES = [
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "limited_liability", label: "Limited Liability Company" },
  { value: "public_company", label: "Public Company" },
  { value: "ngo", label: "NGO / Non-Profit" },
]

const USER_TYPES = [
  { value: "Individual", label: "Individual" },
  { value: "Corporate", label: "Corporate" },
]

export function EditTaxpayerModal({ open, onOpenChange, taxpayer, onSuccess }: EditTaxpayerModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")

  const [areaOffices, setAreaOffices] = useState<AreaOffice[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    is_active: true,
    kadirs_id: "",
    tin: "",
    tax_id_or_nin: "",
    is_business: false,
    business_name: "",
    business_type: "",
    business_address: "",
    residential_address: "",
    rc_number: "",
    gender: "",
    date_of_birth: "",
    nationality: "",
    means_of_identification: "",
    identification_number: "",
    years_of_experience: "",
    profile_photo_url: "",
    industry_id: "",
    user_type: "",
    area_office_id: "",
    lga_id: "",
    address_line1: "",
    business_registration_date: "",
    management_license_number: "",
    paykaduna_customer_code: "",
    paykaduna_customer_id: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if taxpayer has kadirs_id (readonly from PayKaduna)
  const isKadirsUser = Boolean(taxpayer?.kadirs_id)

  useEffect(() => {
    async function fetchDropdownData() {
      const supabase = createClient()

      const [areaOfficesRes, lgasRes, industriesRes] = await Promise.all([
        supabase.from("area_offices").select("id, office_name, lga_id").eq("is_active", true).order("office_name"),
        supabase.from("lgas").select("id, name").order("name"),
        supabase.from("industries").select("id, name").eq("is_active", true).order("name"),
      ])

      if (areaOfficesRes.data) setAreaOffices(areaOfficesRes.data)
      if (lgasRes.data) setLgas(lgasRes.data)
      if (industriesRes.data) setIndustries(industriesRes.data)
    }

    if (open) {
      fetchDropdownData()
    }
  }, [open])

  useEffect(() => {
    if (taxpayer) {
      setFormData({
        first_name: taxpayer.first_name || "",
        middle_name: taxpayer.middle_name || "",
        last_name: taxpayer.last_name || "",
        email: taxpayer.email || "",
        phone_number: taxpayer.phone_number || "",
        is_active: taxpayer.is_active ?? true,
        kadirs_id: taxpayer.kadirs_id || "",
        tin: taxpayer.tin || "",
        tax_id_or_nin: taxpayer.tax_id_or_nin || "",
        is_business: taxpayer.is_business ?? false,
        business_name: taxpayer.business_name || "",
        business_type: taxpayer.business_type || "",
        business_address: taxpayer.business_address || "",
        residential_address: taxpayer.residential_address || "",
        rc_number: taxpayer.rc_number || "",
        gender: taxpayer.gender || "",
        date_of_birth: taxpayer.date_of_birth || "",
        nationality: taxpayer.nationality || "",
        means_of_identification: taxpayer.means_of_identification || "",
        identification_number: taxpayer.identification_number || "",
        years_of_experience: taxpayer.years_of_experience?.toString() || "",
        profile_photo_url: taxpayer.profile_photo_url || "",
        industry_id: taxpayer.industry_id?.toString() || "",
        user_type: taxpayer.user_type || "",
        area_office_id: taxpayer.area_office_id || "",
        lga_id: taxpayer.lga_id || "",
        address_line1: taxpayer.address_line1 || "",
        business_registration_date: taxpayer.business_registration_date || "",
        management_license_number: taxpayer.management_license_number || "",
        paykaduna_customer_code: taxpayer.paykaduna_customer_code || "",
        paykaduna_customer_id: taxpayer.paykaduna_customer_id || "",
      })
      setErrors({})
      setActiveTab("personal")
    }
  }, [taxpayer])

  function validateForm() {
    const newErrors: Record<string, string> = {}

    if (!isKadirsUser) {
      if (!formData.first_name.trim()) {
        newErrors.first_name = "First name is required"
      }
      if (!formData.last_name.trim()) {
        newErrors.last_name = "Last name is required"
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the validation errors")
      return
    }

    if (!taxpayer?.user_id) {
      toast.error("Missing user ID")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Update user table (if not a KADIRS user)
      if (!isKadirsUser) {
        const { error: userError } = await supabase
          .from("users")
          .update({
            first_name: formData.first_name,
            middle_name: formData.middle_name || null,
            last_name: formData.last_name,
            email: formData.email,
            phone_number: formData.phone_number || null,
            is_active: formData.is_active,
          })
          .eq("id", taxpayer.user_id)

        if (userError) throw userError
      }

      // Build profile update object
      const profileUpdate: Record<string, unknown> = {
        user_id: taxpayer.user_id,
        tin: formData.tin || null,
        tax_id_or_nin: formData.tax_id_or_nin || null,
        is_business: formData.is_business,
        business_name: formData.business_name || null,
        business_type: formData.business_type || null,
        business_address: formData.business_address || null,
        residential_address: formData.residential_address || null,
        rc_number: formData.rc_number || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        nationality: formData.nationality || null,
        means_of_identification: formData.means_of_identification || null,
        identification_number: formData.identification_number || null,
        years_of_experience: formData.years_of_experience ? Number.parseInt(formData.years_of_experience) : null,
        industry_id: formData.industry_id ? Number.parseInt(formData.industry_id) : null,
        user_type: formData.user_type || null,
        area_office_id:
          formData.area_office_id && formData.area_office_id !== "undefined" ? formData.area_office_id : null,
        lga_id: formData.lga_id && formData.lga_id !== "undefined" ? formData.lga_id : null,
        address_line1: formData.address_line1 || null,
        business_registration_date: formData.business_registration_date || null,
        management_license_number: formData.management_license_number || null,
      }

      // Remove NaN values
      if (isNaN(profileUpdate.years_of_experience as number)) {
        profileUpdate.years_of_experience = null
      }
      if (isNaN(profileUpdate.industry_id as number)) {
        profileUpdate.industry_id = null
      }

      if (taxpayer.id) {
        // Update existing profile
        const { error: profileError } = await supabase
          .from("taxpayer_profiles")
          .update(profileUpdate)
          .eq("id", taxpayer.id)

        if (profileError) throw profileError
      } else {
        // Create new profile using upsert
        const { error: profileError } = await supabase.from("taxpayer_profiles").upsert(profileUpdate, {
          onConflict: "user_id",
        })

        if (profileError) throw profileError
      }

      toast.success("Taxpayer updated successfully")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating taxpayer:", error)
      toast.error(`Failed to update taxpayer: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  if (!taxpayer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Taxpayer</DialogTitle>
          <DialogDescription>Update taxpayer information and business details</DialogDescription>
        </DialogHeader>

        {isKadirsUser && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-400">
                Personal details are managed via PayKaduna and cannot be edited here
              </p>
            </div>
          </div>
        )}

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
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={errors.first_name ? "border-red-500" : ""}
                  disabled={isKadirsUser}
                />
                {errors.first_name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  disabled={isKadirsUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={errors.last_name ? "border-red-500" : ""}
                  disabled={isKadirsUser}
                />
                {errors.last_name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.last_name}
                  </p>
                )}
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
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isKadirsUser}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+234..."
                  disabled={isKadirsUser}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder="Nigerian"
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id_or_nin">NIN / Tax ID</Label>
                <Input
                  id="tax_id_or_nin"
                  value={formData.tax_id_or_nin}
                  onChange={(e) => setFormData({ ...formData, tax_id_or_nin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="means_of_identification">ID Type</Label>
                <Select
                  value={formData.means_of_identification}
                  onValueChange={(value) => setFormData({ ...formData, means_of_identification: value })}
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
                <Label htmlFor="identification_number">ID Number</Label>
                <Input
                  id="identification_number"
                  value={formData.identification_number}
                  onChange={(e) => setFormData({ ...formData, identification_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_type">User Type</Label>
                <Select
                  value={formData.user_type}
                  onValueChange={(value) => setFormData({ ...formData, user_type: value })}
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
                <Label htmlFor="profile_photo_url">Profile Photo URL</Label>
                <Input
                  id="profile_photo_url"
                  value={formData.profile_photo_url}
                  onChange={(e) => setFormData({ ...formData, profile_photo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {!isKadirsUser && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Account Status</Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.is_active ? "Taxpayer can access the system" : "Taxpayer is blocked"}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            )}
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lga_id">LGA</Label>
                <Select value={formData.lga_id} onValueChange={(value) => setFormData({ ...formData, lga_id: value })}>
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
                <Label htmlFor="area_office_id">Area Office</Label>
                <Select
                  value={formData.area_office_id}
                  onValueChange={(value) => setFormData({ ...formData, area_office_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area office" />
                  </SelectTrigger>
                  <SelectContent>
                    {areaOffices
                      .filter((ao) => !formData.lga_id || ao.lga_id === formData.lga_id)
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
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="residential_address">Residential Address</Label>
              <Input
                id="residential_address"
                value={formData.residential_address}
                onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                placeholder="Full residential address"
              />
            </div>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-4 mt-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is_business">Business Account</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.is_business ? "This is a business/corporate taxpayer" : "This is an individual taxpayer"}
                </p>
              </div>
              <Switch
                id="is_business"
                checked={formData.is_business}
                onCheckedChange={(checked) => setFormData({ ...formData, is_business: checked })}
              />
            </div>

            {formData.is_business && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_type">Business Type</Label>
                    <Select
                      value={formData.business_type}
                      onValueChange={(value) => setFormData({ ...formData, business_type: value })}
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
                    <Label htmlFor="rc_number">RC Number</Label>
                    <Input
                      id="rc_number"
                      value={formData.rc_number}
                      onChange={(e) => setFormData({ ...formData, rc_number: e.target.value })}
                      placeholder="Company registration number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry_id">Industry</Label>
                    <Select
                      value={formData.industry_id}
                      onValueChange={(value) => setFormData({ ...formData, industry_id: value })}
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
                    <Label htmlFor="business_registration_date">Registration Date</Label>
                    <Input
                      id="business_registration_date"
                      type="date"
                      value={formData.business_registration_date}
                      onChange={(e) => setFormData({ ...formData, business_registration_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_address">Business Address</Label>
                  <Input
                    id="business_address"
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Property Manager fields */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Property Manager Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="management_license_number">License Number</Label>
                  <Input
                    id="management_license_number"
                    value={formData.management_license_number}
                    onChange={(e) => setFormData({ ...formData, management_license_number: e.target.value })}
                    placeholder="Property management license"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    min="0"
                    value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
