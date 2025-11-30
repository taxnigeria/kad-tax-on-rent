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

    // Get all enumerators with their stats
    const { data: enumerators, error } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        properties:properties(id, verification_status)
      `)
      .eq("role", "enumerator")
      .eq("is_active", true)

    if (error) {
      console.error("[v0] Leaderboard error:", error)
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }

    // Calculate stats for each enumerator
    const leaderboard =
      enumerators
        ?.map((enumerator) => {
          const total = enumerator.properties?.length || 0
          const verified = enumerator.properties?.filter((p) => p.verification_status === "verified").length || 0
          const approvalRate = total > 0 ? ((verified / total) * 100).toFixed(1) : "0"

          return {
            id: enumerator.id,
            name: `${enumerator.first_name} ${enumerator.last_name}`,
            totalProperties: total,
            verifiedProperties: verified,
            approvalRate: Number.parseFloat(approvalRate),
            isCurrentUser: enumerator.id === user.id,
          }
        })
        .sort((a, b) => b.totalProperties - a.totalProperties) || []

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
