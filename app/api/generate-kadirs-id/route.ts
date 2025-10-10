import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"
import { auth } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
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
      .select("id, email, first_name, last_name")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if KADIRS ID already exists
    const { data: profileData } = await supabase
      .from("taxpayer_profiles")
      .select("kadirs_id")
      .eq("user_id", userData.id)
      .single()

    if (profileData?.kadirs_id) {
      return NextResponse.json({ kadirs_id: profileData.kadirs_id, message: "KADIRS ID already exists" })
    }

    // Get KADIRS ID API settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("setting_value")
      .in("setting_key", ["kadirs_id_api_url", "kadirs_id_api_key"])

    const apiUrl = settings?.find((s) => s.setting_key === "kadirs_id_api_url")?.setting_value?.url
    const apiKey = settings?.find((s) => s.setting_key === "kadirs_id_api_key")?.setting_value?.key

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: "KADIRS ID API not configured" }, { status: 500 })
    }

    // Call external API to generate KADIRS ID
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_id: userData.id,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate KADIRS ID from external API")
    }

    const { kadirs_id } = await response.json()

    // Update taxpayer profile with KADIRS ID
    const { error: updateError } = await supabase
      .from("taxpayer_profiles")
      .update({ kadirs_id })
      .eq("user_id", userData.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ kadirs_id, message: "KADIRS ID generated successfully" })
  } catch (error) {
    console.error("Error generating KADIRS ID:", error)
    return NextResponse.json({ error: "Failed to generate KADIRS ID" }, { status: 500 })
  }
}
