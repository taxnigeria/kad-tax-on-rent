import { createClient } from "@/lib/supabase/server"
import { createFirebaseUser } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userData || !["super_admin", "admin"].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email, password, displayName, phoneNumber } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Create Firebase user
    const { uid, error } = await createFirebaseUser({
      email,
      password,
      displayName,
      phoneNumber,
    })

    if (error) {
      console.error("[API] Error creating Firebase user:", error)
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ uid })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
