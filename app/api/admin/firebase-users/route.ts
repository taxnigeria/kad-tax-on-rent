import { createClient } from "@/lib/supabase/server"
import { listFirebaseUsers } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  try {
    // Get Firebase users
    const { users: firebaseUsers, error: firebaseError } = await listFirebaseUsers()

    if (firebaseError) {
      return NextResponse.json({
        error: firebaseError,
        firebaseConfigured: false,
        users: [],
      })
    }

    // Get all Supabase users with firebase_uid
    const { data: supabaseUsers, error: supabaseError } = await supabase.from("users").select("firebase_uid")

    if (supabaseError) {
      console.error("[API] Error fetching Supabase users:", supabaseError)
      return NextResponse.json({ error: supabaseError.message }, { status: 500 })
    }

    // Get set of firebase_uids that exist in Supabase
    const supabaseFirebaseUids = new Set(supabaseUsers?.map((u) => u.firebase_uid).filter(Boolean))

    // Filter Firebase users that don't exist in Supabase
    const unmigrated = firebaseUsers.filter((user) => !supabaseFirebaseUids.has(user.uid))

    return NextResponse.json({
      firebaseConfigured: true,
      users: unmigrated,
      totalFirebaseUsers: firebaseUsers.length,
      totalMigrated: firebaseUsers.length - unmigrated.length,
    })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Migrate a Firebase user to Supabase
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { firebaseUser, role = "taxpayer" } = await request.json()

    if (!firebaseUser || !firebaseUser.uid) {
      return NextResponse.json({ error: "Missing Firebase user data" }, { status: 400 })
    }

    // Parse display name into first/last name
    const nameParts = (firebaseUser.displayName || "").split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    // Create user in Supabase
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        email_verified: firebaseUser.emailVerified || false,
        phone_number: firebaseUser.phoneNumber,
        first_name: firstName,
        last_name: lastName,
        role: role,
        is_active: !firebaseUser.disabled,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create taxpayer profile if role is taxpayer
    if (role === "taxpayer") {
      await supabase.from("taxpayer_profiles").insert({
        user_id: newUser.id,
      })
    }

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
