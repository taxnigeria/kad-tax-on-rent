"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getUserRole(userId: string): Promise<string | null> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not configured")
      return null
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.from("users").select("role").eq("firebase_uid", userId).maybeSingle()

    if (error) {
      console.error("[v0] Error fetching user role:", error.message)
      return null
    }

    return data?.role || null
  } catch (error) {
    console.error("[v0] Error in getUserRole:", error instanceof Error ? error.message : String(error))
    return null
  }
}
