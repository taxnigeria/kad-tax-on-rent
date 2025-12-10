import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Normalize phone numbers to standard format
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("234")) {
    return digits
  } else if (digits.startsWith("0")) {
    return "234" + digits.substring(1)
  } else if (digits.length === 10) {
    return "234" + digits
  }
  return digits
}

function fuzzyMatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (!s1 || !s2) return 0
  if (s1 === s2) return 1

  // Check if one contains the other (substring match)
  if (s1.includes(s2)) return 0.9
  if (s2.includes(s1)) return 0.85

  // Check if starts with
  if (s1.startsWith(s2) || s2.startsWith(s1)) return 0.8

  // Calculate Levenshtein distance for short strings
  if (s1.length <= 15 && s2.length <= 15) {
    const distance = levenshteinDistance(s1, s2)
    const maxLen = Math.max(s1.length, s2.length)
    const similarity = 1 - distance / maxLen
    // Only return if similarity is above threshold
    return similarity > 0.6 ? similarity : 0
  }

  return 0
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1)
      }
    }
  }
  return dp[m][n]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { firebaseUid, query, searchTerm } = body

    if (!firebaseUid) {
      return NextResponse.json({ error: "Firebase UID is required" }, { status: 401 })
    }

    // Verify user is an enumerator
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (userData.role !== "enumerator") {
      return NextResponse.json({ error: "Forbidden - Enumerator access only" }, { status: 403 })
    }

    const searchValue = query || searchTerm

    if (!searchValue) {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 })
    }

    const normalized = normalizePhone(searchValue)
    const searchPattern = `%${searchValue}%`
    const normalizedPattern = `%${normalized}%`

    const { data: matchingUsers, error: usersError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone_number, is_active")
      .or(
        `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern},phone_number.ilike.${searchPattern},phone_number.ilike.${normalizedPattern}`,
      )
      .eq("role", "taxpayer")
      .limit(20)

    if (usersError) {
      console.error("[v0] Users search error:", usersError)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    if (!matchingUsers || matchingUsers.length === 0) {
      // Search by business name
      const { data: businessProfiles, error: businessError } = await supabase
        .from("taxpayer_profiles")
        .select("*")
        .ilike("business_name", searchPattern)
        .limit(20)

      if (businessError) {
        return NextResponse.json({ error: "Search failed" }, { status: 500 })
      }

      if (!businessProfiles || businessProfiles.length === 0) {
        return NextResponse.json({ success: true, results: [], count: 0 })
      }

      const profileUserIds = businessProfiles.map((p) => p.user_id).filter(Boolean)

      if (profileUserIds.length === 0) {
        return NextResponse.json({
          success: true,
          results: businessProfiles.map((p) => ({ ...p, user: null, properties_count: 0 })),
          count: businessProfiles.length,
        })
      }

      const { data: businessUsers } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, phone_number, is_active")
        .in("id", profileUserIds)

      const scoredResults = businessProfiles
        .map((profile) => ({
          ...profile,
          user: businessUsers?.find((u) => u.id === profile.user_id) || null,
          matchScore: fuzzyMatch(searchValue, profile.business_name || ""),
        }))
        .filter((r) => r.matchScore >= 0.5) // Only include results with decent match
        .sort((a, b) => b.matchScore - a.matchScore)

      const resultUserIds = scoredResults.map((r) => r.user?.id).filter(Boolean)
      let propertiesCounts: Record<string, number> = {}

      if (resultUserIds.length > 0) {
        const { data: properties } = await supabase.from("properties").select("owner_id").in("owner_id", resultUserIds)
        if (properties) {
          propertiesCounts = properties.reduce((acc: Record<string, number>, prop) => {
            acc[prop.owner_id] = (acc[prop.owner_id] || 0) + 1
            return acc
          }, {})
        }
      }

      const resultsWithCount = scoredResults.map((r) => ({
        ...r,
        properties_count: propertiesCounts[r.user?.id] || 0,
      }))

      return NextResponse.json({
        success: true,
        results: resultsWithCount,
        count: resultsWithCount.length,
      })
    }

    const userIds = matchingUsers.map((u) => u.id)

    const { data: profiles, error: profilesError } = await supabase
      .from("taxpayer_profiles")
      .select("*")
      .in("user_id", userIds)

    if (profilesError) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    const results = matchingUsers
      .map((user) => {
        const profile = profiles?.find((p) => p.user_id === user.id)
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim()
        return {
          ...profile,
          user,
          matchScore: Math.max(
            fuzzyMatch(searchValue, fullName),
            fuzzyMatch(searchValue, user.first_name || ""),
            fuzzyMatch(searchValue, user.last_name || ""),
            fuzzyMatch(searchValue, profile?.business_name || ""),
            fuzzyMatch(searchValue, user.email || ""),
            fuzzyMatch(searchValue, user.phone_number || ""),
          ),
        }
      })
      .filter((r) => (r.id || r.user) && r.matchScore >= 0.5) // Minimum match threshold
      .sort((a, b) => b.matchScore - a.matchScore)

    const resultUserIds = results.map((r) => r.user?.id).filter(Boolean)
    let propertiesCounts: Record<string, number> = {}

    if (resultUserIds.length > 0) {
      const { data: properties } = await supabase.from("properties").select("owner_id").in("owner_id", resultUserIds)
      if (properties) {
        propertiesCounts = properties.reduce((acc: Record<string, number>, prop) => {
          acc[prop.owner_id] = (acc[prop.owner_id] || 0) + 1
          return acc
        }, {})
      }
    }

    const resultsWithCount = results.map((r) => ({
      ...r,
      properties_count: propertiesCounts[r.user?.id] || 0,
    }))

    return NextResponse.json({
      success: true,
      results: resultsWithCount,
      count: resultsWithCount.length,
    })
  } catch (error) {
    console.error("[v0] Search taxpayers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
