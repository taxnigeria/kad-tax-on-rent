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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { data: null, error: "User not found" }
    }

    const { data: existingAuth, error: existingAuthError } = await supabase
      .from("manager_authorizations")
      .select("id, is_active")
      .eq("manager_id", managerId)
      .eq("owner_id", userData.id)
      .maybeSingle()

    // Only error if it's not a "no rows" situation
    if (existingAuthError) {
      console.error("[v0] Error checking existing auth:", existingAuthError)
      return { data: null, error: existingAuthError.message }
    }

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

export async function getManagerDetailsWithProperties(managerId: string, firebaseUid: string) {
  try {
    const supabase = createAdminClient()

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { data: null, error: "User not found" }
    }

    const ownerId = userData.id

    // Get manager details
    const { data: manager, error: managerError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone_number")
      .eq("id", managerId)
      .single()

    if (managerError || !manager) {
      console.error("[v0] Error fetching manager:", managerError)
      return { data: null, error: "Manager not found" }
    }

    // Get properties managed by this manager for this owner
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, registered_property_name, total_annual_rent, status")
      .eq("property_manager_id", managerId)
      .eq("owner_id", ownerId)

    if (propertiesError) {
      console.error("[v0] Error fetching properties:", propertiesError)
      return { data: null, error: propertiesError.message }
    }

    // Get manager performance stats for properties under this owner
    const propertyIds = properties?.map((p) => p.id) || []

    let totalTaxDue = 0
    let totalDiscounts = 0
    let totalPaid = 0

    if (propertyIds.length > 0) {
      const { data: taxData, error: taxError } = await supabase
        .from("tax_calculations")
        .select("total_tax_due")
        .in("property_id", propertyIds)

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("total_amount, discount, amount_paid")
        .in("property_id", propertyIds)

      if (taxError || invoiceError) {
        console.error("[v0] Error fetching stats:", taxError || invoiceError)
      }

      totalTaxDue = taxData?.reduce((sum, t) => sum + (t.total_tax_due || 0), 0) || 0
      totalDiscounts = invoiceData?.reduce((sum, i) => sum + (i.discount || 0), 0) || 0
      totalPaid = invoiceData?.reduce((sum, i) => sum + (i.amount_paid || 0), 0) || 0
    }

    return {
      data: {
        manager,
        properties: properties || [],
        stats: {
          totalTaxDue,
          totalDiscounts,
          totalPaid,
          totalProperties: properties?.length || 0,
        },
      },
      error: null,
    }
  } catch (error: any) {
    console.error("[v0] Error in getManagerDetailsWithProperties:", error)
    return { data: null, error: error.message }
  }
}

export async function addPropertyToManagerAuthorization(managerId: string, firebaseUid: string, propertyId: string) {
  try {
    const supabase = createAdminClient()

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { data: null, error: "User not found" }
    }

    const { data, error } = await supabase
      .from("properties")
      .update({ property_manager_id: managerId })
      .eq("id", propertyId)
      .eq("owner_id", userData.id)
      .select()

    if (error) {
      console.error("[v0] Error adding property to manager:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("[v0] Error in addPropertyToManagerAuthorization:", error)
    return { data: null, error: error.message }
  }
}

export async function getManagerManagedPropertiesCount(firebaseUid: string, managerId: string) {
  try {
    const supabase = createAdminClient()

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !userData) {
      console.error("[v0] Error fetching user:", userError)
      return { count: 0, error: "User not found" }
    }

    const { data, error, count } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("property_manager_id", managerId)
      .eq("owner_id", userData.id)

    if (error) {
      console.error("[v0] Error fetching managed properties count:", error)
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error: any) {
    console.error("[v0] Error in getManagerManagedPropertiesCount:", error)
    return { count: 0, error: error.message }
  }
}
