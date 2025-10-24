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
import { Loader2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getKadirsIDSummary,
  updateProfileForKadirs,
  generateKadirsID,
  verifyExistingKadirsID,
  saveExistingKadirsID,
} from "@/app/actions/verification"
import { useAuth } from "@/contexts/auth-context"

interface KadirsIDDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (kadirsId: string) => void
}

type Step = "choice" | "existing-input" | "existing-confirm" | "form" | "summary" | "generating" | "success"

export function KadirsIDDialog({ open, onOpenChange, onSuccess }: KadirsIDDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>("choice")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [existingKadirsData, setExistingKadirsData] = useState<any>(null)
  const [existingCriteria, setExistingCriteria] = useState("")
  const [generatedKadirsId, setGeneratedKadirsId] = useState("")
  const [copied, setCopied] = useState(false)

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
    if (open && user && step === "form") {
      loadInitialData()
    }
  }, [open, user, step])

  const loadInitialData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load LGAs and industries from database
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const [lgasResult, industriesResult, summaryResult] = await Promise.all([
        supabase.from("lgas").select("id, name, lga_id").order("name"),
        supabase.from("industries").select("id, name, industry_id").order("name"),
        getKadirsIDSummary(user.uid),
      ])

      console.log("[v0] LGAs loaded:", lgasResult.data?.length)
      console.log("[v0] Industries loaded:", industriesResult.data?.length)

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
          if (matchingIndustry) industryId = matchingIndustry.industry_id?.toString() || ""
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

  const handleVerifyExisting = async () => {
    if (!existingCriteria.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your KADIRS ID or email",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await verifyExistingKadirsID(existingCriteria)

      if (!result.success) {
        throw new Error(result.error)
      }

      setExistingKadirsData(result.data)
      setStep("existing-confirm")
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Could not verify KADIRS ID",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExisting = async () => {
    if (!user || !existingKadirsData) return

    setLoading(true)
    try {
      const result = await saveExistingKadirsID(user.uid, existingKadirsData.tpui)

      if (!result.success) {
        throw new Error(result.error)
      }

      setGeneratedKadirsId(existingKadirsData.tpui)
      setStep("success")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save KADIRS ID",
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

      setGeneratedKadirsId(result.kadirsId || "")
      setStep("success")
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

  const handleCopyKadirsId = () => {
    navigator.clipboard.writeText(generatedKadirsId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSuccessClose = () => {
    onSuccess(generatedKadirsId)
    onOpenChange(false)
    // Reset state
    setStep("choice")
    setExistingCriteria("")
    setExistingKadirsData(null)
    setGeneratedKadirsId("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "choice" && "KADIRS ID"}
            {step === "existing-input" && "Use Existing KADIRS ID"}
            {step === "existing-confirm" && "Confirm Your Details"}
            {step === "form" && "Generate New KADIRS ID"}
            {step === "summary" && "Review Your Information"}
            {step === "generating" && "Generating KADIRS ID"}
            {step === "success" && "Success!"}
          </DialogTitle>
          <DialogDescription>
            {step === "choice" && "Choose how you want to proceed with your KADIRS ID"}
            {step === "existing-input" && "Enter your existing KADIRS ID or email to verify"}
            {step === "existing-confirm" && "Please confirm these details match your information"}
            {step === "form" && "Please provide the following information to generate your KADIRS ID"}
            {step === "summary" && "Please review your information before generating your KADIRS ID"}
            {step === "generating" && "Generating your KADIRS ID..."}
            {step === "success" && "Your KADIRS ID has been saved successfully"}
          </DialogDescription>
        </DialogHeader>

        {step === "choice" && (
          <div className="space-y-4 py-6">
            <Button
              variant="outline"
              className="w-full h-auto py-6 flex flex-col items-start gap-2 bg-transparent"
              onClick={() => setStep("form")}
            >
              <span className="font-semibold text-base">Generate New KADIRS ID</span>
              <span className="text-sm text-muted-foreground font-normal">
                Create a new KADIRS ID by providing your information
              </span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-6 flex flex-col items-start gap-2 bg-transparent"
              onClick={() => setStep("existing-input")}
            >
              <span className="font-semibold text-base">I Have an Existing KADIRS ID</span>
              <span className="text-sm text-muted-foreground font-normal">
                Link your existing KADIRS ID to your account
              </span>
            </Button>
          </div>
        )}

        {step === "existing-input" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="criteria">
                KADIRS ID or Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="criteria"
                placeholder="Enter your KADIRS ID (e.g., KIR-25T-021207) or email"
                value={existingCriteria}
                onChange={(e) => setExistingCriteria(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter either your KADIRS ID or the email address associated with your KADIRS account
              </p>
            </div>
          </div>
        )}

        {step === "existing-confirm" && existingKadirsData && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold text-sm">Retrieved Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Full Name:</span>
                  <p className="font-medium">{existingKadirsData.fullName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">KADIRS ID:</span>
                  <p className="font-medium">{existingKadirsData.tpui}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{existingKadirsData.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{existingKadirsData.phone}</p>
                </div>
                {existingKadirsData.tin && existingKadirsData.tin !== "-" && (
                  <div>
                    <span className="text-muted-foreground">TIN:</span>
                    <p className="font-medium">{existingKadirsData.tin}</p>
                  </div>
                )}
                {existingKadirsData.nin && existingKadirsData.nin !== "-" && (
                  <div>
                    <span className="text-muted-foreground">NIN:</span>
                    <p className="font-medium">{existingKadirsData.nin}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                Please verify that this information matches your details before proceeding.
              </p>
            </div>
          </div>
        )}

        {/* Existing form step */}
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
                    {lgas.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No LGAs available</div>
                    )}
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
                    {industries.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No industries available</div>
                    )}
                    {industries.map((industry) => (
                      <SelectItem key={industry.id} value={industry.industry_id?.toString() || ""}>
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

        {/* Existing summary step */}
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

        {/* Existing generating step */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating your KADIRS ID...</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">KADIRS ID Saved Successfully!</h3>
              <p className="text-sm text-muted-foreground">Your KADIRS ID has been linked to your account</p>
            </div>

            <div className="w-full max-w-md rounded-lg border-2 border-primary/20 bg-primary/5 p-6 space-y-3">
              <p className="text-sm text-muted-foreground text-center">Your KADIRS ID</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold text-primary">{generatedKadirsId}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyKadirsId} className="h-8 w-8">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "choice" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === "existing-input" && (
            <>
              <Button variant="outline" onClick={() => setStep("choice")}>
                Back
              </Button>
              <Button onClick={handleVerifyExisting} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            </>
          )}

          {step === "existing-confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("existing-input")}>
                Back
              </Button>
              <Button onClick={handleSaveExisting} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Save
              </Button>
            </>
          )}

          {step === "form" && (
            <>
              <Button variant="outline" onClick={() => setStep("choice")}>
                Back
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

          {step === "success" && (
            <Button onClick={handleSuccessClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
