"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, ChevronRight } from "lucide-react"
import { createBrowserClient } from "@/utils/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface ProfileCompletionCardProps {
  onViewDetails: () => void
}

export function ProfileCompletionCard({ onViewDetails }: ProfileCompletionCardProps) {
  const { user, userRole } = useAuth()
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && userRole) {
      loadCompletionPercentage()
    }
  }, [user, userRole])

  const loadCompletionPercentage = async () => {
    if (!user) return

    setLoading(true)
    const supabase = createBrowserClient()

    try {
      const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", user.uid).single()

      if (userData) {
        const { data, error } = await supabase.rpc("calculate_profile_completion", {
          p_user_id: userData.id,
          p_role: userRole,
        })

        if (!error && data !== null) {
          setCompletionPercentage(data)
        }
      }
    } catch (error) {
      console.error("Error loading completion percentage:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || completionPercentage === 100) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-blue-900">Complete Your Profile</CardTitle>
            <CardDescription className="text-blue-700">
              {completionPercentage}% complete - Finish setting up your account
            </CardDescription>
          </div>
          <CheckCircle2 className="h-8 w-8 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completionPercentage} className="h-2" />
        <Button onClick={onViewDetails} className="w-full" variant="default">
          Complete Profile
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
