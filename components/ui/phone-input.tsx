"use client"

import * as React from "react"
import { Check, Loader2, MessageCircle, X } from "lucide-react"
import { CountryCode } from "libphonenumber-js"
import { formatAsYouType, isValidPhone, normalizePhone } from "@/lib/utils/phone"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { checkWhatsAppPresence } from "@/app/actions/validation"
import { toast } from "sonner"

interface PhoneInputProps {
    value: string
    onChange: (value: string) => void
    onNormalizedChange?: (normalized: string | null) => void
    disabled?: boolean
    className?: string
    userId?: string // Required for WhatsApp check
    showWhatsAppBotton?: boolean
}

const COUNTRIES: { code: CountryCode; label: string; flag: string; prefix: string }[] = [
    { code: "NG", label: "Nigeria", flag: "🇳🇬", prefix: "+234" },
    { code: "GH", label: "Ghana", flag: "🇬🇭", prefix: "+233" },
    { code: "KE", label: "Kenya", flag: "🇰🇪", prefix: "+254" },
    { code: "GB", label: "UK", flag: "🇬🇧", prefix: "+44" },
    { code: "US", label: "USA", flag: "🇺🇸", prefix: "+1" },
]

export function PhoneInput({
    value,
    onChange,
    onNormalizedChange,
    disabled,
    className,
    userId,
    showWhatsAppBotton = false, // Changed default since it's now automated
}: PhoneInputProps) {
    const [country, setCountry] = React.useState<CountryCode>("NG")
    const [isCheckingWhatsApp, setIsCheckingWhatsApp] = React.useState(false)
    const [whatsAppStatus, setWhatsAppStatus] = React.useState<"idle" | "exists" | "not_exists" | "error">("idle")
    const prevValidPhoneRef = React.useRef<string | null>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value
        const formatted = formatAsYouType(input, country)
        onChange(formatted)

        if (onNormalizedChange) {
            const normalized = normalizePhone(input, country)
            onNormalizedChange(normalized)
        }

        // Reset status if user changes number significantly
        if (whatsAppStatus !== "idle") {
            setWhatsAppStatus("idle")
        }
    }

    // Auto-fire WhatsApp check when phone is valid
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            const normalized = normalizePhone(value, country)

            // Only fire if valid, different from last checked, and not currently checking
            if (normalized && isValidPhone(normalized, country) && normalized !== prevValidPhoneRef.current) {
                prevValidPhoneRef.current = normalized
                setIsCheckingWhatsApp(true)
                try {
                    const result = await checkWhatsAppPresence(normalized, userId || "system")
                    if (result.success) {
                        setWhatsAppStatus(result.exists ? "exists" : "not_exists")
                    } else {
                        setWhatsAppStatus("error")
                    }
                } catch (err) {
                    setWhatsAppStatus("error")
                } finally {
                    setIsCheckingWhatsApp(false)
                }
            }
        }, 800) // 800ms debounce

        return () => clearTimeout(timer)
    }, [value, country, userId])

    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <div className="flex gap-1">
                <Select
                    value={country}
                    onValueChange={(val: CountryCode) => setCountry(val)}
                    disabled={disabled}
                >
                    <SelectTrigger className="w-[80px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                                {c.flag} {c.code}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="relative flex-1">
                    <Input
                        type="tel"
                        value={value}
                        onChange={handleInputChange}
                        disabled={disabled}
                        placeholder="Phone number"
                        className={cn(
                            whatsAppStatus === "exists" && "border-green-500 pr-10",
                            whatsAppStatus === "not_exists" && "border-red-500 pr-10",
                            isCheckingWhatsApp && "pr-10"
                        )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {isCheckingWhatsApp ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : whatsAppStatus === "exists" ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : whatsAppStatus === "not_exists" ? (
                            <X className="h-4 w-4 text-red-500" />
                        ) : null}
                    </div>
                </div>
            </div>

            {whatsAppStatus === "exists" && (
                <p className="text-[9px] text-green-600 font-medium ml-1">
                    Phone number is on WhatsApp
                </p>
            )}
            {whatsAppStatus === "not_exists" && (
                <p className="text-[9px] text-red-600 font-medium ml-1">
                    Phone number not found on WhatsApp
                </p>
            )}

            {showWhatsAppBotton && ( // Kept for edge cases but hidden by default now
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-1 flex items-center justify-center gap-2 h-9 text-xs"
                    onClick={async () => {
                        const normalized = normalizePhone(value, country)
                        if (normalized) {
                            setIsCheckingWhatsApp(true)
                            const result = await checkWhatsAppPresence(normalized, userId || "system")
                            setWhatsAppStatus(result.success && result.exists ? "exists" : "not_exists")
                            setIsCheckingWhatsApp(false)
                        }
                    }}
                    disabled={disabled || isCheckingWhatsApp || !value}
                >
                    <MessageCircle className="h-3 w-3" />
                    Check WhatsApp Status
                </Button>
            )}
        </div>
    )
}
