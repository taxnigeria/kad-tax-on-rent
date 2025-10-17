"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconHome, IconKey, IconBriefcase, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Loader2, ChevronLeft } from "lucide-react"
import { createUserInDatabase } from "@/app/actions/auth"
import { normalizeNigerianPhone } from "@/lib/utils/phone"

type UserRole = "taxpayer" | "tenant" | "property_manager"

interface RoleOption {
  value: UserRole
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const roleOptions: RoleOption[] = [
  {
    value: "taxpayer",
    label: "Property Owner",
    description: "I own rental properties and need to pay withholding tax",
    icon: <IconHome className="size-8" />,
    color: "text-green-600",
  },
  {
    value: "tenant",
    label: "Tenant",
    description: "I rent a property and want to pay my portion of tax",
    icon: <IconKey className="size-8" />,
    color: "text-blue-600",
  },
  {
    value: "property_manager",
    label: "Property Manager",
    description: "I manage properties on behalf of owners",
    icon: <IconBriefcase className="size-8" />,
    color: "text-purple-600",
  },
]

export default function CompleteProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!user || !selectedRole) {
      setError("Missing required information")
      setLoading(false)
      return
    }

    // Validate and normalize phone number
    const normalizedPhone = normalizeNigerianPhone(phoneNumber)
    if (!normalizedPhone) {
      setError("Please enter a valid Nigerian phone number")
      setLoading(false)
      return
    }

    // Extract name from Google profile
    const displayName = user.displayName || ""
    const [firstName, ...lastNameParts] = displayName.split(" ")
    const lastName = lastNameParts.join(" ") || firstName

    // Create user in database
    const result = await createUserInDatabase({
      firebaseUid: user.uid,
      email: user.email || "",
      firstName: firstName || "User",
      lastName: lastName || "",
      phoneNumber: normalizedPhone,
      role: selectedRole,
      emailVerified: user.emailVerified,
      profilePhotoUrl: user.photoURL || undefined,
    })

    if (!result.success) {
      setError(result.error || "Failed to create profile")
      setLoading(false)
      return
    }

    // Redirect to appropriate dashboard
    if (selectedRole === "tenant") {
      router.push("/tenant-dashboard")
    } else if (selectedRole === "taxpayer" || selectedRole === "property_manager") {
      router.push("/taxpayer-dashboard")
    } else {
      router.push("/dashboard")
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const selectedRoleOption = roleOptions.find((r) => r.value === selectedRole)

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <IconHome className="size-4" />
          </div>
          KADIRS Tax Portal
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{step === 1 ? "Complete Your Profile" : "Almost Done!"}</CardTitle>
            <CardDescription>
              {step === 1 ? "Select your role to get started" : `Just need your phone number to complete registration`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="grid gap-4">
                {/* User info from Google */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                  {user?.photoURL && (
                    <img
                      src={user.photoURL || "/placeholder.svg"}
                      alt="Profile"
                      className="size-10 rounded-full object-cover"
                    />
                  )}
                  {!user?.photoURL && (
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconHome className="size-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{user?.displayName}</div>
                    <div className="text-sm text-muted-foreground">{user?.email}</div>
                  </div>
                </div>

                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleSelect(role.value)}
                    className={cn(
                      "relative flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all hover:border-primary hover:bg-accent",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    )}
                  >
                    <div className={cn("flex-shrink-0", role.color)}>{role.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base">{role.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">{role.description}</div>
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground">
                      <ChevronLeft className="size-5 rotate-180" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                  <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="w-fit -mt-2">
                    <ChevronLeft className="size-4 mr-1" />
                    Change Role
                  </Button>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                    <div className={cn("flex-shrink-0", selectedRoleOption?.color)}>{selectedRoleOption?.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{selectedRoleOption?.label}</div>
                      <div className="text-sm text-muted-foreground">{selectedRoleOption?.description}</div>
                    </div>
                    <IconCheck className="size-5 text-green-600" />
                  </div>

                  {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                  <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="08012345678"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your Nigerian phone number (e.g., 08012345678)
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing profile...
                      </>
                    ) : (
                      "Complete Profile"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
