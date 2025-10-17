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
import { useToast } from "@/hooks/use-toast"
import { getKadirsIDSummary, updateProfileForKadirs, generateKadirsID } from "@/app/actions/verification"
import { useAuth } from "@/contexts/auth-context"

interface KadirsIDDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function KadirsIDDialog({ open, onOpenChange, onSuccess }: KadirsIDDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "summary" | "generating">("form")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  const [formData, setFormData] = useState({
    gender: "",
    addressLine1: "",
    lgaId: "",
    industryId: "",
    userType: "Individual",
    tin: "",
    rcNumber: "",
  })

  const [lgas, setLgas] = useState<any[]>([])
  const [industries, setIndustries] = useState<any[]>([])

  useEffect(() => {
    if (open && user) {
      loadInitialData()
    }
  }, [open, user])

  const loadInitialData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load LGAs and industries from database
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const [lgasResult, industriesResult, summaryResult] = await Promise.all([
        supabase.from("lgas").select("id, name").order("name"),
        supabase.from("industries").select("id, name").eq("is_active", true).order("name"),
        getKadirsIDSummary(user.uid),
      ])

      if (lgasResult.data) setLgas(lgasResult.data)
      if (industriesResult.data) setIndustries(industriesResult.data)

      if (summaryResult.success && summaryResult.summary) {
        const s = summaryResult.summary

        // Find LGA ID by name if available
        let lgaId = ""
        if (s.lga && lgasResult.data) {
          const matchingLga = lgasResult.data.find((lga: any) => lga.name === s.lga)
          if (matchingLga) lgaId = matchingLga.id
        }

        // Find industry ID by name if available
        let industryId = ""
        if (s.industry && industriesResult.data) {
          const matchingIndustry = industriesResult.data.find((ind: any) => ind.name === s.industry)
          if (matchingIndustry) industryId = matchingIndustry.id.toString()
        }

        setFormData({
          gender: s.gender || "",
          addressLine1: s.address || "",
          lgaId: lgaId,
          industryId: industryId,
          userType: s.userType || "Individual",
          tin: s.tin || "",
          rcNumber: s.rcNumber || "",
        })

        // Check if all required fields are filled
        if (s.gender && s.address && lgaId && industryId && s.emailVerified && s.phoneVerified) {
          // If profile is complete, go directly to summary
          setSummary(s)
          setStep("summary")
        }
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForm = async () => {
    if (!user) return

    // Validate required fields
    if (!formData.gender || !formData.addressLine1 || !formData.lgaId || !formData.industryId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await updateProfileForKadirs(user.uid, {
        gender: formData.gender,
        addressLine1: formData.addressLine1,
        lgaId: formData.lgaId,
        industryId: Number.parseInt(formData.industryId),
        userType: formData.userType,
        tin: formData.tin,
        rcNumber: formData.rcNumber,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Load summary with updated data
      const summaryResult = await getKadirsIDSummary(user.uid)
      if (summaryResult.success) {
        setSummary(summaryResult.summary)
        setStep("summary")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateID = async () => {
    if (!user) return

    setStep("generating")
    setLoading(true)

    try {
      const result = await generateKadirsID(user.uid)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "KADIRS ID Generated",
        description: `Your KADIRS ID is: ${result.kadirsId}${result.isTemporary ? " (Temporary)" : ""}`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate KADIRS ID",
        variant: "destructive",
      })
      setStep("summary")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate KADIRS ID</DialogTitle>
          <DialogDescription>
            {step === "form" && "Please provide the following information to generate your KADIRS ID"}
            {step === "summary" && "Please review your information before generating your KADIRS ID"}
            {step === "generating" && "Generating your KADIRS ID..."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                  User Type <span className="text-destructive">*</span>
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
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                placeholder="Enter your full address"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lga">
                  LGA <span className="text-destructive">*</span>
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
                  Industry <span className="text-destructive">*</span>
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
                      <SelectItem key={industry.id} value={industry.id.toString()}>
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

        {step === "summary" && summary && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold text-sm">Verification Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  {summary.emailVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">Email {summary.emailVerified ? "Verified" : "Not Verified"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {summary.phoneVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">Phone {summary.phoneVerified ? "Verified" : "Not Verified"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold text-sm">Personal Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Full Name:</span>
                  <p className="font-medium">{summary.fullName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gender:</span>
                  <p className="font-medium capitalize">{summary.gender}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{summary.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{summary.phoneNumber}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium">{summary.address}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">LGA:</span>
                  <p className="font-medium">{summary.lga}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>
                  <p className="font-medium">{summary.industry}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">User Type:</span>
                  <p className="font-medium">{summary.userType}</p>
                </div>
                {summary.tin && (
                  <div>
                    <span className="text-muted-foreground">TIN:</span>
                    <p className="font-medium">{summary.tin}</p>
                  </div>
                )}
                {summary.rcNumber && (
                  <div>
                    <span className="text-muted-foreground">RC Number:</span>
                    <p className="font-medium">{summary.rcNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {(!summary.emailVerified || !summary.phoneVerified) && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  Please verify your email and phone number before generating your KADIRS ID.
                </p>
              </div>
            )}
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating your KADIRS ID...</p>
          </div>
        )}

        <DialogFooter>
          {step === "form" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitForm} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </>
          )}

          {step === "summary" && (
            <>
              <Button variant="outline" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button
                onClick={handleGenerateID}
                disabled={loading || !summary?.emailVerified || !summary?.phoneVerified}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate KADIRS ID
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
