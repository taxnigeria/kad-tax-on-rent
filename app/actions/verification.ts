"use server"

import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function sendPhoneOTP(phoneNumber: string) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get user from database
    const { data: userData } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("firebase_uid", user.id)
      .single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP in verification_tokens table (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { error: tokenError } = await supabase.from("verification_tokens").insert({
      user_id: userData.id,
      token_value: otp,
      token_type: "phone_otp",
      phone_number: phoneNumber,
      expires_at: expiresAt.toISOString(),
      is_used: false,
    })

    if (tokenError) {
      console.error("[v0] Error storing OTP:", tokenError)
      return { success: false, error: "Failed to generate OTP" }
    }

    // Call n8n webhook to send OTP via WhatsApp
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    const authToken = process.env.N8N_WEBHOOK_AUTH_TOKEN

    if (!webhookUrl || !authToken) {
      return { success: false, error: "Webhook configuration missing" }
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "send_otp",
        channel: "whatsapp",
        phone_number: phoneNumber,
        otp_code: otp,
        user_name: `${userData.first_name} ${userData.last_name}`,
        message_template: `Your KADIRS verification code is: ${otp}. Valid for 10 minutes.`,
      }),
    })

    if (!response.ok) {
      console.error("[v0] Webhook error:", await response.text())
      return { success: false, error: "Failed to send OTP" }
    }

    return { success: true, message: "OTP sent successfully" }
  } catch (error: any) {
    console.error("[v0] Send OTP error:", error)
    return { success: false, error: error.message }
  }
}

export async function verifyPhoneOTP(otp: string) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get user from database
    const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", user.id).single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    // Check if OTP exists and hasn't expired
    const { data: token, error: tokenError } = await supabase
      .from("verification_tokens")
      .select("*")
      .eq("user_id", userData.id)
      .eq("token_value", otp)
      .eq("token_type", "phone_otp")
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (tokenError || !token) {
      return { success: false, error: "Invalid or expired OTP" }
    }

    // Mark token as used
    await supabase
      .from("verification_tokens")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", token.id)

    // Mark phone as verified in users table
    await supabase.from("users").update({ phone_verified: true }).eq("id", userData.id)

    // Also update taxpayer_profiles if exists
    await supabase.from("taxpayer_profiles").update({ phone_verified: true }).eq("user_id", userData.id)

    return { success: true, message: "Phone verified successfully" }
  } catch (error: any) {
    console.error("[v0] Verify OTP error:", error)
    return { success: false, error: error.message }
  }
}

export async function sendEmailVerification() {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Use Supabase Auth to send verification email
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
    })

    if (error) {
      console.error("[v0] Email verification error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, message: "Verification email sent" }
  } catch (error: any) {
    console.error("[v0] Send email verification error:", error)
    return { success: false, error: error.message }
  }
}

export async function uploadProfilePhoto(formData: FormData) {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get user from database
    const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", user.id).single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File must be an image" }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File size must be less than 5MB" }
    }

    // Upload to Vercel Blob
    const blob = await put(`profile-photos/${userData.id}-${Date.now()}.${file.name.split(".").pop()}`, file, {
      access: "public",
    })

    // Update taxpayer_profiles with photo URL
    const { error: updateError } = await supabase
      .from("taxpayer_profiles")
      .update({ profile_photo_url: blob.url })
      .eq("user_id", userData.id)

    if (updateError) {
      console.error("[v0] Error updating profile photo:", updateError)
      return { success: false, error: "Failed to update profile" }
    }

    return { success: true, photoUrl: blob.url }
  } catch (error: any) {
    console.error("[v0] Upload photo error:", error)
    return { success: false, error: error.message }
  }
}

export async function generateKadirsID() {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get user from database
    const { data: userData } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone_number")
      .eq("firebase_uid", user.id)
      .single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    // TODO: Call actual KADIRS ID generation API
    // For now, generate a temporary ID
    const kadirsId = `KAD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`

    // Update taxpayer_profiles with KADIRS ID
    const { error: updateError } = await supabase
      .from("taxpayer_profiles")
      .update({ kadirs_id: kadirsId })
      .eq("user_id", userData.id)

    if (updateError) {
      console.error("[v0] Error updating KADIRS ID:", updateError)
      return { success: false, error: "Failed to generate KADIRS ID" }
    }

    return { success: true, kadirsId }
  } catch (error: any) {
    console.error("[v0] Generate KADIRS ID error:", error)
    return { success: false, error: error.message }
  }
}

export async function getProfileCompletionStatus() {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get user data
    const { data: userData } = await supabase
      .from("users")
      .select("id, email_verified, phone_verified, role")
      .eq("firebase_uid", user.id)
      .single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    // Get taxpayer profile data
    const { data: profileData } = await supabase
      .from("taxpayer_profiles")
      .select("kadirs_id, profile_photo_url, phone_verified")
      .eq("user_id", userData.id)
      .single()

    // Calculate completion items
    const items = {
      emailVerified: userData.email_verified || false,
      phoneVerified: userData.phone_verified || profileData?.phone_verified || false,
      kadirsIdGenerated: !!profileData?.kadirs_id,
      profilePhotoUploaded: !!profileData?.profile_photo_url,
    }

    // For tenants, check if they have linked a property
    let hasLinkedProperty = false
    if (userData.role === "tenant") {
      const { data: rentalData } = await supabase
        .from("tenant_rentals")
        .select("id")
        .eq("tenant_id", userData.id)
        .limit(1)
        .single()

      hasLinkedProperty = !!rentalData
    }

    // For taxpayers, check if they have registered a property
    let hasRegisteredProperty = false
    if (userData.role === "taxpayer" || userData.role === "property_manager") {
      const { data: propertyData } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", userData.id)
        .limit(1)
        .single()

      hasRegisteredProperty = !!propertyData
    }

    return {
      success: true,
      items,
      hasLinkedProperty,
      hasRegisteredProperty,
      role: userData.role,
    }
  } catch (error: any) {
    console.error("[v0] Get profile status error:", error)
    return { success: false, error: error.message }
  }
}
