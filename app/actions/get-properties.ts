"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getPropertiesByAuthId(authId: string) {
  try {
    const supabase = createAdminClient()

    // First, get the database user ID from auth_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authId)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { properties: [], error: "User not found" }
    }

    // Then fetch properties using the database user ID
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(
        `
        *,
        addresses (
          street_address,
          city,
          state,
          lga
        )
      `,
      )
      .eq("owner_id", userData.id)
      .order("created_at", { ascending: false })

    if (propertiesError) {
      console.error("[v0] Error fetching properties:", propertiesError)
      return { properties: [], error: propertiesError.message }
    }

    return { properties: properties || [], error: null }
  } catch (error: any) {
    console.error("[v0] Error in getPropertiesByAuthId:", error)
    return { properties: [], error: error.message }
  }
}
