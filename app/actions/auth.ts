"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function createUserInDatabase(userData: {
  firebaseUid: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  role?: string
  emailVerified: boolean
}) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("users")
      .insert({
        firebase_uid: userData.firebaseUid,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: userData.phoneNumber,
        role: userData.role || "taxpayer",
        email_verified: userData.emailVerified,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database insert error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] User created in database:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: error.message }
  }
}
