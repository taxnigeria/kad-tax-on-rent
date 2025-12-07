import { createClient } from "@/lib/supabase/server"
import { listFirebaseUsers, getFirestoreUserRoles } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

const EXCLUDED_ROLES = ["taxpayer", "tenant", "property_manager"]
const STAFF_ROLES = ["super_admin", "admin", "staff", "enumerator", "area_officer", "qa"]

export async function GET() {
  const supabase = await createClient()

  try {
    // Get Firebase Auth users
    const { users: firebaseUsers, error: firebaseError } = await listFirebaseUsers()

    if (firebaseError) {
      return NextResponse.json({
        error: firebaseError,
        firebaseConfigured: false,
        users: [],
      })
    }

    const firestoreRoles = await getFirestoreUserRoles()

    // Get all Supabase users with firebase_uid
    const { data: supabaseUsers, error: supabaseError } = await supabase.from("users").select("firebase_uid")

    if (supabaseError) {
      console.error("[API] Error fetching Supabase users:", supabaseError)
      return NextResponse.json({ error: supabaseError.message }, { status: 500 })
    }

    // Get set of firebase_uids that exist in Supabase
    const supabaseFirebaseUids = new Set(supabaseUsers?.map((u) => u.firebase_uid).filter(Boolean))

    // Filter to unmigrated staff users
    const unmigrated = firebaseUsers.filter((user) => {
      // Skip if already in Supabase
      if (supabaseFirebaseUids.has(user.uid)) return false

      const firestoreRole = firestoreRoles.get(user.uid)
      const customClaimsRole = user.customClaims?.role as string | undefined
      const userRole = firestoreRole || customClaimsRole

      // If role is explicitly an excluded role, skip
      if (userRole && EXCLUDED_ROLES.includes(userRole.toLowerCase())) return false

      // Include if no role set or role is a staff role
      return true
    })

    const staffFirebaseUsers = firebaseUsers.filter((u) => {
      const firestoreRole = firestoreRoles.get(u.uid)
      const customClaimsRole = u.customClaims?.role as string | undefined
      const role = firestoreRole || customClaimsRole
      return !role || !EXCLUDED_ROLES.includes(role.toLowerCase())
    })

    return NextResponse.json({
      firebaseConfigured: true,
      users: unmigrated.map((user) => {
        const firestoreRole = firestoreRoles.get(user.uid)
        const customClaimsRole = user.customClaims?.role as string | undefined
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          phoneNumber: user.phoneNumber,
          emailVerified: user.emailVerified,
          disabled: user.disabled,
          role: firestoreRole || customClaimsRole || null,
          createdAt: user.creationTime,
          lastSignIn: user.lastSignInTime,
        }
      }),
      totalFirebaseUsers: staffFirebaseUsers.length,
      totalMigrated: staffFirebaseUsers.filter((u) => supabaseFirebaseUids.has(u.uid)).length,
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
