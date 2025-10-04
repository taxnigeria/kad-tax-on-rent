"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Loader2, ChevronLeft, ChevronRight, Search, User, Mail, Phone, Award as IdCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type AddPropertyModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type Taxpayer = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  taxpayer_profiles: Array<{
    kadirs_id: string
  }>
}

export function AddPropertyModal({ open, onOpenChange, onSuccess }: AddPropertyModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searchingTaxpayers, setSearchingTaxpayers] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    propertyName: "",
    propertyType: "",
    streetAddress: "",
    city: "",
    state: "",
    lga: "",
    annualRent: "",
    propertyStatus: "active",
    propertyDescription: "",
  })

  const [taxpayerSearch, setTaxpayerSearch] = useState("")
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([])
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<Taxpayer | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  useEffect(() => {
    if (currentStep === 2 && taxpayerSearch.length >= 2) {
      searchTaxpayers()
    } else {
      setTaxpayers([])
    }
  }, [taxpayerSearch, currentStep])

  async function searchTaxpayers() {
    setSearchingTaxpayers(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          phone_number,
          taxpayer_profiles (
            kadirs_id
          )
        `,
        )
        .or(`first_name.ilike.%${taxpayerSearch}%,last_name.ilike.%${taxpayerSearch}%,email.ilike.%${taxpayerSearch}%`)
        .eq("role", "taxpayer")
        .limit(10)

      if (error) {
        console.error("Error searching taxpayers:", error)
        setTaxpayers([])
      } else {
        setTaxpayers((data as any) || [])
      }
    } catch (error) {
      console.error("Error in searchTaxpayers:", error)
      setTaxpayers([])
    } finally {
      setSearchingTaxpayers(false)
    }
  }

  function resetForm() {
    setCurrentStep(1)
    setFormData({
      propertyName: "",
      propertyType: "",
      streetAddress: "",
      city: "",
      state: "",
      lga: "",
      annualRent: "",
      propertyStatus: "active",
      propertyDescription: "",
    })
    setTaxpayerSearch("")
    setTaxpayers([])
    setSelectedTaxpayer(null)
  }

  function handleNext() {
    // Validate Step 1
    if (!formData.propertyName || !formData.propertyType || !formData.streetAddress || !formData.annualRent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setCurrentStep(2)
  }

  function handleBack() {
    setCurrentStep(1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedTaxpayer) {
      toast({
        title: "No Taxpayer Selected",
        description: "Please select a taxpayer to assign this property to",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // First, create the address
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({
          street_address: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          lga: formData.lga,
          country: "Nigeria",
        })
        .select()
        .single()

      if (addressError) {
        throw new Error("Failed to create address")
      }

      // Then create the property
      const { error: propertyError } = await supabase.from("properties").insert({
        owner_id: selectedTaxpayer.id,
        registered_property_name: formData.propertyName,
        property_type: formData.propertyType,
        street_name: formData.streetAddress,
        address_id: addressData.id,
        total_annual_rent: Number.parseFloat(formData.annualRent.replace(/,/g, "")),
        status: formData.propertyStatus,
        property_description: formData.propertyDescription || null,
        verification_status: "pending",
        total_units: 1,
        occupied_units: 0,
      })

      if (propertyError) {
        console.error("Property creation error:", propertyError)
        throw new Error("Failed to create property")
      }

      toast({
        title: "Success",
        description: "Property created successfully",
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating property:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create property",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const handleNumberInput = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    setFormData({ ...formData, annualRent: numbers })
  }

  const progress = (currentStep / 2) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 2: {currentStep === 1 ? "Property Details" : "Owner Assignment"}
          </DialogDescription>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Property Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="propertyName">
                  Property Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="propertyName"
                  placeholder="e.g., Sunset Apartments"
                  value={formData.propertyName}
                  onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyType">
                  Property Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  disabled={loading}
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="mixed">Mixed-Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">
                  Street Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="streetAddress"
                  placeholder="e.g., 123 Main Street"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Lagos"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="e.g., Lagos State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lga">LGA</Label>
                  <Input
                    id="lga"
                    placeholder="e.g., Ikeja"
                    value={formData.lga}
                    onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualRent">
                  Annual Rent (₦) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="annualRent"
                  type="text"
                  placeholder="e.g., 6,000,000"
                  value={formatNumber(formData.annualRent)}
                  onChange={(e) => handleNumberInput(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyStatus">Property Status</Label>
                <Select
                  value={formData.propertyStatus}
                  onValueChange={(value) => setFormData({ ...formData, propertyStatus: value })}
                  disabled={loading}
                >
                  <SelectTrigger id="propertyStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="under_construction">Under Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyDescription">Property Description (Optional)</Label>
                <Textarea
                  id="propertyDescription"
                  placeholder="Add any additional details about the property..."
                  value={formData.propertyDescription}
                  onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Owner Assignment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxpayerSearch">
                  Search Taxpayer <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="taxpayerSearch"
                    placeholder="Search by name, email, or KADIRS ID..."
                    value={taxpayerSearch}
                    onChange={(e) => setTaxpayerSearch(e.target.value)}
                    disabled={loading}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchingTaxpayers && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!searchingTaxpayers && taxpayers.length > 0 && !selectedTaxpayer && (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                  {taxpayers.map((taxpayer) => (
                    <Card
                      key={taxpayer.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => setSelectedTaxpayer(taxpayer)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {taxpayer.first_name} {taxpayer.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{taxpayer.email}</div>
                            {taxpayer.taxpayer_profiles?.[0]?.kadirs_id && (
                              <div className="text-xs font-mono text-muted-foreground mt-1">
                                KADIRS: {taxpayer.taxpayer_profiles[0].kadirs_id}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline">Select</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!searchingTaxpayers && taxpayerSearch.length >= 2 && taxpayers.length === 0 && !selectedTaxpayer && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No taxpayers found matching your search.</p>
                  <p className="text-sm mt-2">Try searching with a different name or email.</p>
                </div>
              )}

              {/* Selected Taxpayer Info */}
              {selectedTaxpayer && (
                <Card className="border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold">Selected Taxpayer</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTaxpayer(null)}
                        disabled={loading}
                      >
                        Change
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {selectedTaxpayer.first_name} {selectedTaxpayer.last_name}
                        </span>
                      </div>
                      {selectedTaxpayer.taxpayer_profiles?.[0]?.kadirs_id && (
                        <div className="flex items-center gap-2 text-sm">
                          <IdCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono">{selectedTaxpayer.taxpayer_profiles[0].kadirs_id}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedTaxpayer.email}</span>
                      </div>
                      {selectedTaxpayer.phone_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedTaxpayer.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {taxpayerSearch.length < 2 && !selectedTaxpayer && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Start typing to search for taxpayers</p>
                  <p className="text-sm mt-2">Enter at least 2 characters to begin searching</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {currentStep === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleNext} disabled={loading}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={loading || !selectedTaxpayer}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Property
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
