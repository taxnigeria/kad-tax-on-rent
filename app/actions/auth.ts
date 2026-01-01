"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { sendPasswordResetEmail } from "@/lib/firebase-admin"

export async function createUserInDatabase(userData: {
  firebaseUid: string
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

export async function checkUserExists(firebaseUid: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", firebaseUid)
      .maybeSingle()

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

export async function resetUserPassword(email: string) {
  try {
    const { success, resetLink, error } = await sendPasswordResetEmail(email)

    if (!success) {
      console.error("[v0] Password reset error:", error)
      return { success: false, error }
    }

    // Trigger n8n webhook to send password reset email
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    const webhookAuth = process.env.N8N_WEBHOOK_AUTH_TOKEN

    if (webhookUrl) {
      try {
        console.log("[v0] Triggering n8n webhook for password reset...")
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(webhookAuth && { Authorization: `Bearer ${webhookAuth}` }),
          },
          body: JSON.stringify({
            action: "send_password_reset_email",
            email,
            resetLink,
          }),
        })
        console.log("[v0] n8n webhook triggered for password reset")
      } catch (webhookError) {
        console.error("[v0] Error triggering n8n webhook:", webhookError)
        // Don't fail the request if webhook fails - the link was still generated
      }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("[v0] Unexpected error in resetUserPassword:", error)
    return { success: false, error: error.message }
  }
}
