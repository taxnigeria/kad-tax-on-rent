"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export type UserStatus = {
    role: string | null
    isActive: boolean
    error?: string
}

export async function getUserStatus(firebaseUid: string): Promise<UserStatus> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from("users")
            .select("role, is_active")
            .eq("firebase_uid", firebaseUid)
            .maybeSingle()

        if (error) {
            console.error("[v0] Error fetching user status:", error.message)
            return { role: null, isActive: false, error: "Failed to fetch user status" }
        }

        if (!data) {
            return { role: null, isActive: false, error: "User not found in database" }
        }

        return {
            role: data.role,
            isActive: data.is_active ?? true, // Default to true if not specified
        }
    } catch (error: any) {
        console.error("[v0] Error in getUserStatus:", error.message)
        return { role: null, isActive: false, error: "Internal server error" }
    }
}
