"use client"

import { Building2, MapPin, Calculator, FileText, User } from "lucide-react"
import { PropertyFormData } from "./types"

interface ReviewStepProps {
    formData: PropertyFormData
}

export function ReviewStep({ formData }: ReviewStepProps) {
    const formatCurrency = (value: string) => {
        const num = Number.parseFloat(value) || 0
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
        }).format(num)
    }

    const sections = [
        {
            title: "Core Information",
            icon: Building2,
            items: [
                { label: "Property Name", value: formData.propertyName },
                { label: "Type", value: formData.propertyType },
                { label: "Category", value: formData.propertyCategory },
                { label: "Commencement", value: formData.commencementYear },
            ],
        },
        {
            title: "Location",
            icon: MapPin,
            items: [
                { label: "Address", value: `${formData.houseNumber} ${formData.streetName}` },
                { label: "City", value: formData.cityName },
                { label: "LGA", value: formData.lgaName },
                { label: "Area Office", value: formData.areaOfficeName },
            ],
        },
        {
            title: "Financials & Units",
            icon: Calculator,
            items: [
                { label: "Annual Rent", value: formatCurrency(formData.totalAnnualRent) },
                { label: "Total Units", value: formData.totalUnits },
                { label: "Occupied", value: formData.occupiedUnits || "0" },
                { label: "Usage", value: formData.businessType },
            ],
        },
    ]

    return (
        <div className="space-y-6">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 mb-6">
                <p className="text-sm text-emerald-800 leading-relaxed font-light">
                    Please review the information below carefully. Once submitted, your property will be queued for verification by kADIRS auditors.
                </p>
            </div>

            <div className="grid gap-6">
                {sections.map((section, i) => (
                    <div key={i} className="border border-emerald-50 rounded-lg overflow-hidden">
                        <div className="bg-emerald-50/30 px-4 py-2 flex items-center gap-2 border-b border-emerald-50">
                            <section.icon className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-900">{section.title}</h4>
                        </div>
                        <div className="p-4 grid md:grid-cols-2 gap-y-3 gap-x-8">
                            {section.items.map((item, j) => (
                                <div key={j} className="flex flex-col">
                                    <span className="text-[10px] text-emerald-600 uppercase font-medium">{item.label}</span>
                                    <span className="text-sm text-emerald-950 font-medium truncate">{item.value || "N/A"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {formData.propertyDescription && (
                    <div className="border border-emerald-50 rounded-lg overflow-hidden">
                        <div className="bg-emerald-50/30 px-4 py-2 flex items-center gap-2 border-b border-emerald-50">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-900">Notes</h4>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-emerald-800 font-light leading-relaxed">{formData.propertyDescription}</p>
                        </div>
                    </div>
                )}

                {formData.registeringForSomeoneElse && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-center gap-3">
                        <User className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="text-xs font-semibold text-amber-900 uppercase">Representational Filing</p>
                            <p className="text-sm text-amber-800 font-light">
                                This property is being registered on behalf of an authorized property owner.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
