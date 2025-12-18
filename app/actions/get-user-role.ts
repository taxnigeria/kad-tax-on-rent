"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getUserRole(userId: string): Promise<string | null> {
  try {
    // [v0] Added debug logging to see what userId is received
    console.log(`[v0] getUserRole called with userId: ${userId}`)

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("users")
      .select("role, id, auth_id, firebase_uid")
      .eq("auth_id", userId)
      .maybeSingle()

    console.log(`[v0] Query result - User ID: ${userId}, Data:`, data)

    if (error) {
      console.error("[v0] Error fetching user role:", error.message)
      return null
    }

    return data?.role || null
  } catch (error) {
    console.error("[v0] Error in getUserRole:", error)
    return null
  }
}
