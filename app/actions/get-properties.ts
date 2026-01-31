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
export async function getEnumeratorProperties(firebaseUid: string, status?: string) {
  try {
    const supabase = createAdminClient()

    // Get the user by firebase_uid
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", firebaseUid)
      .single()

    if (userError || !user) {
      return { properties: [], error: "User not found" }
    }

    if (user.role !== "enumerator") {
      return { properties: [], error: "Unauthorized" }
    }

    // Map status filter
    let dbStatus: string[] = []
    switch (status) {
      case "verified":
        dbStatus = ["verified"]
        break
      case "pending":
        dbStatus = ["submitted", "under_review"]
        break
      case "rejected":
        dbStatus = ["rejected"]
        break
      default:
        dbStatus = ["submitted", "under_review", "verified", "rejected"]
    }

    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(`
        id,
        registered_property_name,
        property_reference,
        property_type,
        property_category,
        status,
        total_annual_rent,
        house_number,
        street_name,
        created_at,
        area_offices!properties_area_office_id_fkey (
          office_name,
          lgas ( name )
        ),
        addresses (
          city,
          lga,
          state,
          latitude,
          longitude
        ),
        users!properties_owner_id_fkey (
          first_name,
          last_name,
          phone_number,
          email
        )
      `)
      .eq("enumerated_by", user.id)
      .in("status", dbStatus)
      .order("created_at", { ascending: false })

    if (propertiesError) {
      console.error("[AuthAction] Properties fetch error:", propertiesError.message)
      return { properties: [], error: propertiesError.message }
    }

    // Fetch documents for these properties
    if (properties && properties.length > 0) {
      const propertyIds = properties.map((p) => p.id)
      const { data: documents } = await supabase
        .from("documents")
        .select("entity_id, file_url, document_type")
        .eq("entity_type", "property")
        .in("entity_id", propertyIds)
        .in("document_type", ["property_facade", "address_number"])

      const propertiesWithDocs = properties.map((property: any) => ({
        ...property,
        documents: documents?.filter((doc) => doc.entity_id === property.id) || [],
      }))

      return { properties: propertiesWithDocs, error: null }
    }

    return { properties: properties || [], error: null }
  } catch (error: any) {
    console.error("[AuthAction] Error in getEnumeratorProperties:", error)
    return { properties: [], error: error.message }
  }
}
export async function getManagedClients(managerFirebaseUid: string) {
  try {
    const supabase = createAdminClient()

    // 1. Get the manager's database user ID
    const { data: manager, error: managerError } = await supabase
      .from("users")
      .select("id, role")
      .eq("firebase_uid", managerFirebaseUid)
      .single()

    if (managerError || !manager) {
      return { clients: [], error: "Manager not found" }
    }

    if (manager.role !== "property_manager") {
      return { clients: [], error: "Unauthorized" }
    }

    const clientMap = new Map()

    // Helper to ensure client exists in map
    const ensureClientExists = (user: any, profile: any) => {
      if (!clientMap.has(user.id)) {
        clientMap.set(user.id, {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          profile: profile ? {
            kadirs_id: profile.kadirs_id,
            business_name: profile.business_name,
            verification_status: profile.verification_status
          } : null,
          properties: [],
        })
      }
    }

    // Helper to add property safely
    const addPropertyToClient = (userId: string, prop: any) => {
      const client = clientMap.get(userId)
      if (client && !client.properties.find((p: any) => p.id === prop.id)) {
        client.properties.push({
          id: prop.id,
          registered_property_name: prop.registered_property_name,
          property_reference: prop.property_reference,
          status: prop.status,
          verification_status: prop.verification_status,
          total_annual_rent: prop.total_annual_rent,
          address: prop.addresses || prop.address, // Handle variance in structure
        })
      }
    }

    // 2. Fetch clients explicitly onboarded by this manager
    const { data: onboardedProfiles } = await supabase
      .from("taxpayer_profiles")
      .select(`
        *,
        user:users!taxpayer_profiles_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone_number
        )
      `)
      .eq("onboarded_by_id", manager.id)

    if (onboardedProfiles) {
      onboardedProfiles.forEach((profile: any) => {
        if (profile.user) {
          ensureClientExists(profile.user, profile)
        }
      })
    }

    // 3. Fetch properties directly managed (Primary Manager)
    const { data: properties } = await supabase
      .from("properties")
      .select(`
        *,
        owner:users!properties_owner_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (
            kadirs_id,
            business_name,
            verification_status
          )
        ),
        addresses (
          street_address,
          city,
          lga
        )
      `)
      .eq("property_manager_id", manager.id)
      .order("created_at", { ascending: false })

    if (properties) {
      properties.forEach((prop: any) => {
        const owner = prop.owner
        if (owner) {
          ensureClientExists(owner, owner.taxpayer_profiles?.[0])
          addPropertyToClient(owner.id, prop)
        }
      })
    }

    // 4. Fetch properties via Authorization (Delegated)
    // Note: manager_authorizations links manager -> property -> owner
    const { data: authorizations } = await supabase
      .from("manager_authorizations")
      .select(`
        property:properties (
          *,
          addresses (
            street_address,
            city,
            lga
          )
        ),
        owner:users!manager_authorizations_authorized_by_user_id_fkey (
           id,
           first_name,
           last_name,
           email,
           phone_number,
           taxpayer_profiles:taxpayer_profiles!taxpayer_profiles_user_id_fkey (
              kadirs_id,
              business_name,
              verification_status
           )
        )
      `)
      .eq("authorized_manager_id", manager.id)
      .eq("status", "active")

    if (authorizations) {
      authorizations.forEach((auth: any) => {
        const owner = auth.owner
        const prop = auth.property
        if (owner && prop) {
          ensureClientExists(owner, owner.taxpayer_profiles?.[0])
          addPropertyToClient(owner.id, prop)
        }
      })
    }

    return { clients: Array.from(clientMap.values()), error: null }
  } catch (error: any) {
    console.error("Error in getManagedClients:", error)
    return { clients: [], error: error.message }
  }
}
