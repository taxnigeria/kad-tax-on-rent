"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp } from "@/lib/auth"
import { Loader2, ChevronLeft } from "lucide-react"
import { IconHome, IconKey, IconBriefcase, IconCheck } from "@tabler/icons-react"

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

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()

  // Multi-step state
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    // Role-specific fields
    staffId: "", // For enumerator
    licenseNumber: "", // For property manager
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (!selectedRole) {
      setError("Please select a role")
      setLoading(false)
      return
    }

    const { user, error: signUpError } = await signUp({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      role: selectedRole,
    })

    if (signUpError) {
      setError(signUpError)
      setLoading(false)
    } else if (user) {
      // Success - redirect to success page
      router.push("/signup-success")
    }
  }

  const selectedRoleOption = roleOptions.find((r) => r.value === selectedRole)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{step === 1 ? "Choose Your Role" : "Create Your Account"}</CardTitle>
          <CardDescription>
            {step === 1
              ? "Select the option that best describes you"
              : `Register as ${selectedRoleOption?.label.toLowerCase()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="grid gap-4">
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

          {/* Step 2: Registration Form */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                {/* Back Button */}
                <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="w-fit -mt-2">
                  <ChevronLeft className="size-4 mr-1" />
                  Change Role
                </Button>

                {/* Selected Role Display */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                  <div className={cn("flex-shrink-0", selectedRoleOption?.color)}>{selectedRoleOption?.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{selectedRoleOption?.label}</div>
                    <div className="text-sm text-muted-foreground">{selectedRoleOption?.description}</div>
                  </div>
                  <IconCheck className="size-5 text-green-600" />
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="08012345678"
                    required
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Role-specific fields */}
                {selectedRole === "property_manager" && (
                  <div className="grid gap-2">
                    <Label htmlFor="licenseNumber">License Number (Optional)</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      placeholder="PM-KD-12345"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                    Login
                  </Link>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      <div className="text-center text-xs text-balance text-muted-foreground">
        By creating an account, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  )
}
