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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createTaxpayer } from "@/app/actions/taxpayers"
import { useToast } from "@/hooks/use-toast"

type AddTaxpayerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddTaxpayerModal({ open, onOpenChange, onSuccess }: AddTaxpayerModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "taxpayer",
    taxIdOrNin: "",
    gender: "",
    nationality: "Nigerian",
    dateOfBirth: "",
    residentialAddress: "",
    isBusiness: false,
    businessName: "",
    businessType: "",
    businessAddress: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createTaxpayer({
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        taxIdOrNin: formData.taxIdOrNin,
        gender: formData.gender,
        nationality: formData.nationality,
        dateOfBirth: formData.dateOfBirth,
        residentialAddress: formData.residentialAddress,
        isBusiness: formData.isBusiness,
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Taxpayer created successfully",
        })
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create taxpayer",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating taxpayer:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      role: "taxpayer",
      taxIdOrNin: "",
      gender: "",
      nationality: "Nigerian",
      dateOfBirth: "",
      residentialAddress: "",
      isBusiness: false,
      businessName: "",
      businessType: "",
      businessAddress: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Taxpayer</DialogTitle>
          <DialogDescription>
            Create a new taxpayer account. They will receive an email to set up their password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  disabled={loading}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Tax Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxIdOrNin">TIN / NIN *</Label>
                <Input
                  id="taxIdOrNin"
                  value={formData.taxIdOrNin}
                  onChange={(e) => setFormData({ ...formData, taxIdOrNin: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={loading}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taxpayer">Taxpayer</SelectItem>
                    <SelectItem value="property_manager">Property Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentialAddress">Residential Address</Label>
              <Input
                id="residentialAddress"
                value={formData.residentialAddress}
                onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Business Information (Optional) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Business Information (Optional)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value, isBusiness: !!e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Taxpayer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
