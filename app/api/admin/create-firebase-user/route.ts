import { createAdminClient } from "@/lib/supabase/admin"
import { createFirebaseUser } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createAdminClient()

  try {
    const { email, password, displayName, phoneNumber } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Create Firebase user
    const { uid, error } = await createFirebaseUser(email, password, displayName, phoneNumber)

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
