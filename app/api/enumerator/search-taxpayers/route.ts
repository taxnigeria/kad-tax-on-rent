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

    const body = await request.json()
    const { searchTerm, searchType } = body // searchType: 'phone', 'email', 'name'

    if (!searchTerm) {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 })
    }

    let query = supabase.from("taxpayer_profiles").select(`
        *,
        user:users!inner(id, first_name, last_name, email, phone_number, is_active),
        properties:properties(id, registered_property_name, property_type, verification_status)
      `)

    // Search based on type
    if (searchType === "phone") {
      const normalized = normalizePhone(searchTerm)
      query = query.or(`user.phone_number.ilike.%${searchTerm}%,user.phone_number.ilike.%${normalized}%`)
    } else if (searchType === "email") {
      query = query.ilike("user.email", `%${searchTerm}%`)
    } else {
      // Name search (first_name, last_name, business_name)
      query = query.or(
        `user.first_name.ilike.%${searchTerm}%,user.last_name.ilike.%${searchTerm}%,business_name.ilike.%${searchTerm}%`,
      )
    }

    const { data: results, error } = await query

    if (error) {
      console.error("[v0] Taxpayer search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // Add fuzzy match score for name searches
    const scoredResults =
      results
        ?.map((result) => ({
          ...result,
          matchScore:
            searchType === "name"
              ? Math.max(
                  fuzzyMatch(searchTerm, result.user.first_name || ""),
                  fuzzyMatch(searchTerm, result.user.last_name || ""),
                  fuzzyMatch(searchTerm, result.business_name || ""),
                )
              : 1,
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
