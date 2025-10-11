"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Mail, Phone, ImageIcon, ChevronRight } from "lucide-react"
import { createBrowserClient } from "@/utils/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface CompletionItem {
  id: string
  label: string
  completed: boolean
  icon: React.ReactNode
  action: () => void
}

export function ProfileCompletionSection() {
  const { user, userRole } = useAuth()
  const [items, setItems] = useState<CompletionItem[]>([])
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
      const { data: userData } = await supabase
        .from("users")
        .select("id, email_verified, phone_verified")
        .eq("firebase_uid", user.uid)
        .single()

      const { data: profileData } = await supabase
        .from("taxpayer_profiles")
        .select("kadirs_id, profile_photo_url")
        .eq("user_id", userData?.id)
        .single()

      const completionItems: CompletionItem[] = [
        {
          id: "email",
          label: "Verify Email",
          completed: userData?.email_verified || false,
          icon: <Mail className="h-5 w-5" />,
          action: () => handleVerifyEmail(),
        },
        {
          id: "phone",
          label: "Verify Phone",
          completed: userData?.phone_verified || false,
          icon: <Phone className="h-5 w-5" />,
          action: () => handleVerifyPhone(),
        },
        {
          id: "profile_photo",
          label: "Upload profile photo",
          completed: !!profileData?.profile_photo_url,
          icon: <ImageIcon className="h-5 w-5" />,
          action: () => handleUploadPhoto(),
        },
      ]

      setItems(completionItems)

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
    console.log("Verify email")
  }

  const handleVerifyPhone = () => {
    console.log("Verify phone")
  }

  const handleUploadPhoto = () => {
    console.log("Upload photo")
  }

  if (loading || completionPercentage === 100) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header with progress */}
        <div>
          <h3 className="text-lg font-semibold">Complete profile</h3>
          <p className="text-sm text-muted-foreground">{completionPercentage}% complete</p>
        </div>

        {/* Progress bar */}
        <Progress value={completionPercentage} className="h-2" />

        {/* Action items in horizontal layout */}
        <div className="flex flex-wrap gap-3">
          {items
            .filter((item) => !item.completed)
            .map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="flex items-center gap-2 h-auto py-3 px-4 bg-transparent"
                onClick={item.action}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ))}
        </div>
      </div>
    </Card>
  )
}

export default ProfileCompletionSection
