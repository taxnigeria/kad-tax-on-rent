"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Mail, Phone, ImageIcon, ChevronRight, Upload, Loader2, Award as IdCard } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  uploadProfilePhoto,
  getProfileCompletionStatus,
  syncEmailVerificationStatus,
} from "@/app/actions/verification"
import { KadirsIDDialog } from "@/components/kadirs-id-dialog"
import { SuccessModal } from "@/components/success-modal"
import { createClient } from "@/lib/supabase/client"

interface CompletionItem {
  id: string
  label: string
  completed: boolean
  icon: React.ReactNode
  action: () => void
}

export function ProfileCompletionSection() {
  const { user, userRole } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<CompletionItem[]>([])
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [loading, setLoading] = useState(true)

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [kadrisDialogOpen, setKadrisDialogOpen] = useState(false)

  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [successModalData, setSuccessModalData] = useState({
    title: "",
    description: "",
    kadirsId: undefined as string | undefined,
  })

  const [previousEmailVerified, setPreviousEmailVerified] = useState(false)

  useEffect(() => {
    if (user && userRole) {
      loadProfileCompletion()
    }
  }, [user, userRole])

  useEffect(() => {
    if (!user) return

    const checkEmailVerification = async () => {
      if (user.email_confirmed_at && !previousEmailVerified) {
        await syncEmailVerificationStatus(user.id, true)
        setPreviousEmailVerified(true)
        loadProfileCompletion()
      } else if (user.email_confirmed_at) {
        setPreviousEmailVerified(true)
      }
    }

    checkEmailVerification()

    const interval = setInterval(checkEmailVerification, 30000)

    return () => clearInterval(interval)
  }, [user, previousEmailVerified])

  const loadProfileCompletion = async () => {
    if (!user) return

    setLoading(true)

    try {
      const result = await getProfileCompletionStatus(user.id)

      if (!result.success) {
        throw new Error(result.error)
      }

      const completionItems: CompletionItem[] = [
        {
          id: "email",
          label: "Verify Email",
          completed: result.items.emailVerified,
          icon: <Mail className="h-5 w-5" />,
          action: () => setEmailDialogOpen(true),
        },
        {
          id: "phone",
          label: "Verify Phone",
          completed: result.items.phoneVerified,
          icon: <Phone className="h-5 w-5" />,
          action: () => setPhoneDialogOpen(true),
        },
        {
          id: "kadirs",
          label: "Generate KADIRS ID",
          completed: result.items.kadirsIdGenerated,
          icon: <IdCard className="h-5 w-5" />,
          action: () => setKadrisDialogOpen(true),
        },
        {
          id: "profile_photo",
          label: "Upload profile photo",
          completed: result.items.profilePhotoUploaded,
          icon: <ImageIcon className="h-5 w-5" />,
          action: () => setPhotoDialogOpen(true),
        },
      ]

      setItems(completionItems)

      const completedCount = completionItems.filter((item) => item.completed).length
      const percentage = Math.round((completedCount / completionItems.length) * 100)
      setCompletionPercentage(percentage)
    } catch (error) {
      console.error("[v0] Error loading profile completion:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!user) return

    try {
      setVerifying(true)

      const supabase = createClient()
      const { error } = await supabase.auth.resendEmail({
        type: "signup",
        email: user.email!,
      })

      if (error) {
        throw new Error(error.message)
      }

      setEmailDialogOpen(false)
      setSuccessModalData({
        title: "Verification Email Sent!",
        description:
          "We've sent a verification link to your email. Please check your inbox and click the link to verify your account. This page will update automatically once verified.",
        kadirsId: undefined,
      })
      setSuccessModalOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleSendOTP = async () => {
    if (!user) return

    const trimmedPhone = phoneNumber.trim()

    if (!trimmedPhone) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      })
      return
    }

    const phoneRegex = /^(\+?234|0)?[789]\d{9}$/
    if (!phoneRegex.test(trimmedPhone.replace(/\s/g, ""))) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid Nigerian phone number (e.g., 08012345678)",
        variant: "destructive",
      })
      return
    }

    try {
      setVerifying(true)
      const result = await sendPhoneOTP(user.id, trimmedPhone)

      if (!result.success) {
        throw new Error(result.error)
      }

      setOtpSent(true)
      toast({
        title: "OTP sent",
        description: "Check your WhatsApp for the verification code",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!user) return

    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      })
      return
    }

    try {
      setVerifying(true)
      const result = await verifyPhoneOTP(user.id, otp)

      if (!result.success) {
        throw new Error(result.error)
      }

      setPhoneDialogOpen(false)
      setOtpSent(false)
      setOtp("")
      setPhoneNumber("")
      setSuccessModalData({
        title: "Phone Number Verified!",
        description:
          "Your phone number has been verified successfully. You can now proceed with generating your KADIRS ID.",
        kadirsId: undefined,
      })
      setSuccessModalOpen(true)
      loadProfileCompletion()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleVerifyPhone = () => {
    setPhoneDialogOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadPhoto = async () => {
    if (!user) return

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a photo to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("file", selectedFile)

      const result = await uploadProfilePhoto(user.id, formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated successfully",
      })

      setPhotoDialogOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      loadProfileCompletion()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleKadirsSuccess = (kadirsId: string) => {
    setSuccessModalData({
      title: "KADIRS ID Generated!",
      description:
        "Your KADIRS ID has been successfully generated. Keep this ID safe as you'll need it for all tax-related transactions.",
      kadirsId: kadirsId,
    })
    setSuccessModalOpen(true)
    loadProfileCompletion()
  }

  if (loading || completionPercentage === 100) {
    return null
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Complete profile</h3>
            <p className="text-sm text-muted-foreground">{completionPercentage}% complete</p>
          </div>

          <Progress value={completionPercentage} className="h-2" />

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

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Email Address</DialogTitle>
            <DialogDescription>
              We'll send a verification link to {user?.email}. Click the link in the email to verify your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyEmail} disabled={verifying}>
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Phone Number</DialogTitle>
            <DialogDescription>
              We'll send a verification code to your WhatsApp. Enter the code to verify your phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!otpSent ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="08012345678 or +2348012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Nigerian phone number. We'll send a verification code via WhatsApp.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your WhatsApp</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPhoneDialogOpen(false)
                setOtpSent(false)
                setOtp("")
                setPhoneNumber("")
              }}
            >
              Cancel
            </Button>
            {!otpSent ? (
              <Button onClick={handleSendOTP} disabled={verifying}>
                {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Code
              </Button>
            ) : (
              <Button onClick={handleVerifyOTP} disabled={verifying}>
                {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Profile Photo</DialogTitle>
            <DialogDescription>
              Choose a photo to use as your profile picture. Recommended size: 400x400px.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {previewUrl && (
              <div className="flex justify-center">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="h-32 w-32 rounded-full object-cover border-2"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="photo">Select Photo</Label>
              <Input id="photo" type="file" accept="image/*" onChange={handleFileSelect} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPhotoDialogOpen(false)
                setSelectedFile(null)
                setPreviewUrl(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadPhoto} disabled={uploading || !selectedFile}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KadirsIDDialog open={kadrisDialogOpen} onOpenChange={setKadrisDialogOpen} onSuccess={handleKadirsSuccess} />

      <SuccessModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        title={successModalData.title}
        description={successModalData.description}
        kadirsId={successModalData.kadirsId}
      />
    </>
  )
}

export default ProfileCompletionSection
