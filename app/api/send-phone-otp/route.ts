import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"
import { auth } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
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
      .select("id, first_name")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP in database
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10 minutes expiry

    const { error: tokenError } = await supabase.from("verification_tokens").insert({
      user_id: userData.id,
      token_type: "phone_otp",
      token_value: otp,
      delivery_method: "whatsapp",
      sent_to: phoneNumber,
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      throw tokenError
    }

    // Get n8n webhook URL from settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "n8n_whatsapp_webhook_url")
      .single()

    const webhookUrl = settings?.setting_value?.url

    if (!webhookUrl) {
      return NextResponse.json({ error: "WhatsApp webhook not configured" }, { status: 500 })
    }

    // Send OTP via n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        message: `Hello ${userData.first_name}, your KADIRS verification code is: ${otp}. This code expires in 10 minutes.`,
        otp_code: otp,
      }),
    })

    if (!webhookResponse.ok) {
      throw new Error("Failed to send WhatsApp OTP")
    }

    return NextResponse.json({ message: "OTP sent successfully via WhatsApp" })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
