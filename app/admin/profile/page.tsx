"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
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
import { User, Mail, Phone, Calendar, Shield, Pencil, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function AdminProfilePage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)

  // Edit profile state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone_number: "",
  })

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
        setProfileData({
          id: userData.id,
          name: userData.full_name || user?.displayName || "Admin",
          email: userData.email || user?.email || "",
          phone: userData.phone_number || user?.phoneNumber || "",
          photoURL: user?.photoURL || "",
          createdAt: userData.created_at || user?.metadata?.creationTime || new Date().toISOString(),
        })
        setEditForm({
          full_name: userData.full_name || "",
          phone_number: userData.phone_number || "",
        })
      } else {
        // Fallback to Firebase user data
        setProfileData({
          name: user?.displayName || "Admin",
          email: user?.email || "",
          phone: user?.phoneNumber || "",
          photoURL: user?.photoURL || "",
          createdAt: user?.metadata?.creationTime || new Date().toISOString(),
        })
        setEditForm({
          full_name: user?.displayName || "",
          phone_number: user?.phoneNumber || "",
        })
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
          full_name: editForm.full_name,
          phone_number: editForm.phone_number,
        })
        .eq("id", profileData.id)

      if (error) throw error

      setProfileData((prev: any) => ({
        ...prev,
        name: editForm.full_name,
        phone: editForm.phone_number,
      }))

      setEditDialogOpen(false)
      setEditSheetOpen(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const openEditForm = () => {
    if (window.innerWidth < 768) {
      setEditSheetOpen(true)
    } else {
      setEditDialogOpen(true)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 text-center md:text-left">
                <Skeleton className="h-6 w-40 mx-auto md:mx-0" />
                <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
                <Skeleton className="h-6 w-24 mx-auto md:mx-0" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const EditFormContent = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          value={editForm.full_name}
          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
          placeholder="Enter your full name"
        />
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
              <AvatarImage src={profileData?.photoURL || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{getInitials(profileData?.name)}</AvatarFallback>
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
  )
}
