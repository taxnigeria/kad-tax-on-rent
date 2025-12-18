"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function createUserInDatabase(userData: {
  authId: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  role?: string
  emailVerified: boolean
  profilePhotoUrl?: string
}) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("users")
      .insert({
        auth_id: userData.authId,
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

    if (userData.profilePhotoUrl) {
      await supabase.from("taxpayer_profiles").insert({
        user_id: data.id,
        profile_photo_url: userData.profilePhotoUrl,
      })
    }

    console.log("[v0] User created in database:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: error.message }
  }
}

export async function checkUserExists(authId: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.from("users").select("id, role").eq("auth_id", authId).maybeSingle()

    if (error) {
      console.error("[v0] Error checking user:", error)
      return { exists: false, role: null }
    }

    return { exists: !!data, role: data?.role || null }
  } catch (error: any) {
    console.error("[v0] Unexpected error:", error)
    return { exists: false, role: null }
  }
}
