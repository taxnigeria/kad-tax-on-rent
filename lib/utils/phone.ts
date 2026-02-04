import { parsePhoneNumberFromString, PhoneNumber, CountryCode } from "libphonenumber-js"

/**
 * Normalize phone numbers to E.164 format (+234XXXXXXXXXX)
 * Defaults to Nigeria (NG) if no country code is provided.
 */
export function normalizePhone(phone: string, defaultCountry: CountryCode = "NG"): string | null {
  if (!phone) return null

  try {
    const phoneNumber = parsePhoneNumberFromString(phone, defaultCountry)
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format("E.164")
    }
  } catch (error) {
    console.error("[normalizePhone] Error:", error)
  }

  return null
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string, defaultCountry: CountryCode = "NG"): boolean {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone, defaultCountry)
    return phoneNumber ? phoneNumber.isValid() : false
  } catch (error) {
    return false
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneForDisplay(phone: string, defaultCountry: CountryCode = "NG"): string {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone, defaultCountry)
    if (phoneNumber) {
      return phoneNumber.formatInternational()
    }
  } catch (error) {
    // Fallback to original
  }
  return phone
}

/**
 * Get as-you-type formatting (useful for inputs)
 */
import { AsYouType } from "libphonenumber-js"

export function formatAsYouType(text: string, country: CountryCode = "NG"): string {
  return new AsYouType(country).input(text)
}

// Keep the old names for backward compatibility if needed, but pointing to the new logic
export const normalizeNigerianPhone = (phone: string) => normalizePhone(phone, "NG")
export const isValidNigerianPhone = (phone: string) => isValidPhone(phone, "NG")
