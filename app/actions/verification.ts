"use server"

import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import { normalizeNigerianPhone, isValidNigerianPhone } from "@/lib/utils/phone"

export async function sendPhoneOTP(firebaseUid: string, phoneNumber: string) {
  try {
    console.log("[v0] sendPhoneOTP called with:", { firebaseUid, phoneNumber })

    const normalizedPhone = normalizeNigerianPhone(phoneNumber)

    if (!normalizedPhone || !isValidNigerianPhone(phoneNumber)) {
      return {
        success: false,
        error: "Invalid phone number format. Please use Nigerian format (e.g., 08012345678)",
      }
    }

    console.log("[v0] Normalized phone:", normalizedPhone)

    const supabase = await createServerClient()

    // Get user from database using Firebase UID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] User not found:", userError)
      return { success: false, error: "User not found" }
    }

    console.log("[v0] User found:", userData.id)

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("[v0] Generated OTP (will not log in production)")

    // Store OTP in verification_tokens table (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { error: tokenError } = await supabase.from("verification_tokens").insert({
      user_id: userData.id,
      token_value: otp,
      token_type: "phone_otp",
      phone_number: normalizedPhone,
      expires_at: expiresAt.toISOString(),
      is_used: false,
    })

    if (tokenError) {
      console.error("[v0] Error storing OTP:", tokenError)
      return { success: false, error: "Failed to generate OTP" }
    }

    console.log("[v0] OTP stored in database")

    // Call n8n webhook to send OTP via WhatsApp
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    const authToken = process.env.N8N_WEBHOOK_AUTH_TOKEN

    if (!webhookUrl || !authToken) {
      console.error("[v0] Webhook configuration missing")
      return { success: false, error: "Webhook configuration missing" }
    }

    console.log("[v0] Calling n8n webhook...")

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "send_otp",
        channel: "whatsapp",
        phone_number: normalizedPhone,
        otp_code: otp,
        user_name: `${userData.first_name} ${userData.last_name}`,
        message_template: `Your KADIRS verification code is: ${otp}. Valid for 10 minutes.`,
      }),
    })

    console.log("[v0] Webhook response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Webhook error:", errorText)
      return { success: false, error: "Failed to send OTP via WhatsApp" }
    }

    const responseData = await response.json()
    console.log("[v0] Webhook response:", responseData)

    if (phoneNumber !== normalizedPhone) {
      await supabase.from("users").update({ phone_number: normalizedPhone }).eq("id", userData.id)
    }

    return { success: true, message: "OTP sent successfully" }
  } catch (error: any) {
    console.error("[v0] Send OTP error:", error)
    return { success: false, error: error.message }
  }
}

export async function verifyPhoneOTP(firebaseUid: string, otp: string) {
  try {
    const supabase = await createServerClient()

    // Get user from database using Firebase UID
    const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", firebaseUid).single()

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

export async function sendEmailVerification(firebaseUid: string) {
  try {
    // This will be called from the client side where Firebase auth is available
    // The client will handle sending the verification email via Firebase
    // This server action just confirms the action was requested
    return {
      success: true,
      message: "Please check your implementation - email verification should be handled client-side with Firebase",
    }
  } catch (error: any) {
    console.error("[v0] Send email verification error:", error)
    return { success: false, error: error.message }
  }
}

export async function syncEmailVerificationStatus(firebaseUid: string, isVerified: boolean) {
  try {
    const supabase = await createServerClient()

    // Get user from database using Firebase UID
    const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", firebaseUid).single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    // Update email_verified status in users table
    const { error: updateError } = await supabase
      .from("users")
      .update({ email_verified: isVerified })
      .eq("id", userData.id)

    if (updateError) {
      console.error("[v0] Error updating email verification status:", updateError)
      return { success: false, error: "Failed to update verification status" }
    }

    return { success: true, message: "Email verification status synced" }
  } catch (error: any) {
    console.error("[v0] Sync email verification error:", error)
    return { success: false, error: error.message }
  }
}

export async function uploadProfilePhoto(firebaseUid: string, formData: FormData) {
  try {
    const supabase = await createServerClient()

    // Get user from database using Firebase UID
    const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", firebaseUid).single()

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

export async function generateKadirsID(firebaseUid: string) {
  try {
    const supabase = await createServerClient()

    // Get user data using Firebase UID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, first_name, middle_name, last_name, email, phone_number, email_verified, phone_verified")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User not found" }
    }

    if (!userData.email_verified) {
      return { success: false, error: "Please verify your email before generating KADIRS ID" }
    }

    if (!userData.phone_verified) {
      return { success: false, error: "Please verify your phone number before generating KADIRS ID" }
    }

    // Get taxpayer profile data
    const { data: profileData, error: profileError } = await supabase
      .from("taxpayer_profiles")
      .select("*")
      .eq("user_id", userData.id)
      .maybeSingle()

    if (profileError) {
      console.error("[v0] Error fetching profile:", profileError)
      return { success: false, error: "Failed to fetch profile data" }
    }

    if (profileData?.kadirs_id) {
      return { success: false, error: "KADIRS ID already generated", kadirsId: profileData.kadirs_id }
    }

    if (!profileData?.gender) {
      return { success: false, error: "Please update your profile with gender information" }
    }

    if (!profileData?.address_line1) {
      return { success: false, error: "Please update your profile with address information" }
    }

    if (!profileData?.lga_id) {
      return { success: false, error: "Please update your profile with LGA information" }
    }

    if (!profileData?.industry_id) {
      return { success: false, error: "Please update your profile with industry information" }
    }

    // Get LGA details
    const { data: lgaData } = await supabase
      .from("lgas")
      .select("id, area_office_id")
      .eq("id", profileData.lga_id)
      .single()

    if (!lgaData) {
      return { success: false, error: "Invalid LGA selected" }
    }

    // Get system settings for state ID
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("state_id")
      .eq("setting_key", "default_state")
      .maybeSingle()

    const stateId = settingsData?.state_id || 19 // Default to Kaduna (19)

    const kadirsRequestBody = {
      firstName: userData.first_name,
      middleName: userData.middle_name || "",
      lastName: userData.last_name,
      email: userData.email,
      phoneNumber: userData.phone_number || "null",
      password: `Taxpayer${new Date().getFullYear()}#`,
      confirmPassword: `Taxpayer${new Date().getFullYear()}#`,
      addressLine1: profileData.address_line1,
      genderId: profileData.gender === "female" ? 1 : 2,
      lgaId: lgaData.id,
      stateId: stateId,
      taxStation: lgaData.area_office_id || 1,
      industryId: profileData.industry_id,
      userType: profileData.user_type || "Individual",
      tin: profileData.tin || "",
      rcNumber: profileData.rc_number || "",
      identifier: "null",
    }

    console.log("[v0] KADIRS API request body:", kadirsRequestBody)

    const kadirsApiUrl = "https://tax-nigeria-n8n.vwc4mb.easypanel.host/webhook/025e098d-9f68-439d-871f-9bcbb06b1b2b"
    const authToken = process.env.N8N_WEBHOOK_AUTH_TOKEN

    if (!authToken) {
      console.error("[v0] N8N_WEBHOOK_AUTH_TOKEN not configured")
      return { success: false, error: "KADIRS API authentication not configured" }
    }

    const response = await fetch(kadirsApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify(kadirsRequestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] KADIRS API error:", errorText)
      return { success: false, error: "Failed to generate KADIRS ID from API" }
    }

    const responseData = await response.json()
    console.log("[v0] KADIRS API response:", responseData)

    const kadirsId = responseData?.userRegistration?.tpui

    if (!kadirsId) {
      console.error("[v0] KADIRS ID not found in response:", responseData)
      return { success: false, error: "KADIRS ID not found in API response" }
    }

    // Update taxpayer_profiles with KADIRS ID
    const { error: updateError } = await supabase
      .from("taxpayer_profiles")
      .update({ kadirs_id: kadirsId })
      .eq("user_id", userData.id)

    if (updateError) {
      console.error("[v0] Error updating KADIRS ID:", updateError)
      return { success: false, error: "Failed to save KADIRS ID" }
    }

    return { success: true, kadirsId }
  } catch (error: any) {
    console.error("[v0] Generate KADIRS ID error:", error)
    return { success: false, error: error.message }
  }
}

export async function getKadirsIDSummary(firebaseUid: string) {
  try {
    const supabase = await createServerClient()

    const { data: userData } = await supabase
      .from("users")
      .select("id, first_name, middle_name, last_name, email, phone_number, email_verified, phone_verified")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    const { data: profileData } = await supabase
      .from("taxpayer_profiles")
      .select("*, lgas(name), industries(name)")
      .eq("user_id", userData.id)
      .maybeSingle()

    return {
      success: true,
      summary: {
        fullName: `${userData.first_name} ${userData.middle_name || ""} ${userData.last_name}`.trim(),
        email: userData.email,
        phoneNumber: userData.phone_number,
        gender: profileData?.gender,
        address: profileData?.address_line1,
        lga: profileData?.lgas?.name,
        industry: profileData?.industries?.name,
        userType: profileData?.user_type,
        tin: profileData?.tin,
        rcNumber: profileData?.rc_number,
        emailVerified: userData.email_verified,
        phoneVerified: userData.phone_verified,
      },
    }
  } catch (error: any) {
    console.error("[v0] Get KADIRS summary error:", error)
    return { success: false, error: error.message }
  }
}

export async function updateProfileForKadirs(
  firebaseUid: string,
  data: {
    gender: string
    addressLine1: string
    lgaId: string
    industryId: number
    userType: string
    tin?: string
    rcNumber?: string
  },
) {
  try {
    const supabase = await createServerClient()

    const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", firebaseUid).single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("taxpayer_profiles")
      .select("id")
      .eq("user_id", userData.id)
      .maybeSingle()

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from("taxpayer_profiles")
        .update({
          gender: data.gender,
          address_line1: data.addressLine1,
          lga_id: data.lgaId,
          industry_id: data.industryId,
          user_type: data.userType,
          tin: data.tin || null,
          rc_number: data.rcNumber || null,
        })
        .eq("user_id", userData.id)

      if (updateError) {
        console.error("[v0] Error updating profile:", updateError)
        return { success: false, error: "Failed to update profile" }
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase.from("taxpayer_profiles").insert({
        user_id: userData.id,
        gender: data.gender,
        address_line1: data.addressLine1,
        lga_id: data.lgaId,
        industry_id: data.industryId,
        user_type: data.userType,
        tin: data.tin || null,
        rc_number: data.rcNumber || null,
      })

      if (insertError) {
        console.error("[v0] Error creating profile:", insertError)
        return { success: false, error: "Failed to create profile" }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Update profile error:", error)
    return { success: false, error: error.message }
  }
}

export async function getProfileCompletionStatus(firebaseUid: string) {
  try {
    const supabase = await createServerClient()

    // Get user data using Firebase UID
    const { data: userData } = await supabase
      .from("users")
      .select("id, email_verified, phone_verified, role")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (!userData) {
      return { success: false, error: "User not found" }
    }

    const { data: profileData } = await supabase
      .from("taxpayer_profiles")
      .select("kadirs_id, profile_photo_url, phone_verified")
      .eq("user_id", userData.id)
      .maybeSingle()

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
        .maybeSingle()

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
        .maybeSingle()

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
