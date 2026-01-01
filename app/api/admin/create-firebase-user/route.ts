import { createAdminClient } from "@/lib/supabase/admin"
import { createFirebaseUser } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createAdminClient()

  try {
    const { email, password, displayName, phoneNumber, taxpayerId } = await request.json()

    console.log("[v0] API route received request:", { email, displayName, taxpayerId })

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const { success, uid, error } = await createFirebaseUser(email, password, displayName)

    if (!success || error) {
      console.error("[API] Error creating Firebase user:", error)
      return NextResponse.json({ error: error || "Unknown error" }, { status: 500 })
    }

    console.log("[v0] Firebase user created, UID:", uid)

    if (taxpayerId && uid) {
      const { error: updateError } = await supabase.from("users").update({ firebase_uid: uid }).eq("id", taxpayerId)

      if (updateError) {
        console.error("[API] Error updating user with firebase_uid:", updateError)
        // Don't fail the request, Firebase user was created successfully
      } else {
        console.log("[v0] User record updated with firebase_uid")
      }
    }

    return NextResponse.json({ uid })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
