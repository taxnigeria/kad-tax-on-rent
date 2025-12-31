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
    console.log("[v0] Starting user account creation for:", input.email)
    const supabase = createAdminClient()

    // Check for duplicate email
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("email", input.email)
      .maybeSingle()

    if (emailCheckError) {
      console.error("[v0] Error checking email:", emailCheckError)
      return { success: false, error: `Database error while checking email: ${emailCheckError.message}` }
    }

    if (existingEmail) {
      console.log("[v0] Email already exists:", input.email)
      return { success: false, error: "A user with this email already exists" }
    }

    // Normalize and check phone number if provided
    let normalizedPhone: string | null = null
    if (input.phoneNumber) {
      normalizedPhone = normalizePhoneNumber(input.phoneNumber)
      console.log("[v0] Normalized phone:", normalizedPhone)

      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", normalizedPhone)
        .maybeSingle()

      if (phoneCheckError) {
        console.error("[v0] Error checking phone:", phoneCheckError)
        return { success: false, error: `Database error while checking phone: ${phoneCheckError.message}` }
      }

      if (existingPhone) {
        console.log("[v0] Phone already exists:", normalizedPhone)
        return { success: false, error: "A user with this phone number already exists" }
      }
    }

    // Generate password from phone number or random
    const password = generatePassword(input.phoneNumber)
    console.log("[v0] Generated password from phone")

    console.log("[v0] Attempting Firebase user creation...")
    const firebaseResult = await createFirebaseUser({
      email: input.email,
      password,
      displayName: `${input.firstName} ${input.lastName}`,
      phoneNumber: input.phoneNumber,
    })

    if (!firebaseResult.success) {
      console.error("[v0] Firebase user creation failed:", firebaseResult.error)
      // Don't fail completely, continue with Supabase
    } else {
      console.log("[v0] Firebase user created successfully:", firebaseResult.uid)
    }

    // Create base user record in Supabase
    console.log("[v0] Creating Supabase user record...")
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        firebase_uid: firebaseResult.uid || null,
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

    console.log("[v0] User account created successfully:", user.id)
    return {
      success: true,
      data: {
        userId: user.id,
        firebaseUid: firebaseResult.uid || "pending",
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
 * Returns result object with success status, UID, and error
 */
async function createFirebaseUser(data: {
  email: string
  password: string
  displayName: string
  phoneNumber?: string
}): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    console.log("[v0] Calling Firebase creation API for:", data.email)

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

    console.log("[v0] Firebase API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Firebase API error response:", errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      return { success: false, error: errorData.error || `HTTP ${response.status}` }
    }

    const responseData = await response.json()
    console.log("[v0] Firebase creation success response:", responseData)

    if (!responseData.uid) {
      return { success: false, error: "No UID returned from Firebase" }
    }

    return { success: true, uid: responseData.uid }
  } catch (error: any) {
    console.error("[v0] Exception in createFirebaseUser:", error)
    return { success: false, error: error.message || "Network error calling Firebase API" }
  }
}
