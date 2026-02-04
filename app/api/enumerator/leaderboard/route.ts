import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const firebaseUid = searchParams.get("firebaseUid")

    if (!firebaseUid) {
      return NextResponse.json({ error: "Firebase UID is required" }, { status: 401 })
    }

    // Look up current user by Firebase UID
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (currentUser.role !== "enumerator") {
      return NextResponse.json({ error: "Forbidden - Enumerator access only" }, { status: 403 })
    }

    // Calculate current month boundaries
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    // Get all enumerators with their stats for the current month
    const { data: enumerators, error } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        properties:properties!enumerated_by(id, verification_status, enumeration_date)
      `)
      .eq("role", "enumerator")
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Leaderboard error:", error)
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }

    // Calculate stats for each enumerator (filtered by current month)
    const leaderboard =
      enumerators
        ?.map((enumerator) => {
          // Filter properties to only include those enumerated this month
          const monthlyProperties = enumerator.properties?.filter((p: { enumeration_date: string | null }) => {
            if (!p.enumeration_date) return false
            return p.enumeration_date >= startOfMonth.split("T")[0] && p.enumeration_date <= endOfMonth.split("T")[0]
          }) || []

          const total = monthlyProperties.length
          const verified =
            monthlyProperties.filter((p: { verification_status: string }) => p.verification_status === "approved" || p.verification_status === "verified")
              .length || 0
          const approvalRate = total > 0 ? ((verified / total) * 100).toFixed(1) : "0"

          return {
            id: enumerator.id,
            name: `${enumerator.first_name} ${enumerator.last_name}`,
            totalProperties: total,
            verifiedProperties: verified,
            approvalRate: Number.parseFloat(approvalRate),
            isCurrentUser: enumerator.id === currentUser.id,
          }
        })
        // Sort by verified properties (primary), then total properties (secondary)
        .sort((a, b) => {
          if (b.verifiedProperties !== a.verifiedProperties) {
            return b.verifiedProperties - a.verifiedProperties
          }
          return b.totalProperties - a.totalProperties
        }) || []

    // Find current user's rank
    const userRank = leaderboard.findIndex((e) => e.isCurrentUser) + 1

    return NextResponse.json({
      success: true,
      leaderboard,
      userRank,
    })
  } catch (error) {
    console.error("[v0] Leaderboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
