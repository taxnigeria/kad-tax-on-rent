"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getPropertiesByFirebaseUid(firebaseUid: string) {
  try {
    const supabase = createAdminClient()

    // First, get the database user ID from Firebase UID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return {
        ownedProperties: [],
        managedProperties: [],
        error: "User not found",
      }
    }

    const { data: ownedProperties, error: ownedError } = await supabase
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

    const { data: managedProperties, error: managedError } = await supabase
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
      .eq("property_manager_id", userData.id)
      .order("created_at", { ascending: false })

    if (ownedError) {
      console.error("[v0] Error fetching owned properties:", ownedError)
    }

    if (managedError) {
      console.error("[v0] Error fetching managed properties:", managedError)
    }

    return {
      ownedProperties: ownedProperties || [],
      managedProperties: managedProperties || [],
      error: null,
    }
  } catch (error: any) {
    console.error("[v0] Error in getPropertiesByFirebaseUid:", error)
    return {
      ownedProperties: [],
      managedProperties: [],
      error: error.message,
    }
  }
}
