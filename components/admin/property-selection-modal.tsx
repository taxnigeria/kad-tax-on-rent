"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState } from "react"

type Property = {
  id: string
  registered_property_name: string
  property_reference: string
  property_type: string
  verification_status: string
}

type PropertySelectionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: Property[]
  onSelect: (propertyId: string) => void
}

export function PropertySelectionModal({ open, onOpenChange, properties, onSelect }: PropertySelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string>("")

  function handleConfirm() {
    if (selectedId) {
      onSelect(selectedId)
      onOpenChange(false)
      setSelectedId("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Property</DialogTitle>
          <DialogDescription>Choose a property to create an invoice for</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={selectedId} onValueChange={setSelectedId}>
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
              >
                <RadioGroupItem value={property.id} id={property.id} />
                <Label htmlFor={property.id} className="flex-1 cursor-pointer space-y-1">
                  <div className="font-medium">{property.registered_property_name}</div>
                  <div className="text-xs text-muted-foreground space-x-2">
                    <span>{property.property_reference}</span>
                    <span>•</span>
                    <span className="capitalize">{property.property_type}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedId}>
              Create Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
