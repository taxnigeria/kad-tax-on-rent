"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Circle,
  Mail,
  Phone,
  Award as IdCard,
  ImageIcon,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { createBrowserClient } from "@/utils/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface CompletionItem {
  id: string
  label: string
  description: string
  completed: boolean
  icon: React.ReactNode
  action?: () => void
  actionLabel?: string
}

interface ProfileCompletionCardProps {
  userRole: "taxpayer" | "property_manager" | "tenant"
}

export function ProfileCompletionCard({ userRole }: ProfileCompletionCardProps) {
  const { user } = useAuth()
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [items, setItems] = useState<CompletionItem[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [loading, setLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (user) {
      loadCompletionStatus()
    }
  }, [user])

  const loadCompletionStatus = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createBrowserClient()

    try {
      // Get user data
      const { data: userData } = await supabase
        .from("users")
        .select("id, email_verified, phone_verified, profile_photo_url")
        .eq("firebase_uid", user.uid)
        .single()

      if (!userData) return

      // Get taxpayer profile data
      const { data: profileData } = await supabase
        .from("taxpayer_profiles")
        .select("kadirs_id, profile_completion_percentage")
        .eq("user_id", userData.id)
        .single()

      // Get property/rental count based on role
      let hasProperty = false
      if (userRole === "taxpayer" || userRole === "property_manager") {
        const { count } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", userData.id)
        hasProperty = (count || 0) > 0
      } else if (userRole === "tenant") {
        const { count } = await supabase
          .from("tenant_rentals")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", userData.id)
          .eq("is_active", true)
        hasProperty = (count || 0) > 0
      }

      // Build completion items
      const completionItems: CompletionItem[] = [
        {
          id: "email",
          label: "Verify Email",
          description: "Confirm your email address",
          completed: userData.email_verified || false,
          icon: <Mail className="h-4 w-4" />,
          action: () => handleVerifyEmail(),
          actionLabel: "Verify",
        },
        {
          id: "phone",
          label: "Verify Phone Number",
          description: "Verify via WhatsApp OTP",
          completed: userData.phone_verified || false,
          icon: <Phone className="h-4 w-4" />,
          action: () => handleVerifyPhone(),
          actionLabel: "Verify",
        },
        {
          id: "kadirs_id",
          label: "Generate KADIRS ID",
          description: "Get your unique tax ID",
          completed: !!profileData?.kadirs_id,
          icon: <IdCard className="h-4 w-4" />,
          action: () => handleGenerateKadirsId(),
          actionLabel: "Generate",
        },
        {
          id: "photo",
          label: "Upload Profile Photo",
          description: "Add a profile picture",
          completed: !!userData.profile_photo_url,
          icon: <ImageIcon className="h-4 w-4" />,
          action: () => handleUploadPhoto(),
          actionLabel: "Upload",
        },
      ]

      // Add role-specific item
      if (userRole === "taxpayer" || userRole === "property_manager") {
        completionItems.push({
          id: "property",
          label: "Register Property",
          description: "Add at least one property",
          completed: hasProperty,
          icon: <Building2 className="h-4 w-4" />,
          action: () => (window.location.href = "/taxpayer-dashboard/properties"),
          actionLabel: "Register",
        })
      } else if (userRole === "tenant") {
        completionItems.push({
          id: "rental",
          label: "Link Rental Property",
          description: "Connect to your rental",
          completed: hasProperty,
          icon: <Building2 className="h-4 w-4" />,
          action: () => (window.location.href = "/tenant-dashboard/properties"),
          actionLabel: "Link",
        })
      }

      setItems(completionItems)
      setCompletionPercentage(profileData?.profile_completion_percentage || 0)

      // Auto-dismiss if 100% complete
      if (profileData?.profile_completion_percentage === 100) {
        const dismissed = localStorage.getItem("profile_completion_dismissed")
        if (dismissed === "true") {
          setIsDismissed(true)
        }
      }
    } catch (error) {
      console.error("Error loading completion status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    // Trigger Firebase email verification
    if (user) {
      try {
        await user.sendEmailVerification()
        alert("Verification email sent! Please check your inbox.")
      } catch (error) {
        console.error("Error sending verification email:", error)
        alert("Failed to send verification email. Please try again.")
      }
    }
  }

  const handleVerifyPhone = () => {
    // Open phone verification modal/dialog
    window.location.href = "/verify-phone"
  }

  const handleGenerateKadirsId = async () => {
    // Call API to generate KADIRS ID
    try {
      const response = await fetch("/api/generate-kadirs-id", {
        method: "POST",
      })
      if (response.ok) {
        alert("KADIRS ID generated successfully!")
        loadCompletionStatus()
      } else {
        alert("Failed to generate KADIRS ID. Please try again.")
      }
    } catch (error) {
      console.error("Error generating KADIRS ID:", error)
      alert("An error occurred. Please try again.")
    }
  }

  const handleUploadPhoto = () => {
    // Open photo upload modal/dialog
    window.location.href = "/settings?tab=profile"
  }

  const handleDismiss = () => {
    localStorage.setItem("profile_completion_dismissed", "true")
    setIsDismissed(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (isDismissed) {
    return null
  }

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length

  return (
    <Card
      className={cn(
        "border-2",
        completionPercentage === 100 ? "border-green-200 bg-green-50/50" : "border-blue-200 bg-blue-50/50",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {completionPercentage === 100 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-blue-600" />
              )}
              Profile Completion
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="ml-2">
                {completionPercentage}%
              </Badge>
            </CardTitle>
            <CardDescription className={completionPercentage === 100 ? "text-green-700" : "text-blue-700"}>
              {completionPercentage === 100
                ? "Your profile is complete!"
                : `Complete your profile to unlock all features (${completedCount}/${totalCount} completed)`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {completionPercentage === 100 && (
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        </div>
        <Progress value={completionPercentage} className="mt-3" />
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 transition-colors",
                item.completed ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-white",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    item.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600",
                  )}
                >
                  {item.completed ? <CheckCircle2 className="h-4 w-4" /> : item.icon}
                </div>
                <div>
                  <p className={cn("font-medium text-sm", item.completed ? "text-green-900" : "text-gray-900")}>
                    {item.label}
                  </p>
                  <p className={cn("text-xs", item.completed ? "text-green-700" : "text-gray-600")}>
                    {item.description}
                  </p>
                </div>
              </div>
              {!item.completed && item.action && (
                <Button size="sm" variant="outline" onClick={item.action}>
                  {item.actionLabel}
                </Button>
              )}
              {item.completed && (
                <Badge variant="default" className="bg-green-600">
                  Complete
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
