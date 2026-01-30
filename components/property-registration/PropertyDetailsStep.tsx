"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropertyFormData } from "./types"

interface PropertyDetailsStepProps {
    formData: PropertyFormData
    setFormData: (data: PropertyFormData) => void
    handleNumberInput: (field: keyof PropertyFormData, value: string) => void
    formatNumber: (value: string) => string
    geocodeAddress: () => Promise<void>
    geocoding: boolean
    coordinates: { lat: number; lng: number } | null
}

export function PropertyDetailsStep({
    formData,
    setFormData,
    handleNumberInput,
    formatNumber,
    geocodeAddress,
    geocoding,
    coordinates,
}: PropertyDetailsStepProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-emerald-950">Usage & Rental Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="businessType">
                        Usage Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.businessType}
                        onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                        required
                    >
                        <SelectTrigger id="businessType" className="border-emerald-100">
                            <SelectValue placeholder="Select usage" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="individual">Personal/Individual</SelectItem>
                            <SelectItem value="company">Corporate/Company</SelectItem>
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="ngo">NGO/Non-Profit</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="totalUnits">
                        Total Units <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="totalUnits"
                        type="number"
                        min="1"
                        placeholder="e.g., 5"
                        value={formData.totalUnits}
                        onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                        required
                        className="border-emerald-100"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="occupiedUnits">Occupied Units</Label>
                    <Input
                        id="occupiedUnits"
                        type="number"
                        min="0"
                        placeholder="e.g., 3"
                        value={formData.occupiedUnits}
                        onChange={(e) => setFormData({ ...formData, occupiedUnits: e.target.value })}
                        className="border-emerald-100"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="totalAnnualRent">
                        Total Annual Rent (₦) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-emerald-500 font-medium text-sm">₦</span>
                        <Input
                            id="totalAnnualRent"
                            placeholder="e.g., 1,500,000"
                            value={formatNumber(formData.totalAnnualRent)}
                            onChange={(e) => handleNumberInput("totalAnnualRent", e.target.value)}
                            className="pl-7 border-emerald-100 font-medium text-emerald-900"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="floorArea">Floor Area (sqm)</Label>
                    <Input
                        id="floorArea"
                        type="number"
                        placeholder="e.g., 250"
                        value={formData.floorArea}
                        onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                        className="border-emerald-100"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                        id="yearBuilt"
                        type="number"
                        placeholder="e.g., 2015"
                        value={formData.yearBuilt}
                        onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                        className="border-emerald-100"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="numberOfFloors">Number of Floors</Label>
                    <Input
                        id="numberOfFloors"
                        type="number"
                        placeholder="e.g., 2"
                        value={formData.numberOfFloors}
                        onChange={(e) => setFormData({ ...formData, numberOfFloors: e.target.value })}
                        className="border-emerald-100"
                    />
                </div>
            </div>

            <div className="space-y-2 mt-4">
                <Label htmlFor="propertyDescription">Property Description</Label>
                <Textarea
                    id="propertyDescription"
                    placeholder="Provide any additional details about the property..."
                    value={formData.propertyDescription}
                    onChange={(e) => setFormData({ ...formData, propertyDescription: e.target.value })}
                    rows={3}
                    className="border-emerald-100 resize-none focus:ring-emerald-500"
                />
            </div>

            <div className="pt-4 border-t border-emerald-50 mt-4">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-emerald-200 hover:bg-emerald-50 text-emerald-800 flex items-center gap-2 h-12"
                    onClick={geocodeAddress}
                    disabled={geocoding}
                >
                    {geocoding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <MapPin className="w-4 h-4 text-emerald-600" />
                    )}
                    {coordinates ? "Location Verified" : "Verify Geolocation (GPS)"}
                </Button>
                {coordinates && (
                    <p className="text-[10px] text-emerald-600 mt-2 text-center font-mono bg-emerald-50 rounded py-1 border border-emerald-100">
                        Coordinates saved: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </p>
                )}
            </div>
        </div>
    )
}
