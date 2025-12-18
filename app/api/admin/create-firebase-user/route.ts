import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API: Attempting to create Firebase user")

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[v0] API: No Firebase token provided")
      return NextResponse.json({ error: "Unauthorized - Please log in via Firebase first" }, { status: 401 })
    }

    const firebaseToken = authHeader.substring(7)
    let firebaseUser: any

    try {
      const adminAuth = getAuth()
      const decodedToken = await adminAuth.verifyIdToken(firebaseToken)
      firebaseUser = decodedToken
    } catch (error) {
      console.log("[v0] API: Invalid Firebase token:", error)
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("role")
      .eq("firebase_uid", firebaseUser.uid)
      .maybeSingle()

    console.log("[v0] API: User data query result:", userData, "Error:", userDataError)

    if (userDataError) {
      console.log("[v0] API: Error fetching user role:", userDataError)
      return NextResponse.json({ error: "Failed to verify admin status" }, { status: 500 })
    }

    if (!userData) {
      console.log("[v0] API: User not found in database")
      return NextResponse.json({ error: "Unauthorized - User record not found" }, { status: 403 })
    }

    if (!["super_admin", "admin"].includes(userData.role)) {
      console.log("[v0] API: User role is not admin:", userData.role)
      return NextResponse.json(
        { error: `Forbidden - Your role is ${userData.role}, admin access required` },
        { status: 403 },
      )
    }

    console.log("[v0] API: Admin verified, proceeding with user creation")

    const { email, password, displayName, phoneNumber } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const adminAuth = getAuth()
    const createdUser = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber,
    })

    console.log("[v0] API: Firebase user created successfully:", createdUser.uid)
    return NextResponse.json({ uid: createdUser.uid })
  } catch (error: any) {
    console.error("[v0] API: Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
