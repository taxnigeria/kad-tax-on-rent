import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Normalize phone numbers to standard format
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "")

  // Handle Nigerian numbers
  if (digits.startsWith("234")) {
    return digits
  } else if (digits.startsWith("0")) {
    return "234" + digits.substring(1)
  } else if (digits.length === 10) {
    return "234" + digits
  }

  return digits
}

// Simple fuzzy match for names (Levenshtein-like)
function fuzzyMatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  // Calculate similarity
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++
  }

  return matches / longer.length
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
      console.error("[v0] User lookup error:", userError)
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

    const { data: results, error } = await supabase
      .from("taxpayer_profiles")
      .select(`
        *,
        user:users!inner(id, first_name, last_name, email, phone_number, is_active),
        properties:properties(id, registered_property_name, property_type, verification_status)
      `)
      .or(
        `user.first_name.ilike.%${searchValue}%,user.last_name.ilike.%${searchValue}%,business_name.ilike.%${searchValue}%,user.email.ilike.%${searchValue}%,user.phone_number.ilike.%${searchValue}%,user.phone_number.ilike.%${normalized}%`,
      )
      .limit(20)

    if (error) {
      console.error("[v0] Taxpayer search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    const scoredResults =
      results
        ?.map((result) => ({
          ...result,
          matchScore: Math.max(
            fuzzyMatch(searchValue, result.user.first_name || ""),
            fuzzyMatch(searchValue, result.user.last_name || ""),
            fuzzyMatch(searchValue, result.business_name || ""),
            fuzzyMatch(searchValue, result.user.email || ""),
            fuzzyMatch(searchValue, result.user.phone_number || ""),
          ),
        }))
        .sort((a, b) => b.matchScore - a.matchScore) || []

    return NextResponse.json({
      success: true,
      results: scoredResults,
      count: scoredResults.length,
    })
  } catch (error) {
    console.error("[v0] Search taxpayers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
