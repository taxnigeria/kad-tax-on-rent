"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Mail, Phone, ImageIcon, ChevronRight, Upload, Loader2 } from "lucide-react"
import { createBrowserClient } from "@/utils/supabase/client"
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
import { sendEmailVerification } from "firebase/auth"

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
          action: () => setEmailDialogOpen(true),
        },
        {
          id: "phone",
          label: "Verify Phone",
          completed: userData?.phone_verified || false,
          icon: <Phone className="h-5 w-5" />,
          action: () => setPhoneDialogOpen(true),
        },
        {
          id: "profile_photo",
          label: "Upload profile photo",
          completed: !!profileData?.profile_photo_url,
          icon: <ImageIcon className="h-5 w-5" />,
          action: () => setPhotoDialogOpen(true),
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

  const handleVerifyEmail = async () => {
    if (!user) return

    try {
      setVerifying(true)
      await sendEmailVerification(user)
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and click the verification link.",
      })
      setEmailDialogOpen(false)
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
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      })
      return
    }

    try {
      setVerifying(true)
      // TODO: Replace with actual n8n webhook URL
      const response = await fetch("/api/send-whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      })

      if (!response.ok) throw new Error("Failed to send OTP")

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
      // TODO: Replace with actual verification endpoint
      const response = await fetch("/api/verify-whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      })

      if (!response.ok) throw new Error("Invalid OTP")

      // Update database
      const supabase = createBrowserClient()
      const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", user?.uid).single()

      await supabase.from("users").update({ phone_verified: true }).eq("id", userData?.id)

      toast({
        title: "Phone verified",
        description: "Your phone number has been verified successfully",
      })

      setPhoneDialogOpen(false)
      setOtpSent(false)
      setOtp("")
      setPhoneNumber("")
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

      // Upload to Vercel Blob
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/upload-profile-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload photo")

      const { url } = await response.json()

      // Update database
      const supabase = createBrowserClient()
      const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", user?.uid).single()

      await supabase.from("taxpayer_profiles").update({ profile_photo_url: url }).eq("user_id", userData?.id)

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

  if (loading || completionPercentage === 100) {
    return null
  }

  return (
    <>
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
                  placeholder="+234 XXX XXX XXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
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
    </>
  )
}

export default ProfileCompletionSection
