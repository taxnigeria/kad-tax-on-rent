"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface EditPropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: any
  onUpdate: (property: any) => void
  areaOffices: any[]
}

export function EditPropertyModal({ open, onOpenChange, property, onUpdate, areaOffices }: EditPropertyModalProps) {
  const [addressForm, setAddressForm] = useState({ area_office_id: property?.area_office_id || "" })

  if (!property) {
    return null
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="area_office_id">Area Office</Label>
      <Select
        value={addressForm.area_office_id}
        onValueChange={(value) => setAddressForm({ ...addressForm, area_office_id: value === "none" ? "" : value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select area office" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {areaOffices.map((ao) => (
            <SelectItem key={ao.id} value={ao.id}>
              {ao.office_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
