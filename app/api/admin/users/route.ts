import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  try {
    // Fetch all users with their profiles
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        *,
        taxpayer_profiles (
          kadirs_id,
          tin,
          business_name,
          is_business,
          area_office_id
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API] Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get property counts per user
    const { data: propertyCounts } = await supabase.from("properties").select("owner_id")

    const propertyCountMap: Record<string, number> = {}
    propertyCounts?.forEach((p) => {
      if (p.owner_id) {
        propertyCountMap[p.owner_id] = (propertyCountMap[p.owner_id] || 0) + 1
      }
    })

    // Enhance users with property counts
    const enhancedUsers = users?.map((user) => ({
      ...user,
      property_count: propertyCountMap[user.id] || 0,
    }))

    return NextResponse.json({ users: enhancedUsers })
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
