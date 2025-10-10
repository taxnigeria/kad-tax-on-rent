import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"
import { auth } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { otp } = await request.json()

    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 })
    }

    // Get Firebase user from session
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decodedToken = await auth.verifyIdToken(token)
    const firebaseUid = decodedToken.uid

    // Get Supabase user
    const supabase = await createServerClient()
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find valid OTP token
    const { data: tokenData, error: tokenError } = await supabase
      .from("verification_tokens")
      .select("*")
      .eq("user_id", userData.id)
      .eq("token_type", "phone_otp")
      .eq("token_value", otp)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    // Check max attempts
    if (tokenData.verification_attempts >= tokenData.max_attempts) {
      return NextResponse.json({ error: "Maximum verification attempts exceeded" }, { status: 400 })
    }

    // Mark token as used
    await supabase
      .from("verification_tokens")
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", tokenData.id)

    // Update user phone verification status
    await supabase
      .from("users")
      .update({
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", userData.id)

    return NextResponse.json({ message: "Phone number verified successfully" })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
