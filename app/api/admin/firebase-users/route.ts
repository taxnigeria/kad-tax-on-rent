import { createClient } from "@/lib/supabase/server"
import { listFirebaseUsers } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

const EXCLUDED_ROLES = ["taxpayer", "tenant", "property_manager"]
const STAFF_ROLES = ["super_admin", "admin", "staff", "enumerator", "area_officer", "qa"]

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

    // 1. Not already in Supabase
    // 2. Role (from customClaims) is not taxpayer/tenant/property_manager
    const unmigrated = firebaseUsers.filter((user) => {
      // Skip if already in Supabase
      if (supabaseFirebaseUids.has(user.uid)) return false

      // Get role from custom claims
      const userRole = user.customClaims?.role as string | undefined

      // Include if no role set (needs migration) or if role is a staff role
      if (!userRole) return true
      if (EXCLUDED_ROLES.includes(userRole)) return false

      return true
    })

    return NextResponse.json({
      firebaseConfigured: true,
      users: unmigrated.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        role: user.customClaims?.role || null,
        createdAt: user.metadata?.creationTime,
        lastSignIn: user.metadata?.lastSignInTime,
      })),
      totalFirebaseUsers: firebaseUsers.filter((u) => {
        const role = u.customClaims?.role as string | undefined
        return !role || !EXCLUDED_ROLES.includes(role)
      }).length,
      totalMigrated: firebaseUsers.filter((u) => {
        const role = u.customClaims?.role as string | undefined
        return supabaseFirebaseUids.has(u.uid) && (!role || !EXCLUDED_ROLES.includes(role))
      }).length,
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
    const { firebaseUser, role = "staff" } = await request.json()

    if (!firebaseUser || !firebaseUser.uid) {
      return NextResponse.json({ error: "Missing Firebase user data" }, { status: 400 })
    }

    if (!STAFF_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role for staff migration" }, { status: 400 })
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

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
