"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getAuthToken } from "@/app/actions/get-auth-token"
import { ExistingUserConfirmationModal } from "./existing-user-confirmation-modal"
import { KadirsErrorModal } from "./kadirs-error-modal"

interface GenerateKadirsIdModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxpayerId: string // user_id of the taxpayer
  onSuccess: () => void
}

export function GenerateKadirsIdModal({ open, onOpenChange, taxpayerId, onSuccess }: GenerateKadirsIdModalProps) {
  const [loading, setLoading] = useState(false)
  const [generatingId, setGeneratingId] = useState(false)
  const [taxpayerData, setTaxpayerData] = useState<any>(null)
  const [existingUserData, setExistingUserData] = useState<any>(null)
  const [showExistingUserModal, setShowExistingUserModal] = useState(false)
  const [errorData, setErrorData] = useState<any>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    addressLine1: "",
    lgaId: "",
    industryId: "",
    userType: "Individual",
    tin: "",
    rcNumber: "",
    emailVerified: false,
    phoneVerified: false,
  })

  const [lgas, setLgas] = useState<any[]>([])
  const [industries, setIndustries] = useState<any[]>([])

  useEffect(() => {
    if (open && taxpayerId) {
      loadTaxpayerData()
    }
  }, [open, taxpayerId])

  const loadTaxpayerData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Load taxpayer data with profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          middle_name,
          last_name,
          email,
          phone_number,
          email_verified,
          phone_verified,
          taxpayer_profiles (
            id,
            gender,
            address_line1,
            lga_id,
            industry_id,
            user_type,
            tin,
            rc_number
          )
        `,
        )
        .eq("id", taxpayerId)
        .single()

      if (userError || !userData) {
        toast.error("Failed to load taxpayer data")
        return
      }

      setTaxpayerData(userData)

      const profile = userData.taxpayer_profiles

      const [lgasResult, industriesResult] = await Promise.all([
        supabase.from("lgas").select("id, name").order("name"),
        supabase.from("industries").select("id, name").order("name"),
      ])

      if (lgasResult.data) setLgas(lgasResult.data)
      if (industriesResult.data) setIndustries(industriesResult.data)

      // Pre-fill form data
      setFormData({
        firstName: userData.first_name || "",
        middleName: userData.middle_name || "",
        lastName: userData.last_name || "",
        email: userData.email || "",
        phoneNumber: userData.phone_number || "",
        gender: profile?.gender || "",
        addressLine1: profile?.address_line1 || "",
        lgaId: profile?.lga_id?.toString() || "",
        industryId: profile?.industry_id?.toString() || "",
        userType: profile?.user_type || "Individual",
        tin: profile?.tin || "",
        rcNumber: profile?.rc_number || "",
        emailVerified: userData.email_verified || false,
        phoneVerified: userData.phone_verified || false,
      })
    } catch (error: any) {
      console.error("[v0] Error loading taxpayer data:", error)
      toast.error("Failed to load taxpayer data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.gender || !formData.addressLine1 || !formData.lgaId || !formData.industryId) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!formData.emailVerified) {
      toast.error("Email must be verified before generating KADIRS ID")
      return
    }

    if (!formData.phoneVerified) {
      toast.error("Phone number must be verified before generating KADIRS ID")
      return
    }

    setGeneratingId(true)
    try {
      const supabase = createClient()

      // Update user data if changed
      const userUpdates: any = {}
      if (formData.firstName !== taxpayerData.first_name) userUpdates.first_name = formData.firstName
      if (formData.middleName !== taxpayerData.middle_name) userUpdates.middle_name = formData.middleName
      if (formData.lastName !== taxpayerData.last_name) userUpdates.last_name = formData.lastName
      if (formData.email !== taxpayerData.email) userUpdates.email = formData.email
      if (formData.phoneNumber !== taxpayerData.phone_number) userUpdates.phone_number = formData.phoneNumber

      if (Object.keys(userUpdates).length > 0) {
        const { error: userUpdateError } = await supabase.from("users").update(userUpdates).eq("id", taxpayerId)

        if (userUpdateError) {
          throw new Error("Failed to update user data")
        }
      }

      const profile = taxpayerData.taxpayer_profiles

      const profileUpdates = {
        user_id: taxpayerId,
        gender: formData.gender,
        address_line1: formData.addressLine1,
        lga_id: formData.lgaId,
        industry_id: Number.parseInt(formData.industryId),
        user_type: formData.userType,
        tin: formData.tin || null,
        rc_number: formData.rcNumber || null,
      }

      if (profile?.id) {
        // Update existing profile
        const { error: profileUpdateError } = await supabase
          .from("taxpayer_profiles")
          .update(profileUpdates)
          .eq("id", profile.id)

        if (profileUpdateError) {
          throw new Error("Failed to update taxpayer profile")
        }
      } else {
        // Insert new profile
        const { error: profileInsertError } = await supabase.from("taxpayer_profiles").insert(profileUpdates)

        if (profileInsertError) {
          throw new Error("Failed to create taxpayer profile")
        }
      }

      // Get LGA data for PayKaduna lga_id
      const { data: lgaData } = await supabase.from("lgas").select("lga_id").eq("id", formData.lgaId).single()

      // Get area office for the LGA
      const { data: areaOfficeData } = await supabase
        .from("area_offices")
        .select("area_office_id")
        .eq("lga_id", formData.lgaId)
        .limit(1)
        .maybeSingle()

      // Get state ID from settings
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("state_id")
        .eq("setting_key", "default_state")
        .maybeSingle()

      const stateId = settingsData?.state_id || 19

      // Call KADIRS API to generate ID
      const kadirsRequestBody = {
        firstName: formData.firstName,
        middleName: formData.middleName || "",
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || "null",
        password: `Taxpayer${new Date().getFullYear()}#`,
        confirmPassword: `Taxpayer${new Date().getFullYear()}#`,
        addressLine1: formData.addressLine1,
        genderId: formData.gender === "female" ? 1 : 2,
        lgaId: Number.parseInt(lgaData?.lga_id) || 2,
        stateId: stateId,
        taxStation: areaOfficeData?.area_office_id || 1,
        industryId: Number.parseInt(formData.industryId),
        userType: formData.userType,
        tin: formData.tin || "",
        rcNumber: formData.rcNumber || "",
        identifier: "null",
      }

      const kadirsApiUrl = "https://tax-nigeria-n8n.vwc4mb.easypanel.host/webhook/025e098d-9f68-439d-871f-9bcbb06b1b2b"

      const authToken = await getAuthToken()

      if (!authToken) {
        throw new Error("KADIRS API authentication not configured")
      }

      const response = await fetch(kadirsApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(kadirsRequestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] KADIRS API error:", errorText)
        throw new Error("Failed to generate KADIRS ID from API")
      }

      const responseData = await response.json()

      if (responseData.success === true) {
        // Success: KADIRS ID generated
        const kadirsId = responseData?.userRegistration?.tpui

        if (!kadirsId) {
          console.error("[v0] KADIRS ID not found in response:", responseData)
          throw new Error("KADIRS ID not found in API response")
        }

        // Update taxpayer profile with KADIRS ID
        const { error: updateKadirsError } = await supabase
          .from("taxpayer_profiles")
          .update({ kadirs_id: kadirsId })
          .eq("user_id", taxpayerId)

        if (updateKadirsError) {
          throw new Error("Failed to save KADIRS ID")
        }

        toast.success(`KADIRS ID generated successfully: ${kadirsId}`)
        onSuccess()
        onOpenChange(false)
      } else if (responseData.success === false && responseData.search_result) {
        // Existing user found - show confirmation modal
        const searchResult = {
          ...responseData.search_result,
          // Use tpui as kadirs_id since that's what n8n returns for search results
          kadirs_id: responseData.search_result.tpui,
        }
        setExistingUserData(searchResult)
        setShowExistingUserModal(true)
      } else if (responseData.success === false && responseData.error) {
        // Error occurred - show error modal
        setErrorData(responseData.error)
        setShowErrorModal(true)
      } else if (responseData.tpui) {
        const searchResult = {
          ...responseData,
          kadirs_id: responseData.tpui,
        }
        setExistingUserData(searchResult)
        setShowExistingUserModal(true)
      } else {
        // Unexpected response format
        throw new Error("Unexpected API response format")
      }
    } catch (error: any) {
      console.error("[v0] Generate KADIRS ID error:", error)
      toast.error(error.message || "Failed to generate KADIRS ID")
    } finally {
      setGeneratingId(false)
    }
  }

  const handleExistingUserConfirm = async () => {
    // User confirmed to use existing account
    if (existingUserData?.tpui) {
      const supabase = createClient()
      const { error: updateKadirsError } = await supabase
        .from("taxpayer_profiles")
        .update({ kadirs_id: existingUserData.tpui })
        .eq("user_id", taxpayerId)

      if (updateKadirsError) {
        toast.error("Failed to save KADIRS ID")
        return
      }

      toast.success(`KADIRS ID linked successfully: ${existingUserData.tpui}`)
      setShowExistingUserModal(false)
      onSuccess()
      onOpenChange(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate KADIRS ID</DialogTitle>
            <DialogDescription>
              Review and edit taxpayer information before generating KADIRS ID. All fields can be updated as needed.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Verification Status */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-semibold text-sm">Verification Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    {formData.emailVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Email {formData.emailVerified ? "Verified" : "Not Verified"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.phoneVerified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">Phone {formData.phoneVerified ? "Verified" : "Not Verified"}</span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
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
                  />
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userType">
                    User Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.userType}
                    onValueChange={(value) => setFormData({ ...formData, userType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Enter full address"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lga">
                    LGA <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.lgaId} onValueChange={(value) => setFormData({ ...formData, lgaId: value })}>
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
                  <Label htmlFor="industry">
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.industryId}
                    onValueChange={(value) => setFormData({ ...formData, industryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.id} value={industry.id}>
                          {industry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tin">TIN (Optional)</Label>
                  <Input
                    id="tin"
                    placeholder="Tax Identification Number"
                    value={formData.tin}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rcNumber">RC Number (Optional)</Label>
                  <Input
                    id="rcNumber"
                    placeholder="Registration Certificate Number"
                    value={formData.rcNumber}
                    onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generatingId}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || generatingId}>
              {generatingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate KADIRS ID"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals for existing user and error handling */}
      <ExistingUserConfirmationModal
        open={showExistingUserModal}
        onOpenChange={setShowExistingUserModal}
        userData={existingUserData}
        onConfirm={handleExistingUserConfirm}
        isLoading={generatingId}
      />

      <KadirsErrorModal open={showErrorModal} onOpenChange={setShowErrorModal} error={errorData} />
    </>
  )
}
