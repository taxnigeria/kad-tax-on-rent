/**
 * Normalize Nigerian phone numbers to E.164 format (+234XXXXXXXXXX)
 * Handles various input formats:
 * - 08012345678 → +2348012345678
 * - 8012345678 → +2348012345678
 * - +2348012345678 → +2348012345678
 * - 234 801 234 5678 → +2348012345678
 */
export function normalizeNigerianPhone(phone: string): string | null {
  if (!phone) return null

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "")

  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1)
  }

  // Handle different formats
  if (cleaned.startsWith("234")) {
    // Already has country code
    if (cleaned.length === 13) {
      return `+${cleaned}`
    }
  } else if (cleaned.startsWith("0")) {
    // Nigerian format with leading 0
    if (cleaned.length === 11) {
      return `+234${cleaned.substring(1)}`
    }
  } else if (cleaned.length === 10) {
    // Nigerian format without leading 0
    return `+234${cleaned}`
  }

  // Invalid format
  return null
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  const normalized = normalizeNigerianPhone(phone)
  return normalized !== null && normalized.length === 14 // +234 + 10 digits
}

/**
 * Format phone number for display
 * +2348012345678 → +234 801 234 5678
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizeNigerianPhone(phone)
  if (!normalized) return phone

  // +234 801 234 5678
  return `${normalized.substring(0, 4)} ${normalized.substring(4, 7)} ${normalized.substring(7, 10)} ${normalized.substring(10)}`
}
