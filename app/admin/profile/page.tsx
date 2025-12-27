"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { User, Mail, Phone, Calendar, Shield, Pencil, Save, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useMediaQuery } from "@/hooks/use-mobile"

export default function AdminProfilePage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)

  // Edit profile state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
  })
  const [originalPhone, setOriginalPhone] = useState("")

  // Verification modals
  const [emailVerificationOpen, setEmailVerificationOpen] = useState(false)
  const [phoneVerificationOpen, setPhoneVerificationOpen] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }

      if (userRole !== "admin" && userRole !== "super_admin") {
        router.push("/login")
        return
      }

      loadProfile()
    }
  }, [user, userRole, authLoading, router])

  const loadProfile = async () => {
    try {
      const supabase = createClient()

      // Fetch user data from Supabase
      const { data: userData } = await supabase.from("users").select("*").eq("firebase_uid", user?.uid).single()

      if (userData) {
        const fullName = `${userData.first_name || ""} ${userData.middle_name || ""} ${userData.last_name || ""}`.trim()
        setProfileData({
          id: userData.id,
          firstName: userData.first_name || "",
          middleName: userData.middle_name || "",
          lastName: userData.last_name || "",
          name: fullName || user?.displayName || "Admin",
          email: userData.email || user?.email || "",
          phone: userData.phone_number || user?.phoneNumber || "",
          photoURL: user?.photoURL || "",
          emailVerified: userData.email_verified || false,
          phoneVerified: userData.phone_verified || false,
          createdAt: userData.created_at || user?.metadata?.creationTime || new Date().toISOString(),
        })
        setEditForm({
          first_name: userData.first_name || "",
          middle_name: userData.middle_name || "",
          last_name: userData.last_name || "",
          phone_number: userData.phone_number || "",
        })
        setOriginalPhone(userData.phone_number || "")
      }
    } catch (error) {
      console.error("Failed to load profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileData?.id) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("users")
        .update({
          first_name: editForm.first_name,
          middle_name: editForm.middle_name,
          last_name: editForm.last_name,
          phone_number: editForm.phone_number,
        })
        .eq("id", profileData.id)

      if (error) throw error

      const fullName = `${editForm.first_name || ""} ${editForm.middle_name || ""} ${editForm.last_name || ""}`.trim()

      const phoneChanged = editForm.phone_number !== originalPhone
      if (phoneChanged) {
        await supabase.from("users").update({ phone_verified: false }).eq("id", profileData.id)
      }

      setProfileData((prev: any) => ({
        ...prev,
        firstName: editForm.first_name,
        middleName: editForm.middle_name,
        lastName: editForm.last_name,
        name: fullName,
        phone: editForm.phone_number,
        phoneVerified: phoneChanged ? false : prev.phoneVerified,
      }))
      setOriginalPhone(editForm.phone_number)

      setEditDialogOpen(false)
      setEditSheetOpen(false)
      toast({
        title: "Profile Updated",
        description: phoneChanged
          ? "Your profile has been updated. Please verify your new phone number."
          : "Your profile has been updated successfully",
      })

      if (phoneChanged) {
        setPhoneVerificationOpen(true)
      }
    } catch (error) {
      console.error("Failed to save profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0]?.toUpperCase() || ""
    const last = lastName?.[0]?.toUpperCase() || ""
    return first + last || "AD"
  }

  const openEditForm = () => {
    if (isMobile) {
      setEditSheetOpen(true)
    } else {
      setEditDialogOpen(true)
    }
  }

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex-1 space-y-6 p-4 md:p-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-24 rounded-full" />
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const EditFormContent = () => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={editForm.first_name}
            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            placeholder="First name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="middle_name">Middle Name</Label>
          <Input
            id="middle_name"
            value={editForm.middle_name}
            onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
            placeholder="Middle name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={editForm.last_name}
            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            placeholder="Last name"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          value={editForm.phone_number}
          onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
          placeholder="Enter your phone number"
        />
      </div>
    </div>
  )

  const EditFormButtons = () => (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setEditDialogOpen(false)
          setEditSheetOpen(false)
        }}
        disabled={saving}
      >
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>
      <Button onClick={handleSaveProfile} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 space-y-6 p-4 md:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account settings</p>
          </div>

          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData?.photoURL || "/placeholder.svg"} alt="Profile" />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profileData?.firstName, profileData?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-semibold">{profileData?.name}</h2>
                  <p className="text-sm text-muted-foreground">{profileData?.email}</p>
                  <Badge className="mt-2" variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={openEditForm}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>Verify your email and phone number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {profileData?.emailVerified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">Email Address</p>
                    <p className="text-xs text-muted-foreground">{profileData?.email}</p>
                  </div>
                </div>
                {!profileData?.emailVerified && (
                  <Button size="sm" onClick={() => setEmailVerificationOpen(true)}>
                    Verify
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {profileData?.phoneVerified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">Phone Number</p>
                    <p className="text-xs text-muted-foreground">{profileData?.phone || "Not set"}</p>
                  </div>
                </div>
                {!profileData?.phoneVerified && profileData?.phone && (
                  <Button size="sm" onClick={() => setPhoneVerificationOpen(true)}>
                    Verify
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input value={profileData?.name || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input value={profileData?.email || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input value={profileData?.phone || "Not set"} disabled />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <Input
                  value={
                    profileData?.createdAt
                      ? new Date(profileData.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Unknown"
                  }
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Dialog - Desktop */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>Update your profile information</DialogDescription>
              </DialogHeader>
              <EditFormContent />
              <DialogFooter>
                <EditFormButtons />
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Profile Sheet - Mobile */}
          <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
            <SheetContent side="bottom" className="h-[90vh]">
              <SheetHeader>
                <SheetTitle>Edit Profile</SheetTitle>
                <SheetDescription>Update your profile information</SheetDescription>
              </SheetHeader>
              <EditFormContent />
              <SheetFooter className="flex-row gap-2">
                <EditFormButtons />
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
