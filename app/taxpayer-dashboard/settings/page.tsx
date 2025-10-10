"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TaxpayerSidebar } from "@/components/taxpayer-sidebar"
import { TaxpayerHeader } from "@/components/taxpayer-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/utils/supabase/client"
import { User, Lock, Bell, Shield, Download, Trash2, Loader2, Edit2, X, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [dbUserId, setDbUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "Nigerian", // Default value set to Nigerian

    // Contact Information
    email: "",
    phone: "",
    residentialAddress: "",
    businessAddress: "",

    // Identification
    taxId: "",
    meansOfIdentification: "",
    identificationNumber: "",

    // Business Information
    isBusiness: false,
    businessName: "",
    businessType: "",
    rcNumber: "",
    businessRegistrationDate: "",

    // Professional Details
    managementLicenseNumber: "",
    yearsOfExperience: "",
  })

  // Security state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [invoiceReminders, setInvoiceReminders] = useState(true)
  const [paymentConfirmations, setPaymentConfirmations] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["taxpayer", "property_manager"].includes(userRole)) {
        router.push("/dashboard")
      } else {
        loadUserData()
      }
    }
  }, [user, userRole, authLoading, router])

  const loadUserData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const supabase = createBrowserClient()

      const { data: userIdData, error: userIdError } = await supabase
        .from("users")
        .select("id")
        .eq("firebase_uid", user.uid)
        .single()

      if (userIdError) throw userIdError
      if (!userIdData) throw new Error("User not found")

      const userId = userIdData.id
      setDbUserId(userId)

      // Fetch user data using the database ID
      const { data: userInfo, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

      if (userError) throw userError

      // Fetch taxpayer profile data
      const { data: profileInfo, error: profileError } = await supabase
        .from("taxpayer_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError)
      }

      setUserData(userInfo)
      setProfileData(profileInfo)

      setFormData({
        firstName: userInfo.first_name || "",
        middleName: userInfo.middle_name || "",
        lastName: userInfo.last_name || "",
        email: userInfo.email || "",
        phone: userInfo.phone_number || "",
        dateOfBirth: profileInfo?.date_of_birth || "",
        gender: profileInfo?.gender || "",
        nationality: profileInfo?.nationality || "Nigerian", // Default to Nigerian if not set
        residentialAddress: profileInfo?.residential_address || "",
        businessAddress: profileInfo?.business_address || "",
        taxId: profileInfo?.tax_id_or_nin || "",
        meansOfIdentification: profileInfo?.means_of_identification || "",
        identificationNumber: profileInfo?.identification_number || "",
        isBusiness: profileInfo?.is_business || false,
        businessName: profileInfo?.business_name || "",
        businessType: profileInfo?.business_type || "",
        rcNumber: profileInfo?.rc_number || "",
        businessRegistrationDate: profileInfo?.business_registration_date || "",
        managementLicenseNumber: profileInfo?.management_license_number || "",
        yearsOfExperience: profileInfo?.years_of_experience?.toString() || "",
      })
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (First Name, Last Name, Phone)",
        variant: "destructive",
      })
      return
    }

    if (!dbUserId) return

    try {
      setSaving(true)
      const supabase = createBrowserClient()

      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          phone_number: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbUserId)

      if (userError) throw userError

      // Update or insert taxpayer_profiles
      const profilePayload = {
        residential_address: formData.residentialAddress,
        business_address: formData.businessAddress,
        tax_id_or_nin: formData.taxId,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        nationality: formData.nationality || "Nigerian",
        meansOfIdentification: formData.meansOfIdentification || null,
        identificationNumber: formData.identificationNumber || null,
        isBusiness: formData.isBusiness,
        businessName: formData.businessName || null,
        businessType: formData.businessType || null,
        rcNumber: formData.rcNumber || null,
        businessRegistrationDate: formData.businessRegistrationDate || null,
        managementLicenseNumber: formData.managementLicenseNumber || null,
        yearsOfExperience: formData.yearsOfExperience ? Number.parseInt(formData.yearsOfExperience) : null,
        updated_at: new Date().toISOString(),
      }

      if (profileData) {
        const { error: profileError } = await supabase
          .from("taxpayer_profiles")
          .update(profilePayload)
          .eq("user_id", dbUserId)

        if (profileError) throw profileError
      } else {
        const { error: profileError } = await supabase.from("taxpayer_profiles").insert({
          user_id: dbUserId,
          ...profilePayload,
        })

        if (profileError) throw profileError
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      setIsEditMode(false)
      await loadUserData()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    loadUserData() // Reload original data
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const supabase = createBrowserClient()

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Success",
        description: "Password changed successfully",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    toast({
      title: "Export Requested",
      description: "Your data export will be sent to your email within 24 hours",
    })
  }

  if (authLoading || loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <TaxpayerSidebar variant="inset" />
        <SidebarInset>
          <TaxpayerHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="mb-6">
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-96" />
                  </div>

                  <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i}>
                          <CardHeader>
                            <Skeleton className="h-5 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
        <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />
      </SidebarProvider>
    )
  }

  if (!user || (userRole && !["taxpayer", "property_manager"].includes(userRole))) {
    return null
  }

  const initials = `${formData.firstName?.[0] || ""}${formData.lastName?.[0] || ""}`.toUpperCase() || "U"

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <TaxpayerSidebar variant="inset" />
      <SidebarInset>
        <TaxpayerHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-6">
                  <h1 className="text-lg font-bold">Settings</h1>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="security">
                      <Lock className="h-4 w-4 mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="privacy">
                      <Shield className="h-4 w-4 mr-2" />
                      Privacy
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-4">
                    {/* Header with Avatar and Edit Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-2xl font-bold">
                            {formData.firstName} {formData.middleName} {formData.lastName}
                          </h2>
                          <p className="text-sm text-muted-foreground">{formData.email}</p>
                        </div>
                      </div>

                      {!isEditMode ? (
                        <Button onClick={() => setIsEditMode(true)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Kanban-style Grid Layout */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Personal Information Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Personal Information</CardTitle>
                          <CardDescription>Your basic personal details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {isEditMode ? (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-xs">
                                  First Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id="firstName"
                                  value={formData.firstName}
                                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                  className="h-9"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="middleName" className="text-xs">
                                  Middle Name
                                </Label>
                                <Input
                                  id="middleName"
                                  value={formData.middleName}
                                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-xs">
                                  Last Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id="lastName"
                                  value={formData.lastName}
                                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                  className="h-9"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="dateOfBirth" className="text-xs">
                                  Date of Birth
                                </Label>
                                <Input
                                  id="dateOfBirth"
                                  type="date"
                                  value={formData.dateOfBirth}
                                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="gender" className="text-xs">
                                  Gender
                                </Label>
                                <Select
                                  value={formData.gender}
                                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="nationality" className="text-xs">
                                  Nationality
                                </Label>
                                <Input
                                  id="nationality"
                                  value={formData.nationality}
                                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                  className="h-9"
                                  placeholder="e.g., Nigerian"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs text-muted-foreground">Full Name</p>
                                <p className="font-medium">
                                  {formData.firstName} {formData.middleName} {formData.lastName}
                                </p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Date of Birth</p>
                                <p className="font-medium">{formData.dateOfBirth || "Not provided"}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Gender</p>
                                <p className="font-medium">{formData.gender || "Not provided"}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Nationality</p>
                                <p className="font-medium">{formData.nationality || "Not provided"}</p>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Contact Information Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Contact Information</CardTitle>
                          <CardDescription>How to reach you</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {isEditMode ? (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs">
                                  Email Address
                                </Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={formData.email}
                                  disabled
                                  className="h-9 bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs">
                                  Phone Number <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id="phone"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  className="h-9"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="residentialAddress" className="text-xs">
                                  Residential Address
                                </Label>
                                <Textarea
                                  id="residentialAddress"
                                  value={formData.residentialAddress}
                                  onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                                  className="min-h-[80px] resize-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="businessAddress" className="text-xs">
                                  Business Address
                                </Label>
                                <Textarea
                                  id="businessAddress"
                                  value={formData.businessAddress}
                                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                  className="min-h-[80px] resize-none"
                                  placeholder="Optional"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium">{formData.email}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="font-medium">{formData.phone || "Not provided"}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Residential Address</p>
                                <p className="font-medium text-sm">{formData.residentialAddress || "Not provided"}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Business Address</p>
                                <p className="font-medium text-sm">{formData.businessAddress || "Not provided"}</p>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Identification Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Identification</CardTitle>
                          <CardDescription>Your identification details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {isEditMode ? (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="taxId" className="text-xs">
                                  Tax ID / NIN
                                </Label>
                                <Input
                                  id="taxId"
                                  value={formData.taxId}
                                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="meansOfIdentification" className="text-xs">
                                  Means of Identification
                                </Label>
                                <Select
                                  value={formData.meansOfIdentification}
                                  onValueChange={(value) => setFormData({ ...formData, meansOfIdentification: value })}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select ID type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="NIN">National ID (NIN)</SelectItem>
                                    <SelectItem value="Passport">International Passport</SelectItem>
                                    <SelectItem value="Drivers License">Driver's License</SelectItem>
                                    <SelectItem value="Voters Card">Voter's Card</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="identificationNumber" className="text-xs">
                                  Identification Number
                                </Label>
                                <Input
                                  id="identificationNumber"
                                  value={formData.identificationNumber}
                                  onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                                  className="h-9"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs text-muted-foreground">Tax ID / NIN</p>
                                <p className="font-medium">{formData.taxId || "Not provided"}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Means of Identification</p>
                                <p className="font-medium">{formData.meansOfIdentification || "Not provided"}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Identification Number</p>
                                <p className="font-medium">{formData.identificationNumber || "Not provided"}</p>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Business Information Card */}
                      <Card className="md:col-span-2 lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Business Information</CardTitle>
                          <CardDescription>Details about your business (if applicable)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {isEditMode ? (
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="isBusiness"
                                    checked={formData.isBusiness}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isBusiness: checked })}
                                  />
                                  <Label htmlFor="isBusiness" className="text-xs">
                                    I own a business
                                  </Label>
                                </div>
                              </div>

                              {formData.isBusiness && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="businessName" className="text-xs">
                                      Business Name
                                    </Label>
                                    <Input
                                      id="businessName"
                                      value={formData.businessName}
                                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="businessType" className="text-xs">
                                      Business Type
                                    </Label>
                                    <Input
                                      id="businessType"
                                      value={formData.businessType}
                                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                      className="h-9"
                                      placeholder="e.g., Retail, Services"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="rcNumber" className="text-xs">
                                      RC Number
                                    </Label>
                                    <Input
                                      id="rcNumber"
                                      value={formData.rcNumber}
                                      onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="businessRegistrationDate" className="text-xs">
                                      Registration Date
                                    </Label>
                                    <Input
                                      id="businessRegistrationDate"
                                      type="date"
                                      value={formData.businessRegistrationDate}
                                      onChange={(e) =>
                                        setFormData({ ...formData, businessRegistrationDate: e.target.value })
                                      }
                                      className="h-9"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <>
                              {formData.isBusiness ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Business Name</p>
                                    <p className="font-medium">{formData.businessName || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Business Type</p>
                                    <p className="font-medium">{formData.businessType || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">RC Number</p>
                                    <p className="font-medium">{formData.rcNumber || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Registration Date</p>
                                    <p className="font-medium">{formData.businessRegistrationDate || "Not provided"}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No business information provided</p>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Professional Details Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Professional Details</CardTitle>
                          <CardDescription>Property management credentials</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {isEditMode ? (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="managementLicenseNumber" className="text-xs">
                                  Management License Number
                                </Label>
                                <Input
                                  id="managementLicenseNumber"
                                  value={formData.managementLicenseNumber}
                                  onChange={(e) =>
                                    setFormData({ ...formData, managementLicenseNumber: e.target.value })
                                  }
                                  className="h-9"
                                  placeholder="Optional"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="yearsOfExperience" className="text-xs">
                                  Years of Experience
                                </Label>
                                <Input
                                  id="yearsOfExperience"
                                  type="number"
                                  value={formData.yearsOfExperience}
                                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                                  className="h-9"
                                  placeholder="Optional"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs text-muted-foreground">Management License Number</p>
                                <p className="font-medium">{formData.managementLicenseNumber || "Not provided"}</p>
                              </div>
                              <Separator />
                              <div>
                                <p className="text-xs text-muted-foreground">Years of Experience</p>
                                <p className="font-medium">{formData.yearsOfExperience || "Not provided"}</p>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={handleChangePassword} disabled={saving}>
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Update Password"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Login Activity</CardTitle>
                        <CardDescription>Recent login activity on your account</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="font-medium">Last Login</p>
                              <p className="text-sm text-muted-foreground">
                                {userData?.last_login
                                  ? new Date(userData.last_login).toLocaleString()
                                  : "No recent activity"}
                              </p>
                            </div>
                            <span className="text-xs text-green-600 font-medium">Active</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Notifications Tab */}
                  <TabsContent value="notifications" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                        <CardDescription>Choose how you want to receive notifications</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                          </div>
                          <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>SMS Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                          </div>
                          <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Invoice Reminders</Label>
                            <p className="text-sm text-muted-foreground">Get reminders for unpaid invoices</p>
                          </div>
                          <Switch checked={invoiceReminders} onCheckedChange={setInvoiceReminders} />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Payment Confirmations</Label>
                            <p className="text-sm text-muted-foreground">Receive payment confirmation notifications</p>
                          </div>
                          <Switch checked={paymentConfirmations} onCheckedChange={setPaymentConfirmations} />
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              "Save Preferences"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Privacy Tab */}
                  <TabsContent value="privacy" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Data & Privacy</CardTitle>
                        <CardDescription>Manage your data and privacy settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">Export Your Data</p>
                            <p className="text-sm text-muted-foreground">Download a copy of your account data</p>
                          </div>
                          <Button variant="outline" onClick={handleExportData}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium text-destructive">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete your account and all data
                            </p>
                          </div>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <AIAssistantSidebar userRole={userRole as "taxpayer" | "property_manager"} />
    </SidebarProvider>
  )
}
