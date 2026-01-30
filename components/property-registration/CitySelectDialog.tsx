"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"

interface CitySelectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    citySearchQuery: string
    setCitySearchQuery: (query: string) => void
    filteredCities: any[]
    handleCitySelect: (cityId: string) => void
}

export function CitySelectDialog({
    open,
    onOpenChange,
    citySearchQuery,
    setCitySearchQuery,
    filteredCities,
    handleCitySelect,
}: CitySelectDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-emerald-100">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-emerald-950">Select City in Kaduna</DialogTitle>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                        <Input
                            placeholder="Search for city or town..."
                            className="pl-9 border-emerald-100 focus:ring-emerald-500"
                            value={citySearchQuery}
                            onChange={(e) => setCitySearchQuery(e.target.value)}
                        />
                    </div>
                </DialogHeader>
                <div className="max-h-[300px] overflow-y-auto px-2 pb-4">
                    {filteredCities.length === 0 ? (
                        <div className="p-8 text-center text-emerald-600/50">
                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No cities found matching "{citySearchQuery}"</p>
                        </div>
                    ) : (
                        <div className="grid gap-1">
                            {filteredCities.map((city) => (
                                <Button
                                    key={city.id}
                                    variant="ghost"
                                    className="w-full justify-start text-left font-normal h-auto py-3 px-4 hover:bg-emerald-50 hover:text-emerald-900 group"
                                    onClick={() => handleCitySelect(city.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <MapPin className="w-4 h-4" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-emerald-950">{city.name}</p>
                                            <p className="text-xs text-emerald-600/70">Kaduna State</p>
                                        </div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
