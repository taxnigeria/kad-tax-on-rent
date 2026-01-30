"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight } from "lucide-react"
import { PropertyFormData } from "./types"

interface BasicInfoStepProps {
    formData: PropertyFormData
    setFormData: (data: PropertyFormData) => void
    userRole: string | null
    authorizedOwners: any[]
    setCityDialogOpen: (open: boolean) => void
}

export function BasicInfoStep({
    formData,
    setFormData,
    userRole,
    authorizedOwners,
    setCityDialogOpen,
}: BasicInfoStepProps) {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i).reverse()

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-emerald-950">Basic Property Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
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
                        className="border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="propertyType">
                        Property Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.propertyType}
                        onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                        required
                    >
                        <SelectTrigger id="propertyType" className="border-emerald-100">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="residential">Residential</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="mixed">Mixed Use</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="propertyCategory">
                        Property Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.propertyCategory}
                        onValueChange={(value) => setFormData({ ...formData, propertyCategory: value })}
                        required
                    >
                        <SelectTrigger id="propertyCategory" className="border-emerald-100">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="office">Office</SelectItem>
                            <SelectItem value="shop">Shop</SelectItem>
                            <SelectItem value="warehouse">Warehouse</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="houseNumber">
                        House Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="houseNumber"
                        placeholder="e.g., 123"
                        value={formData.houseNumber}
                        onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                        required
                        className="border-emerald-100"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="streetName">
                        Street Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="streetName"
                        placeholder="e.g., Main Street"
                        value={formData.streetName}
                        onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                        required
                        className="border-emerald-100"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="city">
                        City <span className="text-destructive">*</span>
                    </Label>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between bg-white border-emerald-100 hover:bg-emerald-50"
                        onClick={() => setCityDialogOpen(true)}
                    >
                        {formData.cityName || "Select city..."}
                        <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="lga">
                        LGA <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="lga"
                        value={formData.lgaName}
                        readOnly
                        className="bg-emerald-50/50 border-emerald-50 text-emerald-800"
                        placeholder="Select city first"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="area_office">
                        Area Office <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="area_office"
                        value={formData.areaOfficeName}
                        readOnly
                        className="bg-emerald-50/50 border-emerald-50 text-emerald-800"
                        placeholder="Select city first"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                        id="state"
                        value={formData.state || "Kaduna"}
                        readOnly
                        className="bg-emerald-50/50 border-emerald-50 text-emerald-800"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="commencementYear">
                        Commencement Year <span className="text-destructive">*</span>
                    </Label>
                    <Select
                        value={formData.commencementYear}
                        onValueChange={(value) => setFormData({ ...formData, commencementYear: value })}
                        required
                    >
                        <SelectTrigger id="commencementYear" className="border-emerald-100">
                            <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-3 border-t border-emerald-50 pt-4 mt-6">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="registeringForSomeoneElse"
                        checked={formData.registeringForSomeoneElse}
                        onCheckedChange={(checked) => {
                            setFormData({
                                ...formData,
                                registeringForSomeoneElse: checked as boolean,
                                ownerIdForManager: "",
                            })
                        }}
                        disabled={userRole !== "property_manager" && userRole !== "admin"}
                        className="border-emerald-200 data-[state=checked]:bg-emerald-600"
                    />
                    <Label htmlFor="registeringForSomeoneElse" className="text-sm font-normal cursor-pointer text-emerald-900">
                        I am registering this property on behalf of someone else
                    </Label>
                </div>

                {formData.registeringForSomeoneElse && (userRole === "property_manager" || userRole === "admin") && (
                    <div className="space-y-2 pl-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <Label htmlFor="ownerId">
                            Property Owner <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={formData.ownerIdForManager}
                            onValueChange={(value) => setFormData({ ...formData, ownerIdForManager: value })}
                            required
                        >
                            <SelectTrigger id="ownerId" className="border-emerald-100">
                                <SelectValue placeholder="Select property owner" />
                            </SelectTrigger>
                            <SelectContent>
                                {authorizedOwners.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">No authorized owners found</div>
                                ) : (
                                    authorizedOwners.map((owner) => (
                                        <SelectItem key={owner.owner_id} value={owner.owner_id}>
                                            {owner.users?.first_name} {owner.users?.last_name} ({owner.users?.email})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        </div>
    )
}
