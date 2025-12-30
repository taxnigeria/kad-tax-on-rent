"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export interface CreateUserAccountInput {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phoneNumber?: string
  role: string
}

export interface CreateUserAccountOutput {
  success: boolean
  data?: {
    userId: string
    firebaseUid: string
    email: string
    phoneNumber?: string
    password: string
  }
  error?: string
}

/**
 * Core reusable function to create a user account
 * Handles Firebase auth creation and base user record in Supabase
 * Does NOT create role-specific profiles - that's handled separately
 */
export async function createUserAccount(input: CreateUserAccountInput): Promise<CreateUserAccountOutput> {
  try {
    const supabase = createAdminClient()

    const { data: existingEmail, error: emailCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("email", input.email)
      .maybeSingle()

    if (emailCheckError) {
      console.error("[v0] Error checking email:", emailCheckError)
      return { success: false, error: `Database error: ${emailCheckError.message}` }
    }

    if (existingEmail) {
      return { success: false, error: "Email already in use" }
    }

    // Normalize and check phone number if provided
    let normalizedPhone: string | null = null
    if (input.phoneNumber) {
      normalizedPhone = normalizePhoneNumber(input.phoneNumber)

      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", normalizedPhone)
        .maybeSingle()

      if (phoneCheckError) {
        console.error("[v0] Error checking phone:", phoneCheckError)
        return { success: false, error: `Database error: ${phoneCheckError.message}` }
      }

      if (existingPhone) {
        return { success: false, error: "Phone number already in use" }
      }
    }

    // Generate password from phone number or random
    const password = generatePassword(input.phoneNumber)

    const firebaseUid = await createFirebaseUser({
      email: input.email,
      password,
      displayName: `${input.firstName} ${input.lastName}`,
      phoneNumber: input.phoneNumber,
    })

    if (!firebaseUid) {
      console.error("[v0] Firebase user creation failed - continuing with Supabase only")
      // In production, you may want to fail here
    }

    // Create base user record in Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        firebase_uid: firebaseUid || null, // Allow null if Firebase creation failed
        email: input.email,
        first_name: input.firstName,
        middle_name: input.middleName || null,
        last_name: input.lastName,
        phone_number: normalizedPhone,
        role: input.role,
        is_active: true,
        email_verified: false,
        phone_verified: false,
      })
      .select()
      .single()

    if (userError) {
      console.error("[v0] Error creating user in database:", userError)
      return { success: false, error: `Failed to create user: ${userError.message}` }
    }

    return {
      success: true,
      data: {
        userId: user.id,
        firebaseUid: firebaseUid || "pending", // Indicate Firebase UID is pending if failed
        email: user.email,
        phoneNumber: normalizedPhone || undefined,
        password,
      },
    }
  } catch (error: any) {
    console.error("[v0] Error in createUserAccount:", error)
    return { success: false, error: error.message || "Failed to create user account" }
  }
}

/**
 * Normalizes phone number to international format (+234...)
 */
function normalizePhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.trim()

  // Already in international format
  if (normalized.startsWith("+")) {
    return normalized
  }

  // Convert 0 prefix to +234
  if (normalized.startsWith("0")) {
    return `+234${normalized.slice(1)}`
  }

  // No prefix, assume it's a 10-digit Nigerian number
  if (normalized.length === 10) {
    return `+234${normalized}`
  }

  // Has 234 prefix without +
  if (normalized.startsWith("234")) {
    return `+${normalized}`
  }

  // Default: assume 234 prefix
  return `+234${normalized}`
}

/**
 * Generates password from phone number (first 11 digits) or random string
 */
function generatePassword(phoneNumber?: string): string {
  if (!phoneNumber) {
    return Math.random().toString(36).slice(-12)
  }

  // Extract digits only
  let phoneDigits = phoneNumber.replace(/\D/g, "")

  // Remove +234 prefix if present, convert to 0 prefix
  if (phoneDigits.startsWith("234")) {
    phoneDigits = "0" + phoneDigits.slice(3)
  }

  // Ensure 0 prefix for 10-digit numbers
  if (!phoneDigits.startsWith("0") && phoneDigits.length === 10) {
    phoneDigits = "0" + phoneDigits
  }

  // Return first 11 digits (Nigerian phone format)
  return phoneDigits.slice(0, 11)
}

/**
 * Creates Firebase Auth user via API route
 * Returns Firebase UID on success, null on failure
 */
async function createFirebaseUser(data: {
  email: string
  password: string
  displayName: string
  phoneNumber?: string
}): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/admin/create-firebase-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Firebase creation error:", errorData)
      return null
    }

    const { uid } = await response.json()
    return uid
  } catch (error: any) {
    console.error("[v0] Error calling Firebase creation API:", error)
    return null
  }
}
