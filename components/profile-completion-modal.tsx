"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Circle, Mail, Phone, Award as IdCard, ImageIcon, User, Building2, Home, X } from "lucide-react"
import { createBrowserClient } from "@/utils/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface ProfileCompletionItem {
  id: string
  label: string
  description: string
  completed: boolean
  icon: React.ReactNode
  action?: () => void
  actionLabel?: string
}

interface ProfileCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDismiss?: () => void
}

export function ProfileCompletionModal({ open, onOpenChange, onDismiss }: ProfileCompletionModalProps) {
  const { user, userRole } = useAuth()
  const [items, setItems] = useState<ProfileCompletionItem[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && userRole) {
      loadProfileCompletion()
    }
  }, [user, userRole])

  const loadProfileCompletion = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createBrowserClient()

    try {
      // Fetch user data
      const { data: userData } = await supabase
        .from("users")
        .select("email_verified, phone_verified")
        .eq("firebase_uid", user.uid)
        .single()

      // Fetch taxpayer profile
      const { data: profileData } = await supabase
        .from("taxpayer_profiles")
        .select("kadirs_id, profile_photo_url, phone_verified, gender, date_of_birth")
        .eq("user_id", userData?.id)
        .single()

      // Check for properties (taxpayer/property_manager)
      let hasProperty = false
      if (userRole && ["taxpayer", "property_manager"].includes(userRole)) {
        const { count } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", userData?.id)
        hasProperty = (count || 0) > 0
      }

      // Check for rentals (tenant)
      let hasRental = false
      if (userRole === "tenant") {
        const { count } = await supabase
          .from("tenant_rentals")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", userData?.id)
          .eq("is_active", true)
        hasRental = (count || 0) > 0
      }

      // Build completion items
      const completionItems: ProfileCompletionItem[] = [
        {
          id: "email",
          label: "Verify Email",
          description: "Confirm your email address",
          completed: userData?.email_verified || false,
          icon: <Mail className="h-4 w-4" />,
          actionLabel: "Verify Now",
          action: () => handleVerifyEmail(),
        },
        {
          id: "phone",
          label: "Verify Phone Number",
          description: "Verify via WhatsApp OTP",
          completed: profileData?.phone_verified || false,
          icon: <Phone className="h-4 w-4" />,
          actionLabel: "Verify Now",
          action: () => handleVerifyPhone(),
        },
        {
          id: "kadirs_id",
          label: "Generate KADIRS ID",
          description: "Get your unique tax ID",
          completed: !!profileData?.kadirs_id,
          icon: <IdCard className="h-4 w-4" />,
          actionLabel: "Generate ID",
          action: () => handleGenerateKadirsId(),
        },
        {
          id: "profile_photo",
          label: "Upload Profile Photo",
          description: "Add a profile picture (optional)",
          completed: !!profileData?.profile_photo_url,
          icon: <ImageIcon className="h-4 w-4" />,
          actionLabel: "Upload Photo",
          action: () => handleUploadPhoto(),
        },
        {
          id: "basic_details",
          label: "Complete Basic Details",
          description: "Add gender and date of birth",
          completed: !!(profileData?.gender && profileData?.date_of_birth),
          icon: <User className="h-4 w-4" />,
          actionLabel: "Complete Profile",
          action: () => handleCompleteProfile(),
        },
      ]

      // Add role-specific items
      if (userRole && ["taxpayer", "property_manager"].includes(userRole)) {
        completionItems.push({
          id: "property",
          label: "Register Property",
          description: "Add at least one property",
          completed: hasProperty,
          icon: <Building2 className="h-4 w-4" />,
          actionLabel: "Register Property",
          action: () => (window.location.href = "/taxpayer-dashboard/properties"),
        })
      }

      if (userRole === "tenant") {
        completionItems.push({
          id: "rental",
          label: "Link Rental Property",
          description: "Connect to your rental",
          completed: hasRental,
          icon: <Home className="h-4 w-4" />,
          actionLabel: "Link Property",
          action: () => (window.location.href = "/tenant-dashboard/properties"),
        })
      }

      setItems(completionItems)

      // Calculate completion percentage
      const completedCount = completionItems.filter((item) => item.completed).length
      const percentage = Math.round((completedCount / completionItems.length) * 100)
      setCompletionPercentage(percentage)
    } catch (error) {
      console.error("Error loading profile completion:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = () => {
    // TODO: Implement email verification
    console.log("Verify email")
  }

  const handleVerifyPhone = () => {
    // TODO: Implement phone verification via WhatsApp
    console.log("Verify phone")
  }

  const handleGenerateKadirsId = () => {
    // TODO: Implement KADIRS ID generation via API
    console.log("Generate KADIRS ID")
  }

  const handleUploadPhoto = () => {
    // TODO: Implement photo upload
    console.log("Upload photo")
  }

  const handleCompleteProfile = () => {
    // Navigate to settings
    if (userRole === "tenant") {
      window.location.href = "/tenant-dashboard/settings"
    } else {
      window.location.href = "/taxpayer-dashboard/settings"
    }
  }

  const handleDismiss = async () => {
    if (onDismiss) {
      onDismiss()
    }

    // Mark as dismissed in database
    if (user) {
      const supabase = createBrowserClient()
      const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", user.uid).single()

      if (userData) {
        await supabase
          .from("taxpayer_profiles")
          .update({ profile_completion_dismissed: true, last_profile_check: new Date().toISOString() })
          .eq("user_id", userData.id)
      }
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Complete Your Profile</DialogTitle>
              <DialogDescription>Complete these steps to get the most out of your account</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Section */}
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-2xl font-bold">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {items.filter((item) => item.completed).length} of {items.length} completed
              </p>
            </div>
          </Card>

          {/* Completion Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className={item.completed ? "border-green-200 bg-green-50/50" : ""}>
                <div className="flex items-start gap-4 p-4">
                  <div className="mt-1">
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <h4 className="font-medium">{item.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {!item.completed && item.action && (
                    <Button size="sm" onClick={item.action}>
                      {item.actionLabel}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="ghost" onClick={handleDismiss}>
              Remind me later
            </Button>
            {completionPercentage === 100 && <Button onClick={handleDismiss}>Done</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
