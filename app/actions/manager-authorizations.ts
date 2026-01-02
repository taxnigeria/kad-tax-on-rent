"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getManagerAuthorizationsForOwner(firebaseUid: string) {
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
      return { authorizations: [], error: "User not found" }
    }

    const { data: authorizations, error: authError } = await supabase
      .from("manager_authorizations")
      .select(
        `
        id,
        manager_id,
        owner_id,
        is_active,
        created_at,
        authorization_date,
        users:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `,
      )
      .eq("owner_id", userData.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (authError) {
      console.error("[v0] Error fetching authorizations:", authError)
      return { authorizations: [], error: authError.message }
    }

    return { authorizations: authorizations || [], error: null }
  } catch (error: any) {
    console.error("[v0] Error in getManagerAuthorizationsForOwner:", error)
    return { authorizations: [], error: error.message }
  }
}

export async function revokeManagerAuthorization(authorizationId: string) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("manager_authorizations")
      .update({ is_active: false })
      .eq("id", authorizationId)
      .select()

    if (error) {
      console.error("[v0] Error revoking authorization:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("[v0] Error in revokeManagerAuthorization:", error)
    return { data: null, error: error.message }
  }
}

export async function getAvailablePropertyManagers(firebaseUid: string) {
  try {
    const supabase = createAdminClient()

    // Get the database user ID from Firebase UID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { managers: [], error: "User not found" }
    }

    // Get property managers that aren't already authorized to this owner
    const { data: managers, error: managersError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("role", "property_manager")
      .order("first_name", { ascending: true })

    if (managersError) {
      console.error("[v0] Error fetching managers:", managersError)
      return { managers: [], error: managersError.message }
    }

    // Filter out already authorized managers
    const { data: existingAuthorizations } = await supabase
      .from("manager_authorizations")
      .select("manager_id")
      .eq("owner_id", userData.id)
      .eq("is_active", true)

    const authorizedManagerIds = new Set(existingAuthorizations?.map((a) => a.manager_id) || [])
    const availableManagers = managers?.filter((m) => !authorizedManagerIds.has(m.id)) || []

    return { managers: availableManagers, error: null }
  } catch (error: any) {
    console.error("[v0] Error in getAvailablePropertyManagers:", error)
    return { managers: [], error: error.message }
  }
}

export async function authorizePropertyManager(firebaseUid: string, managerId: string) {
  try {
    const supabase = createAdminClient()

    // Get the database user ID from Firebase UID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { data: null, error: "User not found" }
    }

    // Check if authorization already exists
    const { data: existingAuth } = await supabase
      .from("manager_authorizations")
      .select("id, is_active")
      .eq("manager_id", managerId)
      .eq("owner_id", userData.id)
      .single()

    if (existingAuth) {
      if (existingAuth.is_active) {
        return { data: null, error: "Manager is already authorized" }
      }
      // Reactivate if previously revoked
      const { data, error } = await supabase
        .from("manager_authorizations")
        .update({ is_active: true, authorization_date: new Date().toISOString() })
        .eq("id", existingAuth.id)
        .select()

      if (error) {
        console.error("[v0] Error reactivating authorization:", error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    }

    // Create new authorization
    const { data, error } = await supabase
      .from("manager_authorizations")
      .insert({
        manager_id: managerId,
        owner_id: userData.id,
        is_active: true,
        authorization_date: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("[v0] Error authorizing manager:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("[v0] Error in authorizePropertyManager:", error)
    return { data: null, error: error.message }
  }
}
