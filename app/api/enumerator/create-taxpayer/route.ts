import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is enumerator
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "enumerator") {
      return NextResponse.json({ error: "Forbidden - Enumerator access only" }, { status: 403 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      isBusiness,
      businessName,
      businessType,
      taxIdOrNin,
      residentialAddress,
      areaOfficeId,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber) {
      return NextResponse.json(
        {
          error: "First name, last name, and phone number are required",
        },
        { status: 400 },
      )
    }

    // Check if phone already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("phone_number", phoneNumber).single()

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Phone number already registered",
          existingUserId: existingUser.id,
        },
        { status: 409 },
      )
    }

    // Create user account (role: taxpayer)
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone_number: phoneNumber,
        role: "taxpayer",
        is_active: true,
        phone_verified: false, // Will be verified later
      })
      .select()
      .single()

    if (userError) {
      console.error("[v0] Create user error:", userError)
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 })
    }

    // Create taxpayer profile
    const { data: profile, error: profileError } = await supabase
      .from("taxpayer_profiles")
      .insert({
        user_id: newUser.id,
        is_business: isBusiness || false,
        business_name: businessName || null,
        business_type: businessType || null,
        tax_id_or_nin: taxIdOrNin || null,
        residential_address: residentialAddress || null,
        area_office_id: areaOfficeId || null,
      })
      .select()
      .single()

    if (profileError) {
      console.error("[v0] Create profile error:", profileError)
      // Rollback user creation
      await supabase.from("users").delete().eq("id", newUser.id)
      return NextResponse.json({ error: "Failed to create taxpayer profile" }, { status: 500 })
    }

    // Log activity for gamification
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      entity_type: "taxpayer",
      entity_id: profile.id,
      action: "create",
      change_summary: `Enumerator created new taxpayer: ${firstName} ${lastName}`,
    })

    return NextResponse.json({
      success: true,
      taxpayer: {
        id: profile.id,
        userId: newUser.id,
        firstName,
        lastName,
        phoneNumber,
        email,
      },
    })
  } catch (error) {
    console.error("[v0] Create taxpayer API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
