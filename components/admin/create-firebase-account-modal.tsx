"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type CreateFirebaseAccountModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxpayer: {
    id: string
    email: string
    first_name: string
    middle_name?: string | null
    last_name: string
    phone_number?: string | null
  }
  onSuccess: () => void
}

export function CreateFirebaseAccountModal({
  open,
  onOpenChange,
  taxpayer,
  onSuccess,
}: CreateFirebaseAccountModalProps) {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const displayName = [taxpayer.first_name, taxpayer.middle_name, taxpayer.last_name].filter(Boolean).join(" ")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/create-firebase-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: taxpayer.email,
          password,
          displayName,
          phoneNumber: taxpayer.phone_number,
          taxpayerId: taxpayer.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create Firebase account")
      }

      toast.success("Firebase account created successfully")
      onSuccess()
      onOpenChange(false)
      setPassword("")
    } catch (error: any) {
      console.error("Error creating Firebase account:", error)
      toast.error(error.message || "Failed to create Firebase account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Firebase Account</DialogTitle>
            <DialogDescription>Create a Firebase authentication account for this taxpayer</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={taxpayer.email} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={displayName} disabled className="bg-muted" />
            </div>

            {taxpayer.phone_number && (
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={taxpayer.phone_number} disabled className="bg-muted" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Suggested: Use phone number ({taxpayer.phone_number || "N/A"})
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
