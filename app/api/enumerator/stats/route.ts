import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
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

    // Get stats for this enumerator
    const { data: properties, error: propsError } = await supabase
      .from("properties")
      .select("id, verification_status, created_at")
      .eq("enumerated_by", user.id)

    if (propsError) {
      console.error("[v0] Properties stats error:", propsError)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    // Count taxpayers created by this enumerator
    const { count: taxpayerCount, error: taxpayerError } = await supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("entity_type", "taxpayer")
      .eq("action", "create")

    const totalProperties = properties?.length || 0
    const verifiedProperties = properties?.filter((p) => p.verification_status === "verified").length || 0
    const pendingProperties = properties?.filter((p) => p.verification_status === "pending").length || 0
    const rejectedProperties = properties?.filter((p) => p.verification_status === "rejected").length || 0

    // Calculate approval rate
    const approvalRate = totalProperties > 0 ? ((verifiedProperties / totalProperties) * 100).toFixed(1) : "0"

    // Get this week's count
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeekProperties = properties?.filter((p) => new Date(p.created_at) >= oneWeekAgo).length || 0

    return NextResponse.json({
      success: true,
      stats: {
        totalProperties,
        verifiedProperties,
        pendingProperties,
        rejectedProperties,
        taxpayersCreated: taxpayerCount || 0,
        approvalRate: Number.parseFloat(approvalRate),
        thisWeekProperties,
      },
    })
  } catch (error) {
    console.error("[v0] Enumerator stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
