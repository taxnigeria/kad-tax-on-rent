import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const STAFF_ROLES = ["super_admin", "superadmin", "admin", "staff", "enumerator", "qa", "area_officer"]

export async function GET() {
  const supabase = await createClient()

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .in("role", STAFF_ROLES)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API] Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { first_name, last_name, email, phone_number, role } = await request.json()

    if (!first_name || !last_name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!STAFF_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role for staff user" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Create user in Supabase
    const { data, error } = await supabase
      .from("users")
      .insert({
        first_name,
        last_name,
        email,
        phone_number,
        role,
        is_active: true,
        email_verified: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[API] Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  try {
    const { userId, updates } = await request.json()

    if (!userId || !updates) {
      return NextResponse.json({ error: "Missing userId or updates" }, { status: 400 })
    }

    if (updates.role && !STAFF_ROLES.includes(updates.role)) {
      return NextResponse.json({ error: "Invalid role for staff user" }, { status: 400 })
    }

    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()

    if (error) {
      console.error("[API] Error updating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Soft delete - just deactivate the user
    const { error } = await supabase.from("users").update({ is_active: false }).eq("id", userId)

    if (error) {
      console.error("[API] Error deactivating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
